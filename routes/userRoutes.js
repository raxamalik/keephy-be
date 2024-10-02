const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const userController = require("../controllers/userController");
const auth = require('../middleware/auth');

router.post(
  "/login",
  [
    check("email").not().isEmpty().withMessage("Email is required"),
    check("password").not().isEmpty().withMessage("password is required"),
  ],
  userController.login
);

router.post(
  "/signUp",
  [
    check("name").not().isEmpty().withMessage("Email is required"),
    check("email").not().isEmpty().withMessage("Email is required"),
    check("password")
      .not()
      .isEmpty()
      .isLength({ min: 8 })
      .withMessage("Password length must be at least 8 characters"),
    check("cPassword")
      .not()
      .isEmpty()
      .withMessage("Password confirmation is required")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password confirmation does not match password");
        }
        return true;
      }),
  ],
  userController.signUp
);
router.post(
  "/forgot-password",
  [
    check("email").not().isEmpty().withMessage("Email is required"),
  ],
  userController.forgotPassword
);
router.post(
  "/verifyOTP",
  [
    check("otp").not().isEmpty().withMessage("otp is required"),
    check("email").not().isEmpty().withMessage("Email is required"),
  ],
  userController.verifyOTP
);
router.post(
  "/resetPassword",
  [
    check("email").not().isEmpty().withMessage("Email is required"),
    check("password").not().isEmpty().withMessage("password is required"),
    check("passwordConfirm").not().isEmpty().withMessage("passwordConfirm is required"),
  ],
  userController.resetPassword
);
router.post(
  '/google-login',
  [
    check('code').not().isEmpty(),
  ],
  userController.googleLogin
)

// route for handling stripe subscription
// this route contains test data, handle appropriatley after integrating subscriptions
router.post('/subscription', auth, userController.subscriptionController);

router.post(
  '/addCard',
  auth,
  // [
  //   check('cardNo').not().isEmpty(),
  //   check('expMonth').isNumeric().not().isEmpty(),
  //   check('expYear').isNumeric().not().isEmpty(),
  //   check('cvc').not().isEmpty(),
  //   check('name').not().isEmpty(),
  // ],
  userController.addUserCard
);

module.exports = router;
