const Database = require('better-sqlite3');
const db = new Database('worm_data.db');

// Table clés API
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    userId TEXT,
    plan TEXT,
    expiresAt DATETIME,
    requestsCount INTEGER DEFAULT 0
  )
`);

// Table utilisateurs
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    password TEXT,
    googleId TEXT,
    avatar TEXT,
    plan TEXT DEFAULT 'FREE',
    messagesUsed INTEGER DEFAULT 0,
    freeLimit INTEGER DEFAULT 15,
    isVerified INTEGER DEFAULT 0,
    role TEXT DEFAULT 'USER',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Table codes de vérification
db.exec(`
  CREATE TABLE IF NOT EXISTS verification_codes (
    email TEXT PRIMARY KEY,
    code TEXT,
    expiresAt DATETIME
  )
`);

module.exports = {
  // Clés API
  saveKey: (key, userId, plan, days = 7) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const stmt = db.prepare('INSERT OR REPLACE INTO api_keys (key, userId, plan, expiresAt) VALUES (?, ?, ?, ?)');
    stmt.run(key, userId, plan, expiresAt.toISOString());
  },
  getKey: (key) => {
    const stmt = db.prepare('SELECT * FROM api_keys WHERE key = ?');
    return stmt.get(key);
  },
  incrementUsage: (key) => {
    const stmt = db.prepare('UPDATE api_keys SET requestsCount = requestsCount + 1 WHERE key = ?');
    stmt.run(key);
  },

  // Users
  saveUser: (user) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, email, name, password, googleId, avatar, plan, messagesUsed, freeLimit, isVerified, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.email, user.name, user.password || null, user.googleId || null, user.avatar || null,
      user.plan || 'FREE', user.messagesUsed || 0, user.freeLimit || 15, user.isVerified || 0, user.role || 'USER');
  },
  getUserByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },
  getUserById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },
  getUserByGoogleId: (googleId) => {
    const stmt = db.prepare('SELECT * FROM users WHERE googleId = ?');
    return stmt.get(googleId);
  },
  updateUser: (id, fields) => {
    const keys = Object.keys(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
    stmt.run(...keys.map(k => fields[k]), id);
  },

  // Verification codes
  saveCode: (email, code) => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const stmt = db.prepare('INSERT OR REPLACE INTO verification_codes (email, code, expiresAt) VALUES (?, ?, ?)');
    stmt.run(email, code, expiresAt.toISOString());
  },
  getCode: (email) => {
    const stmt = db.prepare('SELECT * FROM verification_codes WHERE email = ?');
    return stmt.get(email);
  },
  deleteCode: (email) => {
    const stmt = db.prepare('DELETE FROM verification_codes WHERE email = ?');
    stmt.run(email);
  },
};
