const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));
router.use('/trainee', require('./trainee'));
router.use('/chat', require('./chat'));

// Public endpoint for fetching companies (used during signup)
router.get('/companies', adminController.getCompanies);

module.exports = router; 