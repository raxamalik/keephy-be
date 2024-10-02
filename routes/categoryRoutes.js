const express = require("express");
const categoryController = require("../controllers/categoryController");
const router = express.Router();
const { check } = require("express-validator");


router.get('/:id/subcategories',categoryController.getCategorySubcategories);
router
  .route('/')
  .get(categoryController.getAllCategory)
  .post(categoryController.createCategory);



module.exports = router;
