const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, '..', process.env.DB_PATH || 'database.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to the SQLite database');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

module.exports = db; 