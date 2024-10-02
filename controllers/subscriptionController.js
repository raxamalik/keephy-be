const { validationResult } = require('express-validator');
const HttpError = require('../utils/httpError');
const Plan = require('../models/planModel');
const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const mongoose = require('mongoose');


const createSubscription = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    let existingUser;

    try {
        existingUser = await User.findById(req.userId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingUser) {
        return next(new HttpError('No user found', 404));
    }

    let checkSubscription;

    try {
        checkSubscription = await Subscription.findOne({ userId: req.userId, active: true }).populate('planId');
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching subscription details', 500));
    }

    if (checkSubscription && !checkSubscription.planId.free) {
        return next(new HttpError('User already has subscription', 403));
    }

    let existingPlan;

    try {
        existingPlan = await Plan.findById(req.body.planId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingPlan) {
        return next(new HttpError('No plan found', 404));
    }

    if (!existingPlan.free) {
        if (!existingUser.customerId) {
            try {
                customer = await stripe.customers.create({
                    email: existingUser.email,
                    name: existingUser.fullName,
                    payment_method: req.body.payment_method,
                    invoice_settings: {
                        default_payment_method: req.body.payment_method
                    }
                });
                existingUser.customerId = customer.id;
            } catch (error) {
                console.log({ error });
                return next(new HttpError(error.message, 500));
            }
        }
        let subscription

        try {
            subscription = await stripe.subscriptions.create({
                customer: existingUser.customerId,
                items: [
                    {
                        price: existingPlan.priceId,
                    },
                ],
            });
        }
        catch (error) {
            return next(new HttpError(error.message, 500));
        }
        let newSubscription = new Subscription({
            userId: existingUser.id,
            planId: existingPlan.id,
            subscription: subscription.id
        })
        existingUser.isSubscribed = true;
        existingUser.subscription = {
            startedAt: new Date(subscription.current_period_start * 1000),
            expiresAt: new Date(subscription.current_period_end * 1000),
        };

        try {
            const session = await mongoose.startSession();
            session.startTransaction();
            await newSubscription.save({ session: session });
            await existingUser.save({ session: session, validateBeforeSave: false });
            await session.commitTransaction();
        } catch (error) {
            return next(new HttpError(error.message, 500));

        }

        res.json({ message: 'Premium plan activated', user: existingUser });
    }

    else {
        res.json({ message: 'Free plan activated', user: existingUser });
    }
};

const userSubscription = async (req, res, next) => {
    let existingUser;
    try {
        existingUser = await User.findById(req.userId);
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching user', 500));
    }

    if (!existingUser) {
        return next(new HttpError('No user found', 404));
    }

    let checkSubscription;
    try {
        checkSubscription = await Subscription.find({ userId: req.userId, active: true }).populate('userId planId');
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching subscription details', 500));
    }

    res.json({ userSubscriptions: checkSubscription });
};

const autoRenew = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid data received', 422));
    }

    let existingSubscription;
    try {
        existingSubscription = await Subscription.findOne({ userId: req.body.userId, subscriptionId: req.body.subscriptionId });
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error fetching subscription details', 500));
    }

    if (!existingSubscription) {
        return next(new HttpError('No subscription record found', 404));
    }

    let subscription;
    try {
        subscription = await stripe.subscriptions.update(
            req.body.subscriptionId,
            {
                cancel_at_period_end: req.body.renew
            }
        );
    } catch (error) {
        console.log(error);
        return next(new HttpError('Error updating subscription details', 500));
    }

    existingSubscription.active = req.body.renew;

    try {
        await existingSubscription.save();
    } catch (error) {
        console.log(error);;
        return next(new HttpError('Error updating subscription details', 500));
    }

    res.json({ message: 'Updated successfully' });
};

const cancelSubscription = async (req, res, next) => {
    let existingSubscription;
    try {
        existingSubscription = await Subscription.findOne({ subscriptionId: req.params.subscriptionId })
    } catch (error) {
        console.log(error);;
        return next(new HttpError('Error getting subscription details', 500));
    }

    if (!existingSubscription) {
        return next(new HttpError('No subscription found', 404));
    }

    let existingUser; PlanId
    try {
        existingUser = await User.findById(existingSubscription.userId);
    } catch (error) {
        console.log(error);;
        return next(new HttpError('Error getting user details', 500));
    }

    if (!existingUser) {
        return next(new HttpError('No user found', 404));
    }

    existingUser.isPremium = false;

    let deleted;
    try {
        deleted = await stripe.subscriptions.cancel(req.params.subscriptionId);
    } catch (error) {
        console.log(error);;
        return next(new HttpError('Error cancelling subscription', 500));
    }

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await existingSubscription.remove({ session: session });
        await existingUser.save({ session: session, validateBeforeSave: false });
        await session.commitTransaction();
    } catch (error) {
        console.log(error);;
        return next(new HttpError('Error cancelling subscription', 500));
    }

    res.json({ message: 'Subscription cancelled successfully' });
};

exports.createSubscription = createSubscription;
exports.userSubscription = userSubscription;
exports.autoRenew = autoRenew;
exports.cancelSubscription = cancelSubscription;