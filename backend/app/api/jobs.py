from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from typing import List
import time
import random
from datetime import datetime

from app.core.database import get_db
from app.api.auth import get_current_user
from app.repositories.job import job_repo
from app.repositories.district import district_repo
from app.schemas.job import JobResponse, JobCreate

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=List[JobResponse])
def read_jobs(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Fetch list of all past and running satellite ingestion pipelines."""
    return job_repo.get_recent_jobs(db)

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def trigger_pipeline_job(
    job_in: JobCreate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Trigger a new satellite ingestion or weather sync job (simulated asynchronous worker)."""
    # 1. Create a Pending Job record
    new_job_dict = {
        "job_type": job_in.job_type,
        "status": "Running",
        "triggered_by": current_user.get("full_name") or current_user["email"],
        "logs": f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Job initialized by user {current_user['email']}\n",
        "created_at": datetime.utcnow()
    }
    new_job = job_repo.create(db, new_job_dict)

    # 2. Simulate pipeline execution stages
    logs = new_job["logs"]
    start_time = time.time()
    
    try:
        if job_in.job_type == "Sentinel-2 Satellite Ingestion":
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Connecting to Sentinel-2 Copernicus Open Access Hub...\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Querying cloud-free tiles for Tamil Nadu districts...\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Found 14 tiles covering Chennai, Coimbatore, Madurai, Salem.\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Downloading bands B4 (Red), B8 (NIR), B10 (SWIR)...\n"
            
            districts = district_repo.get_all(db)
            for d in districts:
                variance = random.uniform(-0.4, 0.4)
                d["lst"] = round(max(20.0, min(50.0, d.get("lst", 35.0) + variance)), 1)
                d["ndvi"] = round(max(-0.2, min(0.9, d.get("ndvi", 0.2) + random.uniform(-0.02, 0.02))), 3)
                d["ndbi"] = round(max(-0.3, min(0.8, d.get("ndbi", 0.4) + random.uniform(-0.02, 0.02))), 3)
                d["heat_index"] = round(d["lst"] * (1.0 + d["ndbi"] - d["ndvi"]), 1)
                district_repo.update(db, d["id"], d)
                
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Computing LST and NDVI bands completed.\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] PostGIS / MongoDB spatial indexing updated successfully.\n"
            data_size = round(random.uniform(350, 750), 1)
            status_text = "Success"
            
        elif job_in.job_type == "Landsat 8 Thermal Sync":
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Connecting to USGS EarthExplorer API...\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Retrieving Landsat 8 TIRS (Thermal Infrared Sensor) data...\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Extracting Band 10 and Band 11 brightness temperatures...\n"
            
            districts = district_repo.get_all(db)
            for d in districts:
                variance = random.uniform(-0.2, 0.2)
                d["lst"] = round(max(20.0, min(50.0, d.get("lst", 35.0) + variance)), 1)
                d["heat_index"] = round(d["lst"] * (1.0 + d.get("ndbi", 0.4) - d.get("ndvi", 0.2)), 1)
                district_repo.update(db, d["id"], d)

            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Applied calibration and radiometric corrections.\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Landsat 8 thermal calibration sync finished.\n"
            data_size = round(random.uniform(400, 900), 1)
            status_text = "Success"
            
        elif job_in.job_type == "ERA5 Atmospheric Reanalysis":
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Initializing ECMWF CDS Client...\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Fetching 2-meter air temperature and relative humidity hourly datasets...\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Processing weather reanalysis for Southern India grid...\n"
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Local ERA5 atmospheric correction parameters loaded.\n"
            data_size = round(random.uniform(50, 150), 1)
            status_text = "Success"
            
        else:
            logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Unknown job type '{job_in.job_type}' requested.\n"
            status_text = "Failed"
            data_size = 0.0

    except Exception as e:
        status_text = "Failed"
        logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error: {str(e)}\n"
        data_size = 0.0

    duration = round(time.time() - start_time, 2)
    logs += f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Job execution finalized with status: {status_text}\n"
    
    # 3. Save finalized status
    update_data = {
        "status": status_text,
        "logs": logs,
        "data_size_mb": data_size,
        "duration_seconds": duration
    }
    updated_job = job_repo.update(db, new_job["id"], update_data)
    
    return updated_job
