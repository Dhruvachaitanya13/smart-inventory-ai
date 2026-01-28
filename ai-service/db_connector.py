import os
import logging
import time
from typing import List, Dict, Optional, Any
from pymongo import MongoClient, UpdateOne
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, BulkWriteError
from datetime import datetime

# Configure Structured Logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger("DB_Connector")

class DatabaseConnectionError(Exception):
    """Custom Exception for DB Failures"""
    pass

class DBConnector:
    _instance = None

    def __new__(cls):
        """Singleton Pattern to ensure one connection pool."""
        if cls._instance is None:
            cls._instance = super(DBConnector, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initializes the MongoDB Connection with Retry Logic."""
        self.uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/smart_inventory")
        self.db_name = self.uri.split("/")[-1] or "smart_inventory"
        self.client = None
        self.db = None
        self._connect_with_retry()

    def _connect_with_retry(self, retries=3, delay=2):
        for attempt in range(retries):
            try:
                self.client = MongoClient(
                    self.uri, 
                    serverSelectionTimeoutMS=5000, 
                    maxPoolSize=50  # Production: Connection Pooling
                )
                self.client.admin.command('ping') # Trigger connection check
                self.db = self.client[self.db_name]
                logger.info(f"✅ Successfully connected to MongoDB: {self.db_name}")
                return
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                logger.warning(f"⚠️ Connection failed (Attempt {attempt+1}/{retries}): {e}")
                time.sleep(delay)
        
        logger.critical("❌ Could not connect to MongoDB after multiple attempts.")
        raise DatabaseConnectionError("Failed to connect to MongoDB.")

    def fetch_training_batch(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Fetches a batch of products optimized for training.
        Uses Projection to fetch ONLY necessary fields (save bandwidth).
        """
        try:
            # Aggregation pipeline to filter valid data at the database level
            pipeline = [
                {
                    "$match": {
                        "history": {"$exists": True, "$not": {"$size": 0}}
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "name": 1,
                        "quantity": 1,
                        "history": 1,
                        "category": 1
                    }
                },
                {"$limit": limit}
            ]
            
            products = list(self.db.products.aggregate(pipeline))
            logger.info(f"📉 Fetched {len(products)} products for training batch.")
            return products
        except Exception as e:
            logger.error(f"❌ Error fetching batch: {e}")
            return []

    def bulk_update_predictions(self, updates: List[Dict[str, Any]]):
        """
        Performs a BULK WRITE operation. 
        Crucial for performance when updating thousands of records.
        """
        if not updates:
            return

        operations = []
        for item in updates:
            operations.append(
                UpdateOne(
                    {"_id": item["_id"]},
                    {"$set": {
                        "ai_forecast": item["prediction"],
                        "last_analyzed": datetime.utcnow()
                    }}
                )
            )

        try:
            result = self.db.products.bulk_write(operations, ordered=False)
            logger.info(f"💾 Bulk Write Success: {result.modified_count} documents updated.")
        except BulkWriteError as bwe:
            logger.error(f"❌ Bulk Write Error: {bwe.details}")
        except Exception as e:
            logger.error(f"❌ General Write Error: {e}")

# Export singleton instance
db = DBConnector()