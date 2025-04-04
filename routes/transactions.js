const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { isAuthenticated } = require('../middleware/auth');

// Get all transactions
router.get('/', isAuthenticated, transactionController.getTransactions);

// Get transactions for a specific product
router.get('/product/:id', isAuthenticated, transactionController.getProductTransactions);

module.exports = router; 