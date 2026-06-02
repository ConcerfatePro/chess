(() => {
  "use strict";

  // Sparring bots simulate the same ELO band as the ranked ladder, but are
  // tuned a little differently (slightly looser, more "human") so practice
  // feels distinct from the rating grind. They never affect ELO/XP/coins.
  const TRAINING_BOTS = [
    {
      id: "spar_sprout",
      name: "Sparring Sprout",
      elo: 350,
      tier: "350 ELO",
      description: "A gentle warm-up partner who hangs pieces and forgets threats.",
      personality: "Playful and careless — great for trying ideas risk-free.",
      ai: {
        depth: 1,
        qDepth: 0,
        timeMs: 200,
        randomness: 0.7,
        blunderChance: 0.4,
        maxNodes: 8000,
        style: "chaotic"
      }
    },
    {
      id: "spar_scout",
      name: "Drill Scout",
      elo: 650,
      tier: "650 ELO",
      description: "Sees one move ahead and chases captures and checks.",
      personality: "Eager attacker that overextends without much of a plan.",
      ai: {
        depth: 2,
        qDepth: 1,
        timeMs: 450,
        randomness: 0.42,
        blunderChance: 0.2,
        maxNodes: 22000,
        style: "aggressive"
      }
    },
    {
      id: "spar_tutor",
      name: "Tempo Tutor",
      elo: 950,
      tier: "950 ELO",
      description: "Solid club-level play that punishes loose moves.",
      personality: "Balanced sparring partner — develops cleanly, trades fairly.",
      ai: {
        depth: 3,
        qDepth: 2,
        timeMs: 900,
        randomness: 0.2,
        blunderChance: 0.1,
        maxNodes: 70000,
        style: "balanced"
      }
    },
    {
      id: "spar_sensei",
      name: "Endgame Sensei",
      elo: 1250,
      tier: "1250 ELO",
      description: "Patient positional player who grinds small edges.",
      personality: "Defensive and precise — rewards clean technique.",
      ai: {
        depth: 4,
        qDepth: 3,
        timeMs: 1500,
        randomness: 0.12,
        blunderChance: 0.05,
        maxNodes: 170000,
        style: "positional"
      }
    },
    {
      id: "spar_mentor",
      name: "Gambit Mentor",
      elo: 1550,
      tier: "1550 ELO",
      description: "Sharp tactician who sacrifices for the initiative.",
      personality: "Aggressive and calculating — keeps you honest.",
      ai: {
        depth: 5,
        qDepth: 4,
        timeMs: 2400,
        randomness: 0.06,
        blunderChance: 0.02,
        maxNodes: 380000,
        style: "aggressive"
      }
    },
    {
      id: "spar_mirror",
      name: "Mirror Master",
      elo: 1850,
      tier: "1850 ELO",
      description: "Near-master strength with very few mistakes.",
      personality: "Cool and relentless — the ultimate sparring test.",
      ai: {
        depth: 6,
        qDepth: 5,
        timeMs: 3800,
        randomness: 0.02,
        blunderChance: 0.006,
        maxNodes: 800000,
        style: "balanced"
      }
    }
  ];

  // A defending bot used by puzzles. Difficulty scales with the puzzle.
  function puzzleAi(label, level) {
    const presets = {
      easy: { depth: 2, qDepth: 1, timeMs: 450, randomness: 0.3, blunderChance: 0.16, maxNodes: 26000 },
      medium: { depth: 3, qDepth: 2, timeMs: 800, randomness: 0.18, blunderChance: 0.08, maxNodes: 70000 },
      hard: { depth: 4, qDepth: 3, timeMs: 1400, randomness: 0.1, blunderChance: 0.03, maxNodes: 170000 }
    };
    return { label, style: "defensive", ...(presets[level] || presets.medium) };
  }

  // Each puzzle drops the player into a clearly winning position that must be
  // converted against a defending ELO bot. The coach (hint) is available.
  const PUZZLES = [
    {
      id: "extra_queen",
      name: "Up a Queen",
      theme: "Conversion",
      difficulty: "easy",
      objective: "You are a full queen ahead. Checkmate the lone king.",
      playerColor: "w",
      botName: "Defender (700)",
      botElo: 700,
      ai: puzzleAi("Defender", "easy"),
      fen: "6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1"
    },
    {
      id: "ladder_mate",
      name: "Two-Rook Ladder",
      theme: "Checkmate pattern",
      difficulty: "easy",
      objective: "Use both rooks to drive the king to the edge and mate it.",
      playerColor: "w",
      botName: "Defender (750)",
      botElo: 750,
      ai: puzzleAi("Defender", "easy"),
      fen: "6k1/5ppp/8/8/8/8/5PPP/R5RK w - - 0 1"
    },
    {
      id: "extra_rook",
      name: "Rook Advantage",
      theme: "Conversion",
      difficulty: "medium",
      objective: "You hold an extra rook. Trade down and win the endgame.",
      playerColor: "w",
      botName: "Defender (1000)",
      botElo: 1000,
      ai: puzzleAi("Defender", "medium"),
      fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1"
    },
    {
      id: "overwhelm",
      name: "Crushing Force",
      theme: "Mating attack",
      difficulty: "medium",
      objective: "Queen and rook vs a bare king. Deliver checkmate quickly.",
      playerColor: "w",
      botName: "Defender (1050)",
      botElo: 1050,
      ai: puzzleAi("Defender", "medium"),
      fen: "6k1/5ppp/8/8/8/8/5PPP/3QR1K1 w - - 0 1"
    },
    {
      id: "black_queen",
      name: "Black to Convert",
      theme: "Conversion (Black)",
      difficulty: "easy",
      objective: "Playing Black, you are a full queen up. Finish the job.",
      playerColor: "b",
      botName: "Defender (700)",
      botElo: 700,
      ai: puzzleAi("Defender", "easy"),
      fen: "3q2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1"
    },
    {
      id: "black_rook",
      name: "Black Rook Edge",
      theme: "Conversion (Black)",
      difficulty: "medium",
      objective: "Playing Black with an extra rook, convert against the defender.",
      playerColor: "b",
      botName: "Defender (1000)",
      botElo: 1000,
      ai: puzzleAi("Defender", "medium"),
      fen: "4r1k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1"
    }
  ];

  function getTrainingBot(id) {
    return TRAINING_BOTS.find(b => b.id === id) || null;
  }

  function getPuzzle(id) {
    return PUZZLES.find(p => p.id === id) || null;
  }

  function randomPuzzle(excludeId) {
    const pool = excludeId && PUZZLES.length > 1
      ? PUZZLES.filter(p => p.id !== excludeId)
      : PUZZLES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  window.TrainingData = {
    TRAINING_BOTS,
    PUZZLES,
    getTrainingBot,
    getPuzzle,
    randomPuzzle
  };
})();
