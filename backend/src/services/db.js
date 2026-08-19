const Database = require('better-sqlite3');
const db = new Database('worm_data.db');

// Création de la table avec support des quotas et de l'expiration
db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    userId TEXT,
    plan TEXT,
    expiresAt DATETIME,
    requestsCount INTEGER DEFAULT 0
  )
`);

module.exports = {
  // Sauvegarde de la clé avec calcul des jours de validité
  saveKey: (key, userId, plan, days = 7) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const stmt = db.prepare('INSERT INTO api_keys (key, userId, plan, expiresAt) VALUES (?, ?, ?, ?)');
    stmt.run(key, userId, plan, expiresAt.toISOString());
  },

  // Récupération de la clé pour vérification
  getKey: (key) => {
    const stmt = db.prepare('SELECT * FROM api_keys WHERE key = ?');
    return stmt.get(key);
  },

  // Incrémenter le nombre de requêtes utilisées
  incrementUsage: (key) => {
    const stmt = db.prepare('UPDATE api_keys SET requestsCount = requestsCount + 1 WHERE key = ?');
    stmt.run(key);
  }
};

