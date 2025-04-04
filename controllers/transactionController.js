const db = require('../config/database');

class TransactionController {
    // Get all transactions
    async getTransactions(req, res) {
        try {
            const query = `
                SELECT 
                    t.*,
                    p.name as product_name,
                    p.category as product_category,
                    u.username as created_by_user
                FROM transactions t
                JOIN products p ON t.product_id = p.id
                LEFT JOIN users u ON t.created_by = u.id
                ORDER BY t.created_at DESC
            `;

            db.all(query, [], (err, transactions) => {
                if (err) {
                    console.error('Error fetching transactions:', err);
                    req.flash('error', 'Error loading transactions');
                    return res.redirect('/');
                }

                res.render('transactions/list', {
                    title: 'Transactions',
                    transactions: transactions,
                    messages: req.flash()
                });
            });
        } catch (error) {
            console.error('Error in getTransactions:', error);
            req.flash('error', 'An unexpected error occurred');
            res.redirect('/');
        }
    }

    // Record a new transaction
    async recordTransaction(productId, type, quantity, previousQuantity, newQuantity, notes, userId) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO transactions 
                (product_id, type, quantity, previous_quantity, new_quantity, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(query, 
                [productId, type, quantity, previousQuantity, newQuantity, notes, userId],
                function(err) {
                    if (err) {
                        console.error('Error recording transaction:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    // Get transactions for a specific product
    async getProductTransactions(req, res) {
        const productId = req.params.id;

        try {
            const query = `
                SELECT 
                    t.*,
                    p.name as product_name,
                    p.category as product_category,
                    u.username as created_by_user
                FROM transactions t
                JOIN products p ON t.product_id = p.id
                LEFT JOIN users u ON t.created_by = u.id
                WHERE t.product_id = ?
                ORDER BY t.created_at DESC
            `;

            db.all(query, [productId], (err, transactions) => {
                if (err) {
                    console.error('Error fetching product transactions:', err);
                    return res.status(500).json({ error: 'Error loading transactions' });
                }

                res.json(transactions);
            });
        } catch (error) {
            console.error('Error in getProductTransactions:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }
}

module.exports = new TransactionController(); 