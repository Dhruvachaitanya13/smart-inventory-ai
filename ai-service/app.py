import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from db_connector import db
from forecaster import engine

# Initialize Flask & Logging
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI_Service_API")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online", 
        "service": "Inventory AI Brain",
        "version": "2.0 (Enterprise)"
    }), 200

@app.route('/predict/batch', methods=['POST'])
def run_batch_prediction():
    """
    High-Performance Batch Job:
    1. Fetches data in bulk (Aggregation)
    2. Generates forecasts (Prophet)
    3. Writes back in bulk (BulkWrite)
    """
    try:
        logger.info("🚀 Starting Batch Prediction Job...")
        
        # 1. Fetch optimized batch
        products = db.fetch_training_batch(limit=2000)
        if not products:
            return jsonify({"message": "No products with sufficient history found."}), 200

        updates = []
        stats = {"uptrend": 0, "downtrend": 0, "critical": 0}

        # 2. Iterate and Predict
        for p in products:
            pid = p['_id']
            name = p.get('name', 'Unknown')
            current_qty = p.get('quantity', 0)
            history = p.get('history', [])
            
            # Generate Forecast
            prediction = engine.generate_forecast(current_qty, history)
            
            if prediction['status'] == 'success':
                # Add to bulk update list
                updates.append({
                    "_id": pid,
                    "prediction": prediction
                })
                
                # Update realtime stats
                if prediction.get('trend') == 'uptrend': stats['uptrend'] += 1
                if prediction.get('trend') == 'downtrend': stats['downtrend'] += 1
                if prediction.get('stock_out_date'): stats['critical'] += 1

        # 3. Bulk Write to DB (The "Pro" Move)
        if updates:
            db.bulk_update_predictions(updates)

        return jsonify({
            "success": True,
            "processed": len(products),
            "updated": len(updates),
            "insights": stats,
            "message": "Batch analysis complete"
        }), 200

    except Exception as e:
        logger.error(f"Batch Job Failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5002))
    logger.info(f"🧠 AI Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)