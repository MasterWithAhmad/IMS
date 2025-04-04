const bcrypt = require('bcryptjs');
const db = require('../config/database');

class AuthController {
    static async getLoginPage(req, res) {
        res.render('auth/login', {
            title: 'Login',
            error: null
        });
    }

    static async getRegisterPage(req, res) {
        res.render('auth/register', {
            title: 'Register',
            error: null
        });
    }

    static async login(req, res) {
        const { username, password } = req.body;

        try {
            // Get user from database
            const user = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM users WHERE username = ?',
                    [username],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!user) {
                return res.render('auth/login', {
                    title: 'Login',
                    error: 'Invalid username or password'
                });
            }

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.render('auth/login', {
                    title: 'Login',
                    error: 'Invalid username or password'
                });
            }

            // Set session
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };

            res.redirect('/');
        } catch (error) {
            console.error('Login Error:', error);
            res.render('auth/login', {
                title: 'Login',
                error: 'An error occurred during login'
            });
        }
    }

    static async register(req, res) {
        const { username, password, confirmPassword } = req.body;

        try {
            // Validate input
            if (!username || !password || !confirmPassword) {
                return res.render('auth/register', {
                    title: 'Register',
                    error: 'All fields are required'
                });
            }

            if (password !== confirmPassword) {
                return res.render('auth/register', {
                    title: 'Register',
                    error: 'Passwords do not match'
                });
            }

            // Check if username exists
            const existingUser = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT * FROM users WHERE username = ?',
                    [username],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (existingUser) {
                return res.render('auth/register', {
                    title: 'Register',
                    error: 'Username already exists'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert new user
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
                    [username, hashedPassword, 'user'],
                    function(err) {
                        if (err) reject(err);
                        resolve(this.lastID);
                    }
                );
            });

            res.redirect('/auth/login');
        } catch (error) {
            console.error('Registration Error:', error);
            res.render('auth/register', {
                title: 'Register',
                error: 'An error occurred during registration'
            });
        }
    }

    static async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout Error:', err);
            }
            res.redirect('/auth/login');
        });
    }
}

module.exports = AuthController; 