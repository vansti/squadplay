# AGENT.md — SquadPlay AI Onboarding Guide

> **Purpose:** System context for Antigravity agents working on this repository.
> Auto-generated from a full codebase scan. Keep this file updated when major architectural decisions change.

---

## 1. Project Overview

**SquadPlay** is a multiplayer real-time party game platform where friends play mini-games together from any device — no app downloads required. It is a full-stack TypeScript monorepo with three packages:

| Package | Path | Purpose |
|---------|------|---------|
| **client** | `client/` | React SPA — the player-facing UI |
| **server** | `server/` | Node.js API + real-time game server |
| **shared** | `shared/` | Shared TypeScript constants (Socket.io event names) |

### Current Games

| Game | Slug | Description |
|------|------|-------------|
| The Odd One | `the-odd-one` | Social deduction word game. One player gets a different word — can they blend in? |

### Key URLs (Development)

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3001` |
| Health Check | `http://localhost:3001/health` |
| PostgreSQL | `localhost:5433` (mapped to container port `5432`) |

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Frontend** | React | 19.2 | Function components only, `react-dom/client` |
| | Vite | 8.1 | Dev server + bundler, `@vitejs/plugin-react` |
| | Tailwind CSS | 4.3 (v4) | Uses `@tailwindcss/vite` plugin + `@theme` directive |
| | Framer Motion | 12.x | Entry/exit animations, layout transitions |
| | React Router DOM | 7.18 | `BrowserRouter`, single catch-all route |
| | Socket.io Client | 4.8 | Singleton pattern with session token auth |
| | clsx + tailwind-merge | — | `cn()` utility for conditional class merging |
| **Backend** | Node.js | 20 (Alpine Docker) | ES Modules (`"type": "module"` in package.json) |
| | Express | 5.1 | HTTP server, CORS middleware, health endpoint |
| | Socket.io | 4.8 | Real-time bidirectional communication |
| | pg (node-postgres) | 8.16 | Raw SQL via connection pool (NOT Drizzle ORM at runtime) |
| | Zod | 3.25 | Schema validation (available, used for input validation) |
| | jsonwebtoken | 9.x | JWT auth (configured, phase 1 TODO) |
| | uuid | 11.x | UUID v4 generation for room/match IDs |
| | dotenv | 16.x | Environment variable loading |
| **Database** | PostgreSQL | 16 Alpine | Dockerized, schema via `init.sql` |
| **Shared** | TypeScript | — | Event name constants as `as const` string literals |
| **DevOps** | Docker + Compose | — | Three-service stack (client, server, postgres) |
| **Language** | TypeScript | 6.x (client) / 5.x (server) | `strict: true` everywhere |
| **Linting** | OxLint | 1.69 | Client-side; plugins: `react`, `typescript`, `oxc` |
| **Formatting** | Prettier | 3.8 | Shared config across client and server |
| **Testing** | Vitest | 3.2 | Server-side unit tests |
| **Dev Runner** | tsx | 4.19 | Server dev mode: `tsx watch src/index.ts` |

