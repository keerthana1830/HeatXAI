import numpy as np
import pandas as pd
from datetime import datetime
from typing import Tuple

def generate_synthetic_data(base_temp: float, start_year: int = 2018, end_year: int = 2026) -> pd.DataFrame:
    """
    Generate synthetic monthly Land Surface Temperature (LST) data.
    Simulates seasonal variations (higher in summer, lower in winter) and a slight upward trend.
    """
    dates = pd.date_range(start=f"{start_year}-01-01", end=f"{end_year}-01-01", freq='MS')
    n_samples = len(dates)
    
    # Base temperature
    lst_values = np.full(n_samples, base_temp)
    
    for i, date in enumerate(dates):
        month = date.month
        
        # Seasonal offsets
        if month in [4, 5, 6]: # Summer peak
            offset = np.random.uniform(3.5, 6.5)
        elif month in [11, 12, 1]: # Winter low
            offset = np.random.uniform(-4.5, -1.5)
        else: # Spring/Autumn
            offset = np.random.uniform(-1.5, 2.5)
            
        # Add slight global warming trend (e.g., +0.02 deg per month)
        trend = (i / 12) * 0.2 
        
        # Add noise
        noise = np.random.normal(0, 0.5)
        
        lst_values[i] = round(base_temp + offset + trend + noise, 2)
        
    df = pd.DataFrame({
        'date': dates,
        'lst': lst_values
    })
    
    return df

def prepare_time_series_data(df: pd.DataFrame, look_back: int = 12) -> Tuple[np.ndarray, np.ndarray]:
    """
    Convert a time series into X and y for supervised learning models.
    """
    X, y = [], []
    series = df['lst'].values
    for i in range(len(series) - look_back):
        X.append(series[i:(i + look_back)])
        y.append(series[i + look_back])
    return np.array(X), np.array(y)
