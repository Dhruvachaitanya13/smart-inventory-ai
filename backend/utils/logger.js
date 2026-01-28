const colors = require('colors');

const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toLocaleTimeString()} - ${msg}`.cyan),
    error: (msg) => console.error(`[ERROR] ${new Date().toLocaleTimeString()} - ${msg}`.red.bold),
    warn: (msg) => console.warn(`[WARN] ${new Date().toLocaleTimeString()} - ${msg}`.yellow),
    debug: (msg) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${msg}`.gray);
        }
    }
};

module.exports = logger;