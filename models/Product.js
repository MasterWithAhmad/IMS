const db = require('../config/database');

class Product {
    static async findAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM products', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static async create(productData) {
        const { name, description, category, price, quantity, reorder_point } = productData;
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO products (name, description, category, price, quantity, reorder_point) VALUES (?, ?, ?, ?, ?, ?)',
                [name, description, category, price, quantity, reorder_point],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    static async update(id, productData) {
        const { name, description, category, price, quantity, reorder_point } = productData;
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE products SET name = ?, description = ?, category = ?, price = ?, quantity = ?, reorder_point = ? WHERE id = ?',
                [name, description, category, price, quantity, reorder_point, id],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                resolve(this.changes);
            });
        });
    }

    static async updateQuantity(id, quantity) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE products SET quantity = quantity + ? WHERE id = ?',
                [quantity, id],
                function(err) {
                    if (err) reject(err);
                    resolve(this.changes);
                }
            );
        });
    }

    static async getLowStock() {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM products WHERE quantity <= reorder_point',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });
    }
}

module.exports = Product; 