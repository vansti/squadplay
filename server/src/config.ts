import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://squadplay:squadplay_dev@localhost:5432/squadplay',
  jwtSecret: process.env.JWT_SECRET || 'squadplay-dev-secret-change-in-prod',
  nodeEnv: process.env.NODE_ENV || 'development',
  turnTimerSeconds: parseInt(process.env.TURN_TIMER_SECONDS || '30', 10),
  voteTimerSeconds: parseInt(process.env.VOTE_TIMER_SECONDS || '60', 10),
  maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM || '10', 10),
  minPlayersToStart: parseInt(process.env.MIN_PLAYERS_TO_START || '3', 10),
} as const;
