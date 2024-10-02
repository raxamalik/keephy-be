const express = require('express');
const { check } = require('express-validator');
const { isValidObjectId } = require('mongoose');

const businessController = require('../controllers/businessController');
const router = express.Router();
const logoUpload = require('../middleware/logo-upload');
const auth = require('../middleware/auth');

const nameValidator = () =>
  check('name').isString().withMessage('Name should be string');
const idValidator = (fieldName = 'id', type = '') =>
  check(fieldName).isMongoId().withMessage(`${type} id is invalid`);
const primaryEmailValidator = () =>
  check('primaryEmail').isEmail().withMessage('Primary email is invalid');
const businessIdsValidator = () =>
  check('businessIds').custom((businessIds) => {
    // If businessIds is a string, validate it directly as an id
    if (typeof businessIds === 'string') {
      if (!isValidObjectId(businessIds)) {
        throw new Error('Business id is invalid');
      }
      return true;
    }
    // If businessIds is an array, validate each element
    if (Array.isArray(businessIds)) {
      for (const id of businessIds) {
        if (typeof id !== 'string' || !isValidObjectId(id)) {
          throw new Error('Invalid Business id: ' + id);
        }
      }
      return true;
    }
    return true;
  });
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
      for (const email of reportingEmail) {
        if (typeof email !== 'string' || !email.includes('@')) {
          throw new Error('Invalid reporting email: ' + email);
        }
      }
      return true;
    }
    return true;
  });

router.post(
  '/createReview',
  [
    nameValidator().notEmpty().withMessage('Name is required'),
    check('description')
      .isString()
      .withMessage('Description should be string')
      .optional(),
    check('rating')
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating should be valid number between 1 and 5'),
    businessIdsValidator()
      .isLength({ min: 1 })
      .withMessage('At least one business id required'),
  ],
  businessController.createReview,
);
router.delete('/deleteBusiness/:id', auth, businessController.deleteBusiness);
router
  .route('/')
  .get(auth, businessController.getAllBusiness)
  .post(
    auth,
    logoUpload.single('logo_img'),
    [
      nameValidator().notEmpty().withMessage('Name is required'),
      idValidator('categoryId', 'Category')
        .notEmpty()
        .withMessage('Category id is required'),
      idValidator('subCategoryId', 'Subcategory')
        .notEmpty()
        .withMessage('Subcategory id is required'),
      primaryEmailValidator()
        .notEmpty()
        .withMessage('Primary email is required'),
      reportingEmailValidator()
        .isLength({ min: 1 })
        .withMessage('At least one reporting email is required'),
    ],
    businessController.addBusiness,
  );

router
  .route('/:id')
  .get(auth, businessController.getOneBusiness)
  .put(
    auth,
    logoUpload.single('logo_img'),
    [
      nameValidator().optional(),
      idValidator('categoryId', 'Category'),
      idValidator('subCategoryId', 'Subcategory'),
      primaryEmailValidator(),
      reportingEmailValidator(),
    ],
    businessController.updateBusiness,
  );

// add form to business
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
  businessController.addForm,
);

router.put(
  '/:id/forms/:formId/activate',
  auth,
  businessController.activateForm,
);

module.exports = router;
