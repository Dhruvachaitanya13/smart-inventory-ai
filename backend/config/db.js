/**
 * ============================================================================
 * DATABASE CONFIGURATION (db.js)
 * ============================================================================
 * Handles the connection to the MongoDB cluster.
 * * FEATURES:
 * - Connection Pooling: Optimized pool size for high-throughput.
 * - Retry Logic: Exponential backoff mechanism for resilience.
 * - Event Listeners: Real-time logging of database states (connected, disconnected).
 * - Graceful Shutdown: Handles process termination signals to close connections safely.
 * * @module config/db
 */

const mongoose = require('mongoose');
const colors = require('colors');

// Internal Utilities
const logger = require('../utils/logger'); // Assuming a custom logger exists

/**
 * MongoDB Connection Options
 * Best practices for Mongoose 6+ and MongoDB Atlas
 */
const dbOptions = {
    // Note: useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
    // but kept here commented out for legacy reference or specific driver versions.
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    
    // Connection Pool Size
    // Maintain up to 10 socket connections. If operations are slow, increase this.
    maxPoolSize: 10,
    
    // Server Selection Timeout
    // Keep trying to send operations for 5 seconds before erroring
    serverSelectionTimeoutMS: 5000,
    
    // Socket Timeout
    // Close sockets after 45 seconds of inactivity
    socketTimeoutMS: 45000,
};

/**
 * Connect to MongoDB with Retry Logic
 * Attempts to connect to the database. If it fails, it waits and retries.
 */
const connectDB = async () => {
    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const uri = process.env.MONGO_URI;

            if (!uri) {
                throw new Error("MONGO_URI environment variable is not defined.");
            }

            logger.info(`Attempting to connect to MongoDB (Attempt ${retries + 1}/${MAX_RETRIES})...`);

            const conn = await mongoose.connect(uri, dbOptions);

            logger.info(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
            
            // Log database name for verification
            logger.info(`Database Name: ${conn.connection.name}`.blue);
            
            return conn; // Success exit
        } catch (err) {
            retries += 1;
            logger.error(`MongoDB Connection Error: ${err.message}`.red);
            
            if (retries === MAX_RETRIES) {
                logger.error('Max retries reached. Exiting application...'.red.bold);
                process.exit(1);
            }

            // Exponential Backoff: Wait 2s, 4s, 8s, etc.
            const waitTime = Math.pow(2, retries) * 1000;
            logger.warn(`Waiting ${waitTime / 1000} seconds before retrying...`);
            await new Promise(res => setTimeout(res, waitTime));
        }
    }
};

/**
 * Connection Event Listeners
 * Monitor the health of the database connection in real-time.
 */
mongoose.connection.on('connected', () => {
    logger.info('Mongoose default connection is open'.green);
});

mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose default connection error: ${err}`.red);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose default connection is disconnected'.yellow);
});

mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose default connection is reconnected'.green);
});

/**
 * Graceful Shutdown Handler
 * Ensures the database connection is closed properly when the server stops.
 */
const closeConnection = async () => {
    try {
        await mongoose.connection.close();
        logger.info('Mongoose default connection disconnected through app termination'.magenta);
        process.exit(0);
    } catch (err) {
        logger.error(`Error closing MongoDB connection: ${err.message}`);
        process.exit(1);
    }
};

// Handle Process Termination Signals (SIGINT = Ctrl+C, SIGTERM = Docker stop)
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = connectDB;