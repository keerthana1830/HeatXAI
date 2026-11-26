import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Conv1D, Flatten

from app.ml.data_generator import generate_synthetic_data, prepare_time_series_data

class MLModels:
    def __init__(self, look_back: int = 12):
        self.look_back = look_back
        self.scaler = MinMaxScaler(feature_range=(0, 1))

    def _prepare_data(self, df: pd.DataFrame):
        # Scale data
        scaled_lst = self.scaler.fit_transform(df[['lst']].values)
        temp_df = pd.DataFrame(scaled_lst, columns=['lst'])
        
        # Split train/test (80/20)
        train_size = int(len(temp_df) * 0.8)
        train_df = temp_df.iloc[:train_size]
        test_df = temp_df.iloc[train_size:]
        
        X_train, y_train = prepare_time_series_data(train_df, self.look_back)
        X_test, y_test = prepare_time_series_data(test_df, self.look_back)
        
        # Need to capture raw series to forecast future
        last_known = scaled_lst[-self.look_back:]
        
        return X_train, y_train, X_test, y_test, last_known
        
    def _forecast_future(self, model, last_known: np.ndarray, steps: int = 12, is_tf: bool = False) -> List[float]:
        current_batch = last_known.copy()
        predictions = []
        
        for _ in range(steps):
            if is_tf:
                pred_input = current_batch.reshape(1, self.look_back, 1)
                pred_scaled = model.predict(pred_input, verbose=0)[0, 0]
            else:
                pred_input = current_batch.reshape(1, -1)
                pred_scaled = model.predict(pred_input)[0]
                
            predictions.append(pred_scaled)
            
            # Update batch for next prediction
            current_batch = np.append(current_batch[1:], pred_scaled).reshape(-1, 1)
            
        # Inverse transform
        pred_actual = self.scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
        return [round(float(p[0]), 1) for p in pred_actual]

    def train_rf(self, df: pd.DataFrame) -> Dict[str, Any]:
        logs = ["Initializing Random Forest Regressor..."]
        X_train, y_train, X_test, y_test, last_known = self._prepare_data(df)
        
        # Sklearn requires 2D array, which prepare_time_series_data provides
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        
        logs.append(f"Training completed. Validation R²: {r2:.3f}, MAE: {mae:.3f}")
        
        future_preds = self._forecast_future(model, last_known, is_tf=False)
        
        return {
            "metrics": {"r2_score": r2, "mae": mae, "epochs": "N/A"},
            "logs": logs,
            "predictions": future_preds
        }

    def train_lstm(self, df: pd.DataFrame) -> Dict[str, Any]:
        logs = ["Initializing LSTM Model..."]
        X_train, y_train, X_test, y_test, last_known = self._prepare_data(df)
        
        # Reshape for TF: [samples, time steps, features]
        X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))
        X_test = X_test.reshape((X_test.shape[0], X_test.shape[1], 1))
        
        model = Sequential([
            LSTM(50, activation='relu', input_shape=(self.look_back, 1)),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        
        # Custom callback to capture logs
        class LogCallback(tf.keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs_dict=None):
                if (epoch + 1) % 10 == 0 or epoch == 0:
                    logs.append(f"Epoch {epoch+1}/50: loss = {logs_dict['loss']:.4f} - val_loss = {logs_dict['val_loss']:.4f}")
                    
        history = model.fit(
            X_train, y_train, 
            epochs=50, 
            validation_data=(X_test, y_test),
            verbose=0,
            callbacks=[LogCallback()]
        )
        
        y_pred = model.predict(X_test, verbose=0)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        
        logs.append(f"Training completed. Validation R²: {r2:.3f}, MAE: {mae:.3f}")
        
        future_preds = self._forecast_future(model, last_known, is_tf=True)
        
        return {
            "metrics": {"r2_score": r2, "mae": mae, "epochs": 50},
            "logs": logs,
            "predictions": future_preds
        }

    def train_cnn(self, df: pd.DataFrame) -> Dict[str, Any]:
        logs = ["Initializing 1D CNN Model..."]
        X_train, y_train, X_test, y_test, last_known = self._prepare_data(df)
        
        X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))
        X_test = X_test.reshape((X_test.shape[0], X_test.shape[1], 1))
        
        model = Sequential([
            Conv1D(filters=64, kernel_size=2, activation='relu', input_shape=(self.look_back, 1)),
            Flatten(),
            Dense(50, activation='relu'),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        
        class LogCallback(tf.keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs_dict=None):
                if (epoch + 1) % 10 == 0 or epoch == 0:
                    logs.append(f"Epoch {epoch+1}/50: loss = {logs_dict['loss']:.4f} - val_loss = {logs_dict['val_loss']:.4f}")
                    
        history = model.fit(
            X_train, y_train, 
            epochs=50, 
            validation_data=(X_test, y_test),
            verbose=0,
            callbacks=[LogCallback()]
        )
        
        y_pred = model.predict(X_test, verbose=0)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        
        logs.append(f"Training completed. Validation R²: {r2:.3f}, MAE: {mae:.3f}")
        
        future_preds = self._forecast_future(model, last_known, is_tf=True)
        
        return {
            "metrics": {"r2_score": r2, "mae": mae, "epochs": 50},
            "logs": logs,
            "predictions": future_preds
        }

ml_models = MLModels()
