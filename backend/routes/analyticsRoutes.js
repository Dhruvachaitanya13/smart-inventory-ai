const express = require('express');
const router = express.Router();

// IMPORT: Must match the export names in the controller
const { getStats, getForecast } = require('../controllers/analyticsController');

// ROUTE DEFINITIONS
// If getStats or getForecast is undefined here, the app crashes.
router.get('/stats', getStats);
router.get('/forecast', getForecast);

module.exports = router;