const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(cors()); // Дозволяє всі походження

// Логування всіх запитів
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin} | Auth: ${req.headers.authorization || 'None'}`);
    next();
});

// Middleware для перевірки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log(`[${new Date().toISOString()}] Token missing for ${req.method} ${req.url}`);
        return res.status(401).json({ error: 'Token required' });
    }
    jwt.verify(token, 'secret_key', (err, user) => {
        if (err) {
            console.log(`[${new Date().toISOString()}] Invalid token for ${req.method} ${req.url}: ${err.message}`);
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Реєстрація
app.post('/api/users/register', (req, res) => {
    const { email, password, first_name, last_name, phone_number } = req.body;
    console.log(`[${new Date().toISOString()}] Register request: ${email}`);
    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    db.query('SELECT email FROM users WHERE email = ?', [email], (err, existing) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Register error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });
        db.query(
            'INSERT INTO users (email, Password, role, first_name, last_name, phone_number, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [email, password, 'user', first_name, last_name, phone_number || null],
            (err, result) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Register error: ${err.message}`);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ user_id: result.insertId });
            }
        );
    });
});

// Логін
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`[${new Date().toISOString()}] Login request: ${email}`);
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
    }
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Login error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = results[0];
        if (password !== user.Password) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ user_id: user.user_id, role: user.role }, 'secret_key', { expiresIn: '1h' });
        console.log(`[${new Date().toISOString()}] Login success: user_id=${user.user_id}, token=${token}`);
        res.json({ token, user_id: user.user_id, role: user.role });
    });
});

// Категорії (без токена)
app.get('/api/categories', (req, res) => {
    console.log(`[${new Date().toISOString()}] Request to /api/categories`);
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Categories error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Курси (без токена)
app.get('/api/courses', (req, res) => {
    const { category_id, courses_id } = req.query;
    console.log(`[${new Date().toISOString()}] Request to /api/courses`, { category_id, courses_id });
    let query = 'SELECT * FROM courses';
    let params = [];
    if (category_id) {
        query += ' WHERE category_id = ?';
        params.push(category_id);
    } else if (courses_id) {
        query += ' WHERE courses_id = ?';
        params.push(courses_id);
    }
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Courses error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Профіль
app.get('/api/users/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    console.log(`[${new Date().toISOString()}] Request to /api/users/${userId}`);
    db.query('SELECT email, first_name, last_name, phone_number, role FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] User error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
    });
});

// Підтримка
app.post('/api/support', authenticateToken, (req, res) => {
    const { user_id, course_id, message } = req.body;
    console.log(`[${new Date().toISOString()}] Support request: user_id=${user_id}, course_id=${course_id}`);
    if (!user_id || !course_id || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    db.query('SELECT email FROM users WHERE user_id = ?', [user_id], (err, user) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Support error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });
        const email = user[0].email;
        db.query(
            'INSERT INTO support (user_id, course_id, email, message, created_at) VALUES (?, ?, ?, ?, NOW())',
            [user_id, course_id, email, message],
            (err, result) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Support error: ${err.message}`);
                    return res.status(500).json({ error: err.message });
                }
                const support_id = result.insertId;
                db.query(
                    'UPDATE purchase SET support_id = ? WHERE user_id = ? AND course_id = ?',
                    [support_id, user_id, course_id],
                    (err) => {
                        if (err) {
                            console.error(`[${new Date().toISOString()}] Support update error: ${err.message}`);
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ support_id });
                    }
                );
            }
        );
    });
});

// Покупка
app.post('/api/purchase', authenticateToken, (req, res) => {
    const { user_id, course_id, support_id } = req.body;
    console.log(`[${new Date().toISOString()}] Purchase request: user_id=${user_id}, course_id=${course_id}`);
    if (!user_id || !course_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    db.query(
        'INSERT INTO purchase (user_id, course_id, support_id, purchase_date) VALUES (?, ?, ?, NOW())',
        [user_id, course_id, support_id || null],
        (err, result) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Purchase error: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }
            res.json({ purchase_id: result.insertId });
        }
    );
});

// Історія покупок
app.get('/api/purchase', authenticateToken, (req, res) => {
    console.log(`[${new Date().toISOString()}] Request to /api/purchase`);
    db.query(
        'SELECT p.purchase_id, p.user_id, p.course_id, p.support_id, p.purchase_date, c.title FROM purchase p JOIN courses c ON p.course_id = c.courses_id',
        (err, results) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Purchase history error: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// Додавання курсу (адмін)
app.post('/api/admin/courses', authenticateToken, (req, res) => {
    const { title, description, category_id, price, external_link, is_popular } = req.body;
    console.log(`[${new Date().toISOString()}] Add course request: ${title}`);
    if (!title || !category_id || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    db.query(
        'INSERT INTO courses (title, description, category_id, price, external_link, is_popular) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, category_id, price, external_link || null, is_popular || 0],
        (err, result) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Add course error: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }
            res.json({ courses_id: result.insertId });
        }
    );
});

// Оновлення курсу (адмін)
app.put('/api/admin/courses/:id', authenticateToken, (req, res) => {
    const courseId = req.params.id;
    const { title, description, category_id, price, external_link, is_popular } = req.body;
    console.log(`[${new Date().toISOString()}] Update course request: courseId=${courseId}`);
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    db.query(
        'UPDATE courses SET title = ?, description = ?, category_id = ?, price = ?, external_link = ?, is_popular = ? WHERE courses_id = ?',
        [title, description, category_id, price, external_link || null, is_popular || 0, courseId],
        (err) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Update course error: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Course updated' });
        }
    );
});

// Видалення курсу (адмін)
app.delete('/api/admin/courses/:id', authenticateToken, (req, res) => {
    const courseId = req.params.id;
    console.log(`[${new Date().toISOString()}] Delete course request: courseId=${courseId}`);
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    db.query('DELETE FROM courses WHERE courses_id = ?', [courseId], (err) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Delete course error: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Course deleted' });
    });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
    console.log('Listening on all interfaces (0.0.0.0:3000)');
});
