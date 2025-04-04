const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Dashboard routes
router.get('/', isAuthenticated, DashboardController.getDashboardData);

module.exports = router; 