> [!IMPORTANT]
> **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`) is installed as a dependency but is **not used at runtime**. All database queries use the raw `pg` pool via `query()` in `server/src/models/db.ts`. Drizzle is available for future schema tooling only.

---

## 3. Architecture & Directory Structure

```
squadplay/
├── .env                          # Root env vars (Postgres credentials)
├── .gitignore
├── README.md
├── AGENT.md                      # ← This file
├── docker-compose.yml            # Three services: postgres, server, client
│
├── client/                       # ─── React Frontend (Vite + Tailwind v4) ───
│   ├── Dockerfile                # Node 20 Alpine, runs `npm run dev`
│   ├── index.html                # SPA entry point (Google Fonts, meta tags, PWA-ready)
│   ├── package.json              # "type": "module"
│   ├── vite.config.ts            # Plugins: react, tailwindcss; proxy: /api, /socket.io
│   ├── tsconfig.app.json         # Target ES2023, bundler resolution, @/ alias
│   ├── .prettierrc               # Shared formatting rules
│   ├── .oxlintrc.json            # React rules-of-hooks, only-export-components
│   └── src/
│       ├── main.tsx              # ReactDOM.createRoot, StrictMode
│       ├── App.tsx               # BrowserRouter, phase-based routing (no URL routes)
│       ├── index.css             # Tailwind v4 @theme design system + custom utilities
│       ├── hooks/
│       │   ├── useSocket.ts      # Socket.io event listener registration + emit helpers
│       │   └── useGameState.ts   # Root reducer (core + game-specific), useReducer hook
│       ├── lib/
│       │   ├── socket.ts         # Socket.io client singleton, session token management
│       │   └── utils.ts          # cn() — clsx + twMerge
│       ├── pages/
│       │   ├── HomePage.tsx      # Name input, create/join room UI
│       │   ├── LobbyPage.tsx     # Room code display, player list, start game
│       │   └── GamePage.tsx      # Input → Voting → Results phase views (memo'd)
│       ├── games/
│       │   └── OddOne/
│       │       ├── oddOne.types.ts    # OddOneState, OddOneAction union type
│       │       └── oddOne.reducer.ts  # Game-specific reducer for The Odd One
│       ├── types/
│       │   └── game.types.ts     # CoreState, RootState, all socket payload interfaces
│       └── assets/               # Static assets
│
├── server/                       # ─── Node.js Backend (Express + Socket.io) ───
│   ├── Dockerfile                # Node 20 Alpine, runs `npm run dev`
│   ├── package.json              # "main": "dist/index.js", tsx watch in dev
│   ├── tsconfig.json             # Target ES2022, NodeNext resolution, @/ alias
│   ├── .prettierrc
│   ├── db/
│   │   └── init.sql              # Full schema (7 tables), indexes, seed word pairs
│   └── src/
│       ├── index.ts              # Express app, HTTP server, middleware, startup
│       ├── config.ts             # Centralized config from env vars (as const)
│       ├── models/
│       │   └── db.ts             # pg.Pool singleton, initDatabase(), query() helper
│       ├── store/
│       │   └── MemoryStore.ts    # In-memory Map<roomCode, RoomState> singleton
│       ├── socket/
│       │   ├── index.ts          # Socket.io server init, auth middleware, connection handler
│       │   ├── roomHandlers.ts   # room:create, room:join, room:leave, disconnect
│       │   └── gameHandlers.ts   # game:start, turn:submit-word, vote:submit, game:play-again
│       └── games/
│           ├── GameEngine.ts     # Abstract base class (onStart, onPlayerAction, etc.)
│           ├── registry.ts       # Game engine registry (factory pattern)
│           └── the-odd-one/
│               ├── OddOneEngine.ts     # Full game logic (552 lines)
│               └── wordPairService.ts  # Random word pair fetcher from DB
│
└── shared/                       # ─── Shared Types & Constants ───
    ├── package.json              # "main": "src/index.ts"
    └── src/
        ├── index.ts              # Re-exports all from events.ts
        └── events.ts             # Socket.io event name constants (as const)
