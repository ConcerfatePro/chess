"use strict";

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "chess.db");

let db = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initDatabase() {
  ensureDataDir();
  const Database = require("better-sqlite3");
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      username TEXT PRIMARY KEY COLLATE NOCASE,
      passcode_hash TEXT NOT NULL,
      passcode_salt TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (username) REFERENCES profiles(username) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);

  return db;
}

function getDb() {
  if (!db) return initDatabase();
  return db;
}

function getDbPath() {
  return DB_PATH;
}

module.exports = {
  initDatabase,
  getDb,
  getDbPath,
  DATA_DIR
};
