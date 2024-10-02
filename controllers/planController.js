const HttpError = require("../utils/httpError");
const Plan = require('../models/planModel');
const { validationResult } = require('express-validator');
const factory = require('./handlerFactory')
const stripe = require('stripe')(process.env.STRIPE_KEY);

const addPlan = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }
    let newPlan;
    if (!req.body.free) {
        let product;
        try {
            product = await stripe.products.create({
                name: req.body.name,
            });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error creating product', 500));
        }

        let price;
        try {
            price = await stripe.plans.create({
                amount: Math.round(req.body.price * 100),
                currency: 'usd',
                interval: req.body.interval,
                interval_count: req.body.interval_count,
                product: product.id,
            });
        } catch (error) {
            console.log(error);
            return next(new HttpError('Error creating price', 500));
        }

        newPlan = new Plan({
            ...req.body,
            productId: product.id,
            priceId: price.id
        });
    }
    else {
        newPlan = new Plan(req.body);
    }

    try {
        await newPlan.save();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error creating plan', 500));
    }

    res.status(200).json({ newPlan });
}

const updatePlan = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    let existingPlan;
    try {
        existingPlan = await Plan.findById(req.params.id);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching plan', 500));
    }

    if (!existingPlan) {
        return next(new HttpError('No plan found', 404));
    }

    if (req.body.description.length) {
        existingPlan.description = req.body.description;
    }

    if (req.body.name) {
        if (existingPlan.productId) {
            try {
                const product = await stripe.products.update(
                    existingPlan.productId,
                    { name: req.body.name }
                );
            } catch (error) {
                console.log(error);
                return next(new HttpError('Error updating plan', 500));
            }
        }

        existingPlan.name = req.body.name;
    }

    if (req.body.price || req.body.interval || req.body.interval_count) {
        let plan;
        if (existingPlan.priceId && !existingPlan.free) {
            try {
                const deleted = await stripe.plans.del(
                    existingPlan.priceId,
                );
            } catch (error) {
                console.log(error);
                return next(new HttpError('Error updating plan', 500));
            }

            try {
                plan = await stripe.plans.create({
                    amount: Math.round((req.body.price || existingPlan.price) * 100),
                    currency: 'usd',
                    interval: req.body.interval || existingPlan.interval,
                    interval_count: req.body.interval_count || existingPlan.interval_count,
                    product: existingPlan.productId,
                });
            } catch (error) {
                console.log(error);
                return next(new HttpError('Error updating plan', 500));
            }
            existingPlan.priceId = plan.id;
        }

        existingPlan.price = req.body.price || existingPlan.price;
        existingPlan.interval = req.body.interval || existingPlan.interval;
        existingPlan.interval_count = req.body.interval_count || existingPlan.interval_count;
    }

    try {
        await existingPlan.save();
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error updating plan', 500));
    }

    res.json({ message: 'Plan updated successfully', plan: existingPlan });
};

exports.getPlan = factory.getAll(Plan)
exports.getPlanById = factory.getOne(Plan)
exports.updatePlan = updatePlan;
exports.addPlan = addPlan;
exports.deletePlan = factory.deleteOne(Plan)
