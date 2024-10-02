const { validationResult } = require('express-validator');

const Business = require('../models/businessModel');
const Review = require('../models/reviewModel');
const HttpError = require('../utils/httpError');
const formModel = require('../models/formModel');

const addBusiness = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
      throw new HttpError(msgs, 422);
    }
    const logo = req?.file?.path;
    const data = {
      ...req.body,
      userId: req.userId,
      logo,
    };
    console.log(data);
    const newBusiness = new Business({
      ...req.body,
      userId: req.userId,
      logo,
    });
    const createBusiness = await newBusiness.save();
    res.status(200).json({
      message: 'Business added successfully',
      Business: createBusiness,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) return next(error);
    return next(new HttpError('Bad Request', 500));
  }
};
const getAllBusiness = async (req, res, next) => {
  try {
    // sometimes we need all businesses instead of paginated results
    // see loading businesses in `View Form Submissions` for a single form on frontend
    // send all businesses if page is not supplied
    if (!req.query?.page) {
      const businesses = await Business.find({
        userId: req.userId,
        isDeleted: false,
      }).populate([{ path: 'categoryId' }, { path: 'reviews' }]);
      updated = businesses.map((business) => {
        const updatedCategory = { ...business.categoryId.toObject() };
        updatedCategory.subcategories = updatedCategory.subcategories.find(
          (subcategory) =>
            subcategory._id.toString() === business.subCategoryId.toString(),
        );
        return { ...business.toObject(), categoryId: updatedCategory };
      });
      res.status(200).json({
        status: 'success',
        results: updated.length,
        totalRecords: updated.length,
        data: {
          docs: updated
        },
      });
    } else {
      const filter = { userId: req.userId, isDeleted: false };
      const page = parseInt(req?.query?.page) || 1;
      const totalRecords = await Business.countDocuments(filter);
      const limit = 10;
      const skip = (page - 1) * limit;
      const getAllBusiness = await Business.find(filter)
        .skip(skip)
        .limit(limit)
        .populate([{ path: 'categoryId' }, { path: 'reviews' }]);
      updated = getAllBusiness.map((business) => {
        const updatedCategory = { ...business.categoryId.toObject() };
        updatedCategory.subcategories = updatedCategory.subcategories.find(
          (subcategory) =>
            subcategory._id.toString() === business.subCategoryId.toString(),
        );
        return { ...business.toObject(), categoryId: updatedCategory };
      });

      res.status(200).json({
        status: 'success',
        results: getAllBusiness.length,
        limit,
        totalRecords,
        page,
        data: {
          docs: updated,
        },
      });
    }
  } catch (error) {
    console.log(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};
const getOneBusiness = async (req, res, next) => {
  try {
    const singleBusiness = await Business.findById(req.params.id, {
      isDeleted: false,
    }).populate([{ path: 'categoryId' }, { path: 'reviews' }]);

    if (!singleBusiness) {
      return next(new HttpError('No Business found against id', 404));
    }

    const subcategory = singleBusiness.categoryId.subcategories.find(
      (subkey) =>
        subkey._id.toString() === singleBusiness.subCategoryId.toString(),
    );
    singleBusiness.subcategory = subcategory || null;
    res.status(200).json({
      status: 'success',
      data: {
        ...singleBusiness.toObject(),
        subcategory: singleBusiness.subcategory,
      },
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};
const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
      throw new HttpError(msgs, 422);
    }
    const { name, description, rating, businessIds } = req.body;

    const newReview = new Review({
      name,
      description,
      rating,
      businessIds,
    });

    const savedReview = await newReview.save();
    await Business.findByIdAndUpdate(businessIds, {
      $push: { reviews: savedReview._id },
    });
    res.status(200).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) return next(error);
    return next(new HttpError('Bad Request', 500));
  }
};

const deleteBusiness = async (req, res, next) => {
  try {
    const getBusinessById = await Business.findById(req.params.id, { isDeleted: false });
    if (!getBusinessById) {
      return next(new HttpError('no business found by this Id', 404));
    }
    getBusinessById.isDeleted = true;
    getBusinessById.save();
    res.status(200).json({
      status: 'success',
      message: 'business Deleted successfully',
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};

const updateBusiness = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
      throw new HttpError(msgs, 422);
    }
    const logo = req?.file?.path;
    let existingBusiness = await Business.findById(req.params.id, {
      isDeleted: false,
    });

    if (!existingBusiness) {
      return next(new HttpError('Business not found', 404));
    }
    const updatedBusinessData = {
      ...req.body,
      logo: logo || existingBusiness.logo,
    };

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      { $set: updatedBusinessData },
      { new: true },
    );
    res.status(200).json({
      message: 'Business updated successfully',
      Business: updatedBusiness,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) return next(error);
    return next(new HttpError('Bad Request', 500));
  }
};

const addForm = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
      throw new HttpError(msgs, 422);
    }
    const business = await Business.findById(req.params.id, { isDeleted: false});
    if (!business) throw new HttpError('Business not found', 404);
    // check whether the forms do not already exist in the forms array
    const existingForms = req.body.forms.filter((item) =>
      business.forms.find((bf) => bf.form.toString() === item),
    );
    // update business
    const updated = await Business.findOneAndUpdate(
      { _id: business._id },
      {
        $push: {
          // filter out existing forms
          forms: req.body.forms
            .filter((f) => !existingForms.includes(f))
            .map((f, index) => ({
              isActive: index === 0 && business.forms.length === 0,
              form: f,
            })),
        },
      },
      { new: true },
    );
    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) return next(error);
    return next(new HttpError('Bad Request', 500));
  }
};

const activateForm = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
      throw new HttpError(msgs, 422);
    }
    const business = await Business.findById(req.params.id, { isDeleted: false });
    if (!business) throw new HttpError('Business not found', 404);
    const form = await formModel.findById(req.params.formId, {isDeleted: false});
    if (!form) throw new HttpError('Form not found', 404);
    // find the form in business `forms`
    const foundIndex = business.forms.findIndex(
      (f) => f.form.toString() === form._id.toString(),
    );
    if (foundIndex < -1) throw new HttpError('Form not found', 404);
    // update business
    await Business.findOneAndUpdate(
      { _id: business._id },
      {
        $set: {
          'forms.$[].isActive': false,
        },
      },
    );
    const updated = await Business.findOneAndUpdate(
      { _id: business._id },
      {
        $set: {
          [`forms.${foundIndex}.isActive`]: true,
        },
      },
      { new: true },
    );
    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) return next(error);
    return next(new HttpError('Bad Request', 500));
  }
};

module.exports = {
  addBusiness,
  getAllBusiness,
  createReview,
  getOneBusiness,
  deleteBusiness,
  updateBusiness,
  addForm,
  activateForm,
};
