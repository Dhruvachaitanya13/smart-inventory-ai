/**
 * @file server.js
 * @description Enterprise Entry Point for Smart Inventory AI Backend.
 * @module server
 * @version 2.2.0
 */

require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// --- ROUTE IMPORTS ---
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// --- CONSTANTS & CONFIGURATION ---
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const NUM_CPUS = os.cpus().length;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory_enterprise';

/**
 * @function setupWorker
 * @description Initializes the Express Application for a single worker process.
 */
const setupWorker = () => {
  const app = express();

  // --- 1. SECURITY & PERFORMANCE MIDDLEWARE ---
  
  // Set security HTTP headers
  app.use(helmet());

  // Gzip compression for response bodies
  app.use(compression());

  // Rate Limiting: 200 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    standardHeaders: true, 
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
      code: 429
    }
  });
  app.use('/api', limiter);

  // CORS Configuration - Strict whitelist in production
  const whitelist = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // UPDATED: Added 'Idempotency-Key' and 'X-Client-Version' here
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'X-Client-Version']
  };
  app.use(cors(corsOptions));

  // --- 2. BODY PARSING & LOGGING ---

  // Increase payload limit for large CSV imports (50mb)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Create a write stream (in append mode) for logs
  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
  
  // Setup Morgan logger
  if (NODE_ENV === 'development') {
    app.use(morgan('dev')); // Console logging
  } else {
    app.use(morgan('combined', { stream: accessLogStream })); // File logging in prod
  }

  // --- 3. DATABASE CONNECTION LOGIC ---

  /**
   * @function connectDatabase
   * @description Establishes MongoDB connection with retry strategy.
   * @param {number} retries - Number of remaining retry attempts.
   */
  const connectDatabase = async (retries = 5) => {
    while (retries > 0) {
      try {
        await mongoose.connect(MONGO_URI, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log(`[Worker ${process.pid}] ✅ MongoDB Connected: ${mongoose.connection.host}`);
        return;
      } catch (error) {
        console.error(`[Worker ${process.pid}] ❌ Database Connection Error: ${error.message}`);
        retries -= 1;
        console.log(`[Worker ${process.pid}] ⏳ Retrying in 5 seconds... (${retries} attempts left)`);
        await new Promise(res => setTimeout(res, 5000));
      }
    }
    console.error(`[Worker ${process.pid}] 🔥 Critical Failure: Unable to connect to Database. Worker exiting.`);
    process.exit(1);
  };

  // --- 4. API ROUTES MOUNTING ---

  // Health Check Endpoint (Used by Load Balancers)
  app.get('/api/health', (req, res) => {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      workerId: process.pid
    };
    try {
      res.send(healthcheck);
    } catch (e) {
      healthcheck.message = e;
      res.status(503).send();
    }
  });

  // Application Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // --- 5. ERROR HANDLING ARCHITECTURE ---

  // 404 - Not Found Handler
  app.use((req, res, next) => {
    const error = new Error(`Resource Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log error details for debugging
    console.error(`[Worker ${process.pid}] 🔥 Error: ${err.message}`);
    if (NODE_ENV === 'development' && err.stack) {
      console.error(err.stack);
    }

    res.status(statusCode).json({
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        code: statusCode,
        workerId: process.pid,
        stack: NODE_ENV === 'production' ? null : err.stack,
      }
    });
  });

  // --- 6. SERVER INITIALIZATION ---

  const server = app.listen(PORT, async () => {
    await connectDatabase();
    console.log(`[Worker ${process.pid}] 🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  });

  // --- 7. GRACEFUL SHUTDOWN HANDLERS ---

  const shutdown = (signal) => {
    console.log(`[Worker ${process.pid}] Received ${signal}. Closing HTTP server...`);
    server.close(() => {
      console.log(`[Worker ${process.pid}] HTTP server closed.`);
      mongoose.connection.close(false, () => {
        console.log(`[Worker ${process.pid}] MongoDB connection closed.`);
        process.exit(0);
      });
    });
    
    // Force close after 10s if graceful fails
    setTimeout(() => {
        console.error(`[Worker ${process.pid}] Could not close connections in time, forcefully shutting down`);
        process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// --- CLUSTER INITIALIZATION ---

if (NODE_ENV === 'production' && cluster.isPrimary) {
  console.log(`[Master] Primary process ${process.pid} is running`);
  console.log(`[Master] Forking ${NUM_CPUS} workers...`);

  // Fork workers based on CPU cores
  for (let i = 0; i < NUM_CPUS; i++) {
    cluster.fork();
  }

  // Listen for dying workers and replace them
  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[Master] Worker ${worker.process.pid} died with code ${code}. Forking replacement...`);
    cluster.fork();
  });

} else {
  // If not production or if this is a worker process, setup the server
  if (NODE_ENV !== 'production') {
    console.log('[Dev] Running in Single Process Mode (Clustering Disabled)');
  }
  setupWorker();
}

// Handle Unhandled Promise Rejections (Process-wide)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});