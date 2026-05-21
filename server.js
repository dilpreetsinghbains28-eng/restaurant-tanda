const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { getDB, initDB } = require('./db');

const app = express();
app.use(cors());
const PORT = 8080;
const JWT_SECRET = 'galaxy_super_secret_key_2026'; // In production, use process.env.JWT_SECRET

// --- PREVENT CRASHES & ENSURE RESTART ---
function handleCriticalError(type, err) {
    console.error(`\n CRITICAL ERROR (${type}):`, err);
    console.error(' Exiting to allow watchdog restart...\n');
    setTimeout(() => process.exit(1), 500);
}

process.on('uncaughtException', (err) => handleCriticalError('Uncaught Exception', err));
process.on('unhandledRejection', (reason) => handleCriticalError('Unhandled Rejection', reason));

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

// Cache Control for Dev
app.use((req, res, next) => {
    if (req.url.endsWith('.js') || req.url.endsWith('.html') || req.url.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

function generateId(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        // If it fails to verify as JWT, fallback to raw token for backward compatibility with frontend code
        if (err) {
             req.user = { id: token }; // Fallback to plain id
             return next();
        }
        req.user = user;
        next();
    });
};

// =============================================
// API ROUTES (Must be before static)
// =============================================

// --- AUTH ---
app.post('/api/auth/register', catchAsync(async (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ success: false, message: 'All fields are required.' });
    
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) return res.status(400).json({ success: false, message: 'Invalid phone format.' });

    const db = await getDB();
    const existingUser = await db.get(`SELECT * FROM users WHERE phone = ?`, [phone]);
    if (existingUser) return res.status(400).json({ success: false, message: 'Phone already registered.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = { id: generateId('USR'), name, phone, createdAt: new Date().toISOString() };
    await db.run(
        `INSERT INTO users (id, name, phone, password, createdAt) VALUES (?, ?, ?, ?, ?)`,
        [newUser.id, name, phone, hashedPassword, newUser.createdAt]
    );

    const token = jwt.sign({ id: newUser.id, name, phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token: token, user: newUser });
}));

app.post('/api/auth/login', catchAsync(async (req, res) => {
    const { phone, password } = req.body;
    const db = await getDB();
    
    const user = await db.get(`SELECT * FROM users WHERE phone = ?`, [phone]);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid phone or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid phone or password.' });

    const token = jwt.sign({ id: user.id, name: user.name, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token: token, user: { id: user.id, name: user.name, phone: user.phone } });
}));

app.get('/api/user/me', authenticateToken, catchAsync(async (req, res) => {
    const userId = req.user.id;
    const db = await getDB();
    
    const user = await db.get(`SELECT id, name, phone FROM users WHERE id = ?`, [userId]);
    if (!user) return res.status(401).json({ success: false });

    const notifications = [];
    let unreadCount = 0;

    const checkItem = (item, type) => {
        if (item.adminReply) {
            if (!item.replyRead) unreadCount++;
            notifications.push({ notifType: 'reply', type, id: item.id, date: item.replyDate || item.createdAt, text: item.adminReply, isRead: !!item.replyRead, itemContext: item });
        }
        if (item.status && !['New', 'Pending'].includes(item.status)) {
            if (!item.statusRead) unreadCount++;
            notifications.push({ notifType: 'status', type, id: item.id, status: item.status, date: item.statusUpdateDate || item.createdAt, text: `Your ${type} is ${item.status.toLowerCase()}.`, isRead: !!item.statusRead, itemContext: item });
        }
    };

    const orders = await db.all(`SELECT * FROM orders WHERE userId = ?`, [userId]);
    orders.forEach(o => { o.items = JSON.parse(o.items); checkItem(o, 'order'); });

    const reservations = await db.all(`SELECT * FROM reservations WHERE userId = ?`, [userId]);
    reservations.forEach(r => checkItem(r, 'reservation'));

    const messages = await db.all(`SELECT * FROM messages WHERE userId = ?`, [userId]);
    messages.forEach(m => checkItem(m, 'message'));

    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, user, notifications: notifications.slice(0, 20), unreadCount });
}));

