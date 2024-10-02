const express = require('express');
const { check } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/user-subscription', auth, subscriptionController.userSubscription);

router.post('/', [
    check('planId').not().isEmpty(),
], auth, subscriptionController.createSubscription);

router.post('/auto-renew', [
    check('renew').isBoolean().not().isEmpty(),
    check('subscriptionId').not().isEmpty(),
    check('userId').not().isEmpty(),
], subscriptionController.autoRenew);

router.delete('/cancel-subscription/:subscriptionId', subscriptionController.cancelSubscription);

module.exports = router;