(() => {
  "use strict";

  const E = window.ChessEngine;
  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const PIECE_GLYPHS = {
    wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
    bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟"
  };

  const DRAW_TITLES = {
    stalemate: "STALEMATE",
    "fifty-move draw": "DRAW",
    "insufficient material": "DRAW"
  };

  let els = {};
  let options = null;
  let state = E.initialState();
  let selected = null;
  let selectedMoves = [];
  let flipped = false;
  let waitingForPromotion = null;
  let gameOver = false;
  let resignWinner = null;
  let thinking = false;
  let botSearchToken = 0;
  let movesForHistory = [];
  let capturedByWhite = [];
  let capturedByBlack = [];
  let matchEnded = false;
  let hintMove = null;
  let hintBusy = false;
  let matchStats = {
    minPlayerMaterial: 0,
    playerHadQueenAtEnd: true,
    comebackWin: false
  };

  // Strong, deterministic engine used only by the training coach (hint helper).
  const COACH_SPEC = {
    label: "Coach",
    depth: 4,
    qDepth: 3,
    timeMs: 1500,
    randomness: 0,
    blunderChance: 0,
    maxNodes: 220000,
    style: "balanced"
  };

  function isTraining() {
    return Boolean(options?.training);
  }

  function playerColor() {
    return options?.playerColor || E.WHITE;
  }

  function botColor() {
    return E.opposite(playerColor());
  }

  function isBotMode() {
    return options?.mode === "bot";
  }

  function isHumanTurn() {
    if (gameOver || thinking) return false;
    if (!isBotMode()) return true;
    return state.turn === playerColor();
  }

  function getProfile() {
    return options?.profile || null;
  }

  function applyCosmetics() {
    const profile = getProfile();
    if (!profile) return;
    window.Cosmetics.applyBoardTheme(profile.selectedCosmetics.board);
  }

  function startGame(opts) {
    options = opts;
    matchEnded = false;
    botSearchToken += 1;
    state = opts?.startFen ? E.fromFen(opts.startFen) : E.initialState();
    hintMove = null;
    hintBusy = false;
    selected = null;
    selectedMoves = [];
    waitingForPromotion = null;
    gameOver = false;
    resignWinner = null;
    thinking = false;
    movesForHistory = [];
    capturedByWhite = [];
    capturedByBlack = [];
    matchStats = {
      minPlayerMaterial: playerMaterialScore(),
      playerHadQueenAtEnd: true,
      comebackWin: false
    };

    els.gameOverOverlay?.classList.add("hidden");
    els.promotionModal?.classList.add("hidden");
    flipped = isBotMode() && playerColor() === E.BLACK;

    applyCosmetics();
    bindElements();
    setupHintUi();
    renderAll();
    maybeBotMove();
  }

  function setupHintUi() {
    const training = isTraining();
    if (els.hintBtn) {
      els.hintBtn.classList.toggle("hidden", !training);
      els.hintBtn.disabled = false;
    }
    if (els.hintText) {
      els.hintText.classList.add("hidden");
      els.hintText.textContent = "";
    }
  }

  function setHintText(message, tone = "") {
    if (!els.hintText) return;
    els.hintText.textContent = message;
    els.hintText.className = `hint-text ${tone}`.trim();
    els.hintText.classList.toggle("hidden", !message);
  }

  function clearHint() {
    hintMove = null;
    if (els.hintText) {
      els.hintText.textContent = "";
      els.hintText.classList.add("hidden");
    }
  }

  async function requestHint() {
    if (!isTraining() || hintBusy) return;
    if (!isHumanTurn()) {
      setHintText("Wait for your turn to ask the coach.", "muted");
      return;
    }
    const legal = E.generateLegalMoves(state, playerColor());
    if (legal.length === 0) {
      setHintText("No legal moves available.", "muted");
      return;
    }

    hintBusy = true;
    hintMove = null;
    if (els.hintBtn) els.hintBtn.disabled = true;
    setHintText("Coach is analysing…", "thinking");

    const token = botSearchToken;
    let move = null;
    try {
      move = await E.chooseBotMoveAsync(state, COACH_SPEC, playerColor());
    } catch (err) {
      move = null;
    }

    hintBusy = false;
    if (els.hintBtn) els.hintBtn.disabled = false;

    if (token !== botSearchToken || gameOver || state.turn !== playerColor()) {
      return;
    }
    if (!move) {
      setHintText("Coach could not find a move.", "muted");
      return;
    }

    hintMove = { fr: move.fr, fc: move.fc, tr: move.tr, tc: move.tc };
    const notation = E.moveToNotation(state, move);
    setHintText(`Coach suggests ${notation} (${E.squareName(move.fr, move.fc)} → ${E.squareName(move.tr, move.tc)}).`, "good");
    renderBoard();
  }

  function bindElements() {
    els = {
      board: document.getElementById("board"),
      statusText: document.getElementById("statusText"),
      thinkingBox: document.getElementById("thinkingBox"),
      thinkingText: document.getElementById("thinkingText"),
      whiteCaptured: document.getElementById("whiteCaptured"),
      blackCaptured: document.getElementById("blackCaptured"),
      moveHistory: document.getElementById("moveHistory"),
      copyPgnBtn: document.getElementById("copyPgnBtn"),
      promotionModal: document.getElementById("promotionModal"),
      gameOverOverlay: document.getElementById("gameOverOverlay"),
      advantageText: document.getElementById("advantageText"),
      rankLabels: document.getElementById("rankLabels"),
      fileLabelsTop: document.getElementById("fileLabelsTop"),
      fileLabelsBottom: document.getElementById("fileLabelsBottom"),
      topName: document.getElementById("topName"),
      bottomName: document.getElementById("bottomName"),
      topMeta: document.getElementById("topMeta"),
      bottomMeta: document.getElementById("bottomMeta"),
      topMaterial: document.getElementById("topMaterial"),
      bottomMaterial: document.getElementById("bottomMaterial"),
      matchMeta: document.getElementById("matchMeta"),
      hintBtn: document.getElementById("hintBtn"),
      hintText: document.getElementById("hintText")
    };
  }

  function playerMaterialScore() {
    const color = playerColor();
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece && E.colorOf(piece) === color) {
          score += E.PIECE_VALUES[E.typeOf(piece)];
        }
      }
    }
    return score;
  }

  function trackMatchStats() {
    const mat = playerMaterialScore();
    matchStats.minPlayerMaterial = Math.min(matchStats.minPlayerMaterial, mat);
    const queen = `${playerColor()}q`;
    let hasQueen = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (state.board[r][c] === queen) hasQueen = true;
      }
    }
    matchStats.playerHadQueenAtEnd = hasQueen;
  }

  function renderAll() {
    const profile = getProfile();
    const showCoords = profile?.settings?.showCoords !== false;
    document.querySelector(".board-frame")?.classList.toggle("hide-coords", !showCoords);

    renderEdgeLabels();
    renderPlayerBars();
    renderBoard();
    updateStatus();
    updateCaptured();
    updateAdvantage();
    updateHistory();
    updateMatchMeta();
    els.board?.classList.toggle("locked", thinking || gameOver);
    els.thinkingBox?.classList.toggle("hidden", !thinking);
  }

  function updateMatchMeta() {
    if (!els.matchMeta || !options?.bot) return;
    const bot = options.bot;
    if (isTraining()) {
      const label = options.puzzle ? "Puzzle" : "Sparring";
      els.matchMeta.textContent = `${label} · ${bot.tier} · No stakes · Coach available`;
      return;
    }
    const fee = options.entryFeePaid || 0;
    els.matchMeta.textContent = fee > 0
      ? `${bot.tier} · Entry ${fee} coins · Victory reward ${bot.rewardCoins}`
      : `${bot.tier} · Free challenge · +${bot.rewardCoins} coins`;
  }

  function renderEdgeLabels() {
    if (!els.rankLabels) return;
    const ranks = flipped ? [...RANKS].reverse() : RANKS;
    const files = flipped ? [...FILES].reverse() : FILES;
    els.rankLabels.innerHTML = ranks.map(rank => `<span>${rank}</span>`).join("");
    els.fileLabelsTop.innerHTML = files.map(file => `<span>${file}</span>`).join("");
    els.fileLabelsBottom.innerHTML = files.map(file => `<span>${file}</span>`).join("");
  }

  function renderPlayerBars() {
    const whiteOnBottom = !flipped;
    const topColor = whiteOnBottom ? E.BLACK : E.WHITE;
    const bottomColor = whiteOnBottom ? E.WHITE : E.BLACK;
    const profile = getProfile();

    els.topName.textContent = topColor === E.WHITE ? "White" : "Black";
    els.bottomName.textContent = bottomColor === E.WHITE ? "White" : "Black";

    if (!isBotMode()) {
      els.topMeta.textContent = "Human";
      els.bottomMeta.textContent = "Human";
    } else {
      const bot = options.bot;
      const youAre = playerColor() === E.WHITE ? "White" : "Black";
      els.topMeta.textContent = topColor === playerColor()
        ? `You · ${profile?.username || ""}`
        : `${bot.name} · ${bot.tier}`;
      els.bottomMeta.textContent = bottomColor === playerColor()
        ? `You · ${profile?.username || ""}`
        : `${bot.name} · ${bot.tier}`;
    }

    const balance = E.materialBalance(state);
    const topSign = topColor === E.WHITE ? balance : -balance;
    const bottomSign = bottomColor === E.WHITE ? balance : -balance;
    els.topMaterial.textContent = formatMaterialPill(topSign);
    els.bottomMaterial.textContent = formatMaterialPill(bottomSign);
    els.topMaterial.className = `material-pill ${pillClass(topSign)}`;
    els.bottomMaterial.className = `material-pill ${pillClass(bottomSign)}`;
  }

  function formatMaterialPill(sign) {
    if (sign === 0) return "±0";
    const pawns = Math.round(Math.abs(sign) / 100);
    return sign > 0 ? `+${pawns}` : `-${pawns}`;
  }

  function pillClass(sign) {
    if (sign > 0) return "ahead";
    if (sign < 0) return "behind";
    return "even";
  }

  function updateAdvantage() {
    const balance = E.materialBalance(state);
    if (balance === 0) {
      els.advantageText.textContent = "Even material";
      els.advantageText.className = "advantage-text even";
      return;
    }
    const pawns = (Math.abs(balance) / 100).toFixed(1).replace(/\.0$/, "");
    const leader = balance > 0 ? "White" : "Black";
    els.advantageText.textContent = `${leader} +${pawns} pawns`;
    els.advantageText.className = `advantage-text ${balance > 0 ? "white-ahead" : "black-ahead"}`;
  }

  function renderBoard() {
    if (!els.board) return;
    const profile = getProfile();
    const pieceStyle = profile?.selectedCosmetics?.pieces || "classic";
    const hints = profile?.settings?.legalHints !== false;

    els.board.innerHTML = "";
    const inCheckColor = !gameOver && E.isKingInCheck(state, state.turn) ? state.turn : null;
    const kingInCheck = inCheckColor ? findKingSquare(inCheckColor) : null;

    for (let displayR = 0; displayR < 8; displayR++) {
      for (let displayC = 0; displayC < 8; displayC++) {
        const r = flipped ? 7 - displayR : displayR;
        const c = flipped ? 7 - displayC : displayC;
        const square = document.createElement("button");
        square.type = "button";
        square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
        square.setAttribute("aria-label", E.squareName(r, c));

        const last = state.lastMove;
        if (last && ((last.fr === r && last.fc === c) || (last.tr === r && last.tc === c))) {
          square.classList.add("last-move");
        }
        if (kingInCheck && kingInCheck.r === r && kingInCheck.c === c) {
          square.classList.add("in-check");
        }
        if (selected && selected.r === r && selected.c === c) {
          square.classList.add("selected");
        }
        if (hintMove) {
          if (hintMove.fr === r && hintMove.fc === c) square.classList.add("hint-from");
          if (hintMove.tr === r && hintMove.tc === c) square.classList.add("hint-to");
        }

        if (hints) {
          const legal = selectedMoves.find(move => move.tr === r && move.tc === c);
          if (legal) {
            square.classList.add((state.board[r][c] || legal.enPassant) ? "capture" : "legal");
          }
        }

        const piece = state.board[r][c];
        if (piece) {
          const pieceEl = document.createElement("span");
          pieceEl.className = window.Cosmetics.pieceClasses(pieceStyle, E.colorOf(piece));
          pieceEl.textContent = PIECE_GLYPHS[piece];
          pieceEl.setAttribute("aria-hidden", "true");
          square.appendChild(pieceEl);
        }

        square.addEventListener("click", () => handleSquareClick(r, c));
        els.board.appendChild(square);
      }
    }
  }

  function findKingSquare(color) {
    const king = `${color}k`;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (state.board[r][c] === king) return { r, c };
      }
    }
    return null;
  }

  function handleSquareClick(r, c) {
    if (!isHumanTurn()) return;
    if (hintMove) clearHint();
    const piece = state.board[r][c];

    if (selected) {
      const targetMoves = selectedMoves.filter(move => move.tr === r && move.tc === c);
      if (targetMoves.length > 0) {
        const profile = getProfile();
        const autoQueen = profile?.settings?.autoQueen;
        if (targetMoves.length > 1 && targetMoves.some(move => move.promotion)) {
          if (autoQueen) {
            const queenMove = targetMoves.find(m => m.promotion === "q");
            if (queenMove) {
              commitMove(queenMove);
              return;
            }
          }
          waitingForPromotion = { moves: targetMoves };
          els.promotionModal.classList.remove("hidden");
          return;
        }
        commitMove(targetMoves[0]);
        return;
      }
    }

    if (piece && E.colorOf(piece) === state.turn) {
      selected = { r, c };
      selectedMoves = E.generateLegalMoves(state, state.turn).filter(move => move.fr === r && move.fc === c);
    } else {
      selected = null;
      selectedMoves = [];
    }
    renderAll();
  }

  function commitMove(move) {
    if (gameOver) return;
    clearHint();

    const before = E.cloneState(state);
    const notation = E.moveToNotation(before, move);
    const capture = move.captured;

    if (capture) {
      if (E.colorOf(move.piece) === E.WHITE) capturedByWhite.push(capture);
      else capturedByBlack.push(capture);
    }

    E.makeMove(state, move);
    movesForHistory.push({ color: E.colorOf(move.piece), notation, uci: E.moveToUci(move) });
    trackMatchStats();

    selected = null;
    selectedMoves = [];
    waitingForPromotion = null;
    els.promotionModal.classList.add("hidden");

    const status = E.getGameStatus(state);
    if (status.over) {
      finishGame(status);
    } else {
      renderAll();
      maybeBotMove();
    }
  }

  async function maybeBotMove() {
    if (!isBotMode() || gameOver || state.turn !== botColor()) return;

    const token = ++botSearchToken;
    thinking = true;
    const bot = options.bot;
    els.thinkingText.textContent = `${bot.name} is thinking…`;
    renderAll();

    const delay = getProfile()?.settings?.botDelayMs ?? 280;
    await new Promise(r => setTimeout(r, delay));

    const aiSpec = window.BotConfigs.getAiSpec(bot);
    const move = await E.chooseBotMoveAsync(state, aiSpec, botColor());

    if (token !== botSearchToken || gameOver) return;
    thinking = false;

    const status = E.getGameStatus(state);
    if (status.over) {
      finishGame(status);
      renderAll();
      return;
    }
    if (!move) {
      finishGame(E.getGameStatus(state));
      renderAll();
      return;
    }
    commitMove(move);
  }

  function finishGame(status) {
    if (matchEnded) return;
    gameOver = true;
    thinking = false;
    botSearchToken += 1;
    selected = null;
    selectedMoves = [];
    trackMatchStats();

    if (isBotMode()) {
      matchEnded = true;
      const playerWon = status.reason === "checkmate" && status.winner === playerColor();
      const playerLost = status.reason === "checkmate" && status.winner === E.opposite(playerColor());
      let result = "draw";
      if (playerWon) result = "win";
      else if (playerLost) result = "loss";

      const startMaterial = options.startingPlayerMaterial ?? 3900;
      matchStats.comebackWin = result === "win" && matchStats.minPlayerMaterial < startMaterial - 500;

      options.onMatchEnd?.({
        result,
        status,
        fullMoves: state.fullmove,
        keptQueen: matchStats.playerHadQueenAtEnd,
        comebackWin: matchStats.comebackWin,
        moves: movesForHistory.length
      });
    } else {
      showSimpleOverlay(status);
    }
  }

  function showSimpleOverlay(status) {
    const endKicker = document.getElementById("endKicker");
    const endTitle = document.getElementById("endTitle");
    const endSubtitle = document.getElementById("endSubtitle");
    if (status.reason === "checkmate") {
      endKicker.textContent = "King trapped";
      endTitle.textContent = "CHECKMATE";
      endSubtitle.textContent = `${status.winner === E.WHITE ? "White" : "Black"} wins.`;
    } else if (status.reason === "resignation") {
      endKicker.textContent = "Resignation";
      endTitle.textContent = `${status.winner === E.WHITE ? "WHITE" : "BLACK"} WINS`;
      endSubtitle.textContent = `${status.winner === E.WHITE ? "Black" : "White"} resigned.`;
    } else {
      endKicker.textContent = "Game drawn";
      endTitle.textContent = DRAW_TITLES[status.reason] || "DRAW";
      endSubtitle.textContent = formatDrawReason(status.reason);
    }
    document.getElementById("gameOverOverlay")?.classList.remove("hidden");
  }

  function resign() {
    if (gameOver) return;
    resignWinner = E.opposite(state.turn);
    if (isBotMode()) {
      matchEnded = true;
      gameOver = true;
      botSearchToken += 1;
      options.onMatchEnd?.({
        result: "loss",
        status: { reason: "resignation" },
        fullMoves: state.fullmove,
        keptQueen: matchStats.playerHadQueenAtEnd,
        comebackWin: false,
        moves: movesForHistory.length
      });
    } else {
      gameOver = true;
      showSimpleOverlay({ reason: "resignation", winner: resignWinner });
      renderAll();
    }
  }

  function abandonGame() {
    gameOver = true;
    thinking = false;
    botSearchToken += 1;
    selected = null;
    selectedMoves = [];
    waitingForPromotion = null;
    els.promotionModal?.classList.add("hidden");
  }

  function updateStatus() {
    if (resignWinner) return;
    const status = E.getGameStatus(state);
    const turnName = state.turn === E.WHITE ? "White" : "Black";

    if (status.over) {
      if (status.reason === "checkmate") {
        els.statusText.innerHTML = `<strong>Checkmate.</strong> ${status.winner === E.WHITE ? "White" : "Black"} wins.`;
      } else {
        els.statusText.innerHTML = `<strong>Draw.</strong> ${formatDrawReason(status.reason)}.`;
      }
      return;
    }

    els.statusText.innerHTML = `
      <strong>${turnName} to move.</strong>${status.inCheck ? " <strong>Check!</strong>" : ""}<br>
      Move ${state.fullmove}
    `;
  }

  function formatDrawReason(reason) {
    if (reason === "fifty-move draw") return "Fifty-move rule";
    if (reason === "insufficient material") return "Insufficient material";
    return String(reason || "draw").charAt(0).toUpperCase() + String(reason).slice(1);
  }

  function updateCaptured() {
    els.whiteCaptured.innerHTML = capturedByWhite.map(pieceToSmallBadge).join("") || "—";
    els.blackCaptured.innerHTML = capturedByBlack.map(pieceToSmallBadge).join("") || "—";
  }

  function pieceToSmallBadge(piece) {
    const profile = getProfile();
    const pieceStyle = profile?.selectedCosmetics?.pieces || "classic";
    const cls = window.Cosmetics.pieceClasses(pieceStyle, E.colorOf(piece));
    return `<span class="${cls} captured-chip">${PIECE_GLYPHS[piece]}</span>`;
  }

  function updateHistory() {
    els.moveHistory.innerHTML = "";
    for (let i = 0; i < movesForHistory.length; i += 2) {
      const li = document.createElement("li");
      const moveNo = Math.floor(i / 2) + 1;
      const white = movesForHistory[i]?.notation || "";
      const black = movesForHistory[i + 1]?.notation || "";
      li.innerHTML = `<span class="move-no">${moveNo}.</span><span class="move-white">${white}</span><span class="move-black">${black}</span>`;
      els.moveHistory.appendChild(li);
    }
    els.moveHistory.scrollTop = els.moveHistory.scrollHeight;
  }

  function copyPgn() {
    const lines = [];
    for (let i = 0; i < movesForHistory.length; i += 2) {
      const moveNo = Math.floor(i / 2) + 1;
      lines.push(`${moveNo}. ${movesForHistory[i]?.notation || ""}${movesForHistory[i + 1]?.notation ? " " + movesForHistory[i + 1].notation : ""}`);
    }
    const text = lines.join(" ");
    navigator.clipboard?.writeText(text).catch(() => window.prompt("Copy:", text));
  }

  function setupPlayControls() {
    document.getElementById("newGameBtn")?.addEventListener("click", () => {
      if (options?.onRestart) {
        abandonGame();
        options.onRestart();
      } else {
        startGame(options);
      }
    });
    document.getElementById("flipBtn")?.addEventListener("click", () => {
      flipped = !flipped;
      renderAll();
    });
    document.getElementById("resignBtn")?.addEventListener("click", resign);
    document.getElementById("hintBtn")?.addEventListener("click", requestHint);
    document.getElementById("copyPgnBtn")?.addEventListener("click", copyPgn);
    document.getElementById("backFromPlayBtn")?.addEventListener("click", () => {
      if (options.onBack?.() !== false) abandonGame();
    });

    els.promotionModal = document.getElementById("promotionModal");
    els.promotionModal?.addEventListener("click", event => {
      if (event.target === els.promotionModal) {
        waitingForPromotion = null;
        els.promotionModal.classList.add("hidden");
        renderAll();
        return;
      }
      const button = event.target.closest("button[data-piece]");
      if (!button || !waitingForPromotion) return;
      const move = waitingForPromotion.moves.find(item => item.promotion === button.dataset.piece);
      if (move) commitMove(move);
    });
  }

  window.ChessGame = {
    startGame,
    setupPlayControls,
    resign
  };
})();
