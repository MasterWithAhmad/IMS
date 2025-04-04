const Product = require('../models/Product');
const db = require('../config/database');
const moment = require('moment');

class ReportsController {
    static async getReportsDashboard(req, res) {
        try {
            // Get total inventory value
            const totalValue = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT SUM(price * quantity) as total FROM products',
                    [],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row.total || 0);
                    }
                );
            });

            // Get category distribution
            const categories = await new Promise((resolve, reject) => {
                db.all(
                    'SELECT category, COUNT(*) as count, SUM(quantity) as total_items FROM products GROUP BY category',
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            // Get recent transactions
            const recentTransactions = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT t.*, p.name as product_name, u.username as user_name 
                     FROM transactions t 
                     JOIN products p ON t.product_id = p.id 
                     JOIN users u ON t.created_by = u.id 
                     ORDER BY t.created_at DESC LIMIT 10`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            res.render('reports/dashboard', {
                title: 'Reports Dashboard',
                totalValue,
                categories,
                recentTransactions
            });
        } catch (error) {
            console.error('Reports Dashboard Error:', error);
            res.status(500).render('error', { error: 'Error loading reports dashboard' });
        }
    }

    static async getInventoryValueReport(req, res) {
        try {
            const products = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT *, (price * quantity) as total_value 
                     FROM products 
                     ORDER BY total_value DESC`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            res.render('reports/inventory-value', {
                title: 'Inventory Value Report',
                products
            });
        } catch (error) {
            console.error('Inventory Value Report Error:', error);
            res.status(500).render('error', { error: 'Error generating inventory value report' });
        }
    }

    static async getLowStockReport(req, res) {
        try {
            const products = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT * FROM products 
                     WHERE quantity <= reorder_point 
                     ORDER BY (quantity - reorder_point)`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            res.render('reports/low-stock', {
                title: 'Low Stock Report',
                products
            });
        } catch (error) {
            console.error('Low Stock Report Error:', error);
            res.status(500).render('error', { error: 'Error generating low stock report' });
        }
    }

    static async getTransactionsReport(req, res) {
        try {
            const { startDate, endDate, type } = req.query;
            let query = `
                SELECT t.*, p.name as product_name, u.username as user_name 
                FROM transactions t 
                JOIN products p ON t.product_id = p.id 
                JOIN users u ON t.created_by = u.id 
                WHERE 1=1
            `;
            const params = [];

            if (startDate) {
                query += ' AND t.created_at >= ?';
                params.push(startDate);
            }
            if (endDate) {
                query += ' AND t.created_at <= ?';
                params.push(endDate);
            }
            if (type) {
                query += ' AND t.type = ?';
                params.push(type);
            }

            query += ' ORDER BY t.created_at DESC';

            const transactions = await new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                });
            });

            res.render('reports/transactions', {
                title: 'Transactions Report',
                transactions,
                filters: { startDate, endDate, type }
            });
        } catch (error) {
            console.error('Transactions Report Error:', error);
            res.status(500).render('error', { 
                title: 'Error',
                error: 'Error generating transactions report' 
            });
        }
    }

    static async getCategoryAnalysis(req, res) {
        try {
            const categories = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT 
                        category,
                        COUNT(*) as product_count,
                        SUM(quantity) as total_items,
                        SUM(price * quantity) as total_value,
                        AVG(price) as avg_price
                     FROM products 
                     GROUP BY category`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            res.render('reports/category-analysis', {
                title: 'Category Analysis',
                categories
            });
        } catch (error) {
            console.error('Category Analysis Error:', error);
            res.status(500).render('error', { error: 'Error generating category analysis' });
        }
    }

    static async generatePDFReport(req, res) {
        // This would require a PDF generation library like PDFKit
        // For now, we'll just send a message
        res.send('PDF generation functionality will be implemented soon');
    }

    static async exportCSV(req, res) {
        try {
            const { type } = req.query;
            let data;
            let filename;

            switch (type) {
                case 'inventory':
                    data = await new Promise((resolve, reject) => {
                        db.all('SELECT * FROM products', [], (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        });
                    });
                    filename = 'inventory_report.csv';
                    break;
                case 'transactions':
                    data = await new Promise((resolve, reject) => {
                        db.all(
                            `SELECT t.date, t.type, t.quantity, p.name as product_name, u.username as user_name 
                             FROM transactions t 
                             JOIN products p ON t.product_id = p.id 
                             JOIN users u ON t.user_id = u.id`,
                            [],
                            (err, rows) => {
                                if (err) reject(err);
                                resolve(rows);
                            }
                        );
                    });
                    filename = 'transactions_report.csv';
                    break;
                default:
                    throw new Error('Invalid report type');
            }

            // Convert data to CSV format
            const csv = this.convertToCSV(data);

            // Set headers for file download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

            // Send the CSV data
            res.send(csv);
        } catch (error) {
            console.error('CSV Export Error:', error);
            res.status(500).render('error', { error: 'Error exporting CSV' });
        }
    }

    static convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }
}

module.exports = ReportsController; 