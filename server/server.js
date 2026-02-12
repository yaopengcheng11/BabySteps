require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- 中间件：验证 Token ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Auth 接口 ---
app.post('/api/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: '邮箱已存在' });

        const hashed = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)', [email, hashed, full_name]);

        res.status(201).json({ message: '注册成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '账号或密码错误' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.full_name } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 数据接口 (都需要登录) ---

// 1. 获取/创建宝宝资料
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM babies WHERE parent_id = ?', [req.user.id]);
        if (rows.length > 0) {
            // 转换数据库字段为前端驼峰命名
            const dbProfile = rows[0];
            res.json({
                name: dbProfile.name,
                gender: dbProfile.gender,
                birthDate: dbProfile.birth_date,
                avatar: dbProfile.avatar_url,
                userId: dbProfile.parent_id
            });
        } else {
            res.json(null);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile', authenticateToken, async (req, res) => {
    const { name, gender, birthDate, avatar } = req.body;
    try {
        const [existing] = await pool.query('SELECT id FROM babies WHERE parent_id = ?', [req.user.id]);
        if (existing.length > 0) {
            await pool.query('UPDATE babies SET name=?, gender=?, birth_date=?, avatar_url=? WHERE parent_id=?',
                [name, gender, new Date(birthDate), avatar, req.user.id]);
        } else {
            await pool.query('INSERT INTO babies (parent_id, name, gender, birth_date, avatar_url) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, name, gender, new Date(birthDate), avatar]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 获取日志
app.get('/api/logs', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.* FROM records r 
            JOIN babies b ON r.baby_id = b.id 
            WHERE b.parent_id = ? 
            ORDER BY r.record_time DESC`,
            [req.user.id]
        );

        const logs = rows.map(row => ({
            id: row.id.toString(),
            type: row.record_type,
            timestamp: new Date(row.record_time).getTime(),
            ...JSON.parse(row.record_value || '{}'),
            userId: req.user.id
        }));
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. 添加日志
app.post('/api/logs', authenticateToken, async (req, res) => {
    const log = req.body;
    try {
        const [babies] = await pool.query('SELECT id FROM babies WHERE parent_id = ?', [req.user.id]);
        if (babies.length === 0) return res.status(400).json({ error: '请先创建宝宝资料' });
        const babyId = babies[0].id;

        const { id, type, timestamp, userId, ...rest } = log;
        const valueJson = JSON.stringify(rest);

        const [result] = await pool.query(
            'INSERT INTO records (baby_id, record_type, record_value, record_time) VALUES (?, ?, ?, ?)',
            [babyId, type, valueJson, new Date(timestamp)]
        );

        res.json({ id: result.insertId.toString(), ...log });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. 删除日志
app.delete('/api/logs/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM records WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));