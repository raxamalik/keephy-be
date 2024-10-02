const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  moduleName: {
    type: String,
    required: [true, 'Module name is required'],
    enum: ['business', 'location'],
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Module Id is required'],
  },
  code: {
    type: String,
    required: [true, 'Form code is required'],
  },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  answers: [
    {
      questionLabel: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone'],
  },
});

const formSubmissionModel = mongoose.model(
  'FormSubmission',
  formSubmissionSchema,
);

module.exports = formSubmissionModel;
