import { integer, pgTable, varchar, text, timestamp, jsonb, bigint } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const replaysTable = pgTable("replays", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(), // Battle.net account ID
  filename: varchar({ length: 255 }).notNull(),
  uploadedAt: timestamp().notNull().defaultNow(),

  // Match metadata for linking with match history
  matchDate: bigint({ mode: 'number' }), // Unix timestamp from replay
  mapName: varchar({ length: 255 }),
  gameType: varchar({ length: 50 }), // 1v1, 2v2, etc.

  // Replay analysis data (stored as JSON)
  replayHeader: jsonb(), // Raw header data
  replayDetails: jsonb(), // Player details, game details
  players: jsonb(), // Array of players
  gameEvents: jsonb(), // Game events from replay
  trackerEvents: jsonb(), // Tracker events from replay
  messageEvents: jsonb(), // Message events from replay

  // Game result
  winner: varchar({ length: 255 }), // Player name who won
  duration: integer(), // Game duration in seconds
  gameLength: integer(), // Game length in game loops

  // File storage
  filePath: text(), // Path to stored replay file
  fileSize: integer(), // File size in bytes
});
