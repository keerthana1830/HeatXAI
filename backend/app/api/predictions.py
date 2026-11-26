from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user
from app.repositories.prediction import prediction_repo
from app.repositories.district import district_repo
from app.schemas.prediction import PredictionResponse, ModelTrainRequest

from app.ml.data_generator import generate_synthetic_data
from app.ml.models import ml_models

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.get("/{district_id}", response_model=List[PredictionResponse])
def read_predictions(
    district_id: str,
    model_type: str = None,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Fetch future temperature predictions for a selected district."""
    predictions = prediction_repo.get_by_district(db, district_id=district_id, model_type=model_type)
    
    # If no predictions exist yet, auto-populate some default mock predictions so user has data immediately
    if not predictions:
        dist = district_repo.get(db, id=district_id)
        if not dist:
            raise HTTPException(status_code=404, detail="District not found")
        
        base_temp = dist.get("lst", 35.0)
        
        # Generate data and train a default Random Forest model to seed the predictions
        df = generate_synthetic_data(base_temp)
        result = ml_models.train_rf(df)
        future_preds = result["predictions"]
        
        created_predictions = []
        for i, pred_val in enumerate(future_preds):
            future_date = datetime.utcnow() + timedelta(days=30 * (i + 1))
            
            pred_dict = {
                "district_id": district_id,
                "model_type": model_type or "Random Forest Regressor",
                "prediction_date": future_date,
                "predicted_lst": pred_val
            }
            pred = prediction_repo.create(db, pred_dict)
            created_predictions.append(pred)
        predictions = created_predictions
        
    return predictions

@router.post("/train")
def train_model(
    payload: ModelTrainRequest,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actually train the AI model and generate new forecasted records for all districts."""
    districts = district_repo.get_all(db)
    if not districts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No districts available to train on. Sync data pipeline first."
        )

    # 1. Clean existing predictions for this model type to overwrite with newly trained forecasts
    db["predictions"].delete_many({"model_type": payload.model_type})

    # Since all districts might have different base temps, we'll train one generalized model on one 
    # district for the logs, but infer for each district using their specific base temps.
    # To keep it simple and robust per the user's request, we will train a model for each district
    # and average the metrics for the response, but use the first one for the logs.
    
    overall_r2 = []
    overall_mae = []
    final_logs = []
    
    for idx, dist in enumerate(districts):
        base_temp = dist.get("lst", 35.0)
        df = generate_synthetic_data(base_temp)
        
        if "LSTM" in payload.model_type:
            res = ml_models.train_lstm(df)
        elif "CNN" in payload.model_type:
            res = ml_models.train_cnn(df)
        else:
            res = ml_models.train_rf(df)
            
        if idx == 0:
            final_logs = res["logs"]
            final_logs.append("Applying models to all districts...")
            epochs = res["metrics"]["epochs"]
            
        overall_r2.append(res["metrics"]["r2_score"])
        overall_mae.append(res["metrics"]["mae"])
        
        # Save predictions for this district
        for i, pred_val in enumerate(res["predictions"]):
            future_date = datetime.utcnow() + timedelta(days=30 * (i + 1))
            pred_dict = {
                "district_id": dist["id"],
                "model_type": payload.model_type,
                "prediction_date": future_date,
                "predicted_lst": pred_val
            }
            prediction_repo.create(db, pred_dict)
            
    avg_r2 = sum(overall_r2) / len(overall_r2)
    avg_mae = sum(overall_mae) / len(overall_mae)
            
    return {
        "status": "Success",
        "message": f"Successfully trained {payload.model_type} and updated forecasts.",
        "metrics": {
            "r2_score": round(avg_r2, 3),
            "mae": round(avg_mae, 3),
            "epochs": epochs,
            "trained_at": datetime.utcnow().isoformat()
        },
        "logs": final_logs
    }
