import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, json, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Base user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  tokens: integer("tokens").notNull().default(2500),
  role: text("role").notNull().default("user"), // Possible values: "user", "admin"
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Game schema
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  platform: text("platform").notNull(),
  image: text("image"),
  players: integer("players").notNull().default(0),
  isPopular: boolean("is_popular").default(false),
  isNew: boolean("is_new").default(false),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
});

// Match schema
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  name: text("name").notNull(),
  schedule: timestamp("schedule").notNull(),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").notNull().default(0),
  prize: integer("prize").notNull(),
  lobbyId: integer("lobby_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  serverDetails: text("server_details"),
  matchResults: text("match_results"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'deposit', 'win', 'match_entry'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

// Stats schema
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  winRate: integer("win_rate").notNull().default(0),
  matchesPlayed: integer("matches_played").notNull().default(0),
  totalEarnings: integer("total_earnings").notNull().default(0),
  avgPosition: integer("avg_position").notNull().default(0),
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
});

// Tournament schema
// Updated to match actual database schema based on information_schema
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gameId: integer("game_id").notNull().references(() => games.id),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  maxParticipants: integer("max_participants").notNull().default(16),
  currentParticipants: integer("current_participants").notNull().default(0),
  status: text("status").notNull().default("upcoming"), // 'upcoming', 'active', 'completed', 'cancelled'
  entryFee: integer("entry_fee").notNull().default(0),
  prizePool: integer("prize_pool").notNull().default(0),
  format: text("format").notNull().default("bracket"), // 'bracket', 'round_robin', 'swiss'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  registrationDeadline: timestamp("registration_deadline"),
  rules: text("rules"),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

// Tournament Participants schema
export const tournamentParticipants = pgTable("tournament_participants", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  userId: integer("user_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
  status: text("status").notNull().default("registered"), // 'registered', 'checked_in', 'eliminated', 'winner'
  seed: integer("seed"),
  placement: integer("placement"),
});

export const insertTournamentParticipantSchema = createInsertSchema(tournamentParticipants).omit({
  id: true,
  registeredAt: true,
});

// Tournament Matches schema
export const tournamentMatches = pgTable("tournament_matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  round: integer("round").notNull(),
  position: integer("position").notNull(),
  player1Id: integer("player1_id").references(() => users.id),
  player2Id: integer("player2_id").references(() => users.id),
  team1Id: integer("team1_id").references(() => teams.id),
  team2Id: integer("team2_id").references(() => teams.id),
  winnerId: integer("winner_id").references(() => users.id),
  winnerTeamId: integer("winner_team_id").references(() => teams.id),
  score: text("score"),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  scheduledTime: timestamp("scheduled_time"),
  completedTime: timestamp("completed_time"),
});

export const insertTournamentMatchSchema = createInsertSchema(tournamentMatches).omit({
  id: true,
});

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'tournament', 'match', 'transaction', 'system'
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  data: json("data"), // Additional JSON data related to the notification
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Friendship status enum
export const friendshipStatusEnum = pgEnum("friendship_status", ["pending", "accepted", "blocked"]);

// Lobby status enum
export const lobbyStatusEnum = pgEnum("lobby_status", ["open", "matchmaking", "in_progress", "completed", "cancelled"]);

// Lobby type enum
export const lobbyTypeEnum = pgEnum("lobby_type", ["solo", "team"]);

// Friendships schema
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: friendshipStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Private Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Teams/Clans schema
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  tag: text("tag").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

// Team Members schema
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // 'leader', 'co-leader', 'member'
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

// Social Activity schema
export const socialActivities = pgTable("social_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'tournament_join', 'tournament_win', 'friend_added', 'team_joined'
  content: text("content").notNull(),
  data: json("data"), // Additional JSON data related to the activity
  createdAt: timestamp("timestamp").notNull().defaultNow(), // Using 'timestamp' column instead of 'created_at'
  // isPublic field does not exist in the database
});

export const insertSocialActivitySchema = createInsertSchema(socialActivities).omit({
  id: true,
  createdAt: true,
});

