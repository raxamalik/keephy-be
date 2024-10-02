const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

const formController = require('../controllers/formController');
const auth = require('../middleware/auth');

const nameValidator = () =>
  check('name').isString().withMessage('Name should be string');
const idValidator = (fieldName = 'id', type = '') =>
  check(fieldName).isMongoId().withMessage(`${type} id is invalid`);
const questionsValidator = () => {
  return check('questions')
    .isArray()
    .withMessage('Questions should be an array')
    .custom((questions) => {
      if (questions.length < 1) {
        throw new Error('At least one question is required');
      }
      return true;
    });
}
const questionTypeValidators = [
  check('questions.*.questionLabel')
    .isString()
    .withMessage('Question label is should be string'),
  check('questions.*.questionType')
    .isString()
    .withMessage('Question type should be string')
    .isIn([
      'dropdown',
      'rating',
      'yesno',
      'multipleChoice',
      'shortText',
      'longText',
    ])
    .withMessage('Invalid question type'),
  // Validator for `options` field when `questionType` is 'dropdown'
  check('questions.*.options')
    .custom((value, { req, pathValues }) => {
      const questionType = req.body.questions.find(
        (q, indx) =>
          q.questionType === 'dropdown' && indx === Number(pathValues),
      );
      if (questionType && (!Array.isArray(value) || value.length === 0)) {
        throw new Error('Options are required for dropdown question');
      }
      return true;
    }),
  // Validator for `choices` field when `questionType` is 'multipleChoice'
  check('questions.*.choices')
    .custom((value, { req, pathValues }) => {
      const questionType = req.body.questions.find(
        (q, indx) =>
          q.questionType === 'multipleChoice' && indx === Number(pathValues),
      );
      if (questionType && (!Array.isArray(value) || value.length === 0)) {
        throw new Error('Choices are required for multiple choice question');
      }
      return true;
    }),
  // Validator for `ratingData.minRating` and `ratingData.maxRating` when `questionType` is 'rating'
  check('questions.*.ratingData.minRating')
    .custom((value, { req, pathValues }) => {
      const questionType = req.body.questions.find(
        (q, indx) => q.questionType === 'rating' && indx === Number(pathValues),
      );
      if (questionType && (typeof value !== 'number' || value < 1)) {
        throw new Error(
          'Minimum rating must be at least 1 for rating questions',
        );
      }
      return true;
    }),
  check('questions.*.ratingData.maxRating')
    .custom((value, { req, pathValues }) => {
      const questionType = req.body.questions.find(
        (q, indx) => q.questionType === 'rating' && indx === Number(pathValues),
      );
      if (questionType && (typeof value !== 'number' || value > 5)) {
        throw new Error(
          'Maximum rating must be at most 5 for rating questions',
        );
      }
      return true;
    }),
];

// Validators for answers array
const answersValidator = () => {
  return check('answers')
    .isArray()
    .withMessage('Answers should be an array')
    .custom((answers) => {
      if (answers.length < 1) {
        throw new Error('At least one answer is required');
      }
      return true;
    });
};
// Validators for each answer inside the answers array
const answerDetailsValidators = [
  check('answers.*.questionLabel')
    .isString()
    .withMessage('Question label must be a string')
    .notEmpty()
    .withMessage('Question label is required'),
  check('answers.*.answer')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Answer must be a string'),
];

router.get('/', auth, formController.getAllForms);

router.post(
  '/addTypeForm',
  auth,
  [
    nameValidator().notEmpty().withMessage('Name is required'),
    questionsValidator(),
    ...questionTypeValidators,
  ],
  formController.addTypeForm,
);

router.post(
  '/addFormSubmission',
  [
    idValidator('formId', 'Form').notEmpty().withMessage('Form id is required'),
    check('email').isEmail().withMessage('Email is invalid'),
    check('phone').isMobilePhone().withMessage('Phone is invalid'),
    check('moduleName')
      .isString()
      .isIn(['business', 'location'])
      .withMessage('Module name should be one of "business" or "location".')
      .notEmpty()
      .withMessage('Module name is required'),
    check('moduleId')
      .isMongoId()
      .withMessage('Module Id is invalid')
      .notEmpty()
      .withMessage('Module Id is required'),
    check('code')
      .isString()
      .notEmpty().withMessage('Form code is required'),
    answersValidator(),
    ...answerDetailsValidators,
  ],
  formController.addFormSubmission,
);

router.get('/getFormByBusinessId/:id', auth, formController.getFormByBusinessId);

router.get(
  '/getFormByLocationId/:id',
  auth,
  formController.getFormByLocationId,
);

router.get('/getFormById/:id', auth, formController.getFormById);

router.get('/getFormByCode/:code', formController.getFormByCode)

router.get(
  '/getFormSubmissionByFormId/:id',
  auth,
  formController.getFormSubmissionByFormId,
);

router.delete('/deleteForm/:id', auth, formController.deleteForm);

router.put(
  '/updateFormById/:id',
  auth,
  [
    nameValidator(),
    idValidator('businessId', 'Business'),
    questionsValidator(),
    ...questionTypeValidators,
  ],
  formController.updateFormById,
);

module.exports = router;