```

---

## 4. Key Architectural Patterns

### 4.1 Game Engine Pattern (Server)

Games are implemented as subclasses of the abstract `GameEngine` base class:

```
GameEngine (abstract)
├── onStart(room)              — Initialize game state, assign roles
├── onPlayerAction(room, ...)  — Handle player input during game
├── onPlayerDisconnect(room, playerId)
├── onPlayerReconnect(room, playerId, socketId)
├── onPlayAgain(room)          — Reset and restart
└── cleanUp(room)              — Clear timers/resources
```

Engines are registered in `server/src/games/registry.ts` via a `Record<string, GameEngine>` map, keyed by game slug (e.g., `'the-odd-one'`). To add a new game:

1. Create `server/src/games/<slug>/` with a class extending `GameEngine`
2. Register it in `registry.ts`
3. Create `client/src/games/<Name>/` with types + reducer
4. Wire the reducer into `useGameState.ts` root reducer

### 4.2 Socket Event Architecture

Events follow a **namespaced convention**: `<domain>:<action>`.

| Namespace | Examples | Handler File |
|-----------|----------|-------------|
| `room:*` | `room:create`, `room:joined`, `room:player-left` | `roomHandlers.ts` |
| `game:*` | `game:start`, `game:started`, `game:your-word`, `game:end` | `gameHandlers.ts` |
| `turn:*` | `turn:submit-word`, `turn:word-submitted`, `turn:next`, `turn:timer-tick` | `gameHandlers.ts` → engine |
| `vote:*` | `vote:submit`, `vote:submitted`, `vote:results` | `gameHandlers.ts` → engine |

**Auth middleware** runs on connection: requires `displayName` in `socket.handshake.auth`. A `sessionToken` (UUID from `sessionStorage`) is used as the persistent player ID for reconnection.

### 4.3 State Management — Client

The client uses **`useReducer`** with a two-layer reducer architecture:

```
rootReducer(state, action)
├── coreReducer(state.core, action)     → CoreState (room, players, phase, connection)
└── oddOneReducer(state.gameData, action, playerId) → OddOneState (game-specific)
```

- `useGameState()` hook owns the reducer and exposes `state`, `dispatch`, `resetGame`, `clearError`.
- `useSocket()` hook manages Socket.io connection lifecycle and provides emit helpers (`createRoom`, `joinRoom`, `startGame`, etc.).
- Game phases drive UI routing in `App.tsx`: `idle` → `lobby` → `playing` → `results`.

### 4.4 State Management — Server

- **Volatile state**: `MemoryStore` — a singleton `Map<string, RoomState>` in `server/src/store/MemoryStore.ts`. All active room/game state lives here. Lost on server restart.
- **Persistent state**: PostgreSQL — only final match results are written via `persistMatchToDB()` using fire-and-forget `.catch()`.
- Scaling note: To go multi-instance, swap `MemoryStore` for a Redis-backed implementation with the same interface.

### 4.5 Database Schema

7 tables defined in `server/db/init.sql`:

| Table | Purpose |
|-------|---------|
| `users` | Player accounts (id, username, display_name, stats) |
| `rooms` | Room metadata (code, host, game_type, status) |
| `room_players` | Room membership (join tracking) |
| `word_packs` | Collections of word pairs |
| `word_pairs` | Individual word pairs (word_a, word_b, category) |
| `matches` | Completed game records (winner, round data as JSONB) |
| `match_players` | Per-player match results (role, word, vote, score) |

UUIDs are used as primary keys (`uuid-ossp` extension). Seed data includes a "Classic Pack" with 63 word pairs across 8 categories.

### 4.6 CSS Design System

Tailwind CSS v4 with a custom `@theme` block in `client/src/index.css`:

- **Color system**: OKLCH color space. Brand (purple-violet hue 270), accent (cyan hue 195), success (emerald), danger (rose), warning (amber). Surface colors for dark theme.
- **Fonts**: Inter (body), Outfit (display/headings), JetBrains Mono (code/room codes). Loaded via Google Fonts in `index.html`.
- **Custom utility classes**: `glass-card`, `glass-card-hover`, `gradient-text`, `btn-gradient`, `bg-animated`, `room-code-input`, `player-avatar`, `pulse-glow`, `safe-top`, `safe-bottom`.
- **Class merging**: Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) for conditional classes.

---

## 5. Coding Standards

### 5.1 TypeScript

| ✅ Do | ❌ Don't |
|-------|---------|
| Use `as const` for config objects | Use `enum` (prefer union types or `as const`) |
| Use `import type` for type-only imports | Omit `type` keyword (enforced by `verbatimModuleSyntax`) |
| Use `.js` extension in server imports (NodeNext) | Use extensionless imports on the server |
| Use `@/` path alias for absolute imports | Use deep relative paths (`../../../`) |
| Use `strict: true` TypeScript config | Disable strict checks |
| Use explicit interface definitions for props | Use inline object types for component props |
| Minimize `any` usage | Scatter `any` liberally |

### 5.2 React (Client)

| ✅ Do | ❌ Don't |
|-------|---------|
| Use named function exports for page components | Use default exports for pages |
| Use `memo()` for sub-phase views with stable props | Memo everything indiscriminately |
| Use `useCallback` for socket emit helpers | Create new function refs on every render in hooks |
| Use `useReducer` for complex state (not `useState`) | Use `useState` for multi-field game state |
| Use `framer-motion` for enter/exit animations | Use raw CSS transitions for complex animation sequences |
| Use `AnimatePresence` with `mode="wait"` for phase transitions | Unmount animated components without exit animations |
| Compute derived state in the reducer | Use `useEffect` to sync derived state |
| Use conditional rendering with `{condition ? <X /> : null}` | Use `{condition && <X />}` (can render `0` or `false`) |

### 5.3 Server / Socket.io

| ✅ Do | ❌ Don't |
|-------|---------|
| Wrap all socket handlers in `try/catch` | Let errors propagate unhandled |
| Emit error events back to the client (`socket.emit('game:error', ...)`) | Throw exceptions from socket handlers |
| Use emoji-prefixed `console.log` for structured logging | Use plain unstructured log messages |
| Use fire-and-forget `.catch()` for non-critical DB writes | Await DB persistence in the game flow hot path |
| Clean up `setInterval`/`setTimeout` in `cleanUp()` and `delete()` | Leave orphaned timers |
| Validate and sanitize all player input (trim, length limits) | Trust client-submitted data |
| Use `socket.data` for per-connection metadata | Store connection state in global variables |

### 5.4 Formatting (Prettier)

Both `client/.prettierrc` and `server/.prettierrc` share these rules:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "auto",
  "bracketSpacing": true
}
```

