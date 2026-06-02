(() => {
  "use strict";

  const PATTERN_LABELS = {
    checker: "Classic checkers",
    marble: "Marble swirl",
    diagonal: "Diagonal weave",
    grid: "Grid lines",
    dots: "Polka dots",
    stripes: "Striped bands",
    crosshatch: "Crosshatch",
    gradient: "Soft gradient",
    neon_grid: "Neon grid"
  };

  const BOARDS = {
    classic_wood: {
      id: "classic_wood",
      name: "Classic Wood",
      themeTag: "Warm · Checker",
      description: "Warm brown squares — your starting board.",
      pattern: "checker",
      price: 0,
      currency: "coins",
      unlockType: "default",
      lightSquare: "#efe4c7",
      darkSquare: "#ad956a",
      border: "#443622",
      shellBackground: "linear-gradient(135deg, rgba(255,255,255,0.35), transparent 55%), #d7c8a6"
    },
    cream_minimal: {
      id: "cream_minimal",
      name: "Cream Minimal",
      themeTag: "Calm · Checker",
      description: "Clean cream tones for focused play.",
      pattern: "checker",
      price: 100,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#f3ead7",
      darkSquare: "#b89f74",
      border: "#2c2418",
      shellBackground: "linear-gradient(135deg, #f8f0dc, #d8c49a)"
    },
    candy_check: {
      id: "candy_check",
      name: "Candy Check",
      themeTag: "Playful · Dots",
      description: "Pastel pink and mint with bubbly dot texture.",
      pattern: "dots",
      price: 140,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#ffd6e8",
      darkSquare: "#9fd4c4",
      border: "#c45c8a",
      shellBackground: "linear-gradient(135deg, #ffe8f2, #b8e8d8)"
    },
    sunset_gradient: {
      id: "sunset_gradient",
      name: "Sunset Gradient",
      themeTag: "Vivid · Gradient",
      description: "Orange-to-violet wash across the battlefield.",
      pattern: "gradient",
      price: 165,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#ffc9a0",
      darkSquare: "#8b5a9e",
      border: "#5c2a4a",
      shellBackground: "linear-gradient(160deg, #ffecd2 0%, #fcb69f 40%, #a18cd1 100%)"
    },
    lavender_dream: {
      id: "lavender_dream",
      name: "Lavender Dream",
      themeTag: "Soft · Marble",
      description: "Purple haze marble with cloudy highlights.",
      pattern: "marble",
      price: 155,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#e8dff5",
      darkSquare: "#9a84b8",
      border: "#5a4578",
      shellBackground: "linear-gradient(135deg, #f0e6ff, #c4b0dc)"
    },
    forest_green: {
      id: "forest_green",
      name: "Forest Green",
      themeTag: "Nature · Diagonal",
      description: "Moss and pine with woven diagonal texture.",
      pattern: "diagonal",
      price: 150,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#d4e4c8",
      darkSquare: "#4a6741",
      border: "#2d3e28",
      shellBackground: "linear-gradient(135deg, #c8dcc0, #3d5a35)"
    },
    ocean_depths: {
      id: "ocean_depths",
      name: "Ocean Depths",
      themeTag: "Cool · Grid",
      description: "Deep teal currents with subtle grid lines.",
      pattern: "grid",
      price: 175,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#7ec8e3",
      darkSquare: "#1a4d6e",
      border: "#0a2a3d",
      shellBackground: "linear-gradient(180deg, #5ba8c9, #0d3a52)"
    },
    midnight_marble: {
      id: "midnight_marble",
      name: "Midnight Marble",
      themeTag: "Dark · Marble",
      description: "Navy stone with silver marble veins.",
      pattern: "marble",
      price: 250,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#5a6578",
      darkSquare: "#2a3142",
      border: "#1a202c",
      shellBackground: "linear-gradient(135deg, #4a5568, #1a202c)"
    },
    blood_moon: {
      id: "blood_moon",
      name: "Blood Moon",
      themeTag: "Bold · Stripes",
      description: "Crimson and charcoal with angled stripe bands.",
      pattern: "stripes",
      price: 180,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#8b3a3a",
      darkSquare: "#2a1212",
      border: "#1a0a0a",
      shellBackground: "linear-gradient(135deg, #4a2020, #1a0a0a)"
    },
    pumpkin_spice: {
      id: "pumpkin_spice",
      name: "Pumpkin Spice",
      themeTag: "Autumn · Crosshatch",
      description: "Orange, cinnamon, and espresso crosshatch weave.",
      pattern: "crosshatch",
      price: 145,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#e8b87a",
      darkSquare: "#8b4a28",
      border: "#4a2810",
      shellBackground: "linear-gradient(135deg, #f5d4a8, #a06030)"
    },
    slate_brick: {
      id: "slate_brick",
      name: "Slate Brick",
      themeTag: "Urban · Grid",
      description: "Cool gray brick grid — modern club aesthetic.",
      pattern: "grid",
      price: 190,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#b8bcc4",
      darkSquare: "#5c6370",
      border: "#2e3238",
      shellBackground: "linear-gradient(135deg, #9aa0aa, #4a5058)"
    },
    frozen_glass: {
      id: "frozen_glass",
      name: "Frozen Glass",
      themeTag: "Icy · Marble",
      description: "Frosted pale blue with glassy marble sheen.",
      pattern: "marble",
      price: 200,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#e8f4fc",
      darkSquare: "#88b0d0",
      border: "#4a7a98",
      shellBackground: "linear-gradient(135deg, rgba(255,255,255,0.7), #a8cce0)"
    },
    backrooms_retro: {
      id: "backrooms_retro",
      name: "Backrooms Retro",
      themeTag: "Retro · Stripes",
      description: "Yellowed wallpaper stripes — unsettling nostalgia.",
      pattern: "stripes",
      price: 120,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#e8dcb0",
      darkSquare: "#c4b87a",
      border: "#8a7a48",
      shellBackground: "repeating-linear-gradient(90deg, #e5d7a0, #e5d7a0 12px, #ddd090 12px, #ddd090 24px)"
    },
    royal_blue: {
      id: "royal_blue",
      name: "Royal Blue",
      themeTag: "Premium · Checker",
      description: "Regal cobalt and ice blue checkerboard.",
      pattern: "checker",
      price: 2,
      currency: "royalTokens",
      unlockType: "shop",
      lightSquare: "#c5d8f0",
      darkSquare: "#3d5a80",
      border: "#1d3557",
      shellBackground: "linear-gradient(135deg, #a8c0e0, #3d5a80)"
    },
    cyber_grid: {
      id: "cyber_grid",
      name: "Cyber Grid",
      themeTag: "Digital · Neon grid",
      description: "Black void with cyan laser grid overlay.",
      pattern: "neon_grid",
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      lightSquare: "#1e3a42",
      darkSquare: "#0a1218",
      border: "#00e5c0",
      shellBackground: "linear-gradient(135deg, #0d1518, #1a3a40)",
      glow: "0 0 14px rgba(0, 229, 192, 0.35)"
    },
    hologram: {
      id: "hologram",
      name: "Hologram",
      themeTag: "Sci-fi · Gradient",
      description: "Iridescent pink-teal shift with prism glow.",
      pattern: "gradient",
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      lightSquare: "#c8b8ff",
      darkSquare: "#4a8a9a",
      border: "#7a5cff",
      shellBackground: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 50%, #fda4af 100%)",
      glow: "0 0 16px rgba(122, 92, 255, 0.35)"
    },
    gold_luxury: {
      id: "gold_luxury",
      name: "Gold Luxury",
      themeTag: "Luxury · Crosshatch",
      description: "Black and gold woven crosshatch pattern.",
      pattern: "crosshatch",
      price: 4,
      currency: "royalTokens",
      unlockType: "shop",
      lightSquare: "#4a4028",
      darkSquare: "#1a1608",
      border: "#c9a227",
      shellBackground: "linear-gradient(135deg, #2a2410, #0a0804)",
      glow: "0 0 10px rgba(201, 162, 39, 0.35)"
    },
    obsidian: {
      id: "obsidian",
      name: "Obsidian",
      themeTag: "Minimal · Diagonal",
      description: "Charcoal diagonal weave — sharp and quiet.",
      pattern: "diagonal",
      price: 220,
      currency: "coins",
      unlockType: "shop",
      lightSquare: "#5a5a5a",
      darkSquare: "#2a2a2a",
      border: "#111111",
      shellBackground: "linear-gradient(135deg, #3a3a3a, #1a1a1a)"
    },
    rose_gold: {
      id: "rose_gold",
      name: "Rose Gold",
      themeTag: "Elegant · Dots",
      description: "Blush and copper speckled dot pattern.",
      pattern: "dots",
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      lightSquare: "#f0d4cc",
      darkSquare: "#a87868",
      border: "#8a5048",
      shellBackground: "linear-gradient(135deg, #fce8e4, #c9a090)",
      glow: "0 0 8px rgba(200, 140, 120, 0.3)"
    },
    matrix_rain: {
      id: "matrix_rain",
      name: "Matrix Rain",
      themeTag: "Hacker · Neon grid",
      description: "Green-on-black digital rain aesthetic.",
      pattern: "neon_grid",
      price: 4,
      currency: "royalTokens",
      unlockType: "shop",
      lightSquare: "#1a4a28",
      darkSquare: "#0a180a",
      border: "#3dff6a",
      shellBackground: "linear-gradient(180deg, #0a1a0a, #051005)",
      glow: "0 0 12px rgba(61, 255, 106, 0.3)"
    },
    sandstone_dunes: {
      id: "sandstone_dunes",
      name: "Sandstone Dunes",
      themeTag: "Desert · Crosshatch",
      description: "Sun-baked tan and clay with woven grain.",
      pattern: "crosshatch",
      price: 130,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 3,
      lightSquare: "#e8d4a8",
      darkSquare: "#b8884a",
      border: "#6a4a28",
      shellBackground: "linear-gradient(135deg, #f0e0bc, #c09858)"
    },
    coral_reef: {
      id: "coral_reef",
      name: "Coral Reef",
      themeTag: "Tropical · Dots",
      description: "Coral pink and lagoon teal with bubble dots.",
      pattern: "dots",
      price: 160,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 5,
      lightSquare: "#ffc4b0",
      darkSquare: "#2a9d8f",
      border: "#1a6a60",
      shellBackground: "linear-gradient(135deg, #ffd8c8, #2a9d8f)"
    },
    sakura_bloom: {
      id: "sakura_bloom",
      name: "Sakura Bloom",
      themeTag: "Spring · Dots",
      description: "Cherry blossom petals over soft cream.",
      pattern: "dots",
      price: 175,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 7,
      lightSquare: "#ffe4ee",
      darkSquare: "#e08aa8",
      border: "#b85a7a",
      shellBackground: "linear-gradient(135deg, #fff0f6, #e8a0bc)"
    },
    emerald_isle: {
      id: "emerald_isle",
      name: "Emerald Isle",
      themeTag: "Verdant · Diagonal",
      description: "Rolling green hills woven on the diagonal.",
      pattern: "diagonal",
      price: 200,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 9,
      lightSquare: "#bfe0a0",
      darkSquare: "#2e7d4f",
      border: "#1a4a2c",
      shellBackground: "linear-gradient(135deg, #c8e8b0, #246640)"
    },
    steel_fortress: {
      id: "steel_fortress",
      name: "Steel Fortress",
      themeTag: "Industrial · Grid",
      description: "Riveted gunmetal plating with grid seams.",
      pattern: "grid",
      price: 240,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 12,
      lightSquare: "#aab0ba",
      darkSquare: "#4a525e",
      border: "#262b32",
      shellBackground: "linear-gradient(135deg, #8a929e, #3a414a)"
    },
    onyx_pearl: {
      id: "onyx_pearl",
      name: "Onyx & Pearl",
      themeTag: "Classic · Checker",
      description: "Polished pearl against deep onyx — pure contrast.",
      pattern: "checker",
      price: 280,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 16,
      lightSquare: "#f4f1ea",
      darkSquare: "#1f1d1b",
      border: "#0a0908",
      shellBackground: "linear-gradient(135deg, #e8e4dc, #1a1816)"
    },
    amethyst_cavern: {
      id: "amethyst_cavern",
      name: "Amethyst Cavern",
      themeTag: "Crystal · Dots",
      description: "Geode purples flecked with crystal dots.",
      pattern: "dots",
      price: 2,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1000,
      lightSquare: "#d0b0ee",
      darkSquare: "#6a3a9a",
      border: "#3d1f5e",
      shellBackground: "linear-gradient(135deg, #c8a0e8, #4a2070)",
      glow: "0 0 10px rgba(150, 90, 220, 0.3)"
    },
    royal_crimson: {
      id: "royal_crimson",
      name: "Royal Crimson",
      themeTag: "Regal · Checker",
      description: "Imperial scarlet and gilt — fit for a coronation.",
      pattern: "checker",
      price: 2,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1100,
      lightSquare: "#f0c8b0",
      darkSquare: "#9a1f2a",
      border: "#5a0f18",
      shellBackground: "linear-gradient(135deg, #e8b89a, #7a1620)",
      glow: "0 0 10px rgba(180, 40, 50, 0.28)"
    },
    solar_flare: {
      id: "solar_flare",
      name: "Solar Flare",
      themeTag: "Stellar · Gradient",
      description: "Blazing corona of gold, orange, and ember.",
      pattern: "gradient",
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1200,
      lightSquare: "#ffe08a",
      darkSquare: "#e0542a",
      border: "#8a2810",
      shellBackground: "linear-gradient(160deg, #fff0a0 0%, #ff9030 45%, #c83010 100%)",
      glow: "0 0 16px rgba(255, 130, 40, 0.4)"
    },
    galaxy_swirl: {
      id: "galaxy_swirl",
      name: "Galaxy Swirl",
      themeTag: "Cosmic · Marble",
      description: "Nebula clouds of indigo and stardust silver.",
      pattern: "marble",
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1300,
      lightSquare: "#6a5aa8",
      darkSquare: "#1a1438",
      border: "#0a0820",
      shellBackground: "radial-gradient(circle at 30% 20%, #5a4a98, #120a2a)",
      glow: "0 0 16px rgba(120, 90, 220, 0.4)"
    },
    toxic_waste: {
      id: "toxic_waste",
      name: "Toxic Waste",
      themeTag: "Hazard · Neon grid",
      description: "Radioactive ooze glowing on a containment grid.",
      pattern: "neon_grid",
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1400,
      lightSquare: "#3a5a18",
      darkSquare: "#0a1604",
      border: "#9aff2a",
      shellBackground: "linear-gradient(135deg, #1a2a08, #060c02)",
      glow: "0 0 14px rgba(154, 255, 42, 0.38)"
    },
    deep_space: {
      id: "deep_space",
      name: "Deep Space",
      themeTag: "Void · Neon grid",
      description: "The endless dark, mapped by a faint star grid.",
      pattern: "neon_grid",
      price: 4,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1600,
      lightSquare: "#1a2240",
      darkSquare: "#05080f",
      border: "#5a7aff",
      shellBackground: "radial-gradient(circle at 50% 30%, #1a2a55, #02040a)",
      glow: "0 0 18px rgba(90, 122, 255, 0.45)"
    },
    champions_board: {
      id: "champions_board",
      name: "Champion's Board",
      themeTag: "Prestige · Crosshatch",
      description: "Black lacquer and 24k gold — earned at the summit.",
      pattern: "crosshatch",
      price: 5,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1900,
      lightSquare: "#3a2f12",
      darkSquare: "#100b02",
      border: "#f0c040",
      shellBackground: "linear-gradient(135deg, #2a2008, #080500)",
      glow: "0 0 22px rgba(240, 192, 64, 0.5)"
    },
    impossible_board: {
      id: "impossible_board",
      name: "Impossible Board",
      themeTag: "Legendary · Gradient",
      description: "Unlocked only by defeating The Checkmate Engine.",
      pattern: "gradient",
      price: 0,
      currency: "coins",
      unlockType: "achievement",
      lightSquare: "#4a2080",
      darkSquare: "#120820",
      border: "#c77dff",
      shellBackground: "radial-gradient(circle at 50% 0%, #6a30b0, #0a0410)",
      glow: "0 0 22px rgba(199, 125, 255, 0.5)"
    }
  };

  const PIECES = {
    classic: {
      id: "classic",
      name: "Classic Cream",
      themeTag: "Default",
      description: "Rounded cream and ebony tournament pieces.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 0,
      currency: "coins",
      unlockType: "default",
      whiteClass: "piece-style-classic",
      blackClass: "piece-style-classic"
    },
    modern_minimal: {
      id: "modern_minimal",
      name: "Modern Minimal",
      themeTag: "Clean",
      description: "Thin, flat glyphs with crisp edges.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 80,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-modern",
      blackClass: "piece-style-modern"
    },
    porcelain: {
      id: "porcelain",
      name: "Porcelain",
      themeTag: "Ceramic",
      description: "Glossy white ceramic with ink-black opponents.",
      previewGlyphs: { w: "♕", b: "♛" },
      price: 110,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-porcelain-w",
      blackClass: "piece-style-porcelain-b"
    },
    marble: {
      id: "marble",
      name: "Marble Stone",
      themeTag: "Stone",
      description: "Carved marble look with veined shadows.",
      previewGlyphs: { w: "♖", b: "♜" },
      price: 130,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-marble-w",
      blackClass: "piece-style-marble-b"
    },
    copper: {
      id: "copper",
      name: "Copper Forge",
      themeTag: "Metal",
      description: "Burnished copper versus oxidized bronze.",
      previewGlyphs: { w: "♘", b: "♞" },
      price: 145,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-copper-w",
      blackClass: "piece-style-copper-b"
    },
    emerald: {
      id: "emerald",
      name: "Emerald Court",
      themeTag: "Jewel",
      description: "Jewel-green glaze with gold trim highlights.",
      previewGlyphs: { w: "♗", b: "♝" },
      price: 2,
      currency: "royalTokens",
      unlockType: "shop",
      whiteClass: "piece-style-emerald-w",
      blackClass: "piece-style-emerald-b"
    },
    crimson: {
      id: "crimson",
      name: "Crimson Order",
      themeTag: "Royal",
      description: "Deep red lacquer against obsidian foes.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 155,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-crimson-w",
      blackClass: "piece-style-crimson-b"
    },
    neon: {
      id: "neon",
      name: "Neon Arcade",
      themeTag: "Glow",
      description: "Arcade neon bloom on dark plastic.",
      previewGlyphs: { w: "♕", b: "♛" },
      price: 150,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-neon-w",
      blackClass: "piece-style-neon-b"
    },
    arcade: {
      id: "arcade",
      name: "Pixel Arcade",
      themeTag: "Retro",
      description: "Chunky 8-bit vibe with saturated colors.",
      previewGlyphs: { w: "♖", b: "♜" },
      price: 125,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-arcade-w",
      blackClass: "piece-style-arcade-b"
    },
    medieval: {
      id: "medieval",
      name: "Medieval Forge",
      themeTag: "Fantasy",
      description: "Heavy fantasy serif pieces with battle wear.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 2,
      currency: "royalTokens",
      unlockType: "shop",
      whiteClass: "piece-style-medieval",
      blackClass: "piece-style-medieval"
    },
    ghost: {
      id: "ghost",
      name: "Ghost Glass",
      themeTag: "Ethereal",
      description: "Translucent ghosts versus void silhouettes.",
      previewGlyphs: { w: "♗", b: "♝" },
      price: 165,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-ghost-w",
      blackClass: "piece-style-ghost-b"
    },
    lava: {
      id: "lava",
      name: "Lava Core",
      themeTag: "Volcanic",
      description: "Molten cracks glow through stone pieces.",
      previewGlyphs: { w: "♘", b: "♞" },
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      whiteClass: "piece-style-lava-w",
      blackClass: "piece-style-lava-b"
    },
    frost: {
      id: "frost",
      name: "Frostbite",
      themeTag: "Ice",
      description: "Icy pale pieces with frozen edges.",
      previewGlyphs: { w: "♕", b: "♛" },
      price: 120,
      currency: "coins",
      unlockType: "shop",
      whiteClass: "piece-style-frost-w",
      blackClass: "piece-style-frost-b"
    },
    gold: {
      id: "gold",
      name: "Gilded Royal",
      themeTag: "Luxury",
      description: "Gold-leaf champions versus onyx rivals.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      whiteClass: "piece-style-gold-w",
      blackClass: "piece-style-gold-b"
    },
    shadow: {
      id: "shadow",
      name: "Shadow Ops",
      themeTag: "Stealth",
      description: "Dark tactical pieces with sharp contrast.",
      previewGlyphs: { w: "♖", b: "♜" },
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      whiteClass: "piece-style-shadow-w",
      blackClass: "piece-style-shadow-b"
    },
    holo: {
      id: "holo",
      name: "Holo Foil",
      themeTag: "Prism",
      description: "Rainbow foil shimmer on every piece.",
      previewGlyphs: { w: "♕", b: "♛" },
      price: 4,
      currency: "royalTokens",
      unlockType: "shop",
      whiteClass: "piece-style-holo-w",
      blackClass: "piece-style-holo-b"
    },
    obsidian_glass: {
      id: "obsidian_glass",
      name: "Obsidian Glass",
      themeTag: "Glass",
      description: "Smoked volcanic glass with a mirror sheen.",
      previewGlyphs: { w: "♗", b: "♝" },
      price: 110,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 4,
      whiteClass: "piece-style-obsidian-w",
      blackClass: "piece-style-obsidian-b"
    },
    ivory_tower: {
      id: "ivory_tower",
      name: "Ivory Tower",
      themeTag: "Heirloom",
      description: "Hand-carved ivory and rich walnut.",
      previewGlyphs: { w: "♖", b: "♜" },
      price: 135,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 6,
      whiteClass: "piece-style-ivory-w",
      blackClass: "piece-style-ivory-b"
    },
    toxic_ooze: {
      id: "toxic_ooze",
      name: "Toxic Ooze",
      themeTag: "Hazard",
      description: "Glowing slime that drips with menace.",
      previewGlyphs: { w: "♘", b: "♞" },
      price: 155,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 8,
      whiteClass: "piece-style-toxic-w",
      blackClass: "piece-style-toxic-b"
    },
    jade_dynasty: {
      id: "jade_dynasty",
      name: "Jade Dynasty",
      themeTag: "Imperial",
      description: "Carved jade with imperial gold inlay.",
      previewGlyphs: { w: "♕", b: "♛" },
      price: 175,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 10,
      whiteClass: "piece-style-jade-w",
      blackClass: "piece-style-jade-b"
    },
    steel_knights: {
      id: "steel_knights",
      name: "Steel Knights",
      themeTag: "Forged",
      description: "Brushed steel armor versus blackened iron.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 210,
      currency: "coins",
      unlockType: "shop",
      requiredLevel: 13,
      whiteClass: "piece-style-steel-w",
      blackClass: "piece-style-steel-b"
    },
    sapphire_guard: {
      id: "sapphire_guard",
      name: "Sapphire Guard",
      themeTag: "Gem",
      description: "Faceted sapphire crystal sentinels.",
      previewGlyphs: { w: "♗", b: "♝" },
      price: 2,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1000,
      whiteClass: "piece-style-sapphire-w",
      blackClass: "piece-style-sapphire-b"
    },
    ruby_legion: {
      id: "ruby_legion",
      name: "Ruby Legion",
      themeTag: "Gem",
      description: "Blood-ruby warriors with a fierce glow.",
      previewGlyphs: { w: "♕", b: "♛" },
      price: 2,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1100,
      whiteClass: "piece-style-ruby-w",
      blackClass: "piece-style-ruby-b"
    },
    royal_amethyst: {
      id: "royal_amethyst",
      name: "Royal Amethyst",
      themeTag: "Gem",
      description: "Purple crystal royalty crowned in silver.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1250,
      whiteClass: "piece-style-amethyst-w",
      blackClass: "piece-style-amethyst-b"
    },
    galaxy_foil: {
      id: "galaxy_foil",
      name: "Galaxy Foil",
      themeTag: "Cosmic",
      description: "Pieces cut from a swirling nebula.",
      previewGlyphs: { w: "♖", b: "♜" },
      price: 3,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1350,
      whiteClass: "piece-style-galaxy-w",
      blackClass: "piece-style-galaxy-b"
    },
    phoenix_fire: {
      id: "phoenix_fire",
      name: "Phoenix Fire",
      themeTag: "Mythic",
      description: "Reborn in flame — embers trail every move.",
      previewGlyphs: { w: "♕", b: "♛" },
      price: 4,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1550,
      whiteClass: "piece-style-phoenix-w",
      blackClass: "piece-style-phoenix-b"
    },
    champion_gold: {
      id: "champion_gold",
      name: "Champion's Gold",
      themeTag: "Prestige",
      description: "Solid-gold regalia reserved for grandmasters.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 5,
      currency: "royalTokens",
      unlockType: "shop",
      requiredElo: 1900,
      whiteClass: "piece-style-champion-w",
      blackClass: "piece-style-champion-b"
    },
    impossible_set: {
      id: "impossible_set",
      name: "Impossible Set",
      themeTag: "Legendary",
      description: "Void-purple pieces for engine breakers.",
      previewGlyphs: { w: "♔", b: "♚" },
      price: 0,
      currency: "coins",
      unlockType: "achievement",
      whiteClass: "piece-style-impossible-w",
      blackClass: "piece-style-impossible-b"
    }
  };

  const TITLES = {
    "New Challenger": { id: "New Challenger", name: "New Challenger", description: "Every grandmaster started here.", unlockType: "default" },
    "Castle Kid": { id: "Castle Kid", name: "Castle Kid", description: "Reach Level 2.", unlockType: "rank", requiredLevel: 2 },
    "Knight Grinder": { id: "Knight Grinder", name: "Knight Grinder", description: "Reach Level 4.", unlockType: "rank", requiredLevel: 4 },
    "Strategist": { id: "Strategist", name: "Strategist", description: "Reach Level 7.", unlockType: "rank", requiredLevel: 7 },
    "Veteran": { id: "Veteran", name: "Veteran", description: "Reach Level 11.", unlockType: "rank", requiredLevel: 11 },
    "Warlord": { id: "Warlord", name: "Warlord", description: "Reach Level 16.", unlockType: "rank", requiredLevel: 16 },
    "Immortal": { id: "Immortal", name: "Immortal", description: "Reach Level 22.", unlockType: "rank", requiredLevel: 22 },
    "Rising Star": { id: "Rising Star", name: "Rising Star", description: "Reach 950 ELO.", unlockType: "rank", requiredElo: 950 },
    "Sharpshooter": { id: "Sharpshooter", name: "Sharpshooter", description: "Reach 1150 ELO.", unlockType: "rank", requiredElo: 1150 },
    "Tactician": { id: "Tactician", name: "Tactician", description: "Reach 1350 ELO.", unlockType: "rank", requiredElo: 1350 },
    "Maestro": { id: "Maestro", name: "Maestro", description: "Reach 1550 ELO.", unlockType: "rank", requiredElo: 1550 },
    "Prodigy": { id: "Prodigy", name: "Prodigy", description: "Reach 1750 ELO.", unlockType: "rank", requiredElo: 1750 },
    "Living Legend": { id: "Living Legend", name: "Living Legend", description: "Reach 1900 ELO.", unlockType: "rank", requiredElo: 1900 },
    "Engine Breaker": { id: "Engine Breaker", name: "Engine Breaker", description: "Defeat The Checkmate Engine.", unlockType: "achievement" }
  };

  function titleSortKey(t) {
    if (t.unlockType === "default") return 0;
    if (t.requiredLevel) return 100 + t.requiredLevel;
    if (t.requiredElo) return 10000 + t.requiredElo;
    if (t.unlockType === "achievement") return 1e9;
    return 5000;
  }

  function listTitles() {
    return Object.values(TITLES).sort((a, b) => titleSortKey(a) - titleSortKey(b));
  }

  const LEVEL_UNLOCKS = [
    { level: 2, boards: [], pieces: [], titles: ["Castle Kid"], bots: [] },
    { level: 3, boards: ["cream_minimal"], pieces: [], titles: [] },
    { level: 4, boards: [], pieces: [], titles: ["Knight Grinder"], bots: [] },
    { level: 5, boards: [], pieces: ["modern_minimal"], titles: [] },
    { level: 6, boards: ["candy_check"], pieces: [], titles: [], bots: [] },
    { level: 8, boards: ["midnight_marble"], pieces: [], titles: [] },
    { level: 10, boards: ["ocean_depths"], pieces: [], titles: [], bots: [] },
    { level: 12, boards: [], pieces: ["medieval"], titles: [] },
    { level: 15, boards: [], pieces: ["shadow"], titles: [] },
    { level: 20, boards: [], pieces: [], titles: [] }
  ];

  function applyBoardTheme(boardId) {
    const board = BOARDS[boardId] || BOARDS.classic_wood;
    const root = document.documentElement;
    const pattern = board.pattern || "checker";

    root.style.setProperty("--board-light", board.lightSquare);
    root.style.setProperty("--board-dark", board.darkSquare);
    root.style.setProperty("--board-border", board.border);
    root.style.setProperty("--board-shell-bg", board.shellBackground);
    root.style.setProperty("--board-glow", board.glow || "none");

    const shell = document.querySelector(".board-shell");
    if (shell) {
      shell.style.background = board.shellBackground;
      shell.style.boxShadow = board.glow
        ? `${board.glow}, 12px 12px 0 rgba(68, 54, 34, 0.12)`
        : "";
    }

    const grid = document.getElementById("board");
    if (grid) {
      grid.style.borderColor = board.border;
      grid.className = `board pattern-${pattern}`;
      grid.dataset.pattern = pattern;
    }
  }

  function pieceClasses(pieceId, color) {
    const set = PIECES[pieceId] || PIECES.classic;
    const base = color === "w" ? "white" : "black";
    const style = color === "w" ? set.whiteClass : set.blackClass;
    return `piece ${base} ${style}`;
  }

  function shopSortKey(item) {
    const rarityOrder = RARITY[getRarity(item)]?.order ?? 0;
    const reqWeight = (item.requiredElo || 0) + (item.requiredLevel || 0) * 30;
    const priceWeight = item.currency === "coins" ? item.price : item.price * 1000;
    return rarityOrder * 1e7 + reqWeight * 1e3 + priceWeight;
  }

  function listShopBoards() {
    return Object.values(BOARDS)
      .filter(b => b.unlockType === "shop")
      .sort((a, b) => shopSortKey(a) - shopSortKey(b));
  }

  function listShopPieces() {
    return Object.values(PIECES)
      .filter(p => p.unlockType === "shop")
      .sort((a, b) => shopSortKey(a) - shopSortKey(b));
  }

  const RARITY = {
    common: { name: "Common", order: 0 },
    rare: { name: "Rare", order: 1 },
    epic: { name: "Epic", order: 2 },
    legendary: { name: "Legendary", order: 3 }
  };

  function getRarity(item) {
    if (!item) return "common";
    if (item.unlockType === "achievement") return "legendary";
    if (item.currency === "royalTokens") return item.price >= 4 ? "legendary" : "epic";
    if (item.price >= 200) return "epic";
    if (item.price >= 135) return "rare";
    return "common";
  }

  function getPatternLabel(pattern) {
    return PATTERN_LABELS[pattern] || pattern;
  }

  function listLockedItems(catalog) {
    return Object.values(catalog).filter(item => item.unlockType === "achievement");
  }

  // Level / ELO gating. ELO uses the player's PEAK so a temporary dip never
  // re-locks something they already qualified for.
  function meetsRequirements(item, profile) {
    const reasons = [];
    if (!item) return { ok: true, reasons };
    const level = profile?.level || 1;
    const peakElo = Math.max(profile?.elo?.rating || 0, profile?.elo?.peak || 0);
    if (item.requiredLevel && level < item.requiredLevel) {
      reasons.push(`Reach Level ${item.requiredLevel}`);
    }
    if (item.requiredElo && peakElo < item.requiredElo) {
      reasons.push(`Reach ${item.requiredElo} ELO`);
    }
    return { ok: reasons.length === 0, reasons };
  }

  function requirementLabel(item) {
    const bits = [];
    if (item.requiredLevel) bits.push(`Lv ${item.requiredLevel}`);
    if (item.requiredElo) bits.push(`${item.requiredElo} ELO`);
    return bits.join(" · ");
  }

  function buildBoardPreviewHtml(board) {
    const pattern = board.pattern || "checker";
    return `
      <div class="preview-mini-board pattern-${pattern}">
        <span class="pv l"></span><span class="pv d"></span><span class="pv l"></span><span class="pv d"></span>
        <span class="pv d"></span><span class="pv l"></span><span class="pv d"></span><span class="pv l"></span>
        <span class="pv l"></span><span class="pv d"></span><span class="pv l"></span><span class="pv d"></span>
        <span class="pv d"></span><span class="pv l"></span><span class="pv d"></span><span class="pv l"></span>
      </div>`;
  }

  function applyBoardPreview(el, board) {
    if (!el) return;
    el.innerHTML = buildBoardPreviewHtml(board);
    el.style.setProperty("--pv-light", board.lightSquare);
    el.style.setProperty("--pv-dark", board.darkSquare);
    el.style.borderColor = board.border;
    if (board.glow) el.style.boxShadow = board.glow;
  }

  function applyPiecePreview(el, pieceSet) {
    if (!el) return;
    const g = pieceSet.previewGlyphs || { w: "♔", b: "♚" };
    el.innerHTML = `
      <span class="${pieceClasses(pieceSet.id, "w")} shop-piece-demo"> ${g.w} </span>
      <span class="${pieceClasses(pieceSet.id, "b")} shop-piece-demo"> ${g.b} </span>`;
  }

  window.Cosmetics = {
    BOARDS,
    PIECES,
    TITLES,
    LEVEL_UNLOCKS,
    PATTERN_LABELS,
    RARITY,
    applyBoardTheme,
    pieceClasses,
    listShopBoards,
    listShopPieces,
    listLockedItems,
    listTitles,
    getRarity,
    meetsRequirements,
    requirementLabel,
    getPatternLabel,
    buildBoardPreviewHtml,
    applyBoardPreview,
    applyPiecePreview
  };
})();
