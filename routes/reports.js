const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reportsController');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

// Reports routes
router.get('/', isAuthenticated, ReportsController.getReportsDashboard);
router.get('/inventory-value', isAuthenticated, ReportsController.getInventoryValueReport);
router.get('/low-stock', isAuthenticated, ReportsController.getLowStockReport);
router.get('/transactions', isAuthenticated, ReportsController.getTransactionsReport);
router.get('/category-analysis', isAuthenticated, ReportsController.getCategoryAnalysis);
router.post('/generate-pdf', isAuthenticated, ReportsController.generatePDFReport);
router.get('/export-csv', isAuthenticated, ReportsController.exportCSV);

module.exports = router; 