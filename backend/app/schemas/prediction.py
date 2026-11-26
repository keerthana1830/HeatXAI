from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class PredictionBase(BaseModel):
    district_id: str
    model_type: str
    prediction_date: datetime
    predicted_lst: float
    model_config = ConfigDict(protected_namespaces=())

class PredictionCreate(PredictionBase):
    pass

class PredictionResponse(PredictionBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ModelTrainRequest(BaseModel):
    model_type: str # 'Random Forest', 'LSTM', 'CNN'
    model_config = ConfigDict(protected_namespaces=())
