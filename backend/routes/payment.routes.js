const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

router.use(authenticate);

router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.get('/payment-methods', paymentController.getPaymentMethods);
router.post('/payment-methods', paymentController.addPaymentMethod);
router.delete('/payment-methods/:id', paymentController.removePaymentMethod);

module.exports = router;