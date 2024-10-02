const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide form Name'],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  questions: [
    {
      questionLabel: { type: String, required: true },
      isRequired: { type: Boolean, default: false },
      questionType: {
        type: String,
        enum: [
          'dropdown',
          'rating',
          'yesno',
          'multipleChoice',
          'shortText',
          'longText',
        ],
        required: true,
      },
      options: {
        type: [String],
        required: function () {
          return this.questionType === 'dropdown';
        },
      },
      choices: {
        type: [String],
        required: function () {
          return this.questionType === 'multipleChoice';
        },
      },
      ratingData: {
        minRating: {
          type: Number,
          default: 1,
          required: function () {
            return this.questionType === 'rating';
          },
        },
        maxRating: {
          type: Number,
          default: 5,
          required: function () {
            return this.questionType === 'rating';
          },
        },
      },
    },
  ],
});

formSchema.pre('save', function (next) {
  this.questions.forEach((question) => {
    switch (question.questionType) {
      case 'dropdown':
        question.choices = undefined;
        question.ratingData = undefined;
        break;
      case 'multipleChoice':
        question.options = undefined;
        question.ratingData = undefined;
        break;
      case 'rating':
        question.options = undefined;
        question.choices = undefined;
        break;
      case 'shortText':
      case 'longText':
      case 'yesno':
        question.options = undefined;
        question.choices = undefined;
        question.ratingData = undefined;
        break;
    }
  });
  next();
});

const formModel = mongoose.model('Form', formSchema);

module.exports = formModel;
