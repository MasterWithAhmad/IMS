const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const { isAuthenticated } = require('../middleware/auth');

// Inventory routes
router.get('/', isAuthenticated, InventoryController.getInventoryList);
router.get('/add', isAuthenticated, InventoryController.getAddProductForm);
router.post('/add', isAuthenticated, InventoryController.addProduct);
router.get('/edit/:id', isAuthenticated, InventoryController.getEditProductForm);
router.post('/edit/:id', isAuthenticated, InventoryController.updateProduct);
router.post('/delete/:id', isAuthenticated, InventoryController.deleteProduct);
router.post('/adjust-stock/:id', isAuthenticated, InventoryController.adjustStock);

module.exports = router; 