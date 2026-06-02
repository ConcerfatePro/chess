(() => {
  "use strict";

  const PROFILES_KEY = "chessGameProfiles";
  const ACTIVE_KEY = "chessGameActiveProfile";
  const SESSION_KEY = "chessGameSessionToken";
  const MAX_HISTORY = 40;

  let useServer = false;
  let serverReady = false;
  let activeProfileCache = null;
  let sessionToken = null;

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

  function randomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  async function hashPasscode(passcode, salt) {
    const data = new TextEncoder().encode(`${salt}:${passcode}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  }

  function createDefaultProfile(username) {
    const ts = nowIso();
    return {
      username,
      passcodeHash: "",
      passcodeSalt: "",
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
        ? merged.botProgress.botWinCounts : {};
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
    return merged;
  }

  function setSession(token) {
    sessionToken = token || null;
    if (token) sessionStorage.setItem(SESSION_KEY, token);
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function loadSessionToken() {
    sessionToken = sessionStorage.getItem(SESSION_KEY);
    return sessionToken;
  }

  async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
  }

  async function init() {
    loadSessionToken();
    try {
      const status = await fetch("/api/storage/status");
      if (status.ok) {
        const data = await status.json();
        if (data.backend === "sqlite") {
          useServer = true;
          serverReady = true;
          await maybeMigrateLocalToServer();
          if (sessionToken) {
            try {
              const me = await apiRequest("/api/profiles/me");
              activeProfileCache = validateProfile(me.profile);
              setActiveUsername(activeProfileCache.username);
            } catch {
              setSession(null);
              activeProfileCache = null;
            }
          }
          return { useServer: true };
        }
      }
    } catch {
      useServer = false;
    }

    const username = getActiveUsername();
    if (username) {
      const profiles = readProfilesRaw();
      activeProfileCache = profiles[username] ? validateProfile(profiles[username]) : null;
    }
    return { useServer: false };
  }

  async function maybeMigrateLocalToServer() {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return;
    try {
      const map = JSON.parse(raw);
      if (!map || !Object.keys(map).length) return;
      const result = await apiRequest("/api/profiles/migrate-local", {
        method: "POST",
        body: JSON.stringify({ profiles: map })
      });
      if (result.imported > 0) {
        localStorage.removeItem(PROFILES_KEY);
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch {
      /* keep local data if migration fails */
    }
  }

  function readProfilesRaw() {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeProfilesRaw(map) {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(map));
  }

  function getAllProfiles() {
    const map = readProfilesRaw();
    const out = {};
    for (const [key, value] of Object.entries(map)) {
      out[key] = validateProfile(value);
    }
    return out;
  }

  async function hasAnyProfiles() {
    if (useServer) {
      try {
        const data = await fetch("/api/storage/status").then(r => r.json());
        return (data.profileCount || 0) > 0;
      } catch {
        return false;
      }
    }
    return Object.keys(getAllProfiles()).length > 0;
  }

  function getActiveUsername() {
    return activeProfileCache?.username || localStorage.getItem(ACTIVE_KEY) || null;
  }

  function setActiveUsername(username) {
    if (username) localStorage.setItem(ACTIVE_KEY, username);
    else localStorage.removeItem(ACTIVE_KEY);
  }

  function getActiveProfile() {
    return activeProfileCache ? validateProfile({ ...activeProfileCache }) : null;
  }

  async function saveProfile(profile) {
    const validated = validateProfile(profile);
    activeProfileCache = validated;
    setActiveUsername(validated.username);

    if (useServer && sessionToken) {
      const data = await apiRequest("/api/profiles/me", {
        method: "PUT",
        body: JSON.stringify({ profile: validated })
      });
      activeProfileCache = validateProfile(data.profile);
      return activeProfileCache;
    }

    const profiles = getAllProfiles();
    profiles[validated.username] = validated;
    writeProfilesRaw(profiles);
    return validated;
  }

  async function updateProfile(updater) {
    const current = getActiveProfile();
    if (!current) return null;
    const next = typeof updater === "function" ? updater(validateProfile({ ...current })) : updater;
    return saveProfile(next);
  }

  async function createProfile(username, passcode) {
    const name = String(username || "").trim();
    if (name.length < 2) throw new Error("Username must be at least 2 characters.");
    if (name.length > 24) throw new Error("Username must be at most 24 characters.");
    if (!passcode || passcode.length < 4) throw new Error("Passcode must be at least 4 characters.");

    if (useServer) {
      const data = await apiRequest("/api/profiles/register", {
        method: "POST",
        body: JSON.stringify({ username: name, passcode })
      });
      setSession(data.session.token);
      activeProfileCache = validateProfile(data.profile);
      setActiveUsername(activeProfileCache.username);
      return activeProfileCache;
    }

    const profiles = getAllProfiles();
    if (profiles[name]) throw new Error("That username already exists.");

    const profile = createDefaultProfile(name);
    profile.passcodeSalt = randomSalt();
    profile.passcodeHash = await hashPasscode(passcode, profile.passcodeSalt);
    profiles[name] = profile;
    writeProfilesRaw(profiles);
    activeProfileCache = profile;
    setActiveUsername(name);
    return profile;
  }

  async function loginProfile(username, passcode) {
    const name = String(username || "").trim();

    if (useServer) {
      const data = await apiRequest("/api/profiles/login", {
        method: "POST",
        body: JSON.stringify({ username: name, passcode })
      });
      setSession(data.session.token);
      activeProfileCache = validateProfile(data.profile);
      setActiveUsername(activeProfileCache.username);
      return activeProfileCache;
    }

    const profiles = getAllProfiles();
    const profile = profiles[name];
    if (!profile) throw new Error("Profile not found.");
    const hash = await hashPasscode(passcode, profile.passcodeSalt);
    if (hash !== profile.passcodeHash) throw new Error("Incorrect passcode.");
    profile.lastPlayedAt = nowIso();
    await saveProfile(profile);
    return profile;
  }

  async function changePasscode(username, oldPasscode, newPasscode) {
    if (!newPasscode || newPasscode.length < 4) {
      throw new Error("New passcode must be at least 4 characters.");
    }

    if (useServer) {
      const data = await apiRequest("/api/profiles/change-passcode", {
        method: "POST",
        body: JSON.stringify({ oldPasscode, newPasscode })
      });
      activeProfileCache = validateProfile(data.profile);
      return activeProfileCache;
    }

    const profiles = getAllProfiles();
    const profile = profiles[username];
    if (!profile) throw new Error("Profile not found.");
    const oldHash = await hashPasscode(oldPasscode, profile.passcodeSalt);
    if (oldHash !== profile.passcodeHash) throw new Error("Old passcode is incorrect.");
    profile.passcodeSalt = randomSalt();
    profile.passcodeHash = await hashPasscode(newPasscode, profile.passcodeSalt);
    return saveProfile(profile);
  }

  async function deleteProfile(username, passcode) {
    if (useServer) {
      await apiRequest("/api/profiles/me", {
        method: "DELETE",
        body: JSON.stringify({ passcode })
      });
      setSession(null);
      activeProfileCache = null;
      setActiveUsername(null);
      return;
    }

    const profiles = getAllProfiles();
    const profile = profiles[username];
    if (!profile) throw new Error("Profile not found.");
    const hash = await hashPasscode(passcode, profile.passcodeSalt);
    if (hash !== profile.passcodeHash) throw new Error("Incorrect passcode.");
    delete profiles[username];
    writeProfilesRaw(profiles);
    if (getActiveUsername() === username) {
      activeProfileCache = null;
      setActiveUsername(null);
    }
  }

  async function logoutProfile() {
    if (useServer && sessionToken) {
      try {
        await apiRequest("/api/profiles/logout", { method: "POST", body: "{}" });
      } catch {
        /* ignore */
      }
    }
    setSession(null);
    activeProfileCache = null;
    setActiveUsername(null);
  }

  function exportProfile(username) {
    const profile = useServer
      ? (activeProfileCache?.username === username ? activeProfileCache : null)
      : getAllProfiles()[username];
    if (!profile) throw new Error("Profile not found.");
    const exportData = { ...profile };
    delete exportData.passcodeHash;
    delete exportData.passcodeSalt;
    return JSON.stringify({ version: 1, profile: exportData }, null, 2);
  }

  async function importProfile(jsonText, passcode) {
    const parsed = JSON.parse(jsonText);
    if (!parsed?.profile?.username) throw new Error("Invalid save file.");
    if (!passcode || passcode.length < 4) throw new Error("Set a passcode for the imported profile.");

    const name = String(parsed.profile.username).trim();
    if (name.length < 2) throw new Error("Username must be at least 2 characters.");
    if (name.length > 24) throw new Error("Username must be at most 24 characters.");

    if (useServer) {
      const data = await apiRequest("/api/profiles/register", {
        method: "POST",
        body: JSON.stringify({ username: name, passcode })
      });
      setSession(data.session.token);
      activeProfileCache = validateProfile(data.profile);
      setActiveUsername(activeProfileCache.username);
      const profile = validateProfile(parsed.profile);
      return saveProfile(profile);
    }

    const profiles = getAllProfiles();
    if (profiles[name]) throw new Error("Username already exists. Delete it first or use another name.");

    const profile = validateProfile(parsed.profile);
    profile.passcodeSalt = randomSalt();
    profile.passcodeHash = await hashPasscode(passcode, profile.passcodeSalt);
    profiles[name] = profile;
    writeProfilesRaw(profiles);
    activeProfileCache = profile;
    setActiveUsername(name);
    return profile;
  }

  function rowsFromProfile(p) {
    return {
      username: p.username,
      rating: p.elo.rating,
      peak: p.elo.peak,
      level: p.level,
      title: p.title,
      wins: p.stats.wins,
      losses: p.stats.losses,
      draws: p.stats.draws,
      botWins: p.stats.botWins,
      bestWinStreak: p.stats.bestWinStreak,
      lastPlayedAt: p.lastPlayedAt
    };
  }

  async function getLeaderboard(limit = 100) {
    if (useServer) {
      try {
        const data = await fetch("/api/leaderboard").then(r => r.json());
        return Array.isArray(data.leaderboard) ? data.leaderboard.slice(0, limit) : [];
      } catch {
        return [];
      }
    }
    const profiles = getAllProfiles();
    const list = Object.values(profiles).map(rowsFromProfile);
    list.sort((a, b) =>
      b.rating - a.rating || b.peak - a.peak || b.level - a.level || b.wins - a.wins);
    return list.slice(0, limit);
  }

  function isUsingServer() {
    return useServer;
  }

  window.ProfileStorage = {
    PROFILES_KEY,
    ACTIVE_KEY,
    SESSION_KEY,
    MAX_HISTORY,
    init,
    isUsingServer,
    hasAnyProfiles,
    createDefaultProfile,
    validateProfile,
    getAllProfiles,
    getActiveProfile,
    saveProfile,
    updateProfile,
    createProfile,
    loginProfile,
    changePasscode,
    deleteProfile,
    logoutProfile,
    exportProfile,
    importProfile,
    getActiveUsername,
    setActiveUsername,
    getLeaderboard,
    hashPasscode
  };
})();
