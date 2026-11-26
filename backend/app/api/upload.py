from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pymongo.database import Database
import re
import csv
import io

from app.core.database import get_db
from app.api.auth import get_current_user
from app.repositories.district import district_repo

router = APIRouter(prefix="/upload", tags=["upload"])

# List of valid districts in Tamil Nadu to match against
TAMIL_NADU_DISTRICTS = {
    "chennai", "coimbatore", "madurai", "tiruchirappalli", "salem", "tirunelveli", "vellore",
    "thoothukudi", "erode", "thanjavur", "dindigul", "ranipet", "tiruppur", "kancheepuram",
    "tiruvallur", "chengalpattu", "cuddalore", "karur", "nagapattinam", "namakkal", "nilgiris",
    "perambalur", "pudukkottai", "ramanathapuram", "sivaganga", "tenkasi", "theni",
    "thiruvannamalai", "tiruvarur", "dharmapuri", "krishnagiri", "kallakurichi", "mayiladuthurai",
    "tirupathur", "viluppuram", "virudhunagar", "ariyalur", "kanyakumari"
}

@router.post("", status_code=status.HTTP_200_OK)
async def upload_dataset_file(
    file: UploadFile = File(...),
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts CSV, TXT, PDF, or DOCX files.
    Parses them for district temperatures and updates dashboard indices.
    """
    filename = file.filename.lower()
    contents = await file.read()
    
    updates = []
    
    # 1. Parse CSV File
    if filename.endswith(".csv"):
        try:
            stream = io.StringIO(contents.decode("utf-8"))
            reader = csv.DictReader(stream)
            for row in reader:
                # Find columns matching keys
                name_key = next((k for k in row if k.lower() in ["district", "name", "district name"]), None)
                temp_key = next((k for k in row if k.lower() in ["lst", "temp", "temperature"]), None)
                
                if name_key and temp_key:
                    name_val = row[name_key].strip()
                    temp_val = row[temp_key].strip()
                    try:
                        temp_float = float(temp_val)
                        if name_val.lower() in TAMIL_NADU_DISTRICTS:
                            updates.append((name_val, temp_float))
                    except ValueError:
                        continue
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    # 2. Parse Text / PDF / DOCX Files
    else:
        # Extract printable text characters from binary or string stream
        text_content = ""
        try:
            text_content = contents.decode("utf-8", errors="ignore")
        except Exception:
            # Fallback for binary contents
            text_content = "".join(chr(b) for b in contents if 32 <= b <= 126 or b in [10, 13])
            
        # Regex scanner to find patterns like "Chennai: 38.5" or "Coimbatore 32"
        pattern = re.compile(r'([A-Za-z]+)\s*[:=-]?\s*(\d{2}(?:\.\d+)?)')
        matches = pattern.findall(text_content)
        
        for name, temp in matches:
            if name.lower() in TAMIL_NADU_DISTRICTS:
                updates.append((name, float(temp)))

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No valid district temperature matrices found in the uploaded file."
        )

    # 3. Apply updates to the database
    applied = 0
    all_districts = district_repo.get_all(db)
    dist_map = {d["name"].lower(): d for d in all_districts}
    
    for name, temp in updates:
        dist = dist_map.get(name.lower())
        if dist:
            dist["lst"] = temp
            # Recalculate index
            dist["heat_index"] = round(dist["lst"] * (1.0 + dist.get("ndbi", 0.4) - dist.get("ndvi", 0.2)), 1)
            dist["risk_level"] = "Extreme" if dist["heat_index"] >= 50 else \
                              "High" if dist["heat_index"] >= 35 else \
                              "Moderate" if dist["heat_index"] >= 20 else "Low"
            district_repo.update(db, dist["id"], dist)
            applied += 1
            
    return {
        "status": "Success",
        "message": f"Successfully ingested file '{file.filename}'. Scanned {len(updates)} matches, updated {applied} districts.",
        "updates": [{"district": name, "lst": temp} for name, temp in updates[:10]]
    }
