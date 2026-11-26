from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database
from typing import Dict, Any, List
from app.core.database import get_db
from app.repositories.district import district_repo
from app.ml.forecasting import heat_forecaster, classify_heat_risk

router = APIRouter(prefix="/forecast", tags=["heat-forecasting"])

@router.get("/summary")
def get_forecast_summary(
    days: int = Query(7, ge=3, le=14),
    db: Database = Depends(get_db)
):
    """
    Get a lightweight district-wise forecast heat risk summary across Tamil Nadu.
    Used for map heat overlays, risk rankings, and rapid dashboard statistics.
    """
    districts = district_repo.get_all(db)
    if not districts:
        raise HTTPException(status_code=404, detail="No districts found.")

    summary = []
    for d in districts:
        base_lst = d.get("lst", 35.0)
        ndvi = d.get("ndvi", 0.25)
        ndbi = d.get("ndbi", 0.45)
        # Approximate 7-day trend based on emissivity delta & season
        predicted_peak = round(base_lst + (ndbi - ndvi) * 1.8, 1)
        risk = classify_heat_risk(predicted_peak)
        summary.append({
            "id": d["id"],
            "name": d["name"],
            "lat": d["lat"],
            "lon": d["lon"],
            "current_lst": base_lst,
            "current_risk": d.get("risk_level", classify_heat_risk(base_lst)),
            "forecast_peak_lst": predicted_peak,
            "forecast_risk": risk,
            "temp_delta": round(predicted_peak - base_lst, 1)
        })

    # Sort by highest forecast risk
    summary.sort(key=lambda x: x["forecast_peak_lst"], reverse=True)
    return {
        "forecast_days": days,
        "total_districts": len(summary),
        "extreme_count": sum(1 for s in summary if s["forecast_risk"] == "Extreme"),
        "high_count": sum(1 for s in summary if s["forecast_risk"] == "High"),
        "districts": summary
    }

@router.get("/{district_id}")
def get_district_forecast(
    district_id: str,
    days: int = Query(7, ge=3, le=14),
    db: Database = Depends(get_db)
):
    """
    Retrieve or generate ML-driven LST forecast for a specific district.
    Evaluates both Random Forest and XGBoost on historical records, selecting
    the best model and returning confidence bounds and full time-series trajectories.
    """
    dist = district_repo.get(db, id=district_id)
    if not dist:
        # Fallback search by name if ID was passed as name
        dist = district_repo.get_by_name(db, name=district_id)
        if not dist:
            raise HTTPException(status_code=404, detail=f"District '{district_id}' not found.")

    try:
        forecast_result = heat_forecaster.forecast_district(
            district_id=str(dist["id"]),
            district_name=dist["name"],
            lat=dist["lat"],
            lon=dist["lon"],
            base_lst=dist.get("lst", 35.0),
            ndvi=dist.get("ndvi", 0.25),
            ndbi=dist.get("ndbi", 0.45),
            forecast_days=days
        )
        return forecast_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Forecasting engine error for {dist.get('name')}: {str(e)}"
        )
