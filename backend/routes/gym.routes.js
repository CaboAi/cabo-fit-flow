const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gym.controller');

router.get('/', gymController.getGyms);
router.get('/:id', gymController.getGymById);

module.exports = router;