The client additionally sets `"jsxSingleQuote": false` (double quotes in JSX).

### 5.5 Linting (OxLint — Client Only)

```json
{
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

### 5.6 Logging Convention (Server)

| Emoji | Meaning | Example |
|-------|---------|---------|
| 🚀 | Server startup | `🚀 SquadPlay server running on port 3001` |
| ✅ | Success / initialization | `✅ PostgreSQL connected` |
| ❌ | Error / failure | `❌ Failed to start server:` |
| 🔌 | Socket connect/disconnect | `🔌 Player connected: Alice` |
| 🏠 | Room lifecycle | `🏠 Room created: ABC123` |
| 👤 | Player action | `👤 Alice joined room ABC123` |
| 🎮 | Game lifecycle | `🎮 OddOneEngine: Starting game` |
| ⏱️ | Timer events | `⏱️ Turn timeout for player ...` |
| 💾 | Database persistence | `💾 Persisting match ... to DB` |
| 🔄 | Reset / replay | `🔄 Play again requested` |
| ⚠️ | Warning | `⚠️ Slow query (150ms)` |

---

## 6. Development Workflow

### 6.1 Running with Docker (Recommended)

```bash
docker compose up --build
```

This starts all three services. The database is automatically initialized with the schema and seed data via `server/db/init.sql` mounted as a Docker entrypoint script.

### 6.2 Running Without Docker

```bash
# Terminal 1: Start PostgreSQL (local install required, or run just the DB container)
docker compose up postgres

# Terminal 2: Start backend
cd server && npm install && npm run dev

# Terminal 3: Start frontend
cd client && npm install && npm run dev
```

### 6.3 Available Scripts

| Package | Script | Command | Purpose |
|---------|--------|---------|---------|
| client | `dev` | `vite` | Start Vite dev server (port 5173) |
| client | `build` | `tsc -b && vite build` | Type-check + production build |
| client | `lint` | `oxlint` | Run OxLint |
| client | `format` | `prettier --write "src/**/*.{ts,tsx,css,json}"` | Format all source files |
| server | `dev` | `tsx watch src/index.ts` | Start server with hot reload |
| server | `build` | `tsc` | Compile TypeScript to `dist/` |
| server | `start` | `node dist/index.js` | Run compiled server |
| server | `test` | `vitest run` | Run tests once |
| server | `test:watch` | `vitest` | Run tests in watch mode |
| server | `lint` | `oxlint` | Run OxLint |
| server | `format` | `prettier --write "src/**/*.ts"` | Format source files |

### 6.4 Vite Proxy Configuration

The client dev server proxies API and WebSocket traffic to the backend:

```typescript
proxy: {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
  '/socket.io': { target: 'http://localhost:3001', ws: true },
}
```

### 6.5 Environment Variables

| Variable | Default | Used By |
|----------|---------|---------|
| `POSTGRES_USER` | `squadplay` | Docker Compose |
| `POSTGRES_PASSWORD` | `squadplay_dev` | Docker Compose |
| `POSTGRES_DB` | `squadplay` | Docker Compose |
| `PORT` | `3001` | Server |
| `CLIENT_URL` | `http://localhost:5173` | Server (CORS) |
| `DATABASE_URL` | `postgres://squadplay:squadplay_dev@localhost:5432/squadplay` | Server |
| `JWT_SECRET` | `squadplay-dev-secret-change-in-prod` | Server |
| `NODE_ENV` | `development` | Server |
| `TURN_TIMER_SECONDS` | `30` | Server (game config) |
| `VOTE_TIMER_SECONDS` | `60` | Server (game config) |
| `MAX_PLAYERS_PER_ROOM` | `10` | Server |
| `MIN_PLAYERS_TO_START` | `3` | Server |
| `VITE_API_URL` | `http://localhost:3001` | Client (build-time) |
| `VITE_WS_URL` | `http://localhost:3001` | Client (Socket.io URL) |

