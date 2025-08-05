const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', subscriptionController.getSubscription);
router.post('/create', subscriptionController.createSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/update', subscriptionController.updateSubscription);
router.get('/plans', subscriptionController.getPlans);

module.exports = router;