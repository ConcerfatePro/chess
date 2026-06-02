(() => {
  "use strict";

  function peakElo(profile) {
    return profile?.elo?.peak || profile?.elo?.rating || 0;
  }

  const ACHIEVEMENTS = [
    {
      id: "first_win",
      name: "First Win",
      description: "Win any bot match.",
      category: "Milestones",
      rewardCoins: 50,
      rewardTokens: 0,
      check(profile, match) {
        return match.result === "win" && match.opponentType === "bot";
      }
    },
    {
      id: "beat_3_bots",
      name: "Ladder Climber",
      description: "Defeat 3 unique ladder bots.",
      category: "Ladder",
      rewardCoins: 100,
      rewardTokens: 0,
      check(profile) {
        return (profile.botProgress.defeatedBots?.length || 0) >= 3;
      }
    },
    {
      id: "beat_advanced",
      name: "Phantom Slayer",
      description: "Defeat Bishop Phantom.",
      category: "Ladder",
      rewardCoins: 0,
      rewardTokens: 1,
      check(profile) {
        return profile.botProgress.defeatedBots.includes("bishop_phantom");
      }
    },
    {
      id: "beat_master",
      name: "Shadow Hunter",
      description: "Defeat Queen's Shadow.",
      category: "Ladder",
      rewardCoins: 0,
      rewardTokens: 3,
      check(profile) {
        return profile.botProgress.defeatedBots.includes("queens_shadow");
      }
    },
    {
      id: "beat_impossible",
      name: "Engine Breaker",
      description: "Defeat The Checkmate Engine.",
      category: "Ladder",
      rewardCoins: 0,
      rewardTokens: 5,
      unlocks: { boards: ["impossible_board"], pieces: ["impossible_set"], titles: ["Engine Breaker"] },
      check(profile) {
        return profile.botProgress.defeatedBots.includes("checkmate_engine");
      }
    },
    {
      id: "giant_slayer",
      name: "Giant Slayer",
      description: "Beat a bot you had under a 30% chance to beat.",
      category: "Skill",
      rewardCoins: 200,
      rewardTokens: 1,
      check(profile, match) {
        return match.upsetWin === true;
      }
    },
    {
      id: "win_keep_queen",
      name: "Crown Intact",
      description: "Win with your queen still on the board vs a real challenge.",
      category: "Skill",
      rewardCoins: 75,
      rewardTokens: 0,
      check(profile, match) {
        return match.result === "win" && match.keptQueen === true && match.qualified === true;
      }
    },
    {
      id: "win_under_30",
      name: "Swift Mate",
      description: "Win in under 30 moves vs an opponent near or above your level.",
      category: "Skill",
      rewardCoins: 100,
      rewardTokens: 0,
      check(profile, match) {
        return match.result === "win" && match.fullMoves < 30 && match.qualified === true;
      }
    },
    {
      id: "comeback_win",
      name: "Comeback King",
      description: "Win after being down significant material.",
      category: "Skill",
      rewardCoins: 150,
      rewardTokens: 1,
      check(profile, match) {
        return match.result === "win" && match.comebackWin === true;
      }
    },
    {
      id: "elo_club",
      name: "Club Player",
      description: "Reach 1000 ELO.",
      category: "Rating",
      rewardCoins: 120,
      rewardTokens: 0,
      check(profile) {
        return peakElo(profile) >= 1000;
      }
    },
    {
      id: "elo_expert",
      name: "Expert",
      description: "Reach 1300 ELO.",
      category: "Rating",
      rewardCoins: 200,
      rewardTokens: 1,
      check(profile) {
        return peakElo(profile) >= 1300;
      }
    },
    {
      id: "elo_master",
      name: "Master",
      description: "Reach 1600 ELO.",
      category: "Rating",
      rewardCoins: 300,
      rewardTokens: 2,
      check(profile) {
        return peakElo(profile) >= 1600;
      }
    },
    {
      id: "elo_grandmaster",
      name: "Grandmaster",
      description: "Reach 1900 ELO.",
      category: "Rating",
      rewardCoins: 500,
      rewardTokens: 3,
      check(profile) {
        return peakElo(profile) >= 1900;
      }
    }
  ];

  function grantAchievementRewards(profile, achievement) {
    profile.coins += achievement.rewardCoins || 0;
    profile.royalTokens += achievement.rewardTokens || 0;
    if (achievement.unlocks) {
      for (const id of achievement.unlocks.boards || []) {
        if (!profile.unlocks.boards.includes(id)) profile.unlocks.boards.push(id);
      }
      for (const id of achievement.unlocks.pieces || []) {
        if (!profile.unlocks.pieces.includes(id)) profile.unlocks.pieces.push(id);
      }
      for (const id of achievement.unlocks.titles || []) {
        if (!profile.unlocks.titles.includes(id)) profile.unlocks.titles.push(id);
      }
    }
  }

  function evaluateAchievements(profile, match) {
    const newlyUnlocked = [];
    for (const achievement of ACHIEVEMENTS) {
      if (profile.achievements.unlocked.includes(achievement.id)) continue;
      if (!achievement.check(profile, match)) continue;
      profile.achievements.unlocked.push(achievement.id);
      if (!profile.achievements.claimed.includes(achievement.id)) {
        profile.achievements.claimed.push(achievement.id);
        grantAchievementRewards(profile, achievement);
      }
      newlyUnlocked.push(achievement);
    }
    return newlyUnlocked;
  }

  function getAchievement(id) {
    return ACHIEVEMENTS.find(a => a.id === id) || null;
  }

  window.Achievements = {
    ACHIEVEMENTS,
    evaluateAchievements,
    getAchievement,
    grantAchievementRewards
  };
})();
