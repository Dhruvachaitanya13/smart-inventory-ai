import pandas as pd
import numpy as np
from prophet import Prophet
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("Forecaster_Engine")

class ForecasterEngine:
    def __init__(self):
        # Configuration for the model
        self.model_config = {
            'daily_seasonality': False,
            'weekly_seasonality': True,
            'yearly_seasonality': True,
            'interval_width': 0.95  # 95% Confidence Interval
        }

    def _preprocess_data(self, history: List[Dict]) -> Optional[pd.DataFrame]:
        """
        Cleans, standardizes, and fills gaps in time-series data.
        """
        try:
            df = pd.DataFrame(history)
            
            # Normalize column names
            # Map common variations to 'ds' and 'y'
            col_map = {'date': 'ds', 'createdAt': 'ds', 'sales': 'y', 'quantity_sold': 'y'}
            df.rename(columns=col_map, inplace=True)

            # Ensure strict types
            df['ds'] = pd.to_datetime(df['ds'])
            df['y'] = pd.to_numeric(df['y'], errors='coerce').fillna(0)

            # Drop invalid rows
            df.dropna(subset=['ds', 'y'], inplace=True)
            
            # Aggregate duplicates (same day sales)
            df = df.groupby('ds').sum().reset_index()

            # Resample to ensure daily frequency (fill missing days with 0)
            df.set_index('ds', inplace=True)
            df = df.resample('D').sum().fillna(0).reset_index()

            if len(df) < 10:  # Require minimum data points
                logger.debug(f"Skipping: Insufficient data points ({len(df)})")
                return None
                
            return df
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            return None

    def generate_forecast(self, current_qty: int, history: List[Dict]) -> Dict[str, Any]:
        """
        Generates advanced inventory forecast with trend analysis and confidence scores.
        """
        df = self._preprocess_data(history)
        if df is None:
            return {"status": "insufficient_data"}

        try:
            # 1. Initialize & Train Prophet
            m = Prophet(**self.model_config)
            m.fit(df)

            # 2. Predict Future (30 Days)
            future = m.make_future_dataframe(periods=30)
            forecast = m.predict(future)

            # 3. Extract Future Data
            # Get last 30 days (prediction window)
            future_data = forecast.tail(30)
            
            # 4. Advanced Logic: Stock Depletion Calculation
            predicted_demand = future_data['yhat'].clip(lower=0).sum() # Prevent negative sales
            
            # Calculate depletion date
            running_stock = current_qty
            stock_out_date = None
            
            for _, row in future_data.iterrows():
                daily_sales = max(0, row['yhat'])
                running_stock -= daily_sales
                
                if running_stock <= 0:
                    stock_out_date = row['ds'].strftime("%Y-%m-%d")
                    break

            # 5. Trend Analysis
            # Compare first 5 days of forecast vs last 5 days
            start_sales = future_data['yhat'].head(5).mean()
            end_sales = future_data['yhat'].tail(5).mean()
            
            if end_sales > start_sales * 1.1:
                trend = "uptrend"
            elif end_sales < start_sales * 0.9:
                trend = "downtrend"
            else:
                trend = "stable"

            # 6. Confidence/Volatility Score
            # Wide gap between yhat_upper and yhat_lower = High Volatility (Low Confidence)
            avg_spread = (future_data['yhat_upper'] - future_data['yhat_lower']).mean()
            confidence_score = "high" if avg_spread < (current_qty * 0.2) else "low"

            return {
                "status": "success",
                "stock_out_date": stock_out_date,
                "predicted_monthly_demand": int(predicted_demand),
                "trend": trend,
                "confidence": confidence_score,
                "forecast_data": future_data[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(30).to_dict('records')
            }

        except Exception as e:
            logger.error(f"Model Training Failed: {e}")
            return {"status": "error", "message": str(e)}

# Export singleton
engine = ForecasterEngine()