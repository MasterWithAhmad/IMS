const Product = require('../models/Product');
const db = require('../config/database');
const transactionController = require('./transactionController');

class InventoryController {
    static async getInventoryList(req, res) {
        try {
            const products = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM products ORDER BY name', (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });

            res.render('inventory/list', {
                title: 'Inventory List',
                products,
                user: req.session.user
            });
        } catch (error) {
            console.error('Error fetching inventory:', error);
            req.flash('error', 'Error loading inventory list');
            res.redirect('/');
        }
    }

    static async getAddProductForm(req, res) {
        res.render('inventory/add', {
            title: 'Add New Product'
        });
    }

    static async addProduct(req, res) {
        try {
            const { name, description, category, price, quantity, reorder_point } = req.body;
            const userId = req.session.user.id;

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Insert product
                db.run(
                    'INSERT INTO products (name, description, category, price, quantity, reorder_point) VALUES (?, ?, ?, ?, ?, ?)',
                    [name, description, category, price, quantity, reorder_point],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            req.flash('error', 'Error adding product');
                            return res.redirect('/inventory/add');
                        }

                        const productId = this.lastID;

                        // If initial quantity is greater than 0, record initial stock transaction
                        if (quantity > 0) {
                            db.run(
                                'INSERT INTO transactions (product_id, type, quantity, notes, created_by) VALUES (?, ?, ?, ?, ?)',
                                [productId, 'in', quantity, 'Initial stock', userId],
                                function(err) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        req.flash('error', 'Error recording initial stock');
                                        return res.redirect('/inventory/add');
                                    }

                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            req.flash('error', 'Error saving product');
                                            return res.redirect('/inventory/add');
                                        }

                                        req.flash('success', 'Product added successfully');
                                        res.redirect('/inventory');
                                    });
                                }
                            );
                        } else {
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    req.flash('error', 'Error saving product');
                                    return res.redirect('/inventory/add');
                                }

                                req.flash('success', 'Product added successfully');
                                res.redirect('/inventory');
                            });
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Add Product Error:', error);
            req.flash('error', 'Error adding product');
            res.redirect('/inventory/add');
        }
    }

    static async getEditProductForm(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                req.flash('error', 'Product not found');
                return res.redirect('/inventory');
            }
            res.render('inventory/edit', {
                title: 'Edit Product',
                product
            });
        } catch (error) {
            console.error('Edit Product Error:', error);
            req.flash('error', 'Error loading product');
            res.redirect('/inventory');
        }
    }

    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const { name, description, category, price, quantity, reorder_point } = req.body;
            const userId = req.session.user.id;

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Get current quantity
                db.get('SELECT quantity FROM products WHERE id = ?', [id], (err, product) => {
                    if (err) {
                        db.run('ROLLBACK');
                        req.flash('error', 'Error checking product');
                        return res.redirect('/inventory');
                    }

                    if (!product) {
                        db.run('ROLLBACK');
                        req.flash('error', 'Product not found');
                        return res.redirect('/inventory');
                    }

                    const quantityChange = quantity - product.quantity;

                    // Update product
                    db.run(
                        'UPDATE products SET name = ?, description = ?, category = ?, price = ?, quantity = ?, reorder_point = ? WHERE id = ?',
                        [name, description, category, price, quantity, reorder_point, id],
                        function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                req.flash('error', 'Error updating product');
                                return res.redirect('/inventory');
                            }

                            // If quantity changed, record transaction
                            if (quantityChange !== 0) {
                                const type = quantityChange > 0 ? 'in' : 'out';
                                db.run(
                                    'INSERT INTO transactions (product_id, type, quantity, notes, created_by) VALUES (?, ?, ?, ?, ?)',
                                    [id, type, Math.abs(quantityChange), 'Quantity update', userId],
                                    function(err) {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            req.flash('error', 'Error recording quantity change');
                                            return res.redirect('/inventory');
                                        }

                                        db.run('COMMIT', (err) => {
                                            if (err) {
                                                db.run('ROLLBACK');
                                                req.flash('error', 'Error saving changes');
                                                return res.redirect('/inventory');
                                            }

                                            req.flash('success', 'Product updated successfully');
                                            res.redirect('/inventory');
                                        });
                                    }
                                );
                            } else {
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        req.flash('error', 'Error saving changes');
                                        return res.redirect('/inventory');
                                    }

                                    req.flash('success', 'Product updated successfully');
                                    res.redirect('/inventory');
                                });
                            }
                        }
                    );
                });
            });
        } catch (error) {
            console.error('Update Product Error:', error);
            req.flash('error', 'Error updating product');
            res.redirect('/inventory');
        }
    }

    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // First delete all transactions associated with this product
                db.run('DELETE FROM transactions WHERE product_id = ?', [id], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        req.flash('error', 'Error deleting product transactions');
                        return res.redirect('/inventory');
                    }

                    // Then delete the product
                    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            req.flash('error', 'Error deleting product');
                            return res.redirect('/inventory');
                        }

                        // If no rows were affected, product didn't exist
                        if (this.changes === 0) {
                            db.run('ROLLBACK');
                            req.flash('error', 'Product not found');
                            return res.redirect('/inventory');
                        }

                        // Commit the transaction
                        db.run('COMMIT', (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                req.flash('error', 'Error saving changes');
                                return res.redirect('/inventory');
                            }

                            req.flash('success', 'Product deleted successfully');
                            res.redirect('/inventory');
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Delete Product Error:', error);
            req.flash('error', 'Error deleting product');
            res.redirect('/inventory');
        }
    }

    static async adjustStock(req, res) {
        try {
            const { id } = req.params;
            const { type, quantity, notes } = req.body;
            const userId = req.session.user.id;

            // Convert quantity to number
            const adjustmentQuantity = parseInt(quantity, 10);
            if (isNaN(adjustmentQuantity)) {
                req.flash('error', 'Invalid quantity');
                return res.redirect('/inventory');
            }

            // Begin transaction
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Check if product exists and get current quantity
                db.get('SELECT quantity FROM products WHERE id = ?', [id], (err, product) => {
                    if (err) {
                        db.run('ROLLBACK');
                        req.flash('error', 'Error checking product');
                        return res.redirect('/inventory');
                    }

                    if (!product) {
                        db.run('ROLLBACK');
                        req.flash('error', 'Product not found');
                        return res.redirect('/inventory');
                    }

                    // Convert current quantity to number
                    const currentQuantity = parseInt(product.quantity, 10);

                    // Check if we have enough stock for stock out
                    if (type === 'out' && currentQuantity < adjustmentQuantity) {
                        db.run('ROLLBACK');
                        req.flash('error', 'Insufficient stock');
                        return res.redirect('/inventory');
                    }

                    // Calculate new quantity
                    const newQuantity = type === 'in' 
                        ? currentQuantity + adjustmentQuantity 
                        : currentQuantity - adjustmentQuantity;

                    // Update product quantity
                    db.run(
                        'UPDATE products SET quantity = ? WHERE id = ?',
                        [newQuantity, id],
                        function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                req.flash('error', 'Error updating stock');
                                return res.redirect('/inventory');
                            }

                            // Record transaction
                            db.run(
                                `INSERT INTO transactions (
                                    product_id, type, quantity, notes, created_by
                                ) VALUES (?, ?, ?, ?, ?)`,
                                [id, type, adjustmentQuantity, notes || '', userId],
                                function(err) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        req.flash('error', 'Error recording transaction');
                                        return res.redirect('/inventory');
                                    }

                                    // Commit transaction
                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            req.flash('error', 'Error committing transaction');
                                            return res.redirect('/inventory');
                                        }

                                        req.flash('success', 'Stock adjusted successfully');
                                        res.redirect('/inventory');
                                    });
                                }
                            );
                        }
                    );
                });
            });
        } catch (error) {
            console.error('Stock Adjustment Error:', error);
            req.flash('error', 'Error adjusting stock');
            res.redirect('/inventory');
        }
    }
}

module.exports = InventoryController; 