const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const paymentRoutes = require('./payment.routes');
const subscriptionRoutes = require('./subscription.routes');
const userRoutes = require('./user.routes');
const classRoutes = require('./class.routes');
const gymRoutes = require('./gym.routes');
const bookingRoutes = require('./booking.routes');

router.use('/auth', authRoutes);
router.use('/payment', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/gyms', gymRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;