### 6.6 Adding a New Game

1. **Server — Game Engine:**
   - Create `server/src/games/<slug>/` directory
   - Implement a class extending `GameEngine` (see `OddOneEngine.ts` for reference)
   - Register it in `server/src/games/registry.ts`

2. **Client — Game State:**
   - Create `client/src/games/<Name>/` directory
   - Define `<name>.types.ts` with state interface + action union type
   - Implement `<name>.reducer.ts` with reducer function + initial state
   - Wire into `useGameState.ts` root reducer's game-type delegation

3. **Shared — Events (optional):**
   - Add new event constants to `shared/src/events.ts`

4. **Database (if needed):**
   - Add tables/seed data to `server/db/init.sql`

### 6.7 Database Migrations

There is no formal migration tool. Schema changes are made by editing `server/db/init.sql`. All statements use `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING` for idempotency. To reset the database:

```bash
docker compose down -v   # Removes the pgdata volume
docker compose up --build
```

---

## 7. Socket Event Reference

### Client → Server (Emits)

| Event | Payload | Handler |
|-------|---------|---------|
| `room:create` | `{ gameType?, displayName?, settings? }` | `roomHandlers.ts` |
| `room:join` | `{ roomCode, displayName? }` | `roomHandlers.ts` |
| `room:leave` | (none) | `roomHandlers.ts` |
| `game:start` | `{ roomCode }` | `gameHandlers.ts` |
| `turn:submit-word` | `{ roomCode, word }` | `gameHandlers.ts` → engine |
| `vote:submit` | `{ roomCode, votedForPlayerId }` | `gameHandlers.ts` → engine |
| `game:play-again` | `{ roomCode }` | `gameHandlers.ts` → engine |

### Server → Client (Emits)

| Event | Payload | Sent To |
|-------|---------|---------|
| `room:created` | `{ roomCode, roomId, hostId, players }` | Creator socket |
| `room:joined` | `{ roomCode, roomId, hostId, players }` | Joiner socket |
| `room:player-joined` | `{ player, players }` | Room (except joiner) |
| `room:player-left` | `{ playerId, players, newHostId }` | Room |
| `room:error` | `{ code, message }` | Individual socket |
| `game:started` | `{ phase, turnOrder, currentTurnPlayerId, gameType }` | Room |
| `game:your-word` | `{ word, role }` | Individual socket (private) |
| `game:state-sync` | `{ phase, currentTurnPlayerId, turnOrder, feed, players }` | Individual socket (reconnect) |
| `game:error` | `{ code, message }` | Individual socket |
| `game:end` | `GameResults` | Room |
| `turn:next` | `{ currentTurnPlayerId, turnIndex, remainingPlayers }` | Room |
| `turn:word-submitted` | `{ playerId, displayName, word, turnIndex }` | Room |
| `turn:timer-tick` | `{ secondsRemaining }` | Room |
| `turn:all-complete` | (none) | Room |
| `vote:submitted` | `{ voterId, totalVotesCast, totalVotesNeeded }` | Room |
| `vote:results` | `GameResults` | Room |

### Error Codes

| Code | Context | Meaning |
|------|---------|---------|
| `CREATE_FAILED` | Room | Failed to create room |
| `ROOM_NOT_FOUND` | Room/Game | Room code doesn't exist |
| `GAME_IN_PROGRESS` | Room | Can't join, game already running |
| `ROOM_FULL` | Room | Max players reached |
| `JOIN_FAILED` | Room | Generic join failure |
| `NOT_HOST` | Game | Non-host tried to start/restart |
| `NOT_ENOUGH_PLAYERS` | Game | Below minimum player count |
| `ENGINE_NOT_FOUND` | Game | Unknown game type slug |
| `START_FAILED` | Game | Game initialization failed |
| `NOT_YOUR_TURN` | Turn | Player submitted out of turn |
| `INVALID_WORD` | Turn | Empty word submitted |
| `ALREADY_VOTED` | Vote | Duplicate vote attempt |
| `CANNOT_VOTE_SELF` | Vote | Self-vote attempt |
| `INVALID_TARGET` | Vote | Voted for nonexistent player |
