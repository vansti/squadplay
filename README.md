# SquadPlay 🎮

A multiplayer real-time party game platform where friends play mini-games together from any device.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, shadcn/ui |
| **Backend** | Node.js, Express 5, Socket.io 4 |
| **Database** | PostgreSQL 16 |
| **DevOps** | Docker & Docker Compose |
| **Language** | TypeScript (full-stack) |

## Quick Start

### With Docker (Recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/health

### Without Docker

```bash
# Terminal 1: Start PostgreSQL (local install required)
# Terminal 2: Start backend
cd server && npm install && npm run dev

# Terminal 3: Start frontend
cd client && npm install && npm run dev
```

## Project Structure

```
squadplay/
├── client/          # React frontend (Vite + Tailwind v4)
├── server/          # Node.js backend (Express + Socket.io)
├── shared/          # Shared TypeScript types
├── docker-compose.yml
└── .env
```

## Games

### The Odd One 🎭
A social deduction word game. One player gets a different word — can they blend in?

## Development

- **Adding a new game**: Create modules in `server/src/games/` and `client/src/games/`
- **Database migrations**: Edit `server/db/init.sql`
- **Environment**: Copy `.env` and modify as needed
