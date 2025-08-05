const subscriptionService = require('../services/subscription.service');

exports.getSubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getSubscription(req.user.id);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

exports.createSubscription = async (req, res, next) => {
  try {
    const { priceId, paymentMethodId } = req.body;
    const subscription = await subscriptionService.createSubscription(
      req.user.id,
      priceId,
      paymentMethodId
    );
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.cancelSubscription(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.updateSubscription = async (req, res, next) => {
  try {
    const { priceId } = req.body;
    const updated = await subscriptionService.updateSubscription(req.user.id, priceId);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionService.getAvailablePlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};