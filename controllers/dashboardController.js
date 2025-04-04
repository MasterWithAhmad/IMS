const Product = require('../models/Product');
const db = require('../config/database');

class DashboardController {
    static async getDashboardData(req, res) {
        try {
            // Get total products
            const totalProducts = await new Promise((resolve, reject) => {
                db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                    if (err) reject(err);
                    resolve(row.count);
                });
            });

            // Get low stock items (quantity <= reorder_point)
            const lowStockItems = await new Promise((resolve, reject) => {
                db.all(
                    'SELECT * FROM products WHERE quantity <= reorder_point',
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            // Get total inventory value
            const totalValue = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT SUM(price * quantity) as total FROM products',
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row.total || 0);
                    }
                );
            });

            // Get recent transactions
            const recentTransactions = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT t.*, p.name as product_name, u.username as created_by_user
                     FROM transactions t 
                     JOIN products p ON t.product_id = p.id 
                     LEFT JOIN users u ON t.created_by = u.id
                     ORDER BY t.created_at DESC LIMIT 5`,
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            // Get category distribution
            const categoryDistribution = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT category, COUNT(*) as count 
                     FROM products 
                     GROUP BY category`,
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            res.render('dashboard', {
                title: 'Dashboard',
                user: req.session.user, // Add user from session
                totalProducts,
                lowStockItems,
                totalValue,
                recentTransactions,
                categoryDistribution
            });
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'An error occurred while loading the dashboard'
            });
        }
    }
}

module.exports = DashboardController; 