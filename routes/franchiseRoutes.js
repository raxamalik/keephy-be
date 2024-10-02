const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

const franchiseController = require('../controllers/franchiseController');
const auth = require('../middleware/auth');

const idValidator = (fieldName = 'id', type = '') =>
  check(fieldName).isMongoId().withMessage(`${type} id is invalid`);
const primaryEmailValidator = () =>
  check('primaryEmail').isEmail().withMessage('Primary email is invalid');
const reportingEmailValidator = () =>
  check('reportingEmail').custom((reportingEmail) => {
    // If reportingEmail is a string, validate it directly as an email
    if (typeof reportingEmail === 'string') {
      if (!reportingEmail.includes('@')) {
        throw new Error('Reporting email is invalid');
      }
      return true;
    }
    // If reportingEmail is an array, validate each element
    if (Array.isArray(reportingEmail)) {
      if (reportingEmail.length < 1) {
        throw new Error('At least one reporting email is required');
      }
      for (const email of reportingEmail) {
        if (typeof email !== 'string' || !email.includes('@')) {
          throw new Error('Invalid reporting email: ' + email);
        }
      }
    }
    return true;
  });
// Validator for openingHour
const openingHourValidator = () => {
  return check('openingHour')
    .isTime()
    .withMessage('Opening hour must be a valid time');
};
// Validator for closingHour
const closingHourValidator = () => {
  return check('closingHour')
    .isTime()
    .withMessage('Closing hour must be a valid time');
};
// Validator for address
const addressValidator = () => {
  return check('address').isString().withMessage('Address must be a string');
};

router.get(
  '/getFranchiseByBusinessId/:id',
  franchiseController.getFranchiseByBusinessId,
);
router.delete('/deleteFranchise/:id', franchiseController.deleteFranchise);
router
  .route('/')
  .get(franchiseController.getAllFranchise)
  .post(
    auth,
    [
      idValidator('businessId', 'Business')
        .notEmpty()
        .withMessage('Business id is required'),
      primaryEmailValidator()
        .notEmpty()
        .withMessage('Primary email is required'),
      reportingEmailValidator()
        .notEmpty()
        .withMessage('Reporting email is required'),
      openingHourValidator(),
      closingHourValidator(),
      addressValidator(),
    ],
    franchiseController.addFranchise,
  );

router
  .route('/:id')
  .get(franchiseController.getOneFranchise)
  .put(
    auth,
    [
      idValidator('businessId', 'Business'),
      primaryEmailValidator(),
      reportingEmailValidator(),
      openingHourValidator().optional(),
      closingHourValidator().optional(),
      addressValidator().optional(),
    ],
    franchiseController.updateOneFranchise,
  );

router.post(
  '/:id/forms',
  auth,
  [
    check('forms')
      .isArray()
      .withMessage('Forms should be an array')
      .notEmpty()
      .withMessage('Forms is required'),
  ],
  franchiseController.addForm,
);

router.put(
  '/:id/forms/:formId/activate',
  auth,
  franchiseController.activateForm,
);

module.exports = router;
