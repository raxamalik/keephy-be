const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const franchiseSchema = new Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    primaryEmail: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
    },
    reportingEmail: {
      type: [String],
      required: [true, 'Please provide your email'],
      lowercase: true,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    openingHour: {
      type: String,
      required: true,
    },
    closingHour: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
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
  },
  { timestamps: true },
);



const franchiseModel = mongoose.model('Franchise', franchiseSchema);
franchiseSchema.index({ location: '2dsphere' });

// Create an index on the entire `forms` array to ensure uniqueness across the collection
franchiseSchema.index({ 'forms.code': 1 }, { unique: true });

module.exports = franchiseModel;
