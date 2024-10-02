const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
    planId: { type: mongoose.Schema.ObjectId, ref: 'Plan' },
    subscriptionId: { type: String },
    active: { type: Boolean, default: true },
}, { timestamps: true });

const Subscription = mongoose.model('subscription', subscriptionSchema);

module.exports = Subscription;


