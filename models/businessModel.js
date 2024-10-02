/**
 * @typedef {object} Business
 * @prop {string} name
 * @prop {import("mongoose").ObjectId} userId
 * @prop {import("mongoose").ObjectId} categoryId
 * @prop {import("mongoose").ObjectId} subCategoryId
 * @prop {string} primaryEmail
 * @prop {string} reportingEmail
 * @prop {string} logo
 * @prop {[import("mongoose").ObjectId]} reviews
 * @prop {boolean} isTrue If `false`, indicates the business is deleted
 */
/** @typedef {mongoose.Model<Business>} BusinessModel */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const businessSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  primaryEmail: {
    type: String,
    required: [true, 'Please provide your email'],
    lowercase: true,
  },
  reportingEmail: {
    type: [String],
    required: [true, 'Please provide your email'],
    lowercase: true,
  },
  logo: {
    type: String,
    required: true,
    trim: true,
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],
  forms: {
    type: [
      {
        isActive: {
          type: Boolean,
          default: false,
        },
        form: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Form',
        },
        code: {
          type: String,
          required: true,
          unique: true,
          default: function () {
            const newcode = (Math.random() * 1000).toFixed(0).toString(36) + Date.now().toString(36); // date in base-36 number format, the date is in milliseconds
            // add `-` (hyphens) as they are in google.meet links
            let str = '';
            for (let i = newcode.length - 1; i >= 0; i--) {
              if (i % 4 === 0) str += '-' + newcode[i];
              else str += newcode[i];
            }
            return str;
          },
        },
      },
    ],
    default: [],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// Create an index on the entire `forms` array to ensure uniqueness across the collection
businessSchema.index({ 'forms.code': 1 }, { unique: true });

const businessModel = mongoose.model('Business', businessSchema);

module.exports = businessModel;
