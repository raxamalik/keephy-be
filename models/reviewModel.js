const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    businessIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true,
      },
    ],
  },
  { timestamps: true },
);

const reviewModel = mongoose.model('Review', reviewSchema);

module.exports = reviewModel;
