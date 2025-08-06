const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.get('/workouts', userController.getWorkouts);
router.post('/workouts', userController.createWorkout);
router.put('/workouts/:id', userController.updateWorkout);
router.delete('/workouts/:id', userController.deleteWorkout);

module.exports = router;