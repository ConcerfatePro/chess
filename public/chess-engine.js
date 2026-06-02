(() => {
  "use strict";

  const WHITE = "w";
  const BLACK = "b";
  const PIECES = {
    pawn: "p",
    knight: "n",
    bishop: "b",
    rook: "r",
    queen: "q",
    king: "k"
  };

  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  const MATE_SCORE = 1000000;
  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const PROMOTIONS = ["q", "r", "b", "n"];

  const PST = {
    p: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 32, 32, 20, 10, 10],
      [5, 5, 14, 30, 30, 14, 5, 5],
      [0, 0, 8, 24, 24, 8, 0, 0],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    n: [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-30, 5, 12, 18, 18, 12, 5, -30],
      [-30, 0, 18, 25, 25, 18, 0, -30],
      [-30, 5, 18, 25, 25, 18, 5, -30],
      [-30, 0, 12, 18, 18, 12, 0, -30],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    b: [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10, 5, 0, 0, 0, 0, 5, -10],
      [-10, 10, 10, 12, 12, 10, 10, -10],
      [-10, 0, 12, 15, 15, 12, 0, -10],
      [-10, 5, 10, 15, 15, 10, 5, -10],
      [-10, 0, 10, 12, 12, 10, 0, -10],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    r: [
      [0, 0, 5, 10, 10, 5, 0, 0],
      [5, 10, 10, 15, 15, 10, 10, 5],
      [-5, 0, 0, 5, 5, 0, 0, -5],
      [-5, 0, 0, 5, 5, 0, 0, -5],
      [-5, 0, 0, 5, 5, 0, 0, -5],
      [-5, 0, 0, 5, 5, 0, 0, -5],
      [-5, 0, 0, 5, 5, 0, 0, -5],
      [0, 0, 5, 10, 10, 5, 0, 0]
    ],
    q: [
      [-20, -10, -10, -5, -5, -10, -10, -20],
      [-10, 0, 5, 0, 0, 0, 0, -10],
      [-10, 5, 5, 5, 5, 5, 0, -10],
      [0, 0, 5, 5, 5, 5, 0, -5],
      [-5, 0, 5, 5, 5, 5, 0, -5],
      [-10, 0, 5, 5, 5, 5, 0, -10],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-20, -10, -10, -5, -5, -10, -10, -20]
    ],
    k: [
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-20, -30, -30, -40, -40, -30, -30, -20],
      [-10, -20, -20, -20, -20, -20, -20, -10],
      [20, 20, 0, 0, 0, 0, 20, 20],
      [25, 30, 10, 0, 0, 10, 30, 25]
    ],
    kEnd: [
      [-50, -30, -30, -30, -30, -30, -30, -50],
      [-30, -10, 0, 0, 0, 0, -10, -30],
      [-30, 0, 20, 25, 25, 20, 0, -30],
      [-30, 0, 25, 35, 35, 25, 0, -30],
      [-30, 0, 25, 35, 35, 25, 0, -30],
      [-30, 0, 20, 25, 25, 20, 0, -30],
      [-30, -10, 0, 0, 0, 0, -10, -30],
      [-50, -30, -30, -30, -30, -30, -30, -50]
    ]
  };

  const DIFFICULTIES = {
    beginner: { label: "Beginner", depth: 2, qDepth: 1, timeMs: 350, randomness: 0.42, blunderChance: 0.22, maxNodes: 12000, style: "chaotic" },
    easy: { label: "Easy", depth: 3, qDepth: 2, timeMs: 700, randomness: 0.22, blunderChance: 0.09, maxNodes: 45000, style: "aggressive" },
    normal: { label: "Normal", depth: 4, qDepth: 3, timeMs: 1200, randomness: 0.08, blunderChance: 0.03, maxNodes: 140000, style: "balanced" },
    hard: { label: "Hard", depth: 5, qDepth: 4, timeMs: 2200, randomness: 0.02, blunderChance: 0.006, maxNodes: 380000, style: "positional" },
    expert: { label: "Expert", depth: 6, qDepth: 5, timeMs: 3800, randomness: 0, blunderChance: 0, maxNodes: 750000, style: "balanced" },
    master: { label: "Master", depth: 7, qDepth: 6, timeMs: 5500, randomness: 0, blunderChance: 0, maxNodes: 1200000, style: "balanced" }
  };

  // Per-personality evaluation weights. These shape *how* a bot plays without
  // changing the rules, so each ladder tier feels distinct.
  const STYLE_WEIGHTS = {
    balanced:   { pawns: 1.0, kingSafety: 1.0, threats: 1.0, development: 1.0, center: 1.0, bishopPair: 1.0, kingAttack: 1.0 },
    chaotic:    { pawns: 0.6, kingSafety: 0.5, threats: 0.7, development: 0.8, center: 1.2, bishopPair: 0.8, kingAttack: 1.3 },
    aggressive: { pawns: 0.8, kingSafety: 0.7, threats: 1.35, development: 1.25, center: 1.4, bishopPair: 1.0, kingAttack: 1.6 },
    positional: { pawns: 1.45, kingSafety: 1.15, threats: 0.9, development: 1.2, center: 1.1, bishopPair: 1.25, kingAttack: 0.8 },
    defensive:  { pawns: 1.2, kingSafety: 1.7, threats: 0.95, development: 0.9, center: 0.85, bishopPair: 1.05, kingAttack: 0.6 }
  };

  function getStyleWeights(style) {
    return STYLE_WEIGHTS[style] || STYLE_WEIGHTS.balanced;
  }

  function initialState() {
    return {
      board: [
        ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
        ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
        ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"]
      ],
      turn: WHITE,
      castling: { wK: true, wQ: true, bK: true, bQ: true },
      ep: null,
      halfmove: 0,
      fullmove: 1,
      history: [],
      lastMove: null
    };
  }

  function cloneState(state) {
    return {
      board: state.board.map(row => row.slice()),
      turn: state.turn,
      castling: { ...state.castling },
      ep: state.ep ? { ...state.ep } : null,
      halfmove: state.halfmove,
      fullmove: state.fullmove,
      history: state.history.slice(),
      lastMove: state.lastMove ? { ...state.lastMove } : null
    };
  }

  function opposite(color) {
    return color === WHITE ? BLACK : WHITE;
  }

  function colorOf(piece) {
    return piece ? piece[0] : null;
  }

  function typeOf(piece) {
    return piece ? piece[1] : null;
  }

  function inside(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function squareName(r, c) {
    return `${FILES[c]}${8 - r}`;
  }

  function parseSquare(name) {
    const file = FILES.indexOf(name[0]);
    const rank = Number(name[1]);
    return { r: 8 - rank, c: file };
  }

  function pushMove(moves, state, fr, fc, tr, tc, extras = {}) {
    const piece = state.board[fr][fc];
    const target = state.board[tr][tc];
    moves.push({
      fr,
      fc,
      tr,
      tc,
      piece,
      captured: extras.enPassant ? `${opposite(colorOf(piece))}p` : target,
      promotion: extras.promotion || null,
      castle: extras.castle || null,
      enPassant: Boolean(extras.enPassant)
    });
  }

  function generateLegalMoves(state, color = state.turn) {
    const pseudo = generatePseudoMoves(state, color);
    const legal = [];

    for (const move of pseudo) {
      const next = cloneState(state);
      makeMove(next, move, { skipHistory: true });
      if (!isKingInCheck(next, color)) {
        legal.push(move);
      }
    }

    return legal;
  }

  function generatePseudoMoves(state, color = state.turn) {
    const moves = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece || colorOf(piece) !== color) continue;

        const type = typeOf(piece);
        if (type === "p") generatePawnMoves(state, moves, r, c, color);
        if (type === "n") generateKnightMoves(state, moves, r, c, color);
        if (type === "b") generateSlidingMoves(state, moves, r, c, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
        if (type === "r") generateSlidingMoves(state, moves, r, c, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
        if (type === "q") generateSlidingMoves(state, moves, r, c, color, [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]);
        if (type === "k") generateKingMoves(state, moves, r, c, color);
      }
    }

    return moves;
  }

  function generatePawnMoves(state, moves, r, c, color) {
    const dir = color === WHITE ? -1 : 1;
    const startRow = color === WHITE ? 6 : 1;
    const promotionRow = color === WHITE ? 0 : 7;
    const one = r + dir;

    if (inside(one, c) && !state.board[one][c]) {
      if (one === promotionRow) {
        for (const promotion of PROMOTIONS) pushMove(moves, state, r, c, one, c, { promotion });
      } else {
        pushMove(moves, state, r, c, one, c);
      }

      const two = r + dir * 2;
      if (r === startRow && inside(two, c) && !state.board[two][c]) {
        pushMove(moves, state, r, c, two, c);
      }
    }

    for (const dc of [-1, 1]) {
      const tr = r + dir;
      const tc = c + dc;
      if (!inside(tr, tc)) continue;

      const target = state.board[tr][tc];
      if (target && colorOf(target) !== color) {
        if (tr === promotionRow) {
          for (const promotion of PROMOTIONS) pushMove(moves, state, r, c, tr, tc, { promotion });
        } else {
          pushMove(moves, state, r, c, tr, tc);
        }
      }

      if (state.ep && state.ep.r === tr && state.ep.c === tc) {
        const capturedPawn = state.board[r][tc];
        if (capturedPawn === `${opposite(color)}p`) {
          pushMove(moves, state, r, c, tr, tc, { enPassant: true });
        }
      }
    }
  }

  function generateKnightMoves(state, moves, r, c, color) {
    const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

    for (const [dr, dc] of offsets) {
      const tr = r + dr;
      const tc = c + dc;
      if (!inside(tr, tc)) continue;

      const target = state.board[tr][tc];
      if (!target || colorOf(target) !== color) {
        pushMove(moves, state, r, c, tr, tc);
      }
    }
  }

  function generateSlidingMoves(state, moves, r, c, color, directions) {
    for (const [dr, dc] of directions) {
      let tr = r + dr;
      let tc = c + dc;

      while (inside(tr, tc)) {
        const target = state.board[tr][tc];
        if (!target) {
          pushMove(moves, state, r, c, tr, tc);
        } else {
          if (colorOf(target) !== color) {
            pushMove(moves, state, r, c, tr, tc);
          }
          break;
        }
        tr += dr;
        tc += dc;
      }
    }
  }

  function generateKingMoves(state, moves, r, c, color) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const tr = r + dr;
        const tc = c + dc;
        if (!inside(tr, tc)) continue;

        const target = state.board[tr][tc];
        if (!target || colorOf(target) !== color) {
          pushMove(moves, state, r, c, tr, tc);
        }
      }
    }

    addCastlingMoves(state, moves, r, c, color);
  }

  function addCastlingMoves(state, moves, r, c, color) {
    const enemy = opposite(color);
    const home = color === WHITE ? 7 : 0;

    if (r !== home || c !== 4) return;
    if (isKingInCheck(state, color)) return;

    const kingSideKey = color === WHITE ? "wK" : "bK";
    const queenSideKey = color === WHITE ? "wQ" : "bQ";

    if (
      state.castling[kingSideKey] &&
      state.board[home][7] === `${color}r` &&
      !state.board[home][5] &&
      !state.board[home][6] &&
      !isSquareAttacked(state, home, 5, enemy) &&
      !isSquareAttacked(state, home, 6, enemy)
    ) {
      pushMove(moves, state, r, c, home, 6, { castle: "K" });
    }

    if (
      state.castling[queenSideKey] &&
      state.board[home][0] === `${color}r` &&
      !state.board[home][1] &&
      !state.board[home][2] &&
      !state.board[home][3] &&
      !isSquareAttacked(state, home, 3, enemy) &&
      !isSquareAttacked(state, home, 2, enemy)
    ) {
      pushMove(moves, state, r, c, home, 2, { castle: "Q" });
    }
  }

  function makeMove(state, move, options = {}) {
    const piece = state.board[move.fr][move.fc];
    const color = colorOf(piece);
    const type = typeOf(piece);
    const target = state.board[move.tr][move.tc];
    const oldCastling = { ...state.castling };
    const oldEp = state.ep ? { ...state.ep } : null;
    const oldHalfmove = state.halfmove;

    state.board[move.fr][move.fc] = null;

    if (move.enPassant) {
      state.board[move.fr][move.tc] = null;
    }

    const finalPiece = move.promotion ? `${color}${move.promotion}` : piece;
    state.board[move.tr][move.tc] = finalPiece;

    if (move.castle === "K") {
      state.board[move.tr][5] = state.board[move.tr][7];
      state.board[move.tr][7] = null;
    }

    if (move.castle === "Q") {
      state.board[move.tr][3] = state.board[move.tr][0];
      state.board[move.tr][0] = null;
    }

    updateCastlingRights(state, piece, move, target);

    state.ep = null;
    if (type === "p" && Math.abs(move.tr - move.fr) === 2) {
      state.ep = { r: (move.fr + move.tr) / 2, c: move.fc };
    }

    if (type === "p" || target || move.enPassant) {
      state.halfmove = 0;
    } else {
      state.halfmove += 1;
    }

    if (state.turn === BLACK) state.fullmove += 1;

    state.turn = opposite(state.turn);
    state.lastMove = { fr: move.fr, fc: move.fc, tr: move.tr, tc: move.tc };

    if (!options.skipHistory) {
      state.history.push({
        move: { ...move },
        oldCastling,
        oldEp,
        oldHalfmove,
        captured: target
      });
    }

    return state;
  }

  function updateCastlingRights(state, piece, move, capturedTarget) {
    const color = colorOf(piece);
    const type = typeOf(piece);

    if (type === "k") {
      if (color === WHITE) {
        state.castling.wK = false;
        state.castling.wQ = false;
      } else {
        state.castling.bK = false;
        state.castling.bQ = false;
      }
    }

    if (type === "r") {
      if (move.fr === 7 && move.fc === 0) state.castling.wQ = false;
      if (move.fr === 7 && move.fc === 7) state.castling.wK = false;
      if (move.fr === 0 && move.fc === 0) state.castling.bQ = false;
      if (move.fr === 0 && move.fc === 7) state.castling.bK = false;
    }

    if (capturedTarget && typeOf(capturedTarget) === "r") {
      if (move.tr === 7 && move.tc === 0) state.castling.wQ = false;
      if (move.tr === 7 && move.tc === 7) state.castling.wK = false;
      if (move.tr === 0 && move.tc === 0) state.castling.bQ = false;
      if (move.tr === 0 && move.tc === 7) state.castling.bK = false;
    }
  }

  function findKing(state, color) {
    const king = `${color}k`;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (state.board[r][c] === king) return { r, c };
      }
    }
    return null;
  }

  function isKingInCheck(state, color) {
    const king = findKing(state, color);
    if (!king) return true;
    return isSquareAttacked(state, king.r, king.c, opposite(color));
  }

  function isSquareAttacked(state, targetR, targetC, byColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece || colorOf(piece) !== byColor) continue;

        const type = typeOf(piece);

        if (type === "p") {
          const dir = byColor === WHITE ? -1 : 1;
          if (targetR === r + dir && Math.abs(targetC - c) === 1) return true;
        }

        if (type === "n") {
          const dr = Math.abs(targetR - r);
          const dc = Math.abs(targetC - c);
          if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) return true;
        }

        if (type === "k") {
          if (Math.max(Math.abs(targetR - r), Math.abs(targetC - c)) === 1) return true;
        }

        if (type === "b" || type === "r" || type === "q") {
          if (attacksByRay(state, r, c, targetR, targetC, type)) return true;
        }
      }
    }
    return false;
  }

  function attacksByRay(state, r, c, targetR, targetC, type) {
    const dr = targetR - r;
    const dc = targetC - c;
    let stepR = 0;
    let stepC = 0;

    if (dr === 0 && dc !== 0 && (type === "r" || type === "q")) {
      stepC = Math.sign(dc);
    } else if (dc === 0 && dr !== 0 && (type === "r" || type === "q")) {
      stepR = Math.sign(dr);
    } else if (Math.abs(dr) === Math.abs(dc) && dr !== 0 && (type === "b" || type === "q")) {
      stepR = Math.sign(dr);
      stepC = Math.sign(dc);
    } else {
      return false;
    }

    let cr = r + stepR;
    let cc = c + stepC;
    while (cr !== targetR || cc !== targetC) {
      if (state.board[cr][cc]) return false;
      cr += stepR;
      cc += stepC;
    }
    return true;
  }

  function getGameStatus(state) {
    const legalMoves = generateLegalMoves(state, state.turn);
    const inCheck = isKingInCheck(state, state.turn);

    if (legalMoves.length === 0 && inCheck) {
      return { over: true, reason: "checkmate", winner: opposite(state.turn), legalMoves, inCheck };
    }

    if (legalMoves.length === 0) {
      return { over: true, reason: "stalemate", winner: null, legalMoves, inCheck };
    }

    if (state.halfmove >= 100) {
      return { over: true, reason: "fifty-move draw", winner: null, legalMoves, inCheck };
    }

    if (isInsufficientMaterial(state)) {
      return { over: true, reason: "insufficient material", winner: null, legalMoves, inCheck };
    }

    return { over: false, reason: null, winner: null, legalMoves, inCheck };
  }

  function isInsufficientMaterial(state) {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (piece && typeOf(piece) !== "k") pieces.push({ piece, r, c });
      }
    }

    if (pieces.length === 0) return true;
    if (pieces.length === 1 && ["b", "n"].includes(typeOf(pieces[0].piece))) return true;

    if (pieces.length === 2 && pieces.every(p => typeOf(p.piece) === "b")) {
      const colors = pieces.map(p => (p.r + p.c) % 2);
      return colors[0] === colors[1];
    }

    return false;
  }

  function toFen(state) {
    const rows = [];
    for (let r = 0; r < 8; r++) {
      let row = "";
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece) {
          empty += 1;
        } else {
          if (empty) {
            row += empty;
            empty = 0;
          }
          const type = typeOf(piece);
          row += colorOf(piece) === WHITE ? type.toUpperCase() : type;
        }
      }
      if (empty) row += empty;
      rows.push(row);
    }

    let castling = "";
    if (state.castling.wK) castling += "K";
    if (state.castling.wQ) castling += "Q";
    if (state.castling.bK) castling += "k";
    if (state.castling.bQ) castling += "q";
    if (!castling) castling = "-";

    const ep = state.ep ? squareName(state.ep.r, state.ep.c) : "-";
    return `${rows.join("/")} ${state.turn} ${castling} ${ep} ${state.halfmove} ${state.fullmove}`;
  }

  function fromFen(fen) {
    const parts = String(fen || "").trim().split(/\s+/);
    const placement = parts[0] || "8/8/8/8/8/8/8/8";
    const turn = parts[1] === "b" ? BLACK : WHITE;
    const castling = parts[2] || "-";
    const ep = parts[3] || "-";
    const halfmove = Number(parts[4]);
    const fullmove = Number(parts[5]);

    const board = [];
    const rows = placement.split("/");
    for (let r = 0; r < 8; r++) {
      const row = [];
      const chars = (rows[r] || "").split("");
      for (const ch of chars) {
        if (/\d/.test(ch)) {
          const count = Number(ch);
          for (let k = 0; k < count; k++) row.push(null);
        } else {
          const color = ch === ch.toUpperCase() ? WHITE : BLACK;
          row.push(`${color}${ch.toLowerCase()}`);
        }
      }
      while (row.length < 8) row.push(null);
      board.push(row.slice(0, 8));
    }
    while (board.length < 8) board.push([null, null, null, null, null, null, null, null]);

    return {
      board,
      turn,
      castling: {
        wK: castling.includes("K"),
        wQ: castling.includes("Q"),
        bK: castling.includes("k"),
        bQ: castling.includes("q")
      },
      ep: ep && ep !== "-" ? parseSquare(ep) : null,
      halfmove: Number.isFinite(halfmove) ? halfmove : 0,
      fullmove: Number.isFinite(fullmove) && fullmove > 0 ? fullmove : 1,
      history: [],
      lastMove: null
    };
  }

  function moveToUci(move) {
    return `${squareName(move.fr, move.fc)}${squareName(move.tr, move.tc)}${move.promotion || ""}`;
  }

  function sameMove(a, b) {
    return a && b && a.fr === b.fr && a.fc === b.fc && a.tr === b.tr && a.tc === b.tc && (a.promotion || null) === (b.promotion || null);
  }

  function moveToNotation(stateBefore, move) {
    const piece = stateBefore.board[move.fr][move.fc];
    const type = typeOf(piece);
    const color = colorOf(piece);

    if (move.castle === "K") return "O-O";
    if (move.castle === "Q") return "O-O-O";

    const capture = stateBefore.board[move.tr][move.tc] || move.enPassant;
    const pieceName = type === "p" ? "" : type.toUpperCase();
    const fromFile = type === "p" && capture ? FILES[move.fc] : "";
    let notation = `${pieceName}${fromFile}${capture ? "x" : ""}${squareName(move.tr, move.tc)}`;

    if (move.promotion) notation += `=${move.promotion.toUpperCase()}`;
    if (move.enPassant) notation += " e.p.";

    const next = cloneState(stateBefore);
    makeMove(next, move, { skipHistory: true });
    const status = getGameStatus(next);
    if (status.reason === "checkmate") notation += "#";
    else if (isKingInCheck(next, opposite(color))) notation += "+";

    return notation;
  }

  function evaluate(state, botColor) {
    const status = getGameStatusFast(state);
    if (status.terminal) {
      if (status.reason === "checkmate") {
        return status.winner === botColor ? MATE_SCORE : -MATE_SCORE;
      }
      return 0;
    }

    let score = 0;
    const endgame = isEndgame(state);
    const bishops = { w: 0, b: 0 };
    const pawnsByFile = { w: Array(8).fill(0), b: Array(8).fill(0) };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece) continue;

        const color = colorOf(piece);
        const type = typeOf(piece);
        const sign = color === botColor ? 1 : -1;
        const tableRow = color === WHITE ? r : 7 - r;
        const table = type === "k" && endgame ? PST.kEnd : PST[type];

        score += sign * PIECE_VALUES[type];
        score += sign * (table ? table[tableRow][c] : 0);

        if (type === "b") bishops[color] += 1;
        if (type === "p") pawnsByFile[color][c] += 1;
      }
    }

    if (bishops.w >= 2) score += botColor === WHITE ? 35 : -35;
    if (bishops.b >= 2) score += botColor === BLACK ? 35 : -35;

    score += evaluatePawnStructure(state, botColor, pawnsByFile);
    score += evaluateKingSafety(state, botColor);
    score += evaluateThreats(state, botColor);
    score += evaluateDevelopment(state, botColor);
    score += evaluateCenter(state, botColor);

    return score;
  }

  function getGameStatusFast(state) {
    const legalMoves = generateLegalMoves(state, state.turn);
    if (legalMoves.length > 0) return { terminal: false };
    const inCheck = isKingInCheck(state, state.turn);
    if (inCheck) return { terminal: true, reason: "checkmate", winner: opposite(state.turn) };
    return { terminal: true, reason: "draw", winner: null };
  }

  function isEndgame(state) {
    let queens = 0;
    let minorMajor = 0;

    for (const row of state.board) {
      for (const piece of row) {
        if (!piece) continue;
        const type = typeOf(piece);
        if (type === "q") queens += 1;
        if (["r", "b", "n"].includes(type)) minorMajor += 1;
      }
    }

    return queens === 0 || minorMajor <= 4;
  }

  function evaluatePawnStructure(state, botColor, pawnsByFile) {
    let score = 0;

    for (const color of [WHITE, BLACK]) {
      const sign = color === botColor ? 1 : -1;
      for (let file = 0; file < 8; file++) {
        const count = pawnsByFile[color][file];
        if (count > 1) score -= sign * 18 * (count - 1);

        if (count > 0) {
          const hasNeighbor = (file > 0 && pawnsByFile[color][file - 1] > 0) || (file < 7 && pawnsByFile[color][file + 1] > 0);
          if (!hasNeighbor) score -= sign * 14;
        }
      }
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece || typeOf(piece) !== "p") continue;

        const color = colorOf(piece);
        const sign = color === botColor ? 1 : -1;
        if (isPassedPawn(state, r, c, color)) {
          const progress = color === WHITE ? 6 - r : r - 1;
          score += sign * (28 + progress * 14);
        }
      }
    }

    return score;
  }

  function isPassedPawn(state, r, c, color) {
    const enemy = opposite(color);
    const dir = color === WHITE ? -1 : 1;

    for (const dc of [-1, 0, 1]) {
      const file = c + dc;
      if (file < 0 || file > 7) continue;

      let row = r + dir;
      while (inside(row, file)) {
        if (state.board[row][file] === `${enemy}p`) return false;
        row += dir;
      }
    }

    return true;
  }

  function evaluateKingSafety(state, botColor) {
    let score = 0;

    for (const color of [WHITE, BLACK]) {
      const sign = color === botColor ? 1 : -1;
      const king = findKing(state, color);
      if (!king) continue;

      const enemy = opposite(color);
      const danger = countAttacksNearKing(state, king.r, king.c, enemy);
      score -= sign * danger * 12;

      const pawnShieldRow = color === WHITE ? king.r - 1 : king.r + 1;
      for (const dc of [-1, 0, 1]) {
        const c = king.c + dc;
        if (inside(pawnShieldRow, c) && state.board[pawnShieldRow][c] === `${color}p`) {
          score += sign * 12;
        }
      }

      if (isKingInCheck(state, color)) score -= sign * 55;
    }

    return score;
  }

  function countAttacksNearKing(state, kr, kc, enemy) {
    let count = 0;
    for (let r = kr - 1; r <= kr + 1; r++) {
      for (let c = kc - 1; c <= kc + 1; c++) {
        if (!inside(r, c)) continue;
        if (isSquareAttacked(state, r, c, enemy)) count += 1;
      }
    }
    return count;
  }

  function evaluateThreats(state, botColor) {
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece || typeOf(piece) === "k") continue;

        const color = colorOf(piece);
        const sign = color === botColor ? 1 : -1;
        const enemy = opposite(color);
        const attacked = isSquareAttacked(state, r, c, enemy);
        const defended = isSquareAttacked(state, r, c, color);
        if (attacked && !defended) score -= sign * Math.min(90, PIECE_VALUES[typeOf(piece)] * 0.18);
      }
    }

    return score;
  }

  function evaluateDevelopment(state, botColor) {
    let score = 0;

    const opening = state.fullmove <= 14;
    if (!opening) return 0;

    const homePieces = [
      { square: [7, 1], piece: "wn", color: WHITE },
      { square: [7, 2], piece: "wb", color: WHITE },
      { square: [7, 5], piece: "wb", color: WHITE },
      { square: [7, 6], piece: "wn", color: WHITE },
      { square: [0, 1], piece: "bn", color: BLACK },
      { square: [0, 2], piece: "bb", color: BLACK },
      { square: [0, 5], piece: "bb", color: BLACK },
      { square: [0, 6], piece: "bn", color: BLACK }
    ];

    for (const item of homePieces) {
      const [r, c] = item.square;
      if (state.board[r][c] === item.piece) {
        score += item.color === botColor ? -12 : 12;
      }
    }

    return score;
  }

  function evaluateCenter(state, botColor) {
    const center = [[3, 3], [3, 4], [4, 3], [4, 4]];
    let score = 0;

    for (const [r, c] of center) {
      const piece = state.board[r][c];
      if (piece) score += colorOf(piece) === botColor ? 16 : -16;
      if (isSquareAttacked(state, r, c, botColor)) score += 6;
      if (isSquareAttacked(state, r, c, opposite(botColor))) score -= 6;
    }

    return score;
  }

  // Full positional evaluation, weighted by the bot's personality. Used at the
  // search horizon so each style steers toward different kinds of positions.
  function evaluatePositional(state, botColor, weights) {
    const w = weights || STYLE_WEIGHTS.balanced;
    let score = 0;
    const endgame = isEndgame(state);
    const bishops = { w: 0, b: 0 };
    const pawnsByFile = { w: Array(8).fill(0), b: Array(8).fill(0) };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece) continue;
        const color = colorOf(piece);
        const type = typeOf(piece);
        const sign = color === botColor ? 1 : -1;
        const tableRow = color === WHITE ? r : 7 - r;
        const table = type === "k" && endgame ? PST.kEnd : PST[type];
        score += sign * PIECE_VALUES[type];
        score += sign * (table ? table[tableRow][c] : 0);
        if (type === "b") bishops[color] += 1;
        if (type === "p") pawnsByFile[color][c] += 1;
      }
    }

    if (bishops.w >= 2) score += (botColor === WHITE ? 35 : -35) * w.bishopPair;
    if (bishops.b >= 2) score += (botColor === BLACK ? 35 : -35) * w.bishopPair;

    score += evaluatePawnStructure(state, botColor, pawnsByFile) * w.pawns;
    score += evaluateKingSafety(state, botColor) * w.kingSafety;
    score += evaluateThreats(state, botColor) * w.threats;
    score += evaluateDevelopment(state, botColor) * w.development;
    score += evaluateCenter(state, botColor) * w.center;
    score += evaluateKingAttack(state, botColor) * w.kingAttack;

    return Math.round(score);
  }

  function evaluateKingAttack(state, botColor) {
    let score = 0;
    const oppKing = findKing(state, opposite(botColor));
    const myKing = findKing(state, botColor);
    if (oppKing) score += countAttacksNearKing(state, oppKing.r, oppKing.c, botColor) * 9;
    if (myKing) score -= countAttacksNearKing(state, myKing.r, myKing.c, opposite(botColor)) * 9;
    return score;
  }

  function createSearchContext(difficulty) {
    return {
      deadline: Date.now() + difficulty.timeMs,
      timedOut: false,
      nodes: 0,
      maxNodes: difficulty.maxNodes,
      tt: new Map(),
      qDepth: difficulty.qDepth,
      weights: getStyleWeights(difficulty.style),
      killers: [[], []],
      history: Object.create(null),
      yieldEvery: 640,
      yieldCounter: 0
    };
  }

  function historyKey(move) {
    return `${move.piece}${move.fr}${move.fc}${move.tr}${move.tc}`;
  }

  function pickBlunderMove(state, legalMoves, botColor) {
    const orderedBad = legalMoves
      .map(move => {
        const next = cloneState(state);
        makeMove(next, move, { skipHistory: true });
        return { move, score: evaluate(next, botColor) };
      })
      .sort((a, b) => a.score - b.score);
    return orderedBad[Math.floor(Math.random() * Math.min(4, orderedBad.length))].move;
  }

  function searchBestMove(state, difficulty, botColor, context) {
    const legalMoves = generateLegalMoves(state, botColor);
    if (legalMoves.length === 0) return null;

    if (Math.random() < difficulty.blunderChance) {
      return pickBlunderMove(state, legalMoves, botColor);
    }

    let bestMove = legalMoves[0];
    let bestScore = -Infinity;
    let completedScores = [];

    for (let depth = 1; depth <= difficulty.depth; depth++) {
      let localBest = bestMove;
      let localBestScore = -Infinity;
      const scored = [];
      const ordered = orderMoves(state, legalMoves, botColor, context, depth);

      for (const move of ordered) {
        if (Date.now() > context.deadline || context.nodes > context.maxNodes) {
          context.timedOut = true;
          break;
        }

        const next = cloneState(state);
        makeMove(next, move, { skipHistory: true });
        const score = minimax(next, depth - 1, -Infinity, Infinity, botColor, context, 1);
        scored.push({ move, score });

        if (score > localBestScore) {
          localBestScore = score;
          localBest = move;
        }
      }

      if (context.timedOut && completedScores.length > 0) break;

      if (scored.length > 0) {
        scored.sort((a, b) => b.score - a.score);
        completedScores = scored;
        bestMove = localBest;
        bestScore = localBestScore;
        storeKiller(context, depth, localBest);
      }

      if (Math.abs(bestScore) > MATE_SCORE - 1000) break;
    }

    if (completedScores.length > 1 && difficulty.randomness > 0 && Math.random() < difficulty.randomness) {
      const spread = difficulty.depth >= 5 ? 80 : 130;
      const top = completedScores.filter(item => item.score >= completedScores[0].score - spread).slice(0, 4);
      return top[Math.floor(Math.random() * top.length)].move;
    }

    return bestMove;
  }

  function resolveDifficulty(spec) {
    if (spec && typeof spec === "object" && typeof spec.depth === "number") {
      return {
        label: spec.label || "Custom",
        depth: spec.depth,
        qDepth: typeof spec.qDepth === "number" ? spec.qDepth : Math.max(0, spec.depth - 1),
        timeMs: spec.timeMs ?? 1200,
        randomness: spec.randomness ?? 0,
        blunderChance: spec.blunderChance ?? 0,
        maxNodes: spec.maxNodes ?? 150000,
        style: spec.style || "balanced"
      };
    }
    return DIFFICULTIES[spec] || DIFFICULTIES.normal;
  }

  function chooseBotMove(state, difficultySpec = "normal", botColor = state.turn) {
    const difficulty = resolveDifficulty(difficultySpec);
    const context = createSearchContext(difficulty);
    return searchBestMove(state, difficulty, botColor, context);
  }

  async function chooseBotMoveAsync(state, difficultySpec = "normal", botColor = state.turn) {
    const difficulty = resolveDifficulty(difficultySpec);
    const legalMoves = generateLegalMoves(state, botColor);
    if (legalMoves.length === 0) return null;

    if (Math.random() < difficulty.blunderChance) {
      return pickBlunderMove(state, legalMoves, botColor);
    }

    const context = createSearchContext(difficulty);
    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;
    let completedScores = [];

    for (let depth = 1; depth <= difficulty.depth; depth++) {
      let localBest = bestMove;
      let localBestScore = -Infinity;
      const scored = [];
      const ordered = orderMoves(state, legalMoves, botColor, context, depth);

      for (const move of ordered) {
        if (Date.now() > context.deadline || context.nodes > context.maxNodes) {
          context.timedOut = true;
          break;
        }

        const next = cloneState(state);
        makeMove(next, move, { skipHistory: true });
        const score = minimax(next, depth - 1, -Infinity, Infinity, botColor, context, 1);
        scored.push({ move, score });

        if (score > localBestScore) {
          localBestScore = score;
          localBest = move;
        }

        if (context.nodes % context.yieldEvery === 0) {
          await yieldToMain();
        }
      }

      if (context.timedOut && completedScores.length > 0) break;

      if (scored.length > 0) {
        scored.sort((a, b) => b.score - a.score);
        completedScores = scored;
        bestMove = localBest;
        bestScore = localBestScore;
        storeKiller(context, depth, localBest);
      }

      if (Math.abs(bestScore) > MATE_SCORE - 1000) break;
      await yieldToMain();
    }

    if (completedScores.length > 1 && difficulty.randomness > 0 && Math.random() < difficulty.randomness) {
      const spread = difficulty.depth >= 5 ? 80 : 130;
      const top = completedScores.filter(item => item.score >= completedScores[0].score - spread).slice(0, 4);
      return top[Math.floor(Math.random() * top.length)].move;
    }

    return bestMove;
  }

  function storeKiller(context, depth, move) {
    const slot = depth % 2;
    const killers = context.killers[slot];
    if (!killers.some(item => sameMove(item, move))) {
      killers.unshift(move);
      if (killers.length > 2) killers.pop();
    }
    const key = historyKey(move);
    context.history[key] = (context.history[key] || 0) + depth * depth;
  }

  function minimax(state, depth, alpha, beta, botColor, context, ply) {
    context.nodes += 1;
    if (context.nodes % 256 === 0 && (Date.now() > context.deadline || context.nodes > context.maxNodes)) {
      context.timedOut = true;
      return evaluatePositional(state, botColor, context.weights);
    }

    const terminal = getGameStatusFast(state);
    if (terminal.terminal) {
      if (terminal.reason === "checkmate") {
        return terminal.winner === botColor ? MATE_SCORE - ply : -MATE_SCORE + ply;
      }
      return 0;
    }

    if (depth <= 0) {
      return quiescence(state, alpha, beta, botColor, context, context.qDepth, ply);
    }

    const key = `${toFen(state)}|${depth}`;
    const cached = context.tt.get(key);
    if (cached && cached.depth >= depth) {
      if (cached.flag === "exact") return cached.score;
      if (cached.flag === "lower") alpha = Math.max(alpha, cached.score);
      if (cached.flag === "upper") beta = Math.min(beta, cached.score);
      if (alpha >= beta) return cached.score;
    }

    const maximizing = state.turn === botColor;
    const originalAlpha = alpha;
    const originalBeta = beta;
    const moves = orderMoves(state, generateLegalMoves(state, state.turn), botColor, context, depth + ply);
    let best = maximizing ? -Infinity : Infinity;
    let bestMove = null;

    for (const move of moves) {
      if (context.timedOut) break;

      const next = cloneState(state);
      makeMove(next, move, { skipHistory: true });
      const score = minimax(next, depth - 1, alpha, beta, botColor, context, ply + 1);

      if (maximizing) {
        if (score > best) {
          best = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, best);
      } else {
        if (score < best) {
          best = score;
          bestMove = move;
        }
        beta = Math.min(beta, best);
      }

      if (beta <= alpha) {
        storeKiller(context, depth + ply, move);
        break;
      }
    }

    if (bestMove) {
      const key = historyKey(bestMove);
      context.history[key] = (context.history[key] || 0) + depth * depth;
    }

    let flag = "exact";
    if (best <= originalAlpha) flag = "upper";
    else if (best >= originalBeta) flag = "lower";
    context.tt.set(key, { depth, score: best, flag });

    return best;
  }

  function quiescence(state, alpha, beta, botColor, context, qDepth, ply) {
    context.nodes += 1;
    // Full positional eval at the horizon; cheap material eval deeper in the
    // capture search to keep it fast.
    const standPat = qDepth === context.qDepth
      ? evaluatePositional(state, botColor, context.weights)
      : evaluateStatic(state, botColor);
    const maximizing = state.turn === botColor;

    if (qDepth <= 0) return standPat;

    if (maximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;
    }

    const tactical = orderMoves(state, generateLegalMoves(state, state.turn), botColor, context, qDepth + ply).filter(move => {
      return move.captured || move.promotion || move.enPassant;
    });

    for (const move of tactical) {
      if (context.timedOut) break;

      const next = cloneState(state);
      makeMove(next, move, { skipHistory: true });
      const score = quiescence(next, alpha, beta, botColor, context, qDepth - 1, ply + 1);

      if (maximizing) {
        if (score > alpha) alpha = score;
        if (alpha >= beta) return beta;
      } else {
        if (score < beta) beta = score;
        if (beta <= alpha) return alpha;
      }
    }

    return maximizing ? alpha : beta;
  }

  function evaluateStatic(state, botColor) {
    let score = 0;
    const endgame = isEndgame(state);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece) continue;
        const color = colorOf(piece);
        const type = typeOf(piece);
        const sign = color === botColor ? 1 : -1;
        const tableRow = color === WHITE ? r : 7 - r;
        const table = type === "k" && endgame ? PST.kEnd : PST[type];
        score += sign * PIECE_VALUES[type];
        score += sign * (table ? table[tableRow][c] : 0);
      }
    }

    if (isKingInCheck(state, botColor)) score -= 60;
    if (isKingInCheck(state, opposite(botColor))) score += 60;
    return score;
  }

  function orderMoves(state, moves, botColor, context, depth = 1) {
    const killers = context?.killers?.[depth % 2] || [];
    return moves.slice().sort((a, b) => {
      return scoreMoveForOrdering(state, b, botColor, context, killers)
        - scoreMoveForOrdering(state, a, botColor, context, killers);
    });
  }

  function scoreMoveForOrdering(state, move, botColor, context, killers) {
    let score = 0;
    const movingType = typeOf(move.piece);
    const target = move.captured;

    if (killers.some(k => sameMove(k, move))) score += 90000;
    if (context?.history) score += context.history[historyKey(move)] || 0;

    if (target) {
      score += 10000 + PIECE_VALUES[typeOf(target)] * 10 - PIECE_VALUES[movingType];
    }

    if (move.promotion) score += PIECE_VALUES[move.promotion] + 8000;
    if (move.castle) score += 600;
    if ([3, 4].includes(move.tr) && [3, 4].includes(move.tc)) score += 80;

    const next = cloneState(state);
    makeMove(next, move, { skipHistory: true });
    if (isKingInCheck(next, opposite(colorOf(move.piece)))) score += 700;

    if (isSquareAttacked(next, move.tr, move.tc, opposite(colorOf(move.piece)))) {
      score -= Math.floor(PIECE_VALUES[typeOf(next.board[move.tr][move.tc])] * 0.35);
    }

    if (colorOf(move.piece) === botColor) score += 4;
    return score;
  }

  function materialBalance(state) {
    let white = 0;
    let black = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece) continue;
        const val = PIECE_VALUES[typeOf(piece)];
        if (colorOf(piece) === WHITE) white += val;
        else black += val;
      }
    }
    return white - black;
  }

  window.ChessEngine = {
    WHITE,
    BLACK,
    PIECES,
    PIECE_VALUES,
    DIFFICULTIES,
    initialState,
    cloneState,
    generateLegalMoves,
    generatePseudoMoves,
    makeMove,
    isKingInCheck,
    isSquareAttacked,
    getGameStatus,
    evaluate,
    chooseBotMove,
    chooseBotMoveAsync,
    resolveDifficulty,
    materialBalance,
    moveToNotation,
    moveToUci,
    sameMove,
    squareName,
    parseSquare,
    toFen,
    fromFen,
    opposite,
    colorOf,
    typeOf,
    inside
  };
})();