// Lobbies schema
export const lobbies = pgTable("lobbies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gameId: integer("game_id").notNull().references(() => games.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  type: lobbyTypeEnum("type").notNull(),
  status: lobbyStatusEnum("status").notNull().default("open"),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").notNull().default(1),
  entryFee: integer("entry_fee").notNull().default(0),
  prizePool: integer("prize_pool").notNull().default(0),
  map: text("map"),
  description: text("description"),
  rules: text("rules"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertLobbySchema = createInsertSchema(lobbies).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

// Lobby Members schema
export const lobbyMembers = pgTable("lobby_members", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobby_id").notNull().references(() => lobbies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  ready: boolean("ready").notNull().default(false),
  side: text("side"), // For team games: "team1", "team2"
});

export const insertLobbyMemberSchema = createInsertSchema(lobbyMembers).omit({
  id: true,
  joinedAt: true,
});

// Lobby Chat Messages schema
export const lobbyMessages = pgTable("lobby_messages", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobby_id").notNull().references(() => lobbies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLobbyMessageSchema = createInsertSchema(lobbyMessages).omit({
  id: true,
  createdAt: true,
});

// Match Reports schema
export const matchReports = pgTable("match_reports", {
  id: serial("id").primaryKey(),
  tournamentMatchId: integer("tournament_match_id").notNull().references(() => tournamentMatches.id),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  winnerTeamId: integer("winner_team_id").references(() => teams.id),
  winnerId: integer("winner_id").references(() => users.id),
  scoreReported: text("score_reported"),
  evidenceUrls: text("evidence_urls").array(),
  status: text("status").notNull().default("pending"), // 'pending', 'verified', 'disputed', 'rejected'
  disputeReason: text("dispute_reason"),
  adminNotes: text("admin_notes"),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedById: integer("verified_by_id").references(() => users.id),
});

export const insertMatchReportSchema = createInsertSchema(matchReports).omit({
  id: true,
  reportedAt: true,
  verifiedAt: true,
});

// Achievements schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // URL or icon name/class
  category: text("category").notNull(), // 'game_specific', 'platform', 'social', 'competitive', 'seasonal'
  rarity: text("rarity").notNull().default("common"), // 'common', 'uncommon', 'rare', 'epic', 'legendary'
  tokenReward: integer("token_reward").notNull().default(0),
  criteria: json("criteria").notNull(), // JSON with achievement criteria
  gameId: integer("game_id").references(() => games.id), // null if not game-specific
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

// User Achievements schema
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  claimedReward: boolean("claimed_reward").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  completedAt: true,
  claimedAt: true,
});

// Bonuses schema
export const bonuses = pgTable("bonuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'daily_login', 'first_win', 'streak', 'seasonal', 'special_event'
  tokenAmount: integer("token_amount").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  requirements: json("requirements").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBonusSchema = createInsertSchema(bonuses).omit({
  id: true,
  createdAt: true,
});

// User Bonuses schema
export const userBonuses = pgTable("user_bonuses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bonusId: integer("bonus_id").notNull().references(() => bonuses.id),
  claimed: boolean("claimed").notNull().default(false),
  eligibleAt: timestamp("eligible_at").notNull(),
  claimedAt: timestamp("claimed_at"),
  transactionId: integer("transaction_id").references(() => transactions.id),
});

export const insertUserBonusSchema = createInsertSchema(userBonuses).omit({
  id: true,
  claimedAt: true,
});

// Define all relations after all tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  stats: many(stats),
  tournamentParticipations: many(tournamentParticipants),
  notifications: many(notifications),
  sentFriendRequests: many(friendships, { relationName: "sentRequests" }),
  receivedFriendRequests: many(friendships, { relationName: "receivedRequests" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  teams: many(teamMembers),
  createdTeams: many(teams, { relationName: "createdTeams" }),
  socialActivities: many(socialActivities),
  ownedLobbies: many(lobbies),
  lobbyMemberships: many(lobbyMembers),
  lobbyMessages: many(lobbyMessages),
  achievements: many(userAchievements),
  bonuses: many(userBonuses),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  matches: many(matches),
  tournaments: many(tournaments),
  lobbies: many(lobbies),
  achievements: many(achievements),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  game: one(games, {
    fields: [matches.gameId],
    references: [games.id],
  }),
  lobby: one(lobbies, {
    fields: [matches.lobbyId],
    references: [lobbies.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const statsRelations = relations(stats, ({ one }) => ({
  user: one(users, {
    fields: [stats.userId],
    references: [users.id],
  }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  game: one(games, {
    fields: [tournaments.gameId],
    references: [games.id],
  }),
  participants: many(tournamentParticipants),
  matches: many(tournamentMatches),
}));

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentParticipants.tournamentId],
    references: [tournaments.id],
  }),
  user: one(users, {
    fields: [tournamentParticipants.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [tournamentParticipants.teamId],
    references: [teams.id],
  }),
}));

export const tournamentMatchesRelations = relations(tournamentMatches, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentMatches.tournamentId],
    references: [tournaments.id],
  }),
  player1: one(users, {
    fields: [tournamentMatches.player1Id],
    references: [users.id],
  }),
  player2: one(users, {
    fields: [tournamentMatches.player2Id],
    references: [users.id],
  }),
  team1: one(teams, {
    fields: [tournamentMatches.team1Id],
    references: [teams.id],
  }),
  team2: one(teams, {
    fields: [tournamentMatches.team2Id],
    references: [teams.id],
  }),
  winner: one(users, {
    fields: [tournamentMatches.winnerId],
    references: [users.id],
  }),
  winnerTeam: one(teams, {
    fields: [tournamentMatches.winnerTeamId],
    references: [teams.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Friendship relations
export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "sentRequests"
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "receivedRequests"
  }),
}));

