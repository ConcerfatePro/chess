(() => {
  "use strict";

  const STARTING_ELO = 100;

  const BOT_ELO = {
    pawn_rookie: 620,
    castle_kid: 780,
    knight_grinder: 940,
    bishop_phantom: 1120,
    rook_warden: 1320,
    queens_shadow: 1580,
    checkmate_engine: 1920
  };

  const ELO_BANDS = [
    { min: 0, name: "Novice", nextAt: 900 },
    { min: 900, name: "Club Player", nextAt: 1100 },
    { min: 1100, name: "Strong Amateur", nextAt: 1300 },
    { min: 1300, name: "Expert", nextAt: 1500 },
    { min: 1500, name: "Master", nextAt: 1700 },
    { min: 1700, name: "Elite", nextAt: 1900 },
    { min: 1900, name: "Grandmaster", nextAt: null }
  ];

  function defaultElo() {
    return {
      rating: STARTING_ELO,
      peak: STARTING_ELO,
      botGames: 0,
      lastChange: 0
    };
  }

  function normalizeElo(elo) {
    const base = defaultElo();
    if (!elo || typeof elo !== "object") return base;
    return {
      rating: Math.max(100, Math.floor(Number(elo.rating) || STARTING_ELO)),
      peak: Math.max(100, Math.floor(Number(elo.peak) || STARTING_ELO)),
      botGames: Math.max(0, Math.floor(Number(elo.botGames) || 0)),
      lastChange: Math.floor(Number(elo.lastChange) || 0)
    };
  }

  // Above this expected score, a win is considered "expected" and grants no
  // rating — you cannot farm ELO off opponents you are supposed to beat.
  const NO_GAIN_EXPECTED = 0.85;

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  function getBotElo(botId) {
    return BOT_ELO[botId] ?? 1000;
  }

  function getKFactor(rating, botGames) {
    if (botGames < 10) return 40;     // provisional: settle fast
    if (rating < 1000) return 28;
    if (rating < 1400) return 20;
    if (rating < 1800) return 14;
    return 10;                        // established players move slowly
  }

  function scoreFromResult(result) {
    if (result === "win") return 1;
    if (result === "draw") return 0.5;
    return 0;
  }

  function expectedScore(playerElo, opponentElo) {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  function getExpectedScore(profile, botOrId) {
    const rating = normalizeElo(profile.elo).rating;
    const botId = typeof botOrId === "string" ? botOrId : botOrId?.id;
    return expectedScore(rating, getBotElo(botId));
  }

  function winProbabilityPercent(profile, botOrId) {
    return Math.round(getExpectedScore(profile, botOrId) * 100);
  }

  // Reward scaling based on how challenging the opponent is for this player.
  // expected≈1 (you heavily outrank them) -> tiny multiplier.
  // expected≈0 (they outrank you) -> bonus multiplier.
  function challengeMultiplier(expected) {
    return clamp(1.35 - expected * 1.3, 0.1, 1.35);
  }

  function calculateChange(playerElo, opponentElo, result, botGames) {
    const expected = expectedScore(playerElo, opponentElo);
    const actual = scoreFromResult(result);
    const k = getKFactor(playerElo, botGames);
    let change = Math.round(k * (actual - expected));

    // Realism guards:
    if (result === "win") {
      // No rating for beating someone you were expected to beat.
      if (expected >= NO_GAIN_EXPECTED) change = 0;
      // A win can never lose you rating.
      change = Math.max(change, 0);
    } else if (result === "draw") {
      // Drawing a much weaker opponent must cost rating.
      if (expected > 0.5) change = Math.min(change, -1);
    } else {
      // A loss always stings at least a little.
      change = Math.min(change, -1);
    }
    return change;
  }

  function applyMatchElo(profile, botId, result) {
    const elo = normalizeElo(profile.elo);
    const opponentElo = getBotElo(botId);
    const expected = expectedScore(elo.rating, opponentElo);
    const change = calculateChange(elo.rating, opponentElo, result, elo.botGames);
    elo.rating = Math.max(100, elo.rating + change);
    elo.peak = Math.max(elo.peak, elo.rating);
    elo.lastChange = change;
    elo.botGames += 1;
    profile.elo = elo;
    return {
      change,
      newRating: elo.rating,
      peak: elo.peak,
      opponentElo,
      expected: Math.round(expected * 100),
      overqualified: result === "win" && expected >= NO_GAIN_EXPECTED,
      challengeMult: challengeMultiplier(expected)
    };
  }

  function getTitle(rating) {
    let band = ELO_BANDS[0];
    for (const b of ELO_BANDS) {
      if (rating >= b.min) band = b;
    }
    const nextAt = band.nextAt;
    let progressPct = 100;
    if (nextAt) {
      const prevMin = band.min;
      progressPct = Math.min(100, Math.max(0, Math.round(((rating - prevMin) / (nextAt - prevMin)) * 100)));
    }
    return {
      name: band.name,
      nextAt,
      progressPct,
      isMax: !nextAt
    };
  }

  function formatChange(change) {
    if (change > 0) return `+${change}`;
    if (change < 0) return String(change);
    return "±0";
  }

  function getLadderProgress(profile, bots) {
    const defeated = profile.botProgress?.defeatedBots || [];
    const steps = bots.map(bot => ({
      id: bot.id,
      name: bot.name,
      tier: bot.tier,
      elo: getBotElo(bot.id),
      defeated: defeated.includes(bot.id),
      unlocked: window.BotConfigs.isBotUnlocked(profile, bot)
    }));

    const nextStep = steps.find(s => s.unlocked && !s.defeated) || steps.find(s => !s.unlocked);

    return {
      steps,
      defeatedCount: defeated.length,
      totalBots: bots.length,
      nextStep
    };
  }

  function getOverallProgress(profile, bots, achievementCount) {
    const ladder = getLadderProgress(profile, bots);
    const achTotal = achievementCount || 10;
    const achDone = profile.achievements?.unlocked?.length || 0;
    const boardsOwned = profile.unlocks?.boards?.length || 0;
    const piecesOwned = profile.unlocks?.pieces?.length || 0;
    const level = profile.level || 1;
    const xpNeed = window.Economy.getXpNeededForNextLevel(level);
    const xpPct = Math.min(100, Math.round((profile.xp / xpNeed) * 100));

    const ladderPct = Math.round((ladder.defeatedCount / ladder.totalBots) * 100);
    const achPct = Math.round((achDone / achTotal) * 100);

    return {
      ladder,
      achDone,
      achTotal,
      achPct,
      ladderPct,
      boardsOwned,
      piecesOwned,
      level,
      xpPct,
      xpNeed,
      xp: profile.xp
    };
  }

  window.Elo = {
    STARTING_ELO,
    BOT_ELO,
    NO_GAIN_EXPECTED,
    defaultElo,
    normalizeElo,
    getBotElo,
    applyMatchElo,
    getTitle,
    formatChange,
    getLadderProgress,
    getOverallProgress,
    calculateChange,
    expectedScore,
    getExpectedScore,
    winProbabilityPercent,
    challengeMultiplier
  };
})();
