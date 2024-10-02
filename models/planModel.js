const mongoose = require('mongoose');


const planSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    price: {
        type: Number,
    },
    interval: {
        type: String,
    },
    intervalCount: {
        type: Number,
    },
    description: {
        type: String,
    },
    free: {
        type: Boolean,
    },
    productId: {
        type: String,
    },
    priceId: {
        type: String,
    },

});
const category = mongoose.model('Plan', planSchema);

module.exports = category;
