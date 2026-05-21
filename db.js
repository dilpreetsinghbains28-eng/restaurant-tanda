const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');

let dbInstance = null;

async function getDB() {
    if (dbInstance) {
        return dbInstance;
    }

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    return dbInstance;
}

async function initDB() {
    const db = await getDB();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            userId TEXT,
            customerName TEXT NOT NULL,
            customerPhone TEXT NOT NULL,
            items TEXT NOT NULL, -- Stored as JSON string
            total REAL NOT NULL,
            status TEXT DEFAULT 'New',
            createdAt TEXT NOT NULL,
            statusUpdateDate TEXT,
            statusRead INTEGER DEFAULT 0, -- 0 false, 1 true
            adminReply TEXT,
            replyDate TEXT,
            replyRead INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS reservations (
            id TEXT PRIMARY KEY,
            userId TEXT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            guests TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            createdAt TEXT NOT NULL,
            statusUpdateDate TEXT,
            statusRead INTEGER DEFAULT 0,
            adminReply TEXT,
            replyDate TEXT,
            replyRead INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            userId TEXT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Unread',
            createdAt TEXT NOT NULL,
            adminReply TEXT,
            replyDate TEXT,
            replyRead INTEGER DEFAULT 0
        );
    `);

    console.log('✅ SQLite Database initialized successfully.');
}

module.exports = { getDB, initDB };
