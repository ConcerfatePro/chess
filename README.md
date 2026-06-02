# Chess

Play chess in your browser against a ladder of bots, or share a link with
someone on your wifi and play against them. You earn coins as you play and can
spend them on cosmetics.

## Run it

```bash
npm install
npm start
```

The terminal prints a link you can send to others on your network.

## What it does

- Play ranked matches against a ladder of bots to earn coins and XP.
- Play another person, either on the same device or over your local network.
- Custom practice: set up any position by placing your pieces and the bot's
  pieces wherever you want, pick which bot to play, and practice. This does not
  affect your ELO, coins, or level.
- Training mode with sparring bots and puzzles, also with no stakes.
- Spend coins in the shop on board and piece cosmetics, then equip them.
- Track stats, match history, achievements, and a server leaderboard.

## What it's made of

- Node.js for the server (`server.js`). No build step.
- Plain HTML, CSS, and JavaScript on the frontend. No frameworks.
- The chess rules and bot search are written from scratch, so it runs fully
  offline. There is no external engine like Stockfish.
- `better-sqlite3` for saving profiles.

## Saves

Profiles are stored in a SQLite database (`data/chess.db`) on whichever machine
runs `npm start`. Everyone who connects through the shared link uses the same
database. Passcodes are hashed before being stored.

If you open `index.html` directly without the server, the game falls back to the
browser's `localStorage` instead.
