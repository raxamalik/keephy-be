const { validationResult } = require('express-validator');

const sendEmail = require('../helper/email');
const Form = require('../models/formModel');
const FormSubmission = require('../models/formSubmissionModel');
const HttpError = require('../utils/httpError');
const factory = require('./handlerFactory');
const Business = require('../models/businessModel');
const Franchise = require('../models/franchiseModel');
const User = require('../models/userModel');

const getAllForms = async (req, res, next) => {
  try {
    // sometimes we need all forms instead of paginated results
    // see loading forms in `Add Form` modal in `Single Business View` route on frontend
    // send all forms if page is not supplied
    if (!req.query?.page) {
      const forms = await Form.find({ user: req.userId, isDeleted: false });
      res.status(200).json({
        status: 'success',
        results: forms.length,
        totalRecords: forms.length,
        data: forms,
      });
    } else {
      const filter = { isDeleted: false, user: req.userId };
      const page = parseInt(req?.query?.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
      const forms = await Form.find(filter).skip(skip).limit(limit);
      const count = await Form.find(filter).countDocuments();
      res.status(200).json({
        status: 'success',
        results: forms.length,
        limit,
        totalRecords: count,
        page,
        data: forms,
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) next(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};

const addTypeForm = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msgs = errors.array().map((error) => `${error.path}: ${error.msg}`);
      throw new HttpError(msgs, 422);
    }
    const createForm = await Form.create({ ...req.body, user: req.userId });
    res
      .status(200)
      .json({ message: 'Form save successfully ', Form: createForm });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) return next(error);
    return next(new HttpError('Bad Request', 500));
  }
};

const getFormByBusinessId = async (req, res, next) => {
  try {
    const page = parseInt(req?.query?.page) || 1;
    const business = await Business.findOne({ _id: req.params.id, isDeleted: false });
    if (!business) throw new HttpError('Business not found', 404);
    const limit = 10;
    const skip = (page - 1) * limit;
    const getFormByBusinessId = await Form.find({
      _id: {
        $in: business.forms.map((f) => f.form),
      },
      isDeleted: false,
    }).skip(skip).limit(limit);
    const count = await Form.find({
      _id: {
        $in: business.forms.map((f) => f.form),
      },
      isDeleted: false,
    }).countDocuments();
    const mappedForms = getFormByBusinessId.map((form) => ({
      ...form.toObject(),
      isActive:
        business.forms.find((f) => f.form.toString() === form._id.toString())
          ?.isActive || false,
      code:
        business.forms.find((f) => f.form.toString() === form._id.toString())
          ?.code || '',
    }));
    res.status(200).json({
      status: 'success',
      results: getFormByBusinessId.length,
      limit,
      totalRecords: count,
      page,
      data: mappedForms,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) next(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};

const getFormByLocationId = async (req, res, next) => {
  try {
    const page = parseInt(req?.query?.page) || 1;
    const franchise = await Franchise.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!franchise) throw new HttpError('Franchise not found', 404);
    const limit = 10;
    const skip = (page - 1) * limit;
    const getFormByFranchiseId = await Form.find({
      _id: {
        $in: franchise.forms.map((f) => f.form),
      },
      isDeleted: false,
    })
      .skip(skip)
      .limit(limit);
    const count = await Form.find({
      _id: {
        $in: franchise.forms.map((f) => f.form),
      },
      isDeleted: false,
    }).countDocuments();
    const mappedForms = getFormByFranchiseId.map((form) => ({
      ...form.toObject(),
      isActive:
        franchise.forms.find((f) => f.form.toString() === form._id.toString())
          ?.isActive || false,
      code:
        franchise.forms.find((f) => f.form.toString() === form._id.toString())
          ?.code || '',
    }));
    res.status(200).json({
      status: 'success',
      results: getFormByFranchiseId.length,
      limit,
      totalRecords: count,
      page,
      data: mappedForms,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) next(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};

const getFormSubmissionByFormId = async (req, res, next) => {
  try {
    const filter = { formId: req.params.id };
    if (req.query.moduleName) filter.moduleName = req.query.moduleName; // business or location
    if (req.query.moduleId) filter.moduleId = req.query.moduleId; // mongodb id
    const page = parseInt(req?.query?.page) || 1;
    const totalRecords = await FormSubmission.countDocuments(filter);
    const limit = 10;
    const skip = (page - 1) * limit;
    const getFormSubmissions = await FormSubmission.find(filter)
      .skip(skip)
      .limit(limit);
    res.status(200).json({
      status: 'success',
      results: getFormSubmissions.length,
      limit,
      totalRecords,
      page,
      data: getFormSubmissions,
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};
const addFormSubmission = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msgs = errors.array().map((err) => `${err.path}: ${err.msg}`);
      throw new HttpError(msgs, 422);
    }
    const { formId, answers, email, phone } = req.body;
    const getFormById = await Form.findById(formId, { isDeleted: false });
    if (!getFormById) {
      return next(new HttpError('Form not found by form Id', 404));
    }
    const formattedAnswers = getFormById.questions.map((question) => {
      return {
        questionLabel: question.questionLabel,
        answer: answers.find((ans) => ans.questionLabel === question.questionLabel)?.answer,
      };
    });
    const submissionData = new FormSubmission({
      moduleName: req.body.moduleName,
      moduleId: req.body.moduleId,
      code: req.body.code,
      formId,
      answers: formattedAnswers,
      email,
      phone,
    });
    await submissionData.save({ validateBeforeSave: false });
    const reportingEmails = [
      ...new Set(getFormById?.businessId?.reportingEmail),
    ];
    const emailContent = `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
          <h2 style="color: #4CAF50;">New Form Submission Received</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          
          <h3 style="color: #333;">User Responses:</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Question</th>
                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Answer</th>
              </tr>
            </thead>
            <tbody>
              ${formattedAnswers
        .map(
          (ans) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${ans.questionLabel}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${ans.answer}</td>
                </tr>
              `,
        )
        .join('')}
            </tbody>
          </table>
      
          <p style="color: #777; font-size: 14px;">This is an automated email, please do not reply.</p>
        </div>
      `;

    await sendEmail({
      email: reportingEmails,
      subject: 'New Form Submission',
      html: emailContent,
    });

    res
      .status(201)
      .json({ message: 'Submission successful', submission: submissionData });
  } catch (error) {
    console.error(error);
    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    else if (error instanceof HttpError) return next(error);
    return next(new HttpError('Failed to submit form', 500));
  }
};

const deleteForm = async (req, res, next) => {
  try {
    const getFormById = await Form.findById(req.params.id, { isDeleted: false });
    if (!getFormById) {
      return next(new HttpError('no Form found by this Id', 404));
    }
    getFormById.isDeleted = true;
    getFormById.save();

    res.status(200).json({
      status: 'success',
      message: 'Form Deleted successfully',
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};
const getFormById = factory.getOne(Form, { isDeleted: false });
const updateFormById = factory.updateOne(Form, { isDeleted: false });

const getFormByCode = async (req, res, next) => {
  try {
    let moduleName = 'business';
    let record = await Business.findOne({ 'forms.code': req.params.code, isDeleted: false }).populate('forms.form');
    if (!record) {
      // find in locations
      record = await Franchise.findOne({
        'forms.code': req.params.code,
        isDeleted: false,
      }).populate([{ path: 'forms.form' }, { path: 'businessId', match: { isDeleted: false } }]);
      if (!record.businessId) record = null;
      moduleName = 'location';
    }
    if (!record) {
      // TODO: handle the business not active case separately
      return next(new HttpError(`No Form found by this code or ${moduleName} is not present`, 404));
    }
    // find the form
    const elem = record.forms.find((f) => f.code === req.params.code);
    const form = elem.form;
    const user = await User.findById(form.user);
    if (!user || !user.subscription?.isActive) throw new HttpError('User subscription is not active, can not load form', 500);
    res.status(200).json({
      status: 'success',
      data: {
        form,
        moduleName,
        moduleId: record.id,
        code: elem.code,
      },
    });
  } catch (error) {
    console.log(error);
    if (error instanceof HttpError) return next(error);
    return next(new HttpError('Internal Server Error', 500));
  }
};

module.exports = {
  getAllForms,
  addTypeForm,
  addFormSubmission,
  getFormByBusinessId,
  getFormById,
  getFormByCode,
  getFormSubmissionByFormId,
  deleteForm,
  updateFormById,
  getFormByLocationId,
};
