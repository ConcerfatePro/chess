(() => {
  "use strict";

  const S = window.ProfileStorage;
  const B = window.BotConfigs;
  const C = window.Cosmetics;
  const A = window.Achievements;

  function getXpNeededForNextLevel(level) {
    return 100 + level * 50;
  }

  function checkLevelUp(profile) {
    const levelsGained = [];
    let needed = getXpNeededForNextLevel(profile.level);
    while (profile.xp >= needed) {
      profile.xp -= needed;
      profile.level += 1;
      levelsGained.push(profile.level);
      applyLevelUnlocks(profile, profile.level);
      needed = getXpNeededForNextLevel(profile.level);
    }
    return levelsGained;
  }

  function applyLevelUnlocks(profile, level) {
    for (const row of C.LEVEL_UNLOCKS) {
      if (row.level !== level) continue;
      for (const boardId of row.boards || []) {
        if (!profile.unlocks.boards.includes(boardId)) profile.unlocks.boards.push(boardId);
      }
      for (const pieceId of row.pieces || []) {
        if (!profile.unlocks.pieces.includes(pieceId)) profile.unlocks.pieces.push(pieceId);
      }
      for (const title of row.titles || []) {
        if (!profile.unlocks.titles.includes(title)) profile.unlocks.titles.push(title);
      }
    }
  }

  // Auto-grant level / ELO ranked titles when the player qualifies.
  function evaluateTitleUnlocks(profile) {
    const unlocked = [];
    for (const title of Object.values(C.TITLES)) {
      if (title.unlockType !== "rank") continue;
      if (profile.unlocks.titles.includes(title.id)) continue;
      if (!C.meetsRequirements(title, profile).ok) continue;
      profile.unlocks.titles.push(title.id);
      unlocked.push({ type: "title", id: title.id, name: title.name });
    }
    return unlocked;
  }

  function applyBotFirstTimeUnlocks(profile, bot) {
    const unlocks = [];
    const ft = bot.firstTimeUnlocks || {};
    for (const boardId of ft.boards || []) {
      if (!profile.unlocks.boards.includes(boardId)) {
        profile.unlocks.boards.push(boardId);
        unlocks.push({ type: "board", id: boardId, name: C.BOARDS[boardId]?.name || boardId });
      }
    }
    for (const pieceId of ft.pieces || []) {
      if (!profile.unlocks.pieces.includes(pieceId)) {
        profile.unlocks.pieces.push(pieceId);
        unlocks.push({ type: "piece", id: pieceId, name: C.PIECES[pieceId]?.name || pieceId });
      }
    }
    for (const title of ft.titles || []) {
      if (!profile.unlocks.titles.includes(title)) {
        profile.unlocks.titles.push(title);
        unlocks.push({ type: "title", id: title, name: title });
      }
    }
    return unlocks;
  }

  function canAffordEntryFee(profile, bot) {
    return (profile.coins || 0) >= (bot.entryFee || 0);
  }

  function deductEntryFee(profile, bot) {
    const fee = bot.entryFee || 0;
    profile.coins = Math.max(0, profile.coins - fee);
    return fee;
  }

  function addCoins(profile, amount) {
    profile.coins = Math.max(0, profile.coins + Math.max(0, Math.floor(amount)));
  }

  function spendCoins(profile, amount) {
    const cost = Math.floor(amount);
    if (profile.coins < cost) return false;
    profile.coins -= cost;
    return true;
  }

  function addRoyalTokens(profile, amount) {
    profile.royalTokens = Math.max(0, profile.royalTokens + Math.max(0, Math.floor(amount)));
  }

  function spendRoyalTokens(profile, amount) {
    const cost = Math.floor(amount);
    if (profile.royalTokens < cost) return false;
    profile.royalTokens -= cost;
    return true;
  }

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  // How much each successive win against the SAME bot is worth (XP).
  // 1st repeat 0.55, then 0.33, 0.2, 0.12 ... floored.
  function repeatXpFactor(winCount) {
    if (winCount <= 0) return 1;
    return clamp(Math.pow(0.6, winCount), 0.1, 1);
  }

  function getRepeatReward(bot, winCount) {
    const mult = bot.repeatRewardMultiplier ?? 0.4;
    const base = bot.rewardCoins || 0;
    if (winCount <= 0) return base;
    return Math.floor(base * mult);
  }

  // Central reward calculator. Rewards scale with the skill gap (you earn
  // little for beating opponents you heavily outrank) and decay for repeat
  // wins against the same bot, so grinding a weak bot is not profitable.
  function calculateMatchReward(profile, bot, result, matchData) {
    const firstTime = B.isFirstTimeWin(profile, bot.id) && result === "win";
    const winCount = B.getBotWinCount(profile, bot.id);
    const entryFee = matchData.entryFeePaid || 0;

    const playerElo = window.Elo.normalizeElo(profile.elo).rating;
    const expected = window.Elo.expectedScore(playerElo, window.Elo.getBotElo(bot.id));
    const challenge = window.Elo.challengeMultiplier(expected); // 0.1 .. 1.35
    const overqualified = expected >= window.Elo.NO_GAIN_EXPECTED;

    let coins = 0;
    let tokens = 0;
    let xp = 0;
    let entryRefund = 0;
    let lowChallenge = false;

    if (result === "win") {
      if (firstTime) {
        // First-clear is a milestone: full coins/tokens, lightly skill-gated XP.
        coins = bot.rewardCoins || 0;
        tokens = bot.firstTimeRewardTokens || 0;
        xp = Math.round((bot.xpReward || 0) * clamp(challenge, 0.5, 1.35));
      } else {
        const baseCoins = (bot.id === "checkmate_engine" && bot.repeatRewardCoins)
          ? bot.repeatRewardCoins
          : getRepeatReward(bot, winCount);
        // Coins shrink further when you massively outrank the bot.
        const coinSkill = clamp(1.15 - expected, 0.15, 1);
        coins = Math.max(overqualified ? 0 : 1, Math.round(baseCoins * coinSkill));
        xp = Math.round((bot.xpReward || 0) * challenge * repeatXpFactor(winCount));
        lowChallenge = overqualified;
      }
      xp = Math.max(xp, overqualified ? 0 : 1);
    } else if (result === "draw") {
      // Drawing a weak bot is near-worthless; drawing a strong one still pays.
      xp = Math.round((bot.xpDraw || Math.floor((bot.xpReward || 0) * 0.45)) * challenge);
      entryRefund = Math.floor(entryFee * (bot.drawRefundPercent || 0));
      coins = Math.round((bot.rewardCoins || 0) * 0.1 * challenge);
      lowChallenge = overqualified;
    } else {
      // Losing to a weak bot gives almost no consolation XP.
      xp = Math.round((bot.xpLoss || Math.floor((bot.xpReward || 0) * 0.2)) * clamp(challenge, 0.3, 1.2));
    }

    return {
      coins: Math.max(0, coins),
      tokens,
      xp: Math.max(0, xp),
      entryRefund,
      firstTime,
      entryFee,
      lowChallenge,
      challenge,
      expectedPercent: Math.round(expected * 100)
    };
  }

  // Lightweight preview for the ladder UI (does not mutate the profile).
  function previewRewards(profile, bot) {
    const win = calculateMatchReward(profile, bot, "win", { entryFeePaid: bot.entryFee || 0 });
    return {
      winCoins: win.coins,
      winXp: win.xp,
      winTokens: win.tokens,
      firstTime: win.firstTime,
      lowChallenge: win.lowChallenge,
      winPercent: window.Elo.winProbabilityPercent(profile, bot)
    };
  }

  function applyMatchResult(profile, bot, result, matchData) {
    const rewards = calculateMatchReward(profile, bot, result, matchData);
    const cosmeticUnlocks = [];
    const achievementUnlocks = [];
    let botDefeated = false;

    if (result === "win") {
      profile.stats.wins += 1;
      profile.stats.botWins += 1;
      profile.stats.currentWinStreak += 1;
      profile.stats.bestWinStreak = Math.max(profile.stats.bestWinStreak, profile.stats.currentWinStreak);

      const firstTime = B.isFirstTimeWin(profile, bot.id);
      profile.botProgress.botWinCounts[bot.id] = (profile.botProgress.botWinCounts[bot.id] || 0) + 1;

      if (!profile.botProgress.defeatedBots.includes(bot.id)) {
        profile.botProgress.defeatedBots.push(bot.id);
        botDefeated = true;
        profile.botProgress.highestBotDefeated = bot.id;
      }

      if (firstTime) {
        profile.botProgress.firstTimeRewardsClaimed.push(bot.id);
        cosmeticUnlocks.push(...applyBotFirstTimeUnlocks(profile, bot));
      }

      addCoins(profile, rewards.coins);
      addRoyalTokens(profile, rewards.tokens);
    } else if (result === "draw") {
      profile.stats.draws += 1;
      profile.stats.currentWinStreak = 0;
      addCoins(profile, rewards.coins + rewards.entryRefund);
    } else {
      profile.stats.losses += 1;
      profile.stats.currentWinStreak = 0;
    }

    profile.stats.totalGames += 1;
    profile.xp += rewards.xp;
    const levelsGained = checkLevelUp(profile);

    const eloResult = window.Elo.applyMatchElo(profile, bot.id, result);

    cosmeticUnlocks.push(...evaluateTitleUnlocks(profile));

    const matchRecord = {
      date: new Date().toISOString(),
      opponentType: "bot",
      botId: bot.id,
      botName: bot.name,
      result,
      moves: matchData.moves || 0,
      coinsGained: result === "win" ? rewards.coins : (result === "draw" ? rewards.coins + rewards.entryRefund : 0),
      entryFee: rewards.entryFee,
      tokensGained: rewards.tokens,
      xpGained: rewards.xp,
      eloChange: eloResult.change,
      eloAfter: eloResult.newRating,
      opponentElo: eloResult.opponentElo,
      board: profile.selectedCosmetics.board,
      pieces: profile.selectedCosmetics.pieces
    };

    profile.matchHistory.unshift(matchRecord);
    profile.matchHistory = profile.matchHistory.slice(0, S.MAX_HISTORY);
    profile.lastPlayedAt = matchRecord.date;

    const ach = A.evaluateAchievements(profile, {
      result,
      opponentType: "bot",
      botId: bot.id,
      opponentElo: eloResult.opponentElo,
      expectedPercent: rewards.expectedPercent,
      qualified: !rewards.lowChallenge,
      upsetWin: result === "win" && rewards.expectedPercent <= 30,
      keptQueen: matchData.keptQueen,
      fullMoves: matchData.fullMoves,
      comebackWin: matchData.comebackWin
    });
    achievementUnlocks.push(...ach);

    return {
      rewards,
      levelsGained,
      cosmeticUnlocks,
      achievementUnlocks,
      botDefeated,
      eloResult,
      matchRecord
    };
  }

  function purchaseCosmetic(profile, item, type) {
    if (type === "board") {
      if (profile.unlocks.boards.includes(item.id)) return { ok: false, reason: "already_owned" };
      if (item.unlockType !== "shop") return { ok: false, reason: "not_for_sale" };
      const req = C.meetsRequirements(item, profile);
      if (!req.ok) return { ok: false, reason: "requirement", reasons: req.reasons };
      if (item.currency === "coins" && !spendCoins(profile, item.price)) return { ok: false, reason: "insufficient" };
      if (item.currency === "royalTokens" && !spendRoyalTokens(profile, item.price)) return { ok: false, reason: "insufficient" };
      profile.unlocks.boards.push(item.id);
      return { ok: true };
    }
    if (type === "piece") {
      if (profile.unlocks.pieces.includes(item.id)) return { ok: false, reason: "already_owned" };
      if (item.unlockType !== "shop") return { ok: false, reason: "not_for_sale" };
      const req = C.meetsRequirements(item, profile);
      if (!req.ok) return { ok: false, reason: "requirement", reasons: req.reasons };
      if (item.currency === "coins" && !spendCoins(profile, item.price)) return { ok: false, reason: "insufficient" };
      if (item.currency === "royalTokens" && !spendRoyalTokens(profile, item.price)) return { ok: false, reason: "insufficient" };
      profile.unlocks.pieces.push(item.id);
      return { ok: true };
    }
    return { ok: false, reason: "invalid" };
  }

  window.Economy = {
    getXpNeededForNextLevel,
    checkLevelUp,
    applyLevelUnlocks,
    canAffordEntryFee,
    deductEntryFee,
    addCoins,
    spendCoins,
    addRoyalTokens,
    spendRoyalTokens,
    getRepeatReward,
    repeatXpFactor,
    calculateMatchReward,
    previewRewards,
    applyMatchResult,
    evaluateTitleUnlocks,
    purchaseCosmetic
  };
})();
