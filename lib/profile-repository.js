"use strict";

const crypto = require("crypto");
const { getDb } = require("./db");
const { createDefaultProfile, validateProfile } = require("./profile-validation");

const SESSION_DAYS = 30;

function nowIso() {
  return new Date().toISOString();
}

function randomSalt() {
  return crypto.randomBytes(16).toString("hex");
}

function hashPasscode(passcode, salt) {
  return crypto.createHash("sha256").update(`${salt}:${passcode}`).digest("hex");
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sessionExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d.toISOString();
}

function rowToProfile(row) {
  const data = JSON.parse(row.profile_json);
  data.username = row.username;
  return validateProfile(data);
}

function countProfiles() {
  const row = getDb().prepare("SELECT COUNT(*) AS n FROM profiles").get();
  return row.n;
}

function register(username, passcode) {
  const name = String(username || "").trim();
  if (name.length < 2) throw new Error("Username must be at least 2 characters.");
  if (name.length > 24) throw new Error("Username must be at most 24 characters.");
  if (!passcode || passcode.length < 4) throw new Error("Passcode must be at least 4 characters.");

  const existing = getDb().prepare("SELECT username FROM profiles WHERE username = ? COLLATE NOCASE").get(name);
  if (existing) throw new Error("That username already exists.");

  const profile = createDefaultProfile(name);
  const salt = randomSalt();
  const hash = hashPasscode(passcode, salt);
  const ts = nowIso();

  getDb().prepare(`
    INSERT INTO profiles (username, passcode_hash, passcode_salt, profile_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, hash, salt, JSON.stringify(profile), ts, ts);

  const session = createSessionForUser(name);
  return { profile, session };
}

function login(username, passcode) {
  const name = String(username || "").trim();
  const row = getDb().prepare("SELECT * FROM profiles WHERE username = ? COLLATE NOCASE").get(name);
  if (!row) throw new Error("Profile not found.");

  const hash = hashPasscode(passcode, row.passcode_salt);
  if (hash !== row.passcode_hash) throw new Error("Incorrect passcode.");

  const profile = rowToProfile(row);
  profile.lastPlayedAt = nowIso();
  updateProfileData(name, profile);

  const session = createSessionForUser(name);
  return { profile, session };
}

function createSessionForUser(username) {
  const token = createSessionToken();
  const created = nowIso();
  const expires = sessionExpiry();
  getDb().prepare(`
    INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)
  `).run(token, username, created, expires);
  return { token, expiresAt: expires };
}

function getSession(token) {
  if (!token) return null;
  purgeExpiredSessions();
  const row = getDb().prepare(`
    SELECT s.token, s.username, s.expires_at, p.*
    FROM sessions s
    JOIN profiles p ON p.username = s.username
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, nowIso());
  if (!row) return null;
  return {
    token: row.token,
    username: row.username,
    expiresAt: row.expires_at,
    profile: rowToProfile(row)
  };
}

function logout(token) {
  if (!token) return;
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

function purgeExpiredSessions() {
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
}

function getProfileByUsername(username) {
  const row = getDb().prepare("SELECT * FROM profiles WHERE username = ? COLLATE NOCASE").get(username);
  if (!row) return null;
  return rowToProfile(row);
}

function updateProfileData(username, profile) {
  const validated = validateProfile({ ...profile, username });
  validated.lastPlayedAt = nowIso();
  getDb().prepare(`
    UPDATE profiles SET profile_json = ?, updated_at = ? WHERE username = ? COLLATE NOCASE
  `).run(JSON.stringify(validated), validated.lastPlayedAt, username);
  return validated;
}

function saveProfileForSession(token, profile) {
  const session = getSession(token);
  if (!session) throw new Error("Session expired. Please log in again.");
  if (profile.username && profile.username.toLowerCase() !== session.username.toLowerCase()) {
    throw new Error("Cannot change username on save.");
  }
  return updateProfileData(session.username, profile);
}

function changePasscode(token, oldPasscode, newPasscode) {
  if (!newPasscode || newPasscode.length < 4) {
    throw new Error("New passcode must be at least 4 characters.");
  }
  const session = getSession(token);
  if (!session) throw new Error("Session expired. Please log in again.");

  const row = getDb().prepare("SELECT * FROM profiles WHERE username = ?").get(session.username);
  const oldHash = hashPasscode(oldPasscode, row.passcode_salt);
  if (oldHash !== row.passcode_hash) throw new Error("Old passcode is incorrect.");

  const salt = randomSalt();
  const hash = hashPasscode(newPasscode, salt);
  getDb().prepare(`
    UPDATE profiles SET passcode_hash = ?, passcode_salt = ?, updated_at = ? WHERE username = ?
  `).run(hash, salt, nowIso(), session.username);

  return rowToProfile(row);
}

function deleteProfile(token, passcode) {
  const session = getSession(token);
  if (!session) throw new Error("Session expired. Please log in again.");

  const row = getDb().prepare("SELECT * FROM profiles WHERE username = ?").get(session.username);
  const hash = hashPasscode(passcode, row.passcode_salt);
  if (hash !== row.passcode_hash) throw new Error("Incorrect passcode.");

  getDb().prepare("DELETE FROM profiles WHERE username = ?").run(session.username);
  getDb().prepare("DELETE FROM sessions WHERE username = ?").run(session.username);
}

function getLeaderboard(limit = 100) {
  const rows = getDb().prepare("SELECT username, profile_json, updated_at FROM profiles").all();
  const list = rows.map(row => {
    let data = {};
    try { data = JSON.parse(row.profile_json) || {}; } catch { data = {}; }
    const elo = data.elo || {};
    const stats = data.stats || {};
    return {
      username: row.username,
      rating: Math.max(100, Math.floor(Number(elo.rating) || 100)),
      peak: Math.max(100, Math.floor(Number(elo.peak) || 100)),
      level: Math.max(1, Math.floor(Number(data.level) || 1)),
      title: data.title || "New Challenger",
      wins: Math.max(0, Math.floor(Number(stats.wins) || 0)),
      losses: Math.max(0, Math.floor(Number(stats.losses) || 0)),
      draws: Math.max(0, Math.floor(Number(stats.draws) || 0)),
      botWins: Math.max(0, Math.floor(Number(stats.botWins) || 0)),
      bestWinStreak: Math.max(0, Math.floor(Number(stats.bestWinStreak) || 0)),
      lastPlayedAt: data.lastPlayedAt || row.updated_at || null
    };
  });
  list.sort((a, b) =>
    b.rating - a.rating || b.peak - a.peak || b.level - a.level || b.wins - a.wins);
  return list.slice(0, Math.max(1, Math.min(500, limit)));
}

function importFromLocalMap(profilesMap) {
  let imported = 0;
  const insert = getDb().prepare(`
    INSERT OR IGNORE INTO profiles (username, passcode_hash, passcode_salt, profile_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const [username, raw] of Object.entries(profilesMap || {})) {
    const name = String(raw?.username || username || "").trim();
    if (name.length < 2 || name.length > 24) continue;
    if (!/^[a-f0-9]{64}$/i.test(raw?.passcodeHash) || !/^[a-f0-9]{32}$/i.test(raw?.passcodeSalt)) continue;
    const profile = validateProfile(raw);
    profile.username = name;
    const ts = profile.createdAt || nowIso();
    const result = insert.run(
      profile.username,
      raw.passcodeHash,
      raw.passcodeSalt,
      JSON.stringify(profile),
      ts,
      profile.lastPlayedAt || ts
    );
    if (result.changes > 0) imported += 1;
  }
  return imported;
}

module.exports = {
  countProfiles,
  register,
  login,
  getSession,
  logout,
  saveProfileForSession,
  changePasscode,
  deleteProfile,
  getProfileByUsername,
  getLeaderboard,
  importFromLocalMap,
  hashPasscode,
  randomSalt
};
