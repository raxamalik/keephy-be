const express = require('express');
const { check } = require('express-validator');
const planController = require('../controllers/planController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', [
  check('name').isString().not().isEmpty(),
  check('description').isString().not().isEmpty(),
  check('price').isNumeric().not().isEmpty(),
  check('interval').optional({ checkFalsy: true }).isString().isIn(['month', 'year']).withMessage('Invalid interval').not().isEmpty(),
  check('interval_count').optional({ checkFalsy: true }).isInt().not().isEmpty(),
  check('free').isBoolean().not().isEmpty(),
], planController.addPlan);
router.get('/',
  planController.getPlan
);
router
  .route('/:id')
  .get(planController.getPlanById)
  .patch([
    check('name').optional({ checkFalsy: true }).not().isEmpty(),
    check('description').optional({ checkFalsy: true }).not().isEmpty(),
    check('price').optional({ checkFalsy: true }).not().isEmpty(),
    check('interval').optional({ checkFalsy: true }).isString().isIn(['month', 'year']).withMessage('Invalid interval').not().isEmpty(),
    check('interval_count').optional({ checkFalsy: true }).isInt().not().isEmpty(),
  ], planController.updatePlan)
  .delete(planController.deletePlan);

module.exports = router;