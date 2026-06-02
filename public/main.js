(() => {
  "use strict";

  const S = window.ProfileStorage;
  const E = window.ChessEngine;
  const Econ = window.Economy;
  const Bots = window.BotConfigs;
  const Cos = window.Cosmetics;
  const Ach = window.Achievements;
  const Elo = window.Elo;
  const Train = window.TrainingData;

  let activeProfile = null;
  let pendingBotMatch = null;
  let lastMatchSummary = null;
  let leaderboardTimer = null;

  const screens = {
    auth: document.getElementById("screen-auth"),
    menu: document.getElementById("screen-menu"),
    leaderboard: document.getElementById("screen-leaderboard"),
    botLadder: document.getElementById("screen-bot-ladder"),
    training: document.getElementById("screen-training"),
    custom: document.getElementById("screen-custom"),
    play: document.getElementById("screen-play"),
    shop: document.getElementById("screen-shop"),
    locker: document.getElementById("screen-locker"),
    profile: document.getElementById("screen-profile"),
    achievements: document.getElementById("screen-achievements"),
    settings: document.getElementById("screen-settings"),
    lan: document.getElementById("screen-lan")
  };

  function showScreen(name) {
    for (const [key, el] of Object.entries(screens)) {
      if (el) el.classList.toggle("hidden", key !== name);
    }
    const hud = document.getElementById("appHud");
    if (hud) hud.style.display = name === "auth" ? "none" : "";

    // Stop leaderboard auto-refresh whenever we leave that screen.
    if (leaderboardTimer) {
      clearInterval(leaderboardTimer);
      leaderboardTimer = null;
    }

    if (name === "menu") renderMenu();
    if (name === "leaderboard") {
      renderLeaderboard();
      leaderboardTimer = setInterval(() => {
        if (screens.leaderboard && !screens.leaderboard.classList.contains("hidden")) {
          renderLeaderboard(true);
        }
      }, 10000);
    }
    if (name === "botLadder") renderBotLadder();
    if (name === "training") renderTraining();
    if (name === "custom") renderCustom();
    if (name === "shop") renderShop();
    if (name === "locker") renderLocker();
    if (name === "profile") renderProfile();
    if (name === "achievements") renderAchievements();
    if (name === "settings") renderSettings();
    if (name === "lan") renderLan();
  }

  function refreshProfile() {
    activeProfile = S.getActiveProfile();
    return activeProfile;
  }

  async function saveAndRefresh(profile) {
    activeProfile = await S.saveProfile(profile);
    updateHud();
    return activeProfile;
  }

  function updateHud() {
    const p = activeProfile;
    if (!p) return;
    const needed = Econ.getXpNeededForNextLevel(p.level);
    const pct = Math.min(100, Math.floor((p.xp / needed) * 100));

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set("hudUsername", p.username);
    set("hudLevel", `Lv ${p.level}`);
    set("hudTitle", p.title);
    set("hudCoins", String(p.coins));
    set("hudTokens", String(p.royalTokens));
    set("hudXpText", `${p.xp} / ${needed} XP`);

    const elo = Elo.normalizeElo(p.elo);
    const eloTitle = Elo.getTitle(elo.rating);
    set("hudElo", String(elo.rating));
    set("hudEloTier", eloTitle.name);

    const bar = document.getElementById("hudXpBar");
    if (bar) bar.style.width = `${pct}%`;
  }

  function renderMenu() {
    refreshProfile();
    updateHud();
    loadServerInfo();

    const p = activeProfile;
    if (!p) return;

    const elo = Elo.normalizeElo(p.elo);
    const eloTitle = Elo.getTitle(elo.rating);
    const progress = Elo.getOverallProgress(p, Bots.BOTS, Ach.ACHIEVEMENTS.length);
    const needed = Econ.getXpNeededForNextLevel(p.level);

    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    set("homeGreeting", p.username);
    set("homeSubtitle", `${p.title} · ${eloTitle.name}`);
    set("homeElo", String(elo.rating));
    set("homeEloMeta", `Peak ${elo.peak}${elo.lastChange ? ` · last ${Elo.formatChange(elo.lastChange)}` : ""}`);
    set("homeLevel", String(p.level));
    set("homeXpMeta", `${p.xp} / ${needed} XP`);
    set("homeCoins", String(p.coins));
    set("homeStreak", String(p.stats.currentWinStreak));
    set("homeStreakMeta", `Best: ${p.stats.bestWinStreak}`);
    set("homeOverallPct", `${progress.ladderPct}% ladder complete`);
    set("homeLadderCount", `${progress.ladder.defeatedCount} / ${progress.ladder.totalBots} defeated`);
    set("homeAchCount", `${progress.achDone} / ${progress.achTotal} unlocked`);
    set("homeLevelCount", `Level ${p.level}`);
    set("homeEloRank", eloTitle.isMax ? `${eloTitle.name} (max)` : `${eloTitle.name} → ${eloTitle.nextAt}`);

    const ladderBar = document.getElementById("homeLadderBar");
    const achBar = document.getElementById("homeAchBar");
    const xpBar = document.getElementById("homeXpBar");
    const eloBar = document.getElementById("homeEloBar");
    if (ladderBar) ladderBar.style.width = `${progress.ladderPct}%`;
    if (achBar) achBar.style.width = `${progress.achPct}%`;
    if (xpBar) xpBar.style.width = `${progress.xpPct}%`;
    if (eloBar) eloBar.style.width = `${eloTitle.progressPct}%`;

    const stepsEl = document.getElementById("homeLadderSteps");
    if (stepsEl) {
      stepsEl.innerHTML = progress.ladder.steps.map(step => {
        let state = "locked";
        if (step.defeated) state = "done";
        else if (step.unlocked) state = "active";
        const short = step.name.split(" ").pop();
        return `<li class="ladder-step ${state}" title="${step.name} · ${step.elo} ELO"><span>${short}</span></li>`;
      }).join("");
    }

    const next = progress.ladder.nextStep;
    const nextEl = document.getElementById("homeNextBot");
    if (nextEl && next) {
      if (next.defeated) {
        nextEl.textContent = "Ladder complete — rematch for coins or push your ELO higher.";
      } else if (next.unlocked) {
        nextEl.textContent = `Next goal: defeat ${next.name} (${next.elo} ELO)`;
      } else {
        nextEl.textContent = `Next unlock: ${next.name} — beat earlier bots or level up`;
      }
    }
  }

  // ——— Leaderboard ———
  function buildPodium(rows, me) {
    const top = rows.slice(0, 3);
    if (!top.length) return "";
    const arrange = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0];
    const slots = arrange.map(idx => {
      const r = top[idx];
      if (!r) return "";
      const rank = idx + 1;
      const isMe = me && r.username.toLowerCase() === me;
      const title = Elo.getTitle(r.rating);
      const crown = rank === 1 ? "♔ " : "";
      return `
        <div class="podium-slot podium-${rank} ${isMe ? "podium-me" : ""}">
          <div class="podium-medal podium-medal-${rank}">${rank}</div>
          <div class="podium-name" title="${escapeHtml(r.username)}">${crown}${escapeHtml(r.username)}</div>
          <div class="podium-elo">${r.rating}</div>
          <div class="podium-tier">${title.name}</div>
          <div class="podium-stand"><span>${rank}</span></div>
        </div>`;
    }).join("");
    return `<div class="lb-podium">${slots}</div>`;
  }

  async function renderLeaderboard(silent = false) {
    const el = document.getElementById("leaderboardList");
    if (!el) return;
    if (!silent) el.innerHTML = `<p class="lb-status">Loading rankings…</p>`;

    let rows = [];
    try {
      rows = await S.getLeaderboard(100);
    } catch {
      rows = [];
    }

    // The screen may have changed while awaiting.
    if (screens.leaderboard && screens.leaderboard.classList.contains("hidden")) return;

    if (!rows.length) {
      el.innerHTML = `<p class="lb-status">No ranked players yet. Win on the bot ladder to claim the top spot!</p>`;
      return;
    }

    const me = (activeProfile?.username || "").toLowerCase();
    const podium = buildPodium(rows, me);
    const head = `
      <div class="lb-row lb-head">
        <span class="lb-rank">#</span>
        <span class="lb-name">Player</span>
        <span class="lb-elo">ELO</span>
        <span class="lb-tier">Rank</span>
        <span class="lb-record">W / L / D</span>
      </div>`;

    const body = rows.map((r, i) => {
      const rank = i + 1;
      const title = Elo.getTitle(r.rating);
      const isMe = me && r.username.toLowerCase() === me;
      const medal = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";
      const rankCell = medal
        ? `<span class="lb-medal lb-medal-${medal}">${rank}</span>`
        : rank;
      return `
        <div class="lb-row ${isMe ? "lb-me" : ""} ${medal ? `lb-${medal}` : ""}">
          <span class="lb-rank">${rankCell}</span>
          <span class="lb-name">
            <strong>${escapeHtml(r.username)}</strong>${isMe ? '<span class="lb-you">YOU</span>' : ""}
            <span class="lb-sub">Lv ${r.level} · ${escapeHtml(r.title)}</span>
          </span>
          <span class="lb-elo">${r.rating}<span class="lb-sub">peak ${r.peak}</span></span>
          <span class="lb-tier">${title.name}</span>
          <span class="lb-record">${r.wins} / ${r.losses} / ${r.draws}</span>
        </div>`;
    }).join("");

    el.innerHTML = podium + head + body;
  }

  // ——— Auth ———
  function setupAuth() {
    const form = document.getElementById("authForm");
    const toggle = document.getElementById("authToggleMode");
    const errorEl = document.getElementById("authError");
    let createMode = true;

    async function detectCreateMode() {
      createMode = !(await S.hasAnyProfiles());
      setMode(createMode);
    }

    function setMode(isCreate) {
      createMode = isCreate;
      document.getElementById("authConfirmWrap")?.classList.toggle("hidden", !createMode);
      document.getElementById("authSubmitBtn").textContent = createMode ? "Create Profile" : "Log In";
      toggle.textContent = createMode ? "Already have a profile? Log in" : "Need a new profile? Create one";
      errorEl.textContent = "";
    }

    detectCreateMode();
    toggle.addEventListener("click", () => setMode(!createMode));

    form.addEventListener("submit", async event => {
      event.preventDefault();
      errorEl.textContent = "";
      const username = document.getElementById("authUsername").value;
      const passcode = document.getElementById("authPasscode").value;
      const confirm = document.getElementById("authPasscodeConfirm")?.value;

      try {
        if (createMode) {
          if (passcode !== confirm) throw new Error("Passcodes do not match.");
          await S.createProfile(username, passcode);
        } else {
          await S.loginProfile(username, passcode);
        }
        refreshProfile();
        showScreen("menu");
      } catch (err) {
        errorEl.textContent = err.message || "Could not authenticate.";
      }
    });
  }

  function setupMenu() {
    document.querySelectorAll("[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.nav;
        if (target === "play-bot") showScreen("botLadder");
        else if (target === "lan") showScreen("lan");
        else showScreen(target);
      });
    });
  }

  function setupShopTabs() {
    document.querySelectorAll(".shop-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.shopTab;
        document.querySelectorAll(".shop-tab").forEach(t => t.classList.toggle("active", t === tab));
        document.getElementById("shopBoardsPanel")?.classList.toggle("hidden", name !== "boards");
        document.getElementById("shopPiecesPanel")?.classList.toggle("hidden", name !== "pieces");
      });
    });
  }

  // ——— Bot ladder ———
  function renderBotLadder() {
    const list = document.getElementById("botLadderList");
    if (!list || !activeProfile) return;
    list.innerHTML = "";

    for (const bot of Bots.BOTS) {
      const unlocked = Bots.isBotUnlocked(activeProfile, bot);
      const defeated = Bots.isBotDefeated(activeProfile, bot.id);
      const firstTime = Bots.isFirstTimeWin(activeProfile, bot.id);
      const canPay = Econ.canAffordEntryFee(activeProfile, bot);
      const preview = Econ.previewRewards(activeProfile, bot);

      const card = document.createElement("article");
      card.className = `bot-card ${unlocked ? "" : "locked"} ${defeated ? "defeated" : ""}`;

      const feeText = bot.entryFee > 0 ? `${bot.entryFee} coins entry` : "Free entry";
      const rewardBits = [`+${preview.winCoins} coins`, `+${preview.winXp} XP`];
      if (preview.winTokens) rewardBits.push(`+${preview.winTokens} tokens`);
      const rewardText = `${firstTime ? "First clear: " : "Win: "}${rewardBits.join(" · ")}`;

      const winClass = preview.winPercent >= 70 ? "high" : preview.winPercent >= 35 ? "mid" : "low";

      card.innerHTML = `
        <div class="bot-card-head">
          <div>
            <span class="bot-tier">${bot.tier}</span>
            <h3>${bot.name}</h3>
            <p class="bot-diff">Difficulty ${bot.difficulty}/7 · ${Elo.getBotElo(bot.id)} ELO</p>
          </div>
          <div class="bot-badges">
            ${defeated ? '<span class="badge won">Defeated</span>' : ""}
            ${!unlocked ? '<span class="badge lock">Locked</span>' : ""}
            ${firstTime && unlocked ? '<span class="badge bonus">First-clear bonus</span>' : ""}
            ${unlocked && preview.lowChallenge ? '<span class="badge faded">Low challenge</span>' : ""}
          </div>
        </div>
        <p class="bot-desc">${bot.description}</p>
        <p class="bot-personality">${bot.personality}</p>
        ${unlocked ? `<div class="bot-winbar" title="Estimated win chance vs your ${Elo.normalizeElo(activeProfile.elo).rating} ELO">
          <div class="bot-winbar-track"><div class="bot-winbar-fill ${winClass}" style="width:${preview.winPercent}%"></div></div>
          <span>${preview.winPercent}% win chance</span>
        </div>` : ""}
        <div class="bot-card-meta">
          <span>${feeText}</span>
          <span>${rewardText}</span>
        </div>
        ${unlocked && preview.lowChallenge ? '<p class="bot-note">You far outrank this bot — minimal ELO &amp; XP.</p>' : ""}
        ${!unlocked ? `<p class="bot-lock-reason">${unlockReasonText(bot)}</p>` : ""}
        ${unlocked && bot.entryFee > 0 && !canPay ? '<p class="warn">Not enough coins for entry fee</p>' : ""}
        <button type="button" class="play-bot-btn" ${!unlocked || (bot.entryFee > 0 && !canPay) ? "disabled" : ""}>Challenge</button>
      `;

      card.querySelector(".play-bot-btn")?.addEventListener("click", () => startBotMatchFlow(bot));
      list.appendChild(card);
    }
  }

  function unlockReasonText(bot) {
    const req = bot.unlockRequirement;
    if (req.type === "botDefeatedOrLevel") {
      const prev = Bots.getBot(req.botId);
      return `Unlock: defeat ${prev?.name || req.botId} or reach level ${req.level}`;
    }
    return "Locked";
  }

  function startBotMatchFlow(bot) {
    if (!Bots.isBotUnlocked(activeProfile, bot)) return;
    if (!Econ.canAffordEntryFee(activeProfile, bot)) return;

    pendingBotMatch = { bot, entryFeePaid: 0 };

    if (bot.entryFee > 0) {
      const modal = document.getElementById("confirmEntryModal");
      document.getElementById("confirmEntryText").textContent =
        `Pay ${bot.entryFee} coins to challenge ${bot.name}? Victory reward: ${bot.rewardCoins} coins.`;
      modal.classList.remove("hidden");
      document.getElementById("confirmEntryYes").onclick = () => {
        modal.classList.add("hidden");
        beginBotMatch(bot);
      };
      document.getElementById("confirmEntryNo").onclick = () => modal.classList.add("hidden");
    } else {
      beginBotMatch(bot);
    }
  }

  async function beginBotMatch(bot) {
    const profile = S.validateProfile({ ...activeProfile });
    if (!Econ.canAffordEntryFee(profile, bot)) {
      toast("Not enough coins for entry fee");
      showScreen("botLadder");
      return;
    }
    const fee = Econ.deductEntryFee(profile, bot);
    await saveAndRefresh(profile);

    const colorSelect = document.getElementById("playColorSelect");
    const color = colorSelect?.value || E.WHITE;

    showScreen("play");
    window.ChessGame.startGame({
      mode: "bot",
      bot,
      playerColor: color,
      profile: activeProfile,
      entryFeePaid: fee,
      startingPlayerMaterial: 3900,
      onBack: () => {
        if (!confirm("Leave match? Unfinished games forfeit the entry fee.")) return false;
        showScreen("botLadder");
        return true;
      },
      onRestart: () => startBotMatchFlow(bot),
      onMatchEnd: async summary => {
        lastMatchSummary = await handleBotMatchEnd(bot, fee, summary);
        showResultModal(lastMatchSummary);
      }
    });
  }

  async function handleBotMatchEnd(bot, entryFeePaid, summary) {
    const profile = S.validateProfile({ ...activeProfile });
    const outcome = Econ.applyMatchResult(profile, bot, summary.result, {
      entryFeePaid,
      keptQueen: summary.keptQueen,
      fullMoves: summary.fullMoves,
      comebackWin: summary.comebackWin,
      moves: summary.moves
    });
    await saveAndRefresh(profile);

    return {
      bot,
      summary,
      outcome,
      entryFeePaid
    };
  }

  function showResultModal(data) {
    const modal = document.getElementById("resultModal");
    const title = document.getElementById("resultTitle");
    const body = document.getElementById("resultBody");
    const { bot, summary, outcome, entryFeePaid } = data;
    const r = summary.result;

    if (r === "win") title.textContent = `You defeated ${bot.name}`;
    else if (r === "loss") title.textContent = `You lost to ${bot.name}`;
    else title.textContent = `Draw vs ${bot.name}`;

    const reward = (amount, label, cls = "good") =>
      `<p class="result-reward ${cls}"><span class="result-amt">${amount}</span> ${label}</p>`;

    const lines = [];
    const e = outcome.eloResult;
    if (e) {
      const cls = e.change > 0 ? "good" : e.change < 0 ? "bad" : "muted";
      lines.push(`<p class="result-elo ${cls}">ELO ${Elo.formatChange(e.change)} → <strong>${e.newRating}</strong>
        <span class="result-sub">${e.expected}% expected win vs ${e.opponentElo}</span></p>`);
    }

    if (r === "win") {
      if (e && e.overqualified) {
        lines.push(`<p class="result-warn">Low-challenge win — rating &amp; XP heavily reduced.</p>`);
      }
      lines.push(reward(`+${outcome.rewards.coins}`, "coins"));
      lines.push(reward(`+${outcome.rewards.xp}`, "XP"));
      if (outcome.rewards.tokens) lines.push(reward(`+${outcome.rewards.tokens}`, "Royal Tokens"));
      if (outcome.botDefeated) lines.push(`<p class="result-tag">Bot defeated — ladder progress saved</p>`);
    } else if (r === "loss") {
      if (entryFeePaid) lines.push(reward(`-${entryFeePaid}`, "coins (entry fee)", "bad"));
      lines.push(reward(`+${outcome.rewards.xp}`, "consolation XP"));
      lines.push(`<p class="result-tip">Tip: watch for hanging pieces and king safety.</p>`);
    } else {
      if (outcome.rewards.entryRefund) lines.push(reward(`+${outcome.rewards.entryRefund}`, "coins refunded"));
      lines.push(reward(`+${outcome.rewards.xp}`, "XP"));
      if (outcome.rewards.coins) lines.push(reward(`+${outcome.rewards.coins}`, "coins"));
      if (e && e.change < 0) lines.push(`<p class="result-warn">Drawing a weaker opponent costs rating.</p>`);
    }

    if (outcome.levelsGained.length) {
      lines.push(`<p class="result-levelup">Level up! → Level ${outcome.levelsGained[outcome.levelsGained.length - 1]}</p>`);
    }
    for (const u of outcome.cosmeticUnlocks) {
      lines.push(`<p class="result-unlock">Unlocked: ${u.name}</p>`);
    }
    for (const a of outcome.achievementUnlocks) {
      lines.push(`<p class="result-ach">Achievement: ${a.name}</p>`);
    }

    body.innerHTML = lines.join("");
    modal.classList.remove("hidden");

    document.getElementById("resultPlayAgain").onclick = () => {
      modal.classList.add("hidden");
      startBotMatchFlow(bot);
    };
    document.getElementById("resultToLadder").onclick = () => {
      modal.classList.add("hidden");
      showScreen("botLadder");
    };
    document.getElementById("resultToLocker").onclick = () => {
      modal.classList.add("hidden");
      showScreen("locker");
    };
  }

  // ——— Training mode ———
  function setupTraining() {
    document.querySelectorAll(".training-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.trainTab;
        document.querySelectorAll(".training-tab").forEach(t => t.classList.toggle("active", t === tab));
        document.getElementById("trainBotsPanel")?.classList.toggle("hidden", name !== "bots");
        document.getElementById("trainPuzzlesPanel")?.classList.toggle("hidden", name !== "puzzles");
      });
    });
    document.getElementById("startPuzzleBtn")?.addEventListener("click", () => startRandomPuzzle());
  }

  function renderTraining() {
    renderTrainingBots();
    renderPuzzles();
  }

  function renderTrainingBots() {
    const list = document.getElementById("trainingBotList");
    if (!list || !activeProfile || !Train) return;
    list.innerHTML = "";

    const playerRating = Elo.normalizeElo(activeProfile.elo).rating;

    for (const bot of Train.TRAINING_BOTS) {
      const pct = Math.round(Elo.expectedScore(playerRating, bot.elo) * 100);
      const winClass = pct >= 70 ? "high" : pct >= 35 ? "mid" : "low";

      const card = document.createElement("article");
      card.className = "bot-card";
      card.innerHTML = `
        <div class="bot-card-head">
          <div>
            <span class="bot-tier">${bot.tier}</span>
            <h3>${bot.name}</h3>
            <p class="bot-diff">Sparring partner · ${bot.elo} ELO strength</p>
          </div>
          <div class="bot-badges">
            <span class="badge faded">No stakes</span>
          </div>
        </div>
        <p class="bot-desc">${bot.description}</p>
        <p class="bot-personality">${bot.personality}</p>
        <div class="bot-winbar" title="Estimated win chance vs your ${playerRating} ELO">
          <div class="bot-winbar-track"><div class="bot-winbar-fill ${winClass}" style="width:${pct}%"></div></div>
          <span>${pct}% win chance</span>
        </div>
        <div class="bot-card-meta">
          <span>Free practice</span>
          <span>Coach available 💡</span>
        </div>
        <button type="button" class="play-bot-btn">Spar</button>
      `;
      card.querySelector(".play-bot-btn")?.addEventListener("click", () => startTrainingMatch(bot));
      list.appendChild(card);
    }
  }

  function renderPuzzles() {
    const list = document.getElementById("puzzleList");
    if (!list || !Train) return;
    list.innerHTML = "";

    for (const puzzle of Train.PUZZLES) {
      const card = document.createElement("article");
      card.className = `puzzle-card puzzle-${puzzle.difficulty}`;
      card.innerHTML = `
        <div class="puzzle-card-head">
          <span class="puzzle-theme">${puzzle.theme}</span>
          <span class="puzzle-diff">${puzzle.difficulty}</span>
        </div>
        <h3>${puzzle.name}</h3>
        <p class="puzzle-objective">${puzzle.objective}</p>
        <div class="puzzle-meta">
          <span>Play as ${puzzle.playerColor === "w" ? "White" : "Black"}</span>
          <span>vs ${puzzle.botName}</span>
        </div>
        <button type="button" class="play-bot-btn">Solve</button>
      `;
      card.querySelector(".play-bot-btn")?.addEventListener("click", () => startPuzzle(puzzle));
      list.appendChild(card);
    }
  }

  function resolveTrainColor() {
    const sel = document.getElementById("trainColorSelect")?.value || "w";
    if (sel === "random") return Math.random() < 0.5 ? "w" : "b";
    return sel;
  }

  function startTrainingMatch(trainingBot) {
    const color = resolveTrainColor();
    const bot = {
      id: trainingBot.id,
      name: trainingBot.name,
      tier: trainingBot.tier,
      rewardCoins: 0,
      ai: trainingBot.ai
    };
    showScreen("play");
    window.ChessGame.startGame({
      mode: "bot",
      training: true,
      bot,
      playerColor: color,
      profile: activeProfile,
      entryFeePaid: 0,
      startingPlayerMaterial: 3900,
      onBack: () => { showScreen("training"); return true; },
      onRestart: () => startTrainingMatch(trainingBot),
      onMatchEnd: summary => showTrainingResult({ kind: "spar", trainingBot, summary })
    });
  }

  function startPuzzle(puzzle) {
    const bot = {
      id: `puzzle_${puzzle.id}`,
      name: puzzle.botName,
      tier: `${puzzle.botElo} ELO`,
      rewardCoins: 0,
      ai: puzzle.ai
    };
    showScreen("play");
    window.ChessGame.startGame({
      mode: "bot",
      training: true,
      puzzle: true,
      bot,
      startFen: puzzle.fen,
      playerColor: puzzle.playerColor,
      profile: activeProfile,
      entryFeePaid: 0,
      startingPlayerMaterial: 3900,
      onBack: () => { showScreen("training"); return true; },
      onRestart: () => startPuzzle(puzzle),
      onMatchEnd: summary => showTrainingResult({ kind: "puzzle", puzzle, summary })
    });
  }

  function startRandomPuzzle(excludeId) {
    if (!Train) return;
    const puzzle = Train.randomPuzzle(excludeId);
    if (puzzle) startPuzzle(puzzle);
  }

  // ——— Custom practice (free position editor, no stakes) ———
  const CUSTOM_GLYPHS = {
    wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
    bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟"
  };
  const CUSTOM_PALETTE = ["wk", "wq", "wr", "wb", "wn", "wp", "bk", "bq", "br", "bb", "bn", "bp"];
  let customState = null;
  let customWired = false;

  function emptyBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(null));
  }

  function standardBoard() {
    return E.initialState().board.map(row => row.slice());
  }

  function ensureCustomState() {
    if (customState) return;
    customState = {
      board: standardBoard(),
      turn: "w",
      playerColor: "w",
      botId: Bots.BOTS[0]?.id || "pawn_rookie",
      brush: "wq"
    };
  }

  function setupCustom() {
    if (customWired) return;
    customWired = true;

    const botSelect = document.getElementById("customBotSelect");
    if (botSelect) {
      botSelect.innerHTML = Bots.BOTS
        .map(b => `<option value="${b.id}">${escapeHtml(b.name)} — ${escapeHtml(b.tier)} (Difficulty ${b.difficulty}/7)</option>`)
        .join("");
      botSelect.addEventListener("change", () => {
        ensureCustomState();
        customState.botId = botSelect.value;
        updateCustomBotDesc();
      });
    }

    document.getElementById("customTurnSelect")?.addEventListener("change", e => {
      ensureCustomState();
      customState.turn = e.target.value === "b" ? "b" : "w";
    });
    document.getElementById("customColorSelect")?.addEventListener("change", e => {
      ensureCustomState();
      customState.playerColor = e.target.value === "b" ? "b" : "w";
    });
    document.getElementById("customResetBtn")?.addEventListener("click", () => {
      ensureCustomState();
      customState.board = standardBoard();
      clearCustomError();
      renderCustomBoard();
    });
    document.getElementById("customClearBtn")?.addEventListener("click", () => {
      ensureCustomState();
      customState.board = emptyBoard();
      clearCustomError();
      renderCustomBoard();
    });
    document.getElementById("customStartBtn")?.addEventListener("click", startCustomMatch);
  }

  function renderCustom() {
    ensureCustomState();
    setupCustom();

    const turnSel = document.getElementById("customTurnSelect");
    const colorSel = document.getElementById("customColorSelect");
    const botSel = document.getElementById("customBotSelect");
    if (turnSel) turnSel.value = customState.turn;
    if (colorSel) colorSel.value = customState.playerColor;
    if (botSel) botSel.value = customState.botId;

    clearCustomError();
    renderCustomPalette();
    renderCustomBoard();
    updateCustomBotDesc();
  }

  function renderCustomPalette() {
    const el = document.getElementById("customPalette");
    if (!el) return;
    const cells = CUSTOM_PALETTE.map(code => {
      const color = code[0] === "w" ? "palette-white" : "palette-black";
      const active = customState.brush === code ? "active" : "";
      return `<button type="button" class="palette-piece ${color} ${active}" data-brush="${code}" title="${code}">${CUSTOM_GLYPHS[code]}</button>`;
    });
    // Eraser sits at the end of the first (white) row.
    cells.splice(6, 0, `<button type="button" class="palette-piece palette-erase ${customState.brush === "erase" ? "active" : ""}" data-brush="erase">Erase</button>`);
    el.innerHTML = cells.join("");

    el.querySelectorAll("[data-brush]").forEach(btn => {
      btn.addEventListener("click", () => {
        customState.brush = btn.dataset.brush;
        renderCustomPalette();
      });
    });
  }

  function renderCustomBoard() {
    const el = document.getElementById("customBoard");
    if (!el) return;
    el.innerHTML = "";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `custom-cell ${(r + c) % 2 === 0 ? "light" : "dark"}`;
        cell.setAttribute("aria-label", E.squareName(r, c));
        const piece = customState.board[r][c];
        if (piece) {
          const colorClass = piece[0] === "w" ? "cp-white" : "cp-black";
          cell.innerHTML = `<span class="${colorClass}">${CUSTOM_GLYPHS[piece]}</span>`;
        }
        cell.addEventListener("click", () => {
          customState.board[r][c] = customState.brush === "erase" ? null : customState.brush;
          clearCustomError();
          renderCustomBoard();
        });
        el.appendChild(cell);
      }
    }
  }

  function updateCustomBotDesc() {
    const el = document.getElementById("customBotDesc");
    if (!el) return;
    const bot = Bots.getBot(customState.botId);
    el.textContent = bot ? `${bot.personality}` : "";
  }

  function setCustomError(msg) {
    const el = document.getElementById("customError");
    if (el) el.textContent = msg;
  }

  function clearCustomError() {
    setCustomError("");
  }

  function countPieces(board, code) {
    let n = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === code) n += 1;
      }
    }
    return n;
  }

  function validateCustomBoard(board, turn) {
    if (countPieces(board, "wk") !== 1) return "Add exactly one white king.";
    if (countPieces(board, "bk") !== 1) return "Add exactly one black king.";
    for (let c = 0; c < 8; c++) {
      if (board[0][c] && E.typeOf(board[0][c]) === "p") return "Pawns can't sit on the last rank.";
      if (board[7][c] && E.typeOf(board[7][c]) === "p") return "Pawns can't sit on the first rank.";
    }
    // The side that is NOT to move cannot already be in check.
    const probe = customToState(board, turn);
    if (E.isKingInCheck(probe, E.opposite(turn))) {
      return "Illegal position: the side not to move is in check.";
    }
    return null;
  }

  function customToState(board, turn) {
    return {
      board: board.map(row => row.slice()),
      turn,
      castling: {
        wK: board[7][4] === "wk" && board[7][7] === "wr",
        wQ: board[7][4] === "wk" && board[7][0] === "wr",
        bK: board[0][4] === "bk" && board[0][7] === "br",
        bQ: board[0][4] === "bk" && board[0][0] === "br"
      },
      ep: null,
      halfmove: 0,
      fullmove: 1,
      history: [],
      lastMove: null
    };
  }

  function startCustomMatch() {
    ensureCustomState();
    const error = validateCustomBoard(customState.board, customState.turn);
    if (error) {
      setCustomError(error);
      return;
    }

    const baseBot = Bots.getBot(customState.botId) || Bots.BOTS[0];
    const bot = {
      id: `custom_${baseBot.id}`,
      name: baseBot.name,
      tier: baseBot.tier,
      rewardCoins: 0,
      ai: baseBot.ai
    };
    const fen = E.toFen(customToState(customState.board, customState.turn));

    showScreen("play");
    window.ChessGame.startGame({
      mode: "bot",
      training: true,
      bot,
      startFen: fen,
      playerColor: customState.playerColor,
      profile: activeProfile,
      entryFeePaid: 0,
      startingPlayerMaterial: 3900,
      onBack: () => { showScreen("custom"); return true; },
      onRestart: () => startCustomMatch(),
      onMatchEnd: summary => showTrainingResult({ kind: "custom", bot: baseBot, summary })
    });
  }

  function showTrainingResult(data) {
    const modal = document.getElementById("trainingResultModal");
    const kicker = document.getElementById("trainingResultKicker");
    const title = document.getElementById("trainingResultTitle");
    const body = document.getElementById("trainingResultBody");
    const againBtn = document.getElementById("trainAgainBtn");
    const newBtn = document.getElementById("trainNewBtn");
    const exitBtn = document.getElementById("trainExitBtn");
    if (!modal) return;

    const r = data.summary?.result || "draw";
    const lines = [];
    const exitTarget = data.kind === "custom" ? "custom" : "training";

    if (data.kind === "custom") {
      const bot = data.bot;
      kicker.textContent = `Custom practice · ${bot.tier}`;
      if (r === "win") {
        title.textContent = `You beat ${bot.name}`;
        lines.push(`<p class="result-tag">Custom position converted in ${data.summary.moves} moves. No stakes — pure practice.</p>`);
      } else if (r === "loss") {
        title.textContent = `${bot.name} got you`;
        lines.push(`<p class="result-tip">No rating lost. Tweak the position and run it back.</p>`);
      } else {
        title.textContent = `Draw vs ${bot.name}`;
        lines.push(`<p class="result-tip">Even ending. Adjust the setup and try again.</p>`);
      }

      againBtn.textContent = "Play again";
      againBtn.onclick = () => { modal.classList.add("hidden"); startCustomMatch(); };
      newBtn.classList.remove("hidden");
      newBtn.textContent = "Edit position";
      newBtn.onclick = () => { modal.classList.add("hidden"); showScreen("custom"); };
    } else if (data.kind === "puzzle") {
      const puzzle = data.puzzle;
      kicker.textContent = `Puzzle · ${puzzle.theme}`;
      if (r === "win") {
        title.textContent = "Puzzle solved! 🎉";
        lines.push(`<p class="result-tag">You converted "${puzzle.name}" in ${data.summary.moves} moves.</p>`);
      } else if (r === "loss") {
        title.textContent = "Puzzle failed";
        lines.push(`<p class="result-warn">The defender escaped. Try the coach hint and go again.</p>`);
      } else {
        title.textContent = "Puzzle drawn";
        lines.push(`<p class="result-warn">A draw doesn't count — keep the pressure on next time.</p>`);
      }
      lines.push(`<p class="result-tip">${puzzle.objective}</p>`);

      againBtn.textContent = "Try again";
      againBtn.onclick = () => { modal.classList.add("hidden"); startPuzzle(puzzle); };
      newBtn.classList.remove("hidden");
      newBtn.textContent = "New puzzle";
      newBtn.onclick = () => { modal.classList.add("hidden"); startRandomPuzzle(puzzle.id); };
    } else {
      const bot = data.trainingBot;
      kicker.textContent = `Sparring · ${bot.tier}`;
      if (r === "win") {
        title.textContent = `You beat ${bot.name}`;
        lines.push(`<p class="result-tag">Clean practice win in ${data.summary.moves} moves. No stakes — just sharpening.</p>`);
      } else if (r === "loss") {
        title.textContent = `${bot.name} got you`;
        lines.push(`<p class="result-tip">No rating lost. Replay and lean on the coach to spot the better moves.</p>`);
      } else {
        title.textContent = `Draw vs ${bot.name}`;
        lines.push(`<p class="result-tip">Solid hold. Try again for the full point.</p>`);
      }

      againBtn.textContent = "Play again";
      againBtn.onclick = () => { modal.classList.add("hidden"); startTrainingMatch(bot); };
      newBtn.classList.add("hidden");
    }

    body.innerHTML = lines.join("");
    exitBtn.onclick = () => { modal.classList.add("hidden"); showScreen(exitTarget); };
    modal.classList.remove("hidden");
  }

  // ——— LAN / local ———
  function renderLan() {
    const el = document.getElementById("serverUrlsLan");
    if (!el) return;
    fetch("/api/info").then(r => r.json()).then(data => {
      el.innerHTML = `<code>${data.local}</code>${data.lan?.length ? `<br>LAN: ${data.lan.map(u => `<code>${u}</code>`).join(" · ")}` : ""}`;
    }).catch(() => { el.textContent = "Run npm start to host on your LAN."; });
  }

  function setupLan() {
    document.getElementById("startLanBtn")?.addEventListener("click", () => {
      const color = document.getElementById("playColorSelect")?.value || "w";
      showScreen("play");
      window.ChessGame.startGame({
        mode: "human",
        playerColor: color,
        profile: activeProfile,
        onBack: () => showScreen("lan"),
        onMatchEnd: null
      });
    });
  }

  // ——— Shop ———
  function renderShop() {
    const boardsEl = document.getElementById("shopBoards");
    const piecesEl = document.getElementById("shopPieces");
    if (!boardsEl || !piecesEl) return;

    renderShopSummary();

    boardsEl.innerHTML = "";
    piecesEl.innerHTML = "";

    for (const item of Cos.listShopBoards()) boardsEl.appendChild(shopCard(item, "board"));
    for (const item of Cos.listLockedItems(Cos.BOARDS)) {
      if (!activeProfile.unlocks.boards.includes(item.id)) boardsEl.appendChild(shopCard(item, "board"));
    }

    for (const item of Cos.listShopPieces()) piecesEl.appendChild(shopCard(item, "piece"));
    for (const item of Cos.listLockedItems(Cos.PIECES)) {
      if (!activeProfile.unlocks.pieces.includes(item.id)) piecesEl.appendChild(shopCard(item, "piece"));
    }
  }

  function renderShopSummary() {
    const el = document.getElementById("shopSummary");
    if (!el) return;
    const boardsOwned = activeProfile.unlocks.boards.length;
    const piecesOwned = activeProfile.unlocks.pieces.length;
    const boardsTotal = Object.keys(Cos.BOARDS).length;
    const piecesTotal = Object.keys(Cos.PIECES).length;
    el.innerHTML = `
      <div class="shop-balance">
        <span class="shop-coin">${activeProfile.coins} coins</span>
        <span class="shop-token">${activeProfile.royalTokens} Royal Tokens</span>
      </div>
      <div class="shop-collection">Collection: ${boardsOwned}/${boardsTotal} boards · ${piecesOwned}/${piecesTotal} piece sets</div>
    `;
  }

  function shopCard(item, type) {
    const owned = type === "board"
      ? activeProfile.unlocks.boards.includes(item.id)
      : activeProfile.unlocks.pieces.includes(item.id);
    const equipped = type === "board"
      ? activeProfile.selectedCosmetics.board === item.id
      : activeProfile.selectedCosmetics.pieces === item.id;
    const achievementLocked = item.unlockType === "achievement" && !owned;
    const isToken = item.currency === "royalTokens";
    const balance = isToken ? activeProfile.royalTokens : activeProfile.coins;
    const affordable = owned || achievementLocked || balance >= item.price;
    const shortfall = Math.max(0, item.price - balance);

    const reqStatus = Cos.meetsRequirements(item, activeProfile);
    const reqLabel = Cos.requirementLabel(item);
    const reqLocked = !owned && !achievementLocked && !reqStatus.ok;
    const isLocked = achievementLocked || reqLocked;

    const rarity = Cos.getRarity(item);
    const rarityName = Cos.RARITY[rarity]?.name || "Common";
    const priceLabel = item.price === 0
      ? "Free"
      : `${item.price} ${isToken ? "Royal Tokens" : "coins"}`;
    const tag = item.themeTag || (type === "board" ? Cos.getPatternLabel(item.pattern) : "Piece set");
    const patternLine = type === "board" && item.pattern
      ? `<span class="shop-pattern">${Cos.getPatternLabel(item.pattern)}</span>`
      : "";
    const reqLine = reqLabel
      ? `<p class="shop-req ${reqStatus.ok ? "met" : "unmet"}">${reqStatus.ok ? "✓ " : "🔒 "}Requires ${reqLabel}</p>`
      : "";

    let actionHtml;
    if (achievementLocked) actionHtml = `<p class="shop-locked-reason">Locked · defeat The Checkmate Engine</p>`;
    else if (equipped) actionHtml = `<button type="button" class="shop-equipped" disabled>Equipped</button>`;
    else if (owned) actionHtml = `<button type="button" class="shop-equip" data-action="equip">Equip</button>`;
    else if (reqLocked) actionHtml = `<p class="shop-locked-reason">${reqStatus.reasons.join(" · ")}</p>`;
    else if (!affordable) actionHtml = `<button type="button" disabled>Need ${shortfall} more</button>`;
    else actionHtml = `<button type="button" data-action="buy">Purchase</button>`;

    const card = document.createElement("div");
    card.className = `shop-card shop-card-${type} rarity-${rarity}${isLocked ? " shop-locked" : ""}${!affordable && !owned && !isLocked ? " shop-unaffordable" : ""}`;
    card.innerHTML = `
      <div class="shop-card-top">
        <span class="shop-tag">${tag}</span>
        <span class="rarity-badge rarity-${rarity}">${rarityName}</span>
      </div>
      <h4>${item.name}</h4>
      ${patternLine}
      <p class="shop-desc">${item.description}</p>
      <div class="shop-preview ${type === "board" ? "board-preview" : "piece-preview"}"></div>
      ${reqLine}
      <p class="shop-price">${achievementLocked ? "Achievement reward" : priceLabel}</p>
      ${actionHtml}
    `;

    const preview = card.querySelector(".shop-preview");
    if (type === "board") Cos.applyBoardPreview(preview, item);
    else Cos.applyPiecePreview(preview, item);

    const btn = card.querySelector("button[data-action]");
    if (btn?.dataset.action === "buy") {
      btn.addEventListener("click", async () => {
        const profile = S.validateProfile({ ...activeProfile });
        const result = Econ.purchaseCosmetic(profile, item, type);
        if (!result.ok) {
          if (result.reason === "insufficient") toast("Not enough currency");
          else if (result.reason === "requirement") toast(`Locked — ${(result.reasons || []).join(", ")}`);
          else toast("Cannot purchase");
          return;
        }
        await saveAndRefresh(profile);
        toast(`Purchased ${item.name}`);
        renderShop();
      });
    } else if (btn?.dataset.action === "equip") {
      btn.addEventListener("click", async () => {
        const profile = S.validateProfile({ ...activeProfile });
        if (type === "board") profile.selectedCosmetics.board = item.id;
        else profile.selectedCosmetics.pieces = item.id;
        await saveAndRefresh(profile);
        Cos.applyBoardTheme(profile.selectedCosmetics.board);
        toast(`Equipped ${item.name}`);
        renderShop();
      });
    }
    return card;
  }

  // ——— Locker ———
  function renderLocker() {
    renderLockerGrid("lockerBoards", Cos.BOARDS, activeProfile.unlocks.boards, "board");
    renderLockerGrid("lockerPieces", Cos.PIECES, activeProfile.unlocks.pieces, "piece");
    renderLockerTitles();
  }

  function renderLockerGrid(containerId, catalog, ownedIds, type) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = "";
    for (const id of ownedIds) {
      const item = catalog[id];
      if (!item) continue;
      const selected = type === "board"
        ? activeProfile.selectedCosmetics.board === id
        : activeProfile.selectedCosmetics.pieces === id;
      const rarity = Cos.getRarity(item);
      const card = document.createElement("button");
      card.type = "button";
      card.className = `locker-item rarity-${rarity} ${selected ? "selected" : ""}`;
      card.innerHTML = `<span class="rarity-badge rarity-${rarity}">${Cos.RARITY[rarity]?.name || "Common"}</span><strong>${item.name}</strong><span>${selected ? "Equipped" : "Equip"}</span>`;
      card.addEventListener("click", async () => {
        const profile = S.validateProfile({ ...activeProfile });
        if (type === "board") profile.selectedCosmetics.board = id;
        else profile.selectedCosmetics.pieces = id;
        await saveAndRefresh(profile);
        Cos.applyBoardTheme(profile.selectedCosmetics.board);
        renderLocker();
      });
      el.appendChild(card);
    }
  }

  function renderLockerTitles() {
    const el = document.getElementById("lockerTitles");
    if (!el) return;
    el.innerHTML = "";
    const owned = new Set(activeProfile.unlocks.titles);

    for (const title of Cos.listTitles()) {
      const isOwned = owned.has(title.id);
      const selected = activeProfile.title === title.id;
      const reqLabel = Cos.requirementLabel(title);

      let sub;
      if (isOwned) sub = selected ? "Equipped" : "Equip";
      else if (title.unlockType === "achievement") sub = "🔒 Achievement";
      else sub = `🔒 ${reqLabel || "Locked"}`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.disabled = !isOwned;
      btn.className = `locker-item locker-title ${selected ? "selected" : ""} ${isOwned ? "" : "locked"}`;
      btn.innerHTML = `<strong>${escapeHtml(title.name)}</strong><span>${sub}</span>`;

      if (isOwned) {
        btn.addEventListener("click", async () => {
          const profile = S.validateProfile({ ...activeProfile });
          profile.title = title.id;
          await saveAndRefresh(profile);
          renderLocker();
        });
      }
      el.appendChild(btn);
    }
  }

  // ——— Profile ———
  function renderProfile() {
    const p = activeProfile;
    const el = document.getElementById("profileDetails");
    if (!el) return;
    const needed = Econ.getXpNeededForNextLevel(p.level);
    const elo = Elo.normalizeElo(p.elo);
    const eloTitle = Elo.getTitle(elo.rating);
    const highest = p.botProgress.highestBotDefeated
      ? (Bots.getBot(p.botProgress.highestBotDefeated)?.name || p.botProgress.highestBotDefeated)
      : "—";

    const decided = p.stats.wins + p.stats.losses;
    const winRate = decided > 0 ? Math.round((p.stats.wins / decided) * 100) : 0;

    const stat = (label, value, sub = "") =>
      `<div class="pstat"><span class="pstat-val">${value}</span><span class="pstat-label">${label}</span>${sub ? `<span class="pstat-sub">${sub}</span>` : ""}</div>`;

    el.innerHTML = `
      <div class="profile-head">
        <div>
          <h3>${escapeHtml(p.username)}</h3>
          <p class="profile-title">${escapeHtml(p.title)} · ${eloTitle.name}</p>
        </div>
        <div class="profile-elo-badge">
          <span class="elo-pill">${elo.rating}</span>
          <span>Peak ${elo.peak}</span>
        </div>
      </div>
      <div class="profile-stats-grid">
        ${stat("ELO rank", eloTitle.name, eloTitle.isMax ? "Max tier" : `Next at ${eloTitle.nextAt}`)}
        ${stat("Level", p.level, `${p.xp}/${needed} XP`)}
        ${stat("Win rate", `${winRate}%`, `${p.stats.wins}W / ${p.stats.losses}L / ${p.stats.draws}D`)}
        ${stat("Win streak", p.stats.currentWinStreak, `Best ${p.stats.bestWinStreak}`)}
        ${stat("Coins", p.coins, `${p.royalTokens} Royal Tokens`)}
        ${stat("Rated games", elo.botGames, `Top bot: ${escapeHtml(highest)}`)}
        ${stat("Boards", p.unlocks.boards.length, `${p.unlocks.pieces.length} piece sets`)}
        ${stat("Bot wins", p.stats.botWins, `${p.stats.totalGames} games played`)}
      </div>
    `;
    renderMatchHistory();
  }

  function renderMatchHistory() {
    const el = document.getElementById("profileHistory");
    if (!el) return;
    const history = activeProfile.matchHistory || [];
    if (!history.length) {
      el.innerHTML = `<li class="mh-empty">No matches yet — challenge the bot ladder to build your record.</li>`;
      return;
    }

    el.innerHTML = history.slice(0, 25).map(m => {
      const outcome = m.result === "win" ? "victory" : m.result === "loss" ? "defeat" : "draw";
      const label = outcome === "victory" ? "VICTORY" : outcome === "defeat" ? "DEFEAT" : "DRAW";
      const opp = escapeHtml(m.botName || (m.opponentType === "bot" ? m.botId : "Local match"));
      const oppElo = m.opponentElo ? ` · ${m.opponentElo} ELO` : "";

      const when = new Date(m.date);
      const dateStr = isNaN(when.getTime())
        ? ""
        : `${when.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
      const movesTxt = m.moves ? `${m.moves} moves` : "";
      const meta = [dateStr, movesTxt].filter(Boolean).join(" · ");

      const eloHtml = typeof m.eloChange === "number"
        ? `<span class="mh-elo ${m.eloChange > 0 ? "up" : m.eloChange < 0 ? "down" : "flat"}">${Elo.formatChange(m.eloChange)}<span class="mh-elo-sub">${m.eloAfter ? m.eloAfter : ""}</span></span>`
        : `<span class="mh-elo flat"></span>`;

      const rewards = [];
      if (m.coinsGained) rewards.push(`+${m.coinsGained}c`);
      if (m.xpGained) rewards.push(`+${m.xpGained} XP`);
      if (m.tokensGained) rewards.push(`+${m.tokensGained}t`);

      return `
        <li class="mh-row mh-${outcome}">
          <span class="mh-result">${label}</span>
          <span class="mh-main">
            <strong class="mh-opp">${opp}</strong>
            <span class="mh-meta">${meta}${oppElo}</span>
          </span>
          ${eloHtml}
          <span class="mh-rewards">${rewards.join(" · ")}</span>
        </li>`;
    }).join("");
  }

  function setupProfileActions() {
    document.getElementById("switchProfileBtn")?.addEventListener("click", () => {
      S.logoutProfile();
      activeProfile = null;
      showScreen("auth");
    });

    document.getElementById("changePassBtn")?.addEventListener("click", async () => {
      const oldP = prompt("Current passcode:");
      if (!oldP) return;
      const newP = prompt("New passcode (min 4 chars):");
      if (!newP) return;
      try {
        await S.changePasscode(activeProfile.username, oldP, newP);
        toast("Passcode updated");
      } catch (err) {
        alert(err.message);
      }
    });

    document.getElementById("deleteProfileBtn")?.addEventListener("click", async () => {
      const pass = prompt("Enter passcode to delete this profile:");
      if (!pass) return;
      if (!confirm("Delete profile permanently?")) return;
      try {
        await S.deleteProfile(activeProfile.username, pass);
        activeProfile = null;
        showScreen("auth");
      } catch (err) {
        alert(err.message);
      }
    });

    document.getElementById("exportSaveBtn")?.addEventListener("click", () => {
      const json = S.exportProfile(activeProfile.username);
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${activeProfile.username}-chess-save.json`;
      a.click();
    });

    document.getElementById("importSaveBtn")?.addEventListener("click", async () => {
      const json = prompt("Paste save JSON:");
      if (!json) return;
      const pass = prompt("Passcode for imported profile:");
      try {
        await S.importProfile(json, pass);
        refreshProfile();
        toast("Import complete");
        renderProfile();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ——— Achievements ———
  function renderAchievements() {
    const el = document.getElementById("achievementsList");
    if (!el) return;

    const unlockedSet = new Set(activeProfile.achievements.unlocked);
    const order = ["Milestones", "Ladder", "Skill", "Rating"];
    const groups = new Map();
    for (const a of Ach.ACHIEVEMENTS) {
      const cat = a.category || "Other";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(a);
    }

    const cats = [...groups.keys()].sort((a, b) => {
      const ia = order.indexOf(a); const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const total = Ach.ACHIEVEMENTS.length;
    const done = Ach.ACHIEVEMENTS.filter(a => unlockedSet.has(a.id)).length;

    let html = `<div class="ach-summary"><strong>${done} / ${total}</strong> achievements unlocked
      <div class="progress-track"><div class="progress-fill" style="width:${Math.round((done / total) * 100)}%"></div></div></div>`;

    for (const cat of cats) {
      const items = groups.get(cat);
      const catDone = items.filter(a => unlockedSet.has(a.id)).length;
      html += `<h3 class="ach-cat">${cat} <span>${catDone}/${items.length}</span></h3><div class="ach-grid">`;
      html += items.map(a => {
        const unlocked = unlockedSet.has(a.id);
        const rewardBits = [];
        if (a.rewardCoins) rewardBits.push(`+${a.rewardCoins} coins`);
        if (a.rewardTokens) rewardBits.push(`+${a.rewardTokens} tokens`);
        return `
          <article class="achievement-card ${unlocked ? "unlocked" : ""}">
            <div class="ach-status">${unlocked ? "✓" : "•"}</div>
            <div class="ach-body">
              <h4>${a.name}</h4>
              <p>${a.description}</p>
              ${rewardBits.length ? `<p class="ach-reward">${rewardBits.join(" · ")}</p>` : ""}
            </div>
          </article>`;
      }).join("");
      html += `</div>`;
    }

    el.innerHTML = html;
  }

  // ——— Settings ———
  function renderSettings() {
    const p = activeProfile;
    document.getElementById("settingBotDelay").value = p.settings.botDelayMs;
    document.getElementById("settingCoords").checked = p.settings.showCoords;
    document.getElementById("settingHints").checked = p.settings.legalHints;
    document.getElementById("settingAutoQueen").checked = p.settings.autoQueen;
  }

  function setupSettings() {
    const save = async () => {
      const profile = S.validateProfile({ ...activeProfile });
      const delay = Number(document.getElementById("settingBotDelay").value);
      profile.settings.botDelayMs = Number.isFinite(delay) ? Math.min(2000, Math.max(0, delay)) : 280;
      profile.settings.showCoords = document.getElementById("settingCoords").checked;
      profile.settings.legalHints = document.getElementById("settingHints").checked;
      profile.settings.autoQueen = document.getElementById("settingAutoQueen").checked;
      await saveAndRefresh(profile);
      toast("Settings saved");
    };
    document.getElementById("saveSettingsBtn")?.addEventListener("click", save);

    document.getElementById("resetProgressBtn")?.addEventListener("click", async () => {
      const pass = prompt("Enter passcode to reset progress:");
      if (!pass) return;
      try {
        await S.loginProfile(activeProfile.username, pass);
        const fresh = S.createDefaultProfile(activeProfile.username);
        await saveAndRefresh(fresh);
        toast("Progress reset");
      } catch {
        alert("Could not reset progress. Check your passcode.");
      }
    });
  }

  // ——— Utils ———
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 2200);
  }

  async function loadServerInfo() {
    const el = document.getElementById("serverUrls");
    if (!el) return;
    try {
      const res = await fetch("/api/info");
      const data = await res.json();
      el.innerHTML = `<code>${data.local}</code>${data.lan?.length ? `<br>LAN: ${data.lan.map(u => `<code>${u}</code>`).join(" · ")}` : ""}`;
    } catch {
      el.textContent = "Run npm start and share your LAN URL.";
    }
  }

  async function init() {
    window.ChessGame.setupPlayControls();
    setupAuth();
    setupMenu();
    setupLan();
    setupProfileActions();
    setupSettings();
    setupShopTabs();
    setupTraining();
    setupCustom();

    document.querySelectorAll("[data-back]").forEach(btn => {
      btn.addEventListener("click", () => showScreen(btn.dataset.back || "menu"));
    });

    const storageInfo = await S.init();
    activeProfile = S.getActiveProfile();

    if (storageInfo.useServer) {
      console.info("Saves: SQLite database on server");
    }

    if (activeProfile) {
      const gainedTitles = Econ.evaluateTitleUnlocks(activeProfile);
      if (gainedTitles.length) {
        activeProfile = await S.saveProfile(activeProfile);
      }
      Cos.applyBoardTheme(activeProfile.selectedCosmetics.board);
      showScreen("menu");
    } else {
      showScreen("auth");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})();