// Message relations
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages"
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages"
  }),
}));

// Team relations
export const teamsRelations = relations(teams, ({ one, many }) => ({
  creator: one(users, {
    fields: [teams.creatorId],
    references: [users.id],
    relationName: "createdTeams"
  }),
  members: many(teamMembers),
  lobbies: many(lobbies),
  lobbyMemberships: many(lobbyMembers),
}));

// Team members relations
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

// Social activity relations
export const socialActivitiesRelations = relations(socialActivities, ({ one }) => ({
  user: one(users, {
    fields: [socialActivities.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one, many }) => ({
  game: one(games, {
    fields: [achievements.gameId],
    references: [games.id],
  }),
  users: many(userAchievements)
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const bonusesRelations = relations(bonuses, ({ many }) => ({
  users: many(userBonuses)
}));

export const userBonusesRelations = relations(userBonuses, ({ one }) => ({
  user: one(users, {
    fields: [userBonuses.userId],
    references: [users.id],
  }),
  bonus: one(bonuses, {
    fields: [userBonuses.bonusId],
    references: [bonuses.id],
  }),
  transaction: one(transactions, {
    fields: [userBonuses.transactionId],
    references: [transactions.id],
  })
}));

// Lobby relations
export const lobbiesRelations = relations(lobbies, ({ one, many }) => ({
  game: one(games, {
    fields: [lobbies.gameId],
    references: [games.id],
  }),
  owner: one(users, {
    fields: [lobbies.ownerId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [lobbies.teamId],
    references: [teams.id],
  }),
  members: many(lobbyMembers),
  messages: many(lobbyMessages),
  matches: many(matches),
}));

// Lobby members relations
export const lobbyMembersRelations = relations(lobbyMembers, ({ one }) => ({
  lobby: one(lobbies, {
    fields: [lobbyMembers.lobbyId],
    references: [lobbies.id],
  }),
  user: one(users, {
    fields: [lobbyMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [lobbyMembers.teamId],
    references: [teams.id],
  }),
}));

// Lobby messages relations
export const lobbyMessagesRelations = relations(lobbyMessages, ({ one }) => ({
  lobby: one(lobbies, {
    fields: [lobbyMessages.lobbyId],
    references: [lobbies.id],
  }),
  user: one(users, {
    fields: [lobbyMessages.userId],
    references: [users.id],
  }),
}));

// Match report relations
export const matchReportsRelations = relations(matchReports, ({ one }) => ({
  match: one(tournamentMatches, {
    fields: [matchReports.tournamentMatchId],
    references: [tournamentMatches.id],
  }),
  reporter: one(users, {
    fields: [matchReports.reporterId],
    references: [users.id],
  }),
  winnerTeam: one(teams, {
    fields: [matchReports.winnerTeamId],
    references: [teams.id],
  }),
  winner: one(users, {
    fields: [matchReports.winnerId],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [matchReports.verifiedById],
    references: [users.id],
  }),
}));

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof stats.$inferSelect;

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;

export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;
export type TournamentMatch = typeof tournamentMatches.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertSocialActivity = z.infer<typeof insertSocialActivitySchema>;
export type SocialActivity = typeof socialActivities.$inferSelect;

export type InsertMatchReport = z.infer<typeof insertMatchReportSchema>;
export type MatchReport = typeof matchReports.$inferSelect;

export type InsertLobby = z.infer<typeof insertLobbySchema>;
export type Lobby = typeof lobbies.$inferSelect;

export type InsertLobbyMember = z.infer<typeof insertLobbyMemberSchema>;
export type LobbyMember = typeof lobbyMembers.$inferSelect;

export type InsertLobbyMessage = z.infer<typeof insertLobbyMessageSchema>;
export type LobbyMessage = typeof lobbyMessages.$inferSelect;