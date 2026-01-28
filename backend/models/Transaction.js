/**
 * ============================================================================
 * TRANSACTION MODEL (Transaction.js)
 * ============================================================================
 * Immutable log of all stock movements.
 */

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    type: {
        type: String,
        enum: ['inbound', 'outbound', 'adjustment', 'return'],
        required: [true, 'Transaction type is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Please specify quantity moved'],
        min: 1
    },
    reason: {
        type: String,
        default: 'Regular Sale'
    },
    // Snapshot of price at the time of transaction
    unitPriceSnapshot: {
        type: Number
    },
    totalValue: {
        type: Number
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Calculate total value before saving
TransactionSchema.pre('save', async function(next) {
    // If unitPriceSnapshot is provided, calculate total
    if (this.unitPriceSnapshot && this.quantity) {
        this.totalValue = this.unitPriceSnapshot * this.quantity;
    }
    next();
});

// Static method to get total sales for a date range
TransactionSchema.statics.getSalesVolume = async function(startDate, endDate) {
    return await this.aggregate([
        {
            $match: {
                type: 'outbound',
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: '$quantity' },
                totalRevenue: { $sum: '$totalValue' }
            }
        }
    ]);
};

module.exports = mongoose.model('Transaction', TransactionSchema);