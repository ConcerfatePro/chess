"use strict";

const MAX_HISTORY = 40;

function nowIso() {
  return new Date().toISOString();
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function integer(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

function stringArray(value, fallback = []) {
  return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === "string"))] : fallback.slice();
}

function createDefaultProfile(username) {
  const ts = nowIso();
  return {
    username,
    createdAt: ts,
    lastPlayedAt: ts,
    level: 1,
    xp: 0,
    coins: 50,
    royalTokens: 0,
    title: "New Challenger",
    elo: {
      rating: 100,
      peak: 100,
      botGames: 0,
      lastChange: 0
    },
    stats: {
      wins: 0,
      losses: 0,
      draws: 0,
      botWins: 0,
      multiplayerWins: 0,
      totalGames: 0,
      currentWinStreak: 0,
      bestWinStreak: 0
    },
    botProgress: {
      defeatedBots: [],
      highestBotDefeated: null,
      firstTimeRewardsClaimed: [],
      botWinCounts: {}
    },
    unlocks: {
      boards: ["classic_wood", "cream_minimal"],
      pieces: ["classic"],
      titles: ["New Challenger"]
    },
    selectedCosmetics: {
      board: "classic_wood",
      pieces: "classic"
    },
    achievements: {
      unlocked: [],
      claimed: []
    },
    matchHistory: [],
    settings: {
      botDelayMs: 280,
      showCoords: true,
      legalHints: true,
      autoQueen: false
    }
  };
}

function validateProfile(profile) {
  const base = createDefaultProfile(profile?.username || "Player");
  const merged = { ...base, ...profile };
  merged.username = String(merged.username || base.username).trim().slice(0, 24);
  merged.level = Math.max(1, nonNegativeInteger(merged.level, 1));
  merged.xp = nonNegativeInteger(merged.xp);
  merged.coins = nonNegativeInteger(merged.coins);
  merged.royalTokens = nonNegativeInteger(merged.royalTokens);
  merged.elo = { ...base.elo, ...(merged.elo || {}) };
  merged.elo.rating = Math.max(100, nonNegativeInteger(merged.elo.rating, 100));
  merged.elo.peak = Math.max(merged.elo.rating, nonNegativeInteger(merged.elo.peak, 100));
  merged.elo.botGames = nonNegativeInteger(merged.elo.botGames);
  merged.elo.lastChange = integer(merged.elo.lastChange);
  merged.stats = { ...base.stats, ...(merged.stats || {}) };
  for (const key of Object.keys(base.stats)) {
    merged.stats[key] = nonNegativeInteger(merged.stats[key]);
  }
  merged.botProgress = { ...base.botProgress, ...(merged.botProgress || {}) };
  merged.botProgress.defeatedBots = stringArray(merged.botProgress.defeatedBots);
  merged.botProgress.firstTimeRewardsClaimed = stringArray(merged.botProgress.firstTimeRewardsClaimed);
  merged.botProgress.botWinCounts =
    merged.botProgress.botWinCounts && typeof merged.botProgress.botWinCounts === "object" && !Array.isArray(merged.botProgress.botWinCounts)
      ? merged.botProgress.botWinCounts
      : {};
  for (const key of Object.keys(merged.botProgress.botWinCounts)) {
    merged.botProgress.botWinCounts[key] = nonNegativeInteger(merged.botProgress.botWinCounts[key]);
  }
  merged.unlocks = { ...base.unlocks, ...(merged.unlocks || {}) };
  merged.unlocks.boards = stringArray(merged.unlocks.boards, base.unlocks.boards);
  merged.unlocks.pieces = stringArray(merged.unlocks.pieces, base.unlocks.pieces);
  merged.unlocks.titles = stringArray(merged.unlocks.titles, base.unlocks.titles);
  merged.selectedCosmetics = { ...base.selectedCosmetics, ...(merged.selectedCosmetics || {}) };
  merged.achievements = { ...base.achievements, ...(merged.achievements || {}) };
  merged.achievements.unlocked = stringArray(merged.achievements.unlocked);
  merged.achievements.claimed = stringArray(merged.achievements.claimed);
  merged.matchHistory = Array.isArray(merged.matchHistory)
    ? merged.matchHistory.filter(item => item && typeof item === "object").slice(0, MAX_HISTORY) : [];
  merged.settings = { ...base.settings, ...(merged.settings || {}) };
  merged.settings.botDelayMs = Math.min(2000, nonNegativeInteger(merged.settings.botDelayMs, base.settings.botDelayMs));
  merged.settings.showCoords = typeof merged.settings.showCoords === "boolean" ? merged.settings.showCoords : base.settings.showCoords;
  merged.settings.legalHints = typeof merged.settings.legalHints === "boolean" ? merged.settings.legalHints : base.settings.legalHints;
  merged.settings.autoQueen = typeof merged.settings.autoQueen === "boolean" ? merged.settings.autoQueen : base.settings.autoQueen;
  if (!merged.unlocks.boards.includes(merged.selectedCosmetics.board)) {
    merged.selectedCosmetics.board = "classic_wood";
  }
  if (!merged.unlocks.pieces.includes(merged.selectedCosmetics.pieces)) {
    merged.selectedCosmetics.pieces = "classic";
  }
  if (!merged.unlocks.titles.includes(merged.title)) {
    merged.title = merged.unlocks.titles[0] || "New Challenger";
  }
  delete merged.passcodeHash;
  delete merged.passcodeSalt;
  return merged;
}

module.exports = {
  MAX_HISTORY,
  createDefaultProfile,
  validateProfile
};
