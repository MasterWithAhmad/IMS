const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, '..', process.env.DB_PATH || 'database.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    console.log('Connected to the SQLite database');

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    fs.readFile(schemaPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading schema file:', err);
            db.close();
            return;
        }

        // Execute each SQL statement
        db.serialize(() => {
            db.exec(data, (err) => {
                if (err) {
                    console.error('Error executing schema:', err);
                    db.close();
                    return;
                }
                console.log('Database schema initialized successfully');

                // Create admin user
                const username = 'admin';
                const password = 'admin123';
                
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        db.close();
                        return;
                    }

                    db.run(
                        'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
                        [username, hashedPassword, 'admin'],
                        function(err) {
                            if (err) {
                                console.error('Error creating admin user:', err);
                                db.close();
                                return;
                            }
                            console.log('Admin user created successfully');
                            console.log('Username:', username);
                            console.log('Password:', password);

                            // Add sample products
                            const products = [
                                // Electronics
                                ['Laptop', 'High-performance laptop with 16GB RAM', 'Electronics', 999.99, 10, 5],
                                ['Smartphone', 'Latest model with 5G capability', 'Electronics', 699.99, 15, 8],
                                ['Wireless Mouse', 'Bluetooth wireless mouse', 'Electronics', 29.99, 30, 15],
                                ['Keyboard', 'Mechanical gaming keyboard', 'Electronics', 89.99, 20, 10],
                                ['Monitor', '27-inch 4K display', 'Electronics', 299.99, 8, 4],
                                
                                // Furniture
                                ['Desk Chair', 'Ergonomic office chair', 'Furniture', 199.99, 15, 8],
                                ['Office Desk', 'Modern standing desk', 'Furniture', 299.99, 12, 6],
                                ['Bookshelf', '5-shelf wooden bookcase', 'Furniture', 149.99, 20, 10],
                                ['Filing Cabinet', '2-drawer metal cabinet', 'Furniture', 89.99, 25, 12],
                                
                                // Office Supplies
                                ['Notebook', '100-page ruled notebook', 'Office Supplies', 4.99, 100, 50],
                                ['Pen Set', '12-color ballpoint pen set', 'Office Supplies', 12.99, 50, 25],
                                ['Stapler', 'Heavy-duty stapler', 'Office Supplies', 8.99, 40, 20],
                                ['Paper Clips', 'Box of 100 paper clips', 'Office Supplies', 2.99, 200, 100],
                                
                                // Appliances
                                ['Coffee Maker', '12-cup programmable', 'Appliances', 79.99, 20, 10],
                                ['Microwave', '1000W countertop microwave', 'Appliances', 89.99, 15, 8],
                                ['Mini Fridge', 'Compact office refrigerator', 'Appliances', 149.99, 10, 5],
                                
                                // Cleaning Supplies
                                ['Hand Sanitizer', '500ml bottle', 'Cleaning Supplies', 5.99, 50, 25],
                                ['Disinfectant Wipes', 'Pack of 100', 'Cleaning Supplies', 7.99, 40, 20],
                                ['Paper Towels', '12-pack', 'Cleaning Supplies', 12.99, 30, 15]
                            ];

                            const stmt = db.prepare(`
                                INSERT INTO products (name, description, category, price, quantity, reorder_point)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `);

                            products.forEach(product => {
                                stmt.run(product, (err) => {
                                    if (err) {
                                        console.error('Error adding product:', err);
                                    }
                                });
                            });

                            stmt.finalize(() => {
                                console.log('Sample products added successfully');
                                db.close((err) => {
                                    if (err) {
                                        console.error('Error closing database:', err);
                                    } else {
                                        console.log('Database initialization completed successfully');
                                    }
                                });
                            });
                        }
                    );
                });
            });
        });
    });
}); 