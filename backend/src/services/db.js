const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.RENDER ? '/tmp/worm_db.json' : path.join(__dirname, '../../worm_db.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.log('DB load error:', e.message);
  }
  return { users: [], api_keys: [] };
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.log('DB save error:', e.message);
  }
}

let db = loadDB();

module.exports = {
  // Users
  saveUser: (user) => {
    db.users = db.users.filter(u => u.id !== user.id && u.email !== user.email);
    db.users.push(user);
    saveDB(db);
  },
  getUserByEmail: (email) => {
    return db.users.find(u => u.email === email) || null;
  },
  getUserById: (id) => {
    return db.users.find(u => u.id === id) || null;
  },
  getUserByGoogleId: (googleId) => {
    return db.users.find(u => u.googleId === googleId) || null;
  },
  getAllUsers: () => {
    return db.users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      plan: u.plan,
      messagesUsed: u.messagesUsed,
      freeLimit: u.freeLimit,
      role: u.role,
      createdAt: u.createdAt
    }));
  },
  updateUser: (id, fields) => {
    const user = db.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, fields);
      saveDB(db);
    }
  },
  deleteUser: (id) => {
    const before = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    saveDB(db);
    return db.users.length < before;
  },

  // API Keys
  saveKey: (key, userId, plan, days = 7) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    db.api_keys = db.api_keys.filter(k => k.key !== key);
    db.api_keys.push({ key, userId, plan, expiresAt: expiresAt.toISOString(), requestsCount: 0 });
    saveDB(db);
  },
  getKey: (key) => {
    return db.api_keys.find(k => k.key === key) || null;
  },
  incrementUsage: (key) => {
    const k = db.api_keys.find(k => k.key === key);
    if (k) {
      k.requestsCount = (k.requestsCount || 0) + 1;
      saveDB(db);
    }
  },
  getAllKeys: () => {
    return db.api_keys;
  },

  // Codes
  saveCode: (email, code) => {
    // Pas besoin avec auth simple
  },
  getCode: (email) => {
    return null;
  },
  deleteCode: (email) => {
    // Pas besoin
  },
};
