(() => {
  "use strict";

  const BOTS = [
    {
      id: "pawn_rookie",
      name: "Pawn Rookie",
      tier: "Beginner",
      difficulty: 1,
      description: "A new player who barely knows what they are doing.",
      personality: "Random and forgetful — misses obvious threats.",
      entryFee: 0,
      rewardCoins: 15,
      repeatRewardMultiplier: 0.45,
      rewardTokens: 0,
      firstTimeRewardTokens: 0,
      xpReward: 25,
      xpLoss: 8,
      xpDraw: 12,
      unlockRequirement: { type: "always" },
      firstTimeUnlocks: { boards: [], pieces: [], titles: [] },
      ai: {
        depth: 1,
        qDepth: 0,
        timeMs: 200,
        randomness: 0.62,
        blunderChance: 0.35,
        maxNodes: 8000,
        style: "chaotic"
      }
    },
    {
      id: "castle_kid",
      name: "Castle Kid",
      tier: "Casual",
      difficulty: 2,
      description: "Understands basic tactics but still blunders.",
      personality: "Likes captures and checks, still learning development.",
      entryFee: 0,
      rewardCoins: 35,
      repeatRewardMultiplier: 0.45,
      rewardTokens: 0,
      firstTimeRewardTokens: 0,
      xpReward: 40,
      xpLoss: 10,
      xpDraw: 18,
      unlockRequirement: { type: "botDefeatedOrLevel", botId: "pawn_rookie", level: 2 },
      firstTimeUnlocks: { boards: [], pieces: [], titles: [] },
      ai: {
        depth: 2,
        qDepth: 1,
        timeMs: 450,
        randomness: 0.38,
        blunderChance: 0.22,
        maxNodes: 22000,
        style: "aggressive"
      }
    },
    {
      id: "knight_grinder",
      name: "Knight Grinder",
      tier: "Club",
      difficulty: 3,
      description: "Club-level grinder who values material and pressure.",
      personality: "Aggressive — loves forks and center fights.",
      entryFee: 10,
      rewardCoins: 75,
      repeatRewardMultiplier: 0.4,
      rewardTokens: 0,
      firstTimeRewardTokens: 0,
      xpReward: 65,
      xpLoss: 15,
      xpDraw: 28,
      drawRefundPercent: 0.5,
      unlockRequirement: { type: "botDefeatedOrLevel", botId: "castle_kid", level: 4 },
      firstTimeUnlocks: { boards: ["midnight_marble"], pieces: [], titles: [] },
      ai: {
        depth: 3,
        qDepth: 2,
        timeMs: 900,
        randomness: 0.22,
        blunderChance: 0.12,
        maxNodes: 70000,
        style: "aggressive"
      }
    },
    {
      id: "bishop_phantom",
      name: "Bishop Phantom",
      tier: "Advanced",
      difficulty: 4,
      description: "Quiet positional bot that punishes weak moves.",
      personality: "Patient — improves pieces and waits for mistakes.",
      entryFee: 25,
      rewardCoins: 140,
      repeatRewardMultiplier: 0.4,
      rewardTokens: 0,
      firstTimeRewardTokens: 1,
      xpReward: 90,
      xpLoss: 18,
      xpDraw: 35,
      drawRefundPercent: 0.5,
      unlockRequirement: { type: "botDefeatedOrLevel", botId: "knight_grinder", level: 6 },
      firstTimeUnlocks: { boards: ["midnight_marble"], pieces: [], titles: [] },
      ai: {
        depth: 4,
        qDepth: 3,
        timeMs: 1600,
        randomness: 0.1,
        blunderChance: 0.05,
        maxNodes: 180000,
        style: "positional"
      }
    },
    {
      id: "rook_warden",
      name: "Rook Warden",
      tier: "Expert",
      difficulty: 5,
      description: "Defensive expert that slowly crushes bad positions.",
      personality: "Solid and punishing — low mistake rate.",
      entryFee: 60,
      rewardCoins: 225,
      repeatRewardMultiplier: 0.38,
      rewardTokens: 0,
      firstTimeRewardTokens: 1,
      xpReward: 125,
      xpLoss: 22,
      xpDraw: 45,
      drawRefundPercent: 0.5,
      unlockRequirement: { type: "botDefeatedOrLevel", botId: "bishop_phantom", level: 10 },
      firstTimeUnlocks: { boards: ["royal_blue"], pieces: ["medieval"], titles: [] },
      ai: {
        depth: 5,
        qDepth: 4,
        timeMs: 2600,
        randomness: 0.04,
        blunderChance: 0.015,
        maxNodes: 420000,
        style: "defensive"
      }
    },
    {
      id: "queens_shadow",
      name: "Queen's Shadow",
      tier: "Master",
      difficulty: 6,
      description: "Near-master precision — intimidating and relentless.",
      personality: "Calculates deeply and punishes hanging pieces.",
      entryFee: 125,
      rewardCoins: 350,
      repeatRewardMultiplier: 0.35,
      rewardTokens: 2,
      firstTimeRewardTokens: 2,
      xpReward: 175,
      xpLoss: 28,
      xpDraw: 55,
      drawRefundPercent: 0.5,
      unlockRequirement: { type: "botDefeatedOrLevel", botId: "rook_warden", level: 15 },
      firstTimeUnlocks: { boards: ["gold_luxury"], pieces: ["shadow"], titles: [] },
      ai: {
        depth: 6,
        qDepth: 5,
        timeMs: 4000,
        randomness: 0.01,
        blunderChance: 0.004,
        maxNodes: 850000,
        style: "balanced"
      }
    },
    {
      id: "checkmate_engine",
      name: "The Checkmate Engine",
      tier: "Impossible",
      difficulty: 7,
      description: "The final boss — designed to feel nearly unbeatable.",
      personality: "No mercy. No blunders. Maximum calculation.",
      entryFee: 300,
      rewardCoins: 1000,
      repeatRewardCoins: 300,
      repeatRewardMultiplier: 0.35,
      rewardTokens: 0,
      firstTimeRewardTokens: 5,
      xpReward: 300,
      xpLoss: 35,
      xpDraw: 70,
      drawRefundPercent: 0.5,
      unlockRequirement: { type: "botDefeatedOrLevel", botId: "queens_shadow", level: 20 },
      firstTimeUnlocks: {
        boards: ["impossible_board"],
        pieces: ["impossible_set"],
        titles: ["Engine Breaker"]
      },
      ai: {
        depth: 7,
        qDepth: 6,
        timeMs: 6000,
        randomness: 0,
        blunderChance: 0,
        maxNodes: 1400000,
        style: "balanced"
      }
    }
  ];

  function getBot(id) {
    return BOTS.find(b => b.id === id) || null;
  }

  function getAiSpec(bot) {
    if (!bot) return null;
    return { label: bot.name, ...bot.ai };
  }

  function isBotUnlocked(profile, bot) {
    if (!profile || !bot) return false;
    const req = bot.unlockRequirement;
    if (req.type === "always") return true;
    if (req.type === "botDefeatedOrLevel") {
      const defeated = profile.botProgress.defeatedBots.includes(req.botId);
      const levelOk = profile.level >= (req.level || 1);
      return defeated || levelOk;
    }
    return false;
  }

  function isBotDefeated(profile, botId) {
    return profile?.botProgress?.defeatedBots?.includes(botId) || false;
  }

  function getBotWinCount(profile, botId) {
    return profile?.botProgress?.botWinCounts?.[botId] || 0;
  }

  function isFirstTimeWin(profile, botId) {
    return !profile?.botProgress?.firstTimeRewardsClaimed?.includes(botId);
  }

  window.BotConfigs = {
    BOTS,
    getBot,
    getAiSpec,
    isBotUnlocked,
    isBotDefeated,
    getBotWinCount,
    isFirstTimeWin
  };
})();
