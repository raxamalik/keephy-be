const { validationResult } = require('express-validator');
const HttpError = require('../utils/httpError');
const Category = require('../models/categoryModel');
const factory = require('./handlerFactory');

const createCategory = async (req, res, next) => {
    try {
        const categories = req.body.categories;       
        const newCategories = await Category.insertMany(categories);
        res.status(201).json({ message: 'category created successfully',newCategories});
    } catch (error) {
        return (new HttpError('Error to add category ', 500))
    }
   
};

const getCategorySubcategories = async (req, res, next) => {
    try {
      const categoryId = req.params.id;
  
      const category = await Category.findById(categoryId);
  
      if (!category) {
        return next(new HttpError('Category not found', 404));
      }
  
      res.status(200).json({ subcategories: category.subcategories });
    } catch (error) {
      return next(new HttpError('Failed to retrieve subcategories', 500));
    }
  };

const getAllCategory = async (req,res,next)=>{
  try {

    const getAllCategories = await Category.find();
    res.status(200).json({ categories:getAllCategories });
  } catch (error) {
    return next(new HttpError('Failed to retrieve categories', 500));
    
  }
}
const deleteCategory = factory.deleteOne(Category) 
const getCategory = factory.getOne(Category)

exports.createCategory = createCategory;
exports.getAllCategory = getAllCategory;
exports.deleteCategory = deleteCategory;
exports.getCategory = getCategory;
exports.getCategorySubcategories = getCategorySubcategories;


