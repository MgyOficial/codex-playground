const express = require('express');
const healthController = require('../controllers/healthController');
const authRoutes = require('./auth');
const eventRoutes = require('./events');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);

module.exports = router;