// --- CONTACT MESSAGES ---
app.post('/api/contact', catchAsync(async (req, res) => {
    const { name, email, subject, message, userId } = req.body;
    if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    
    const db = await getDB();
    const newMsg = { id: generateId('MSG'), userId: userId || null, name, email, subject: subject || 'General Inquiry', message, status: 'Unread', createdAt: new Date().toISOString() };
    
    await db.run(
        `INSERT INTO messages (id, userId, name, email, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newMsg.id, newMsg.userId, newMsg.name, newMsg.email, newMsg.subject, newMsg.message, newMsg.status, newMsg.createdAt]
    );
    res.json({ success: true, message: newMsg });
}));

app.get('/api/contact', catchAsync(async (req, res) => {
    const db = await getDB();
    const messages = await db.all(`SELECT * FROM messages ORDER BY createdAt DESC`);
    res.json(messages);
}));

app.delete('/api/contact/:id', catchAsync(async (req, res) => {
    const db = await getDB();
    await db.run(`DELETE FROM messages WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
}));

// --- ORDERS & RESERVATIONS ---
app.post('/api/orders', catchAsync(async (req, res) => {
    const { customerName, customerPhone, items, total, userId } = req.body;
    if (!customerName || !customerPhone || !items) return res.status(400).json({ success: false });
    
    const db = await getDB();
    const newOrder = { id: generateId('ORD'), userId: userId || null, customerName, customerPhone, items, total, status: 'New', createdAt: new Date().toISOString() };
    
    await db.run(
        `INSERT INTO orders (id, userId, customerName, customerPhone, items, total, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newOrder.id, newOrder.userId, newOrder.customerName, newOrder.customerPhone, JSON.stringify(newOrder.items), newOrder.total, newOrder.status, newOrder.createdAt]
    );
    res.json({ success: true, order: newOrder });
}));

app.get('/api/orders', catchAsync(async (req, res) => {
    const db = await getDB();
    const orders = await db.all(`SELECT * FROM orders ORDER BY createdAt DESC`);
    orders.forEach(o => o.items = JSON.parse(o.items));
    res.json(orders);
}));

app.patch('/api/orders/:id', catchAsync(async (req, res) => {
    const db = await getDB();
    if (req.body.status) {
        const updateDate = new Date().toISOString();
        await db.run(`UPDATE orders SET status = ?, statusUpdateDate = ?, statusRead = 0 WHERE id = ?`, [req.body.status, updateDate, req.params.id]);
    }
    const order = await db.get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if(order) order.items = JSON.parse(order.items);
    res.json({ success: true, order });
}));

app.delete('/api/orders/:id', catchAsync(async (req, res) => {
    const db = await getDB();
    await db.run(`DELETE FROM orders WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
}));

app.post('/api/reservations', catchAsync(async (req, res) => {
    const { name, date, time, guests, phone, userId } = req.body;
    if (!name || !date || !time) return res.status(400).json({ success: false });
    
    const db = await getDB();
    const newRes = { id: generateId('RES'), userId: userId || null, name, phone, date, time, guests, status: 'Pending', createdAt: new Date().toISOString() };
    
    await db.run(
        `INSERT INTO reservations (id, userId, name, phone, date, time, guests, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newRes.id, newRes.userId, newRes.name, newRes.phone, newRes.date, newRes.time, newRes.guests, newRes.status, newRes.createdAt]
    );
    res.json({ success: true, reservation: newRes });
}));

app.get('/api/reservations', catchAsync(async (req, res) => {
    const db = await getDB();
    const resv = await db.all(`SELECT * FROM reservations ORDER BY createdAt DESC`);
    res.json(resv);
}));

app.patch('/api/reservations/:id', catchAsync(async (req, res) => {
    const db = await getDB();
    if (req.body.status) {
        const updateDate = new Date().toISOString();
        await db.run(`UPDATE reservations SET status = ?, statusUpdateDate = ?, statusRead = 0 WHERE id = ?`, [req.body.status, updateDate, req.params.id]);
    }
    const resv = await db.get(`SELECT * FROM reservations WHERE id = ?`, [req.params.id]);
    res.json({ success: true, reservation: resv });
}));

app.delete('/api/reservations/:id', catchAsync(async (req, res) => {
    const db = await getDB();
    await db.run(`DELETE FROM reservations WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
}));

// --- ADMIN REPLIES ---
app.patch('/api/:type/:id/reply', catchAsync(async (req, res) => {
    const { type, id } = req.params;
    const { reply } = req.body;
    const db = await getDB();
    
    const validTypes = ['orders', 'reservations', 'contact'];
    if (!validTypes.includes(type)) return res.status(400).json({ success: false });

    const tableName = type === 'contact' ? 'messages' : type;
    const date = new Date().toISOString();

    let query = `UPDATE ${tableName} SET adminReply = ?, replyDate = ?, replyRead = 0`;
    if (type === 'contact') query += `, status = 'Read'`;
    query += ` WHERE id = ?`;

    await db.run(query, [reply, date, id]);
    res.json({ success: true });
}));

// --- ADMIN STATS ---
app.get('/api/stats', catchAsync(async (req, res) => {
    const db = await getDB();
    const orders = await db.all(`SELECT * FROM orders`);
    const resv = await db.all(`SELECT * FROM reservations`);
    const msgs = await db.all(`SELECT * FROM messages`);
    
    res.json({
        totalOrders: orders.length,
        newOrders: orders.filter(o => o.status === 'New').length,
        totalRevenue: orders.filter(o => ['Confirmed', 'Completed'].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0),
        totalReservations: resv.length,
        pendingReservations: resv.filter(r => r.status === 'Pending').length,
        totalMessages: msgs.length,
        unreadMessages: msgs.filter(m => m.status === 'Unread').length
    });
}));

// --- NOTIFICATION MARK AS READ ---
app.post('/api/notifications/mark-read', authenticateToken, catchAsync(async (req, res) => {
    const userId = req.user.id;
    const db = await getDB();

    await db.run(`UPDATE orders SET replyRead = 1, statusRead = 1 WHERE userId = ?`, [userId]);
    await db.run(`UPDATE reservations SET replyRead = 1, statusRead = 1 WHERE userId = ?`, [userId]);
    await db.run(`UPDATE messages SET replyRead = 1 WHERE userId = ?`, [userId]);

    res.json({ success: true });
}));

app.patch('/api/notifications/:type/:id/read', authenticateToken, catchAsync(async (req, res) => {
    const { type, id } = req.params;
    const { notifType } = req.body;
    const db = await getDB();
    
    const validTypes = ['order', 'reservation', 'message'];
    if (!validTypes.includes(type)) return res.status(400).json({ success: false });

    let tableName = type + 's';
    
    if (notifType === 'reply') {
        await db.run(`UPDATE ${tableName} SET replyRead = 1 WHERE id = ? AND userId = ?`, [id, req.user.id]);
    } else if (notifType === 'status') {
        await db.run(`UPDATE ${tableName} SET statusRead = 1 WHERE id = ? AND userId = ?`, [id, req.user.id]);
    }

    res.json({ success: true });
}));

// --- HEALTH CHECK ---
app.get('/ping', (req, res) => res.json({ success: true, status: 'alive', time: new Date().toISOString() }));
app.use(express.static(__dirname));

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('❌ SERVER ERROR:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// --- START SERVER WITH PORT RECLAIMING ---
async function startServer(retryCount = 0) {
    await initDB(); // Initialize Database before starting
    
    const server = app.listen(PORT, () => {
        console.log(`
  🚀 Galaxy Restaurant Server is Fixed & Running!
  ─────────────────────────────────────────────
  🌐 Website:  http://localhost:${PORT}
  📊 Admin:    http://localhost:${PORT}/admin.html
  ─────────────────────────────────────────────
        `);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            if (retryCount < 5) {
                console.error(`⚠️ Port ${PORT} is busy. Retrying in 2s... (Attempt ${retryCount + 1}/5)`);
                setTimeout(() => startServer(retryCount + 1), 2000);
            } else {
                console.error(`❌ Port ${PORT} is occupied. Please kill conflicting processes.`);
                process.exit(1);
            }
        } else {
            console.error('❌ Fatal Start Error:', err);
            process.exit(1);
        }
    });

    // Graceful Shutdown
    const shutdown = () => {
        console.log('\n👋 Server stopping safely...');
        server.close(() => {
            console.log('✅ Server stopped.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

startServer();
