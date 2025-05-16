import { z } from "zod";
import { db } from "./db";
import { eq, asc, desc, and, or, not, inArray, sql } from "drizzle-orm";
import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  matches, type Match, type InsertMatch,
  transactions, type Transaction, type InsertTransaction,
  stats, type Stats, type InsertStats,
  tournaments, type Tournament, type InsertTournament,
  tournamentParticipants, type TournamentParticipant, type InsertTournamentParticipant,
  tournamentMatches, type TournamentMatch, type InsertTournamentMatch,
  notifications, type Notification, type InsertNotification,
  friendships, type Friendship, type InsertFriendship,
  messages, type Message, type InsertMessage,
  teams, type Team, type InsertTeam, 
  teamMembers, type TeamMember, type InsertTeamMember,
  socialActivities, type SocialActivity, type InsertSocialActivity,
  matchReports, type MatchReport, type InsertMatchReport,
  lobbies, type Lobby, type InsertLobby,
  lobbyMembers, type LobbyMember, type InsertLobbyMember,
  lobbyMessages, type LobbyMessage, type InsertLobbyMessage,
  achievements,
  userAchievements,
  bonuses,
  userBonuses,
  insertAchievementSchema,
  insertUserAchievementSchema,
  insertBonusSchema,
  insertUserBonusSchema
} from "@shared/schema";

// Define the types from the schema
type Achievement = typeof achievements.$inferSelect;
type InsertAchievement = z.infer<typeof insertAchievementSchema>;
type UserAchievement = typeof userAchievements.$inferSelect;
type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
type Bonus = typeof bonuses.$inferSelect;
type InsertBonus = z.infer<typeof insertBonusSchema>;
type UserBonus = typeof userBonuses.$inferSelect;
type InsertUserBonus = z.infer<typeof insertUserBonusSchema>;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User | undefined>;
  updateUser(userId: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserSettings(userId: number, settings: any): Promise<boolean>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  
  // Achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getAchievementsByGame(gameId: number): Promise<Achievement[]>;
  getAchievementsByCategory(category: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, data: Partial<Achievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: number): Promise<boolean>;
  
  // User Achievement methods
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  getUserAchievementDetails(userId: number): Promise<any[]>; // Achievements with progress
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement | undefined>;
  completeUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined>;
  claimAchievementReward(userId: number, achievementId: number): Promise<UserAchievement | undefined>;
  
  // Bonus methods
  getAllBonuses(): Promise<Bonus[]>;
  getActiveBonus(): Promise<Bonus[]>;
  getBonus(id: number): Promise<Bonus | undefined>;
  getBonusByType(type: string): Promise<Bonus[]>;
  createBonus(bonus: InsertBonus): Promise<Bonus>;
  updateBonus(id: number, data: Partial<Bonus>): Promise<Bonus | undefined>;
  activateBonus(id: number): Promise<Bonus | undefined>;
  deactivateBonus(id: number): Promise<Bonus | undefined>;
  
  // User Bonus methods
  getUserBonuses(userId: number): Promise<UserBonus[]>;
  createUserBonus(userBonus: InsertUserBonus): Promise<UserBonus>;
  claimUserBonus(userId: number, bonusId: number): Promise<UserBonus | undefined>;
  checkDailyBonusEligibility(userId: number): Promise<boolean>;
  
  // Game methods
  getAllGames(): Promise<Game[]>;
  getGameCount(): Promise<number>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, data: Partial<Game>): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  
  // Match methods
  getAllMatches(): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByGame(gameId: number): Promise<Match[]>;
  getMatchesByLobby(lobbyId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  
  // Transaction methods
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTotalTransactions(): Promise<number>;
  
  // Stats methods
  getUserStats(userId: number): Promise<Stats | undefined>;
  createOrUpdateStats(stats: InsertStats): Promise<Stats>;
  
  // Tournament methods
  getAllTournaments(): Promise<Tournament[]>;
  getTournamentCount(): Promise<number>;
  getTournament(id: number): Promise<Tournament | undefined>;
  getTournamentsByGame(gameId: number): Promise<Tournament[]>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament | undefined>;
  
  // Tournament participants methods
  getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]>;
  getUserTournaments(userId: number): Promise<TournamentParticipant[]>;
  createTournamentParticipant(participant: InsertTournamentParticipant): Promise<TournamentParticipant>;
  updateTournamentParticipant(id: number, data: Partial<TournamentParticipant>): Promise<TournamentParticipant | undefined>;
  
  // Tournament matches methods
  getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]>;
  getTournamentMatch(id: number): Promise<TournamentMatch | undefined>;
  createTournamentMatch(match: InsertTournamentMatch): Promise<TournamentMatch>;
  updateTournamentMatch(id: number, data: Partial<TournamentMatch>): Promise<TournamentMatch | undefined>;
  
  // Notification methods
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Friendship methods
  getFriendsByUser(userId: number): Promise<User[]>;
  getFriendRequests(userId: number): Promise<Friendship[]>;
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendshipStatus(id: number, status: string): Promise<Friendship | undefined>;
  deleteFriendship(id: number): Promise<boolean>;
  
  // Messaging methods
  getUserConversations(userId: number): Promise<any[]>; // Returns a list of conversation summaries
  getConversationMessages(senderId: number, receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  markAllMessagesAsRead(userId: number): Promise<boolean>;
  
  // Team methods
  getAllTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  getUserTeams(userId: number): Promise<Team[]>; 
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, data: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  isTeamLeader(teamId: number, userId: number): Promise<boolean>;
  isTeamMember(teamId: number, userId: number): Promise<boolean>;
  
  // Team members methods
  getTeamMembers(teamId: number): Promise<any[]>; // Returns TeamMembers with username
  getTeamMember(teamId: number, userId: number): Promise<TeamMember | undefined>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMemberRole(id: number, role: string): Promise<TeamMember | undefined>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  
  // Match report methods
  getMatchReport(id: number): Promise<MatchReport | undefined>;
  getMatchReports(matchId: number): Promise<MatchReport[]>;
  createMatchReport(report: InsertMatchReport): Promise<MatchReport>;
  verifyMatchReport(id: number, verifiedById: number): Promise<MatchReport | undefined>;
  disputeMatchReport(id: number, disputeReason: string): Promise<MatchReport | undefined>;
  isMatchParticipant(matchId: number, userId: number, teamId: number | null): Promise<boolean>;
  updateMatchResult(matchId: number, winnerId: number | null, winnerTeamId: number | null, score: string): Promise<TournamentMatch | undefined>;
  notifyMatchReportSubmitted(match: TournamentMatch, report: MatchReport): Promise<void>;
  notifyReportDisputed(report: MatchReport, disputedByUserId: number, reason: string): Promise<void>;
  notifyReportVerified(report: MatchReport): Promise<void>;
  
  // Lobby methods
  getLobby(id: number): Promise<Lobby | undefined>;
  getAllLobbies(): Promise<Lobby[]>;
  getLobbyMembers(lobbyId: number): Promise<LobbyMember[]>;
  getLobbyMember(lobbyId: number, userId: number): Promise<LobbyMember | undefined>;
  addLobbyMember(member: InsertLobbyMember): Promise<LobbyMember>;
  updateLobbyMemberReadyStatus(lobbyId: number, userId: number, ready: boolean): Promise<LobbyMember | undefined>;
  removeLobbyMember(lobbyId: number, userId: number): Promise<boolean>;
  updateLobby(id: number, data: Partial<Lobby>): Promise<Lobby | undefined>;
  deleteLobby(id: number): Promise<boolean>;
  
  // Social Activity methods
  getUserSocialActivities(userId: number): Promise<SocialActivity[]>;
  getFriendsSocialActivities(userId: number): Promise<SocialActivity[]>;
  createSocialActivity(activity: InsertSocialActivity): Promise<SocialActivity>;
  deleteSocialActivity(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.id));
  }
  
  async getUserCount(): Promise<number> {
    const result = await db.select().from(users);
    return result.length;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserRole(userId: number, role: string): Promise<User | undefined> {
    // Only allow 'user' or 'admin' roles
    if (role !== 'user' && role !== 'admin') {
      throw new Error("Invalid role. Must be 'user' or 'admin'");
    }
    
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserTokens(userId: number, tokens: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ tokens })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    // Filter out properties that don't exist in the users table
    const validUserData: any = {};
    if (userData.username !== undefined) validUserData.username = userData.username;
    if (userData.tokens !== undefined) validUserData.tokens = userData.tokens;
    
    const [user] = await db
      .update(users)
      .set(validUserData)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserSettings(userId: number, settings: any): Promise<boolean> {
    try {
      // Since we don't have a settings field in the schema, we'll use a no-op function
      // This is just a placeholder to satisfy the interface
      // In a real implementation, we would create a settings table
      return true;
    } catch (error) {
      console.error("Error updating user settings:", error);
      return false;
    }
  }

  // Game methods
  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games);
  }
  
  async getGameCount(): Promise<number> {
    const result = await db.select().from(games);
    return result.length;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }
  
  async updateGame(id: number, data: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(data)
      .where(eq(games.id, id))
      .returning();
    return game || undefined;
  }
  
  async deleteGame(id: number): Promise<boolean> {
    try {
      // Check if game exists first
      const game = await this.getGame(id);
      if (!game) {
        return false;
      }
      
      // Delete the game
      await db
        .delete(games)
        .where(eq(games.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting game:", error);
      return false;
    }
  }

  // Match methods
  async getAllMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getMatchesByGame(gameId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.gameId, gameId));
  }
  
  async getMatchesByLobby(lobbyId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.lobbyId, lobbyId));
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }

  // Transaction methods
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.timestamp));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }
  
  async getTotalTransactions(): Promise<number> {
    const result = await db.select().from(transactions);
    return result.length;
  }

  // Stats methods
  async getUserStats(userId: number): Promise<Stats | undefined> {
    const [userStats] = await db.select().from(stats).where(eq(stats.userId, userId));
    return userStats || undefined;
  }

  async createOrUpdateStats(insertStats: InsertStats): Promise<Stats> {
    const existingStats = await this.getUserStats(insertStats.userId);
    
    if (existingStats) {
      const [updatedStats] = await db
        .update(stats)
        .set(insertStats)
        .where(eq(stats.id, existingStats.id))
        .returning();
      return updatedStats;
    }
    
    const [newStats] = await db
      .insert(stats)
      .values(insertStats)
      .returning();
    return newStats;
  }

  // Tournament methods
  async getAllTournaments(): Promise<Tournament[]> {
    try {
      // Fields explicitly match the actual database schema from information_schema
      return await db.select({
        id: tournaments.id,
        name: tournaments.name,
        gameId: tournaments.gameId,
        description: tournaments.description,
        startDate: tournaments.startDate,
        endDate: tournaments.endDate,
        maxParticipants: tournaments.maxParticipants,
        currentParticipants: tournaments.currentParticipants,
        status: tournaments.status,
        entryFee: tournaments.entryFee,
        prizePool: tournaments.prizePool,
        format: tournaments.format,
        createdAt: tournaments.createdAt,
        registrationDeadline: tournaments.registrationDeadline,
        rules: tournaments.rules,
      }).from(tournaments).orderBy(desc(tournaments.createdAt));
    } catch (error) {
      console.error("Error in getAllTournaments:", error);
      return [];
    }
  }
  
  async getTournamentCount(): Promise<number> {
    const result = await db.select().from(tournaments);
    return result.length;
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    try {
      const [tournament] = await db.select({
        id: tournaments.id,
        name: tournaments.name,
        gameId: tournaments.gameId,
        description: tournaments.description,
        startDate: tournaments.startDate,
        endDate: tournaments.endDate,
        maxParticipants: tournaments.maxParticipants,
        currentParticipants: tournaments.currentParticipants,
        status: tournaments.status,
        entryFee: tournaments.entryFee,
        prizePool: tournaments.prizePool,
        format: tournaments.format,
        createdAt: tournaments.createdAt,
        registrationDeadline: tournaments.registrationDeadline,
        rules: tournaments.rules,
      }).from(tournaments).where(eq(tournaments.id, id));
      return tournament || undefined;
    } catch (error) {
      console.error("Error in getTournament:", error);
      return undefined;
    }
  }

  async getTournamentsByGame(gameId: number): Promise<Tournament[]> {
    try {
      return await db.select({
        id: tournaments.id,
        name: tournaments.name,
        gameId: tournaments.gameId,
        description: tournaments.description,
        startDate: tournaments.startDate,
        endDate: tournaments.endDate,
        maxParticipants: tournaments.maxParticipants,
        currentParticipants: tournaments.currentParticipants,
        status: tournaments.status,
        entryFee: tournaments.entryFee,
        prizePool: tournaments.prizePool,
        format: tournaments.format,
        createdAt: tournaments.createdAt,
        registrationDeadline: tournaments.registrationDeadline,
        rules: tournaments.rules,
      }).from(tournaments)
        .where(eq(tournaments.gameId, gameId))
        .orderBy(desc(tournaments.createdAt));
    } catch (error) {
      console.error("Error in getTournamentsByGame:", error);
      return [];
    }
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const [tournament] = await db
      .insert(tournaments)
      .values(insertTournament)
      .returning();
    return tournament;
  }

  async updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament | undefined> {
    const [tournament] = await db
      .update(tournaments)
      .set(data)
      .where(eq(tournaments.id, id))
      .returning();
    return tournament || undefined;
  }

  // Tournament participants methods
  async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
    return await db.select().from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId))
      .orderBy(asc(tournamentParticipants.seed));
  }

  async getUserTournaments(userId: number): Promise<TournamentParticipant[]> {
    return await db.select().from(tournamentParticipants)
      .where(eq(tournamentParticipants.userId, userId))
      .orderBy(desc(tournamentParticipants.registeredAt));
  }

  async createTournamentParticipant(insertParticipant: InsertTournamentParticipant): Promise<TournamentParticipant> {
    const [participant] = await db
      .insert(tournamentParticipants)
      .values(insertParticipant)
      .returning();
    
    // Update the tournament's current participants count
    const [tournament] = await db.select().from(tournaments)
      .where(eq(tournaments.id, insertParticipant.tournamentId));
    
    if (tournament) {
      await db.update(tournaments)
        .set({ currentParticipants: tournament.currentParticipants + 1 })
        .where(eq(tournaments.id, tournament.id));
    }
    
    return participant;
  }

  async updateTournamentParticipant(id: number, data: Partial<TournamentParticipant>): Promise<TournamentParticipant | undefined> {
    const [participant] = await db
      .update(tournamentParticipants)
      .set(data)
      .where(eq(tournamentParticipants.id, id))
      .returning();
    return participant || undefined;
  }

  // Tournament matches methods
  async getTournamentMatches(tournamentId: number): Promise<TournamentMatch[]> {
    const matches = await db.select().from(tournamentMatches)
      .where(eq(tournamentMatches.tournamentId, tournamentId));
    
    // Sort in memory since we have an issue with the orderBy chaining
    return matches.sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.position - b.position;
    });
  }

  async getTournamentMatch(id: number): Promise<TournamentMatch | undefined> {
    const [match] = await db.select().from(tournamentMatches)
      .where(eq(tournamentMatches.id, id));
    return match || undefined;
  }

  async createTournamentMatch(insertMatch: InsertTournamentMatch): Promise<TournamentMatch> {
    const [match] = await db
      .insert(tournamentMatches)
      .values(insertMatch)
      .returning();
    return match;
  }

  async updateTournamentMatch(id: number, data: Partial<TournamentMatch>): Promise<TournamentMatch | undefined> {
    const [match] = await db
      .update(tournamentMatches)
      .set(data)
      .where(eq(tournamentMatches.id, id))
      .returning();
    return match || undefined;
  }

  // Notification methods
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    // Use a two-step filtering approach to avoid the chained where clause
    const allUserNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    
    const unreads = allUserNotifications.filter(notification => notification.read === false);
    return unreads.length;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  // Friendship methods
  async getFriendsByUser(userId: number): Promise<User[]> {
    // Get friendships where the user is either the sender or receiver and status is 'accepted'
    const outgoingFriendships = await db
      .select({
        friendId: friendships.friendId,
      })
      .from(friendships)
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.status, "accepted")
        )
      );

    const incomingFriendships = await db
      .select({
        userId: friendships.userId,
      })
      .from(friendships)
      .where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, "accepted")
        )
      );

    // Extract the friend IDs
    const friendIds = [
      ...outgoingFriendships.map(f => f.friendId),
      ...incomingFriendships.map(f => f.userId)
    ];

    if (friendIds.length === 0) {
      return [];
    }

    // Get the users with those IDs
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, friendIds));
  }

  async getFriendRequests(userId: number): Promise<Friendship[]> {
    // Get friendship requests where user is the receiver and status is 'pending'
    return await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, "pending")
        )
      );
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const [newFriendship] = await db
      .insert(friendships)
      .values(friendship)
      .returning();

    // Create a social activity for the friendship request
    await this.createSocialActivity({
      userId: friendship.userId,
      type: "friend_added",
      content: `Sent a friend request`,
      data: { friendId: friendship.friendId }
    });

    return newFriendship;
  }

  async updateFriendshipStatus(id: number, status: string): Promise<Friendship | undefined> {
    if (!["pending", "accepted", "blocked"].includes(status)) {
      throw new Error("Invalid friendship status");
    }

    const [friendship] = await db
      .update(friendships)
      .set({ 
        status: status as any, // Type assertion to work around the enum issue
        updatedAt: new Date() 
      })
      .where(eq(friendships.id, id))
      .returning();

    if (friendship && status === "accepted") {
      // Create social activities for accepted friendship
      await this.createSocialActivity({
        userId: friendship.userId,
        type: "friend_added",
        content: `Added a new friend`,
        data: { friendId: friendship.friendId }
      });

      await this.createSocialActivity({
        userId: friendship.friendId,
        type: "friend_added",
        content: `Added a new friend`,
        data: { friendId: friendship.userId }
      });
    }

    return friendship || undefined;
  }

  async deleteFriendship(id: number): Promise<boolean> {
    try {
      await db
        .delete(friendships)
        .where(eq(friendships.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting friendship:", error);
      return false;
    }
  }

  // Messaging methods
  async getUserConversations(userId: number): Promise<any[]> {
    // Find all users this user has exchanged messages with
    const sentMessageUsers = await db
      .select({
        otherUserId: messages.receiverId,
        lastMessage: sql`MAX(${messages.createdAt})`
      })
      .from(messages)
      .where(eq(messages.senderId, userId))
      .groupBy(messages.receiverId);

    const receivedMessageUsers = await db
      .select({
        otherUserId: messages.senderId,
        lastMessage: sql`MAX(${messages.createdAt})`
      })
      .from(messages)
      .where(eq(messages.receiverId, userId))
      .groupBy(messages.senderId);

    // Combine and deduplicate the list of users
    const conversationMap = new Map();
    
    [...sentMessageUsers, ...receivedMessageUsers].forEach(item => {
      if (!conversationMap.has(item.otherUserId) || 
          (item.lastMessage && conversationMap.get(item.otherUserId)?.lastMessage &&
           new Date(item.lastMessage as string) > new Date(conversationMap.get(item.otherUserId).lastMessage as string))) {
        conversationMap.set(item.otherUserId, item);
      }
    });

    const conversations = Array.from(conversationMap.values());
    
    // Get user details and last message for each conversation
    const result = [];
    for (const conversation of conversations) {
      const otherUser = await this.getUser(conversation.otherUserId);
      if (!otherUser) continue;

      // Get the last message
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, userId),
              eq(messages.receiverId, conversation.otherUserId)
            ),
            and(
              eq(messages.senderId, conversation.otherUserId),
              eq(messages.receiverId, userId)
            )
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Count unread messages
      const unreadCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.senderId, conversation.otherUserId),
            eq(messages.receiverId, userId),
            eq(messages.read, false)
          )
        );

      result.push({
        userId: conversation.otherUserId,
        username: otherUser.username,
        lastMessage: lastMessage.content,
        lastMessageTime: lastMessage.createdAt,
        unreadCount: Number(unreadCount[0].count) || 0
      });
    }

    // Sort by most recent message
    return result.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }

  async getConversationMessages(senderId: number, receiverId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, senderId),
            eq(messages.receiverId, receiverId)
          ),
          and(
            eq(messages.senderId, receiverId),
            eq(messages.receiverId, senderId)
          )
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Create a notification for the message recipient
    await this.createNotification({
      userId: message.receiverId,
      type: "message",
      title: "New Message",
      message: "You have received a new message",
      data: { senderId: message.senderId, messageId: newMessage.id }
    });

    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    try {
      await db
        .update(messages)
        .set({ read: true })
        .where(eq(messages.id, id));
      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }

  async markAllMessagesAsRead(userId: number): Promise<boolean> {
    try {
      await db
        .update(messages)
        .set({ read: true })
        .where(
          and(
            eq(messages.receiverId, userId),
            eq(messages.read, false)
          )
        );
      return true;
    } catch (error) {
      console.error("Error marking all messages as read:", error);
      return false;
    }
  }

  // Team methods
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(asc(teams.name));
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const teamMemberships = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    if (teamMemberships.length === 0) {
      return [];
    }

    const teamIds = teamMemberships.map(tm => tm.teamId);
    return await db
      .select()
      .from(teams)
      .where(inArray(teams.id, teamIds))
      .orderBy(asc(teams.name));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    // We need to work around the createdAt column name issue
    const values = {
      name: team.name,
      tag: team.tag,
      description: team.description,
      logo: team.logo || "",
      creator_id: team.creatorId
    };
    
    // Use SQL to insert directly with the column names as they exist in the database
    const result = await db.execute(
      sql`INSERT INTO teams (name, tag, description, logo, creator_id) 
          VALUES (${values.name}, ${values.tag}, ${values.description}, ${values.logo}, ${values.creator_id}) 
          RETURNING *`
    );
    
    // Log the result to debug what we're getting back
    console.log("SQL insert result:", JSON.stringify(result));
    
    // Extract the team from the result - assume first row of rows array
    const newTeam = result.rows?.[0] || {};

    // Map the database column names to the expected properties
    const mappedTeam: Team = {
      id: Number(newTeam.id),
      name: String(newTeam.name),
      tag: String(newTeam.tag),
      logo: newTeam.logo ? String(newTeam.logo) : null,
      description: newTeam.description ? String(newTeam.description) : null,
      creatorId: Number(newTeam.creator_id),
      createdAt: new Date(String(newTeam.created_at))
    };

    try {
      // Automatically add the creator as a team member with 'leader' role
      await this.addTeamMember({
        teamId: mappedTeam.id,
        userId: team.creatorId,
        role: "leader"
      });
    } catch (error) {
      console.error("Error adding team member:", error);
      // Continue execution even if there's an error adding the member
      // This ensures the team is still created even if member creation fails
    }

    try {
      // Create a social activity for team creation
      await this.createSocialActivity({
        userId: team.creatorId,
        type: "team_created",
        content: `Created a new team: ${team.name}`,
        data: { teamId: mappedTeam.id, teamName: team.name }
      });
    } catch (error) {
      console.error("Error creating social activity:", error);
      // Continue execution to ensure team creation still succeeds
    }

    return mappedTeam;
  }

  async updateTeam(id: number, data: Partial<Team>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    try {
      // Delete team members first
      await db
        .delete(teamMembers)
        .where(eq(teamMembers.teamId, id));

      // Delete the team
      await db
        .delete(teams)
        .where(eq(teams.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting team:", error);
      return false;
    }
  }
  
  async isTeamLeader(teamId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId),
          eq(teamMembers.role, "leader")
        )
      );
    return !!member;
  }

  async isTeamMember(teamId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
    return !!member;
  }

  // Team members methods
  async getTeamMembers(teamId: number): Promise<any[]> {
    // Join with users to get the usernames
    return await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        username: users.username
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
  }

  async getTeamMember(teamId: number, userId: number): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
    return member || undefined;
  }

  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db
      .insert(teamMembers)
      .values(teamMember)
      .returning();

    // Get team details
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamMember.teamId));

    // Create a social activity for joining the team
    if (teamMember.role !== "leader") {  // Don't create activity for team creator
      await this.createSocialActivity({
        userId: teamMember.userId,
        type: "team_joined",
        content: `Joined a team: ${team?.name || "Unknown Team"}`,
        data: { teamId: teamMember.teamId, teamName: team?.name }
      });

      // Get the team creator's username for the notification
      const [teamCreator] = await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, team.creatorId));

      // Create a notification for the invited user
      await this.createNotification({
        userId: teamMember.userId,
        type: "team",
        title: "Team Invitation",
        message: `You have been added to the team "${team?.name}" by ${teamCreator?.username || "a team leader"}`,
        data: { teamId: teamMember.teamId, teamName: team?.name }
      });
    }

    return newMember;
  }

  async updateTeamMemberRole(id: number, role: string): Promise<TeamMember | undefined> {
    if (!["leader", "co-leader", "member"].includes(role)) {
      throw new Error("Invalid team member role");
    }

    const [member] = await db
      .update(teamMembers)
      .set({ role })
      .where(eq(teamMembers.id, id))
      .returning();
    return member || undefined;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    try {
      const member = await this.getTeamMember(teamId, userId);

      if (!member) {
        return false;
      }

      // Check if this is the last leader
      if (member.role === "leader") {
        const leaders = await db
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, teamId),
              eq(teamMembers.role, "leader")
            )
          );

        if (leaders.length === 1) {
          // This is the last leader, find a co-leader to promote
          const [coLeader] = await db
            .select()
            .from(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, teamId),
                eq(teamMembers.role, "co-leader")
              )
            );

          if (coLeader) {
            // Promote co-leader to leader
            await db
              .update(teamMembers)
              .set({ role: "leader" })
              .where(eq(teamMembers.id, coLeader.id));
          } else {
            // No co-leader, find regular member to promote
            const [regularMember] = await db
              .select()
              .from(teamMembers)
              .where(
                and(
                  eq(teamMembers.teamId, teamId),
                  eq(teamMembers.role, "member"),
                  not(eq(teamMembers.userId, userId))
                )
              );

            if (regularMember) {
              // Promote regular member to leader
              await db
                .update(teamMembers)
                .set({ role: "leader" })
                .where(eq(teamMembers.id, regularMember.id));
            } else {
              // This is the last member, delete the team
              await this.deleteTeam(teamId);
              return true;
            }
          }
        }
      }

      // Delete the team member
      await db
        .delete(teamMembers)
        .where(and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        ));
      
      return true;
    } catch (error) {
      console.error("Error removing team member:", error);
      return false;
    }
  }
  
  // Match report methods
  async getMatchReport(id: number): Promise<MatchReport | undefined> {
    const [report] = await db
      .select()
      .from(matchReports)
      .where(eq(matchReports.id, id));
    return report || undefined;
  }

  async getMatchReports(matchId: number): Promise<MatchReport[]> {
    return await db
      .select()
      .from(matchReports)
      .where(eq(matchReports.tournamentMatchId, matchId))
      .orderBy(desc(matchReports.reportedAt));
  }

  async createMatchReport(report: InsertMatchReport): Promise<MatchReport> {
    const [newReport] = await db
      .insert(matchReports)
      .values(report)
      .returning();
    return newReport;
  }

  async verifyMatchReport(id: number, verifiedById: number): Promise<MatchReport | undefined> {
    const now = new Date();
    const [report] = await db
      .update(matchReports)
      .set({
        status: 'verified',
        verifiedAt: now,
        verifiedById
      })
      .where(eq(matchReports.id, id))
      .returning();
    return report || undefined;
  }

  async disputeMatchReport(id: number, disputeReason: string): Promise<MatchReport | undefined> {
    const [report] = await db
      .update(matchReports)
      .set({
        status: 'disputed',
        disputeReason
      })
      .where(eq(matchReports.id, id))
      .returning();
    return report || undefined;
  }

  async isMatchParticipant(matchId: number, userId: number, teamId: number | null): Promise<boolean> {
    // Get the match
    const match = await this.getTournamentMatch(matchId);
    if (!match) return false;

    // Get the tournament
    const tournament = await this.getTournament(match.tournamentId);
    if (!tournament) return false;

    // First check if this is an individual match (no team IDs)
    if (!match.team1Id && !match.team2Id) {
      // For individual tournaments, check if the user is a player in the match
      return match.player1Id === userId || match.player2Id === userId;
    } else {
      // For team tournaments, check if the user is part of the team
      if (!teamId) return false;
      
      // Check if the team is in the match
      const isTeamInMatch = match.team1Id === teamId || match.team2Id === teamId;
      if (!isTeamInMatch) return false;
      
      // Check if the user is a member of the team
      return await this.isTeamMember(teamId, userId);
    }
  }

  async updateMatchResult(
    matchId: number, 
    winnerId: number | null, 
    winnerTeamId: number | null, 
    score: string
  ): Promise<TournamentMatch | undefined> {
    const [match] = await db
      .update(tournamentMatches)
      .set({
        winnerId,
        winnerTeamId,
        score,
        status: 'completed',
        completedTime: new Date()
      })
      .where(eq(tournamentMatches.id, matchId))
      .returning();
    return match || undefined;
  }

  async notifyMatchReportSubmitted(match: TournamentMatch, report: MatchReport): Promise<void> {
    // Determine who to notify based on the match type
    let userIdsToNotify: number[] = [];
    
    // For individual matches
    if (match.player1Id && match.player1Id !== report.reporterId) {
      userIdsToNotify.push(match.player1Id);
    }
    if (match.player2Id && match.player2Id !== report.reporterId) {
      userIdsToNotify.push(match.player2Id);
    }
    
    // For team matches, notify team captains
    if (match.team1Id) {
      const teamMembers = await this.getTeamMembers(match.team1Id);
      const captains = teamMembers.filter(m => m.role === 'leader' || m.role === 'co-leader');
      const captainIds = captains.map(c => c.userId).filter(id => id !== report.reporterId);
      for (const id of captainIds) {
        userIdsToNotify.push(id);
      }
    }
    
    if (match.team2Id) {
      const teamMembers = await this.getTeamMembers(match.team2Id);
      const captains = teamMembers.filter(m => m.role === 'leader' || m.role === 'co-leader');
      const captainIds = captains.map(c => c.userId).filter(id => id !== report.reporterId);
      for (const id of captainIds) {
        userIdsToNotify.push(id);
      }
    }
    
    // Also notify admins
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
    
    const adminIds = admins.map(a => a.id).filter(id => id !== report.reporterId);
    for (const id of adminIds) {
      userIdsToNotify.push(id);
    }
    
    // Remove duplicates using object as a map
    const uniqueIds: Record<number, boolean> = {};
    userIdsToNotify.forEach(id => uniqueIds[id] = true);
    const uniqueUserIds = Object.keys(uniqueIds).map(id => parseInt(id));
    
    // Create notifications
    for (const userId of uniqueUserIds) {
      await this.createNotification({
        userId,
        type: 'match',
        title: 'Match Result Reported',
        message: `A match result has been reported and is awaiting verification.`,
        data: {
          matchId: match.id,
          reportId: report.id,
          reporterId: report.reporterId,
          tournamentId: match.tournamentId
        }
      });
    }
  }

  async notifyReportDisputed(report: MatchReport, disputedByUserId: number, reason: string): Promise<void> {
    // Notify the reporter
    if (report.reporterId !== disputedByUserId) {
      await this.createNotification({
        userId: report.reporterId,
        type: 'match',
        title: 'Match Report Disputed',
        message: `Your match report has been disputed: ${reason}`,
        data: {
          reportId: report.id,
          matchId: report.tournamentMatchId,
          disputedBy: disputedByUserId,
          reason
        }
      });
    }
    
    // Notify admins about the dispute
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
    
    for (const admin of admins) {
      if (admin.id !== disputedByUserId) {
        await this.createNotification({
          userId: admin.id,
          type: 'match',
          title: 'Match Report Disputed',
          message: `A match report has been disputed and requires review. Reason: ${reason}`,
          data: {
            reportId: report.id,
            matchId: report.tournamentMatchId,
            disputedBy: disputedByUserId,
            reason
          }
        });
      }
    }
  }

  async notifyReportVerified(report: MatchReport): Promise<void> {
    // Get the match
    const match = await this.getTournamentMatch(report.tournamentMatchId);
    if (!match) return;
    
    // Get users to notify (all participants)
    let userIdsToNotify: number[] = [];
    
    if (match.player1Id) userIdsToNotify.push(match.player1Id);
    if (match.player2Id) userIdsToNotify.push(match.player2Id);
    
    // For team matches, notify all team members
    if (match.team1Id) {
      const teamMembers = await this.getTeamMembers(match.team1Id);
      for (const member of teamMembers) {
        userIdsToNotify.push(member.userId);
      }
    }
    
    if (match.team2Id) {
      const teamMembers = await this.getTeamMembers(match.team2Id);
      for (const member of teamMembers) {
        userIdsToNotify.push(member.userId);
      }
    }
    
    // Remove duplicates using object as a map
    const uniqueIds: Record<number, boolean> = {};
    userIdsToNotify.forEach(id => uniqueIds[id] = true);
    const uniqueUserIds = Object.keys(uniqueIds).map(id => parseInt(id));
    
    // Create notifications
    for (const userId of uniqueUserIds) {
      await this.createNotification({
        userId,
        type: 'match',
        title: 'Match Result Verified',
        message: `The result for your match has been officially verified.`,
        data: {
          matchId: match.id,
          reportId: report.id,
          tournamentId: match.tournamentId
        }
      });
    }
  }

  // Social Activity methods
  async getUserSocialActivities(userId: number): Promise<SocialActivity[]> {
    return await db
      .select()
      .from(socialActivities)
      .where(eq(socialActivities.userId, userId))
      .orderBy(desc(socialActivities.createdAt));
  }

  async getFriendsSocialActivities(userId: number): Promise<SocialActivity[]> {
    const friends = await this.getFriendsByUser(userId);
    if (friends.length === 0) {
      return [];
    }

    const friendIds = friends.map(f => f.id);
    return await db
      .select()
      .from(socialActivities)
      .where(
        inArray(socialActivities.userId, friendIds)
      )
      .orderBy(desc(socialActivities.createdAt));
  }

  async createSocialActivity(activity: InsertSocialActivity): Promise<SocialActivity> {
    const [newActivity] = await db
      .insert(socialActivities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async deleteSocialActivity(id: number): Promise<boolean> {
    try {
      await db
        .delete(socialActivities)
        .where(eq(socialActivities.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting social activity:", error);
      return false;
    }
  }
  
  // Lobby methods
  async getLobby(id: number): Promise<Lobby | undefined> {
    const [lobby] = await db.select().from(lobbies).where(eq(lobbies.id, id));
    return lobby || undefined;
  }
  
  async getAllLobbies(): Promise<Lobby[]> {
    return await db.select().from(lobbies).orderBy(desc(lobbies.createdAt));
  }
  
  async deleteLobby(id: number): Promise<boolean> {
    try {
      // Check if lobby exists first
      const lobby = await this.getLobby(id);
      if (!lobby) {
        return false;
      }
      
      // Delete all lobby messages associated with this lobby
      await db
        .delete(lobbyMessages)
        .where(eq(lobbyMessages.lobbyId, id));
      
      // Delete all lobby members associated with this lobby
      await db
        .delete(lobbyMembers)
        .where(eq(lobbyMembers.lobbyId, id));
      
      // Delete the lobby
      await db
        .delete(lobbies)
        .where(eq(lobbies.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting lobby:", error);
      return false;
    }
  }
  
  async getLobbyMembers(lobbyId: number): Promise<LobbyMember[]> {
    return await db
      .select()
      .from(lobbyMembers)
      .where(eq(lobbyMembers.lobbyId, lobbyId));
  }
  
  async getLobbyMember(lobbyId: number, userId: number): Promise<LobbyMember | undefined> {
    const [member] = await db
      .select()
      .from(lobbyMembers)
      .where(
        and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, userId)
        )
      );
    return member || undefined;
  }
  
  async addLobbyMember(member: InsertLobbyMember): Promise<LobbyMember> {
    const [newMember] = await db
      .insert(lobbyMembers)
      .values(member)
      .returning();
    return newMember;
  }
  
  async updateLobbyMemberReadyStatus(lobbyId: number, userId: number, ready: boolean): Promise<LobbyMember | undefined> {
    const [member] = await db
      .update(lobbyMembers)
      .set({ ready })
      .where(
        and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, userId)
        )
      )
      .returning();
    return member || undefined;
  }
  
  async removeLobbyMember(lobbyId: number, userId: number): Promise<boolean> {
    try {
      await db
        .delete(lobbyMembers)
        .where(
          and(
            eq(lobbyMembers.lobbyId, lobbyId),
            eq(lobbyMembers.userId, userId)
          )
        );
      return true;
    } catch (error) {
      console.error("Error removing lobby member:", error);
      return false;
    }
  }
  
  async updateLobby(id: number, data: Partial<Lobby>): Promise<Lobby | undefined> {
    const [lobby] = await db
      .update(lobbies)
      .set(data)
      .where(eq(lobbies.id, id))
      .returning();
    return lobby || undefined;
  }

  async deleteLobby(id: number): Promise<boolean> {
    try {
      // Check if lobby exists first
      const lobby = await this.getLobby(id);
      if (!lobby) {
        return false;
      }
      
      // Delete the lobby
      await db
        .delete(lobbies)
        .where(eq(lobbies.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting lobby:", error);
      return false;
    }
  }

  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(asc(achievements.id));
  }

  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id));
    return achievement || undefined;
  }

  async getAchievementsByGame(gameId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.gameId, gameId))
      .orderBy(asc(achievements.id));
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.category, category))
      .orderBy(asc(achievements.id));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async updateAchievement(id: number, data: Partial<Achievement>): Promise<Achievement | undefined> {
    const [achievement] = await db
      .update(achievements)
      .set(data)
      .where(eq(achievements.id, id))
      .returning();
    return achievement || undefined;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    try {
      // Check if achievement exists first
      const achievement = await this.getAchievement(id);
      if (!achievement) {
        return false;
      }
      
      // Delete the achievement
      await db
        .delete(achievements)
        .where(eq(achievements.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting achievement:", error);
      return false;
    }
  }

  // User Achievement methods
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(asc(userAchievements.achievementId));
  }

  async getUserAchievementDetails(userId: number): Promise<any[]> {
    // Join user achievements with achievement details
    return await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        progress: userAchievements.progress,
        completed: userAchievements.completed,
        completedAt: userAchievements.completedAt,
        claimedReward: userAchievements.claimedReward,
        claimedAt: userAchievements.claimedAt,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        category: achievements.category,
        rarity: achievements.rarity,
        tokenReward: achievements.tokenReward,
        criteria: achievements.criteria,
        gameId: achievements.gameId,
        isHidden: achievements.isHidden,
      })
      .from(userAchievements)
      .innerJoin(
        achievements,
        eq(userAchievements.achievementId, achievements.id)
      )
      .where(
        and(
          eq(userAchievements.userId, userId),
          or(
            eq(achievements.isHidden, false),
            eq(userAchievements.completed, true)
          )
        )
      )
      .orderBy(asc(achievements.category), asc(achievements.name));
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    // Check if this user already has this achievement
    const [existingAchievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userAchievement.userId),
          eq(userAchievements.achievementId, userAchievement.achievementId)
        )
      );
    
    if (existingAchievement) {
      // Return the existing one without changes
      return existingAchievement;
    }
    
    // Create new user achievement
    const [newUserAchievement] = await db
      .insert(userAchievements)
      .values(userAchievement)
      .returning();
    return newUserAchievement;
  }

  async updateUserAchievementProgress(userId: number, achievementId: number, progress: number): Promise<UserAchievement | undefined> {
    // Get the achievement to check completion criteria
    const achievement = await this.getAchievement(achievementId);
    if (!achievement) return undefined;
    
    // Check if user has this achievement record
    const [userAchievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
    
    let completed = false;
    const now = new Date();
    
    // Check completion criteria based on achievement type
    const criteria = achievement.criteria as any;
    if (criteria && criteria.target && progress >= criteria.target) {
      completed = true;
    }
    
    if (userAchievement) {
      // If achievement is already completed, don't update progress
      if (userAchievement.completed) {
        return userAchievement;
      }
      
      // Update existing record
      const [updatedAchievement] = await db
        .update(userAchievements)
        .set({
          progress,
          completed,
          completedAt: completed ? now : null
        })
        .where(eq(userAchievements.id, userAchievement.id))
        .returning();
      
      // Create achievement notification if newly completed
      if (completed && !userAchievement.completed) {
        // Add notification for completion
        await db.insert(notifications).values({
          userId,
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You've unlocked the "${achievement.name}" achievement!`,
          data: { achievementId: achievement.id, tokenReward: achievement.tokenReward },
          read: false
        });
      }
      
      return updatedAchievement;
    } else {
      // Create new record
      const [newUserAchievement] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          progress,
          completed,
          completedAt: completed ? now : null,
          claimedReward: false
        })
        .returning();
      
      // Create achievement notification if completed on first tracking
      if (completed) {
        // Add notification for completion
        await db.insert(notifications).values({
          userId,
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You've unlocked the "${achievement.name}" achievement!`,
          data: { achievementId: achievement.id, tokenReward: achievement.tokenReward },
          read: false
        });
      }
      
      return newUserAchievement;
    }
  }

  async completeUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    // Get the achievement details
    const achievement = await this.getAchievement(achievementId);
    if (!achievement) return undefined;
    
    const now = new Date();
    
    // Check if user has this achievement already
    const [userAchievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
    
    if (userAchievement) {
      // If achievement is already completed, don't update
      if (userAchievement.completed) {
        return userAchievement;
      }
      
      // Update to completed
      const [updatedAchievement] = await db
        .update(userAchievements)
        .set({
          completed: true,
          completedAt: now,
          // If achievement has criteria with a target, set progress to that target
          progress: (achievement.criteria as any).target || 100
        })
        .where(eq(userAchievements.id, userAchievement.id))
        .returning();
      
      // Add notification for completion
      await db.insert(notifications).values({
        userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've unlocked the "${achievement.name}" achievement!`,
        data: { achievementId: achievement.id, tokenReward: achievement.tokenReward },
        read: false
      });
      
      return updatedAchievement;
    } else {
      // Create new completion record
      const [newUserAchievement] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          progress: (achievement.criteria as any).target || 100,
          completed: true,
          completedAt: now,
          claimedReward: false
        })
        .returning();
      
      // Add notification for completion
      await db.insert(notifications).values({
        userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've unlocked the "${achievement.name}" achievement!`,
        data: { achievementId: achievement.id, tokenReward: achievement.tokenReward },
        read: false
      });
      
      return newUserAchievement;
    }
  }

  async claimAchievementReward(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    // Get the achievement to verify reward
    const achievement = await this.getAchievement(achievementId);
    if (!achievement || achievement.tokenReward <= 0) return undefined;
    
    // Check if user has completed this achievement and hasn't claimed reward
    const [userAchievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId),
          eq(userAchievements.completed, true),
          eq(userAchievements.claimedReward, false)
        )
      );
    
    if (!userAchievement) return undefined;
    
    const now = new Date();
    
    // Start a transaction to claim the reward and update tokens
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Update user tokens
    const newTokenBalance = user.tokens + achievement.tokenReward;
    await this.updateUserTokens(userId, newTokenBalance);
    
    // Record the transaction
    await this.createTransaction({
      userId,
      amount: achievement.tokenReward,
      type: 'achievement',
      timestamp: now
    });
    
    // Mark achievement as claimed
    const [updatedAchievement] = await db
      .update(userAchievements)
      .set({
        claimedReward: true,
        claimedAt: now
      })
      .where(eq(userAchievements.id, userAchievement.id))
      .returning();
    
    // Add notification for reward claim
    await db.insert(notifications).values({
      userId,
      type: 'transaction',
      title: 'Achievement Reward Claimed',
      message: `You've received ${achievement.tokenReward} tokens for completing "${achievement.name}"!`,
      data: { achievementId: achievement.id, tokenReward: achievement.tokenReward },
      read: false
    });
    
    return updatedAchievement;
  }

  // Bonus methods
  async getAllBonuses(): Promise<Bonus[]> {
    return await db.select().from(bonuses).orderBy(asc(bonuses.id));
  }

  async getActiveBonus(): Promise<Bonus[]> {
    const now = new Date();
    return await db
      .select()
      .from(bonuses)
      .where(
        and(
          eq(bonuses.isActive, true),
          or(
            sql`${bonuses.endDate} IS NULL`,
            sql`${bonuses.endDate} > ${now}`
          ),
          sql`${bonuses.startDate} <= ${now}`
        )
      )
      .orderBy(asc(bonuses.id));
  }

  async getBonus(id: number): Promise<Bonus | undefined> {
    const [bonus] = await db
      .select()
      .from(bonuses)
      .where(eq(bonuses.id, id));
    return bonus || undefined;
  }

  async getBonusByType(type: string): Promise<Bonus[]> {
    const now = new Date();
    return await db
      .select()
      .from(bonuses)
      .where(
        and(
          eq(bonuses.type, type),
          eq(bonuses.isActive, true),
          or(
            sql`${bonuses.endDate} IS NULL`,
            sql`${bonuses.endDate} > ${now}`
          ),
          sql`${bonuses.startDate} <= ${now}`
        )
      )
      .orderBy(asc(bonuses.id));
  }

  async createBonus(bonus: InsertBonus): Promise<Bonus> {
    const [newBonus] = await db
      .insert(bonuses)
      .values(bonus)
      .returning();
    return newBonus;
  }

  async updateBonus(id: number, data: Partial<Bonus>): Promise<Bonus | undefined> {
    const [bonus] = await db
      .update(bonuses)
      .set(data)
      .where(eq(bonuses.id, id))
      .returning();
    return bonus || undefined;
  }

  async activateBonus(id: number): Promise<Bonus | undefined> {
    const [bonus] = await db
      .update(bonuses)
      .set({ isActive: true })
      .where(eq(bonuses.id, id))
      .returning();
    return bonus || undefined;
  }

  async deactivateBonus(id: number): Promise<Bonus | undefined> {
    const [bonus] = await db
      .update(bonuses)
      .set({ isActive: false })
      .where(eq(bonuses.id, id))
      .returning();
    return bonus || undefined;
  }

  // User Bonus methods
  async getUserBonuses(userId: number): Promise<UserBonus[]> {
    return await db
      .select()
      .from(userBonuses)
      .where(eq(userBonuses.userId, userId))
      .orderBy(asc(userBonuses.bonusId));
  }

  async createUserBonus(userBonus: InsertUserBonus): Promise<UserBonus> {
    const [newUserBonus] = await db
      .insert(userBonuses)
      .values(userBonus)
      .returning();
    return newUserBonus;
  }

  async claimUserBonus(userId: number, bonusId: number): Promise<UserBonus | undefined> {
    // Get the bonus to verify details
    const bonus = await this.getBonus(bonusId);
    if (!bonus || !bonus.isActive || bonus.tokenAmount <= 0) return undefined;
    
    // Check if this bonus is currently active
    const now = new Date();
    if (bonus.startDate > now || (bonus.endDate && bonus.endDate < now)) {
      return undefined;
    }
    
    // Check if user already has this bonus and if it's already claimed
    const [userBonus] = await db
      .select()
      .from(userBonuses)
      .where(
        and(
          eq(userBonuses.userId, userId),
          eq(userBonuses.bonusId, bonusId)
        )
      );
    
    if (userBonus && userBonus.claimed) {
      return userBonus; // Already claimed
    }
    
    // Get user to update tokens
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Create transaction for the bonus
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        amount: bonus.tokenAmount,
        type: 'bonus',
        timestamp: now
      })
      .returning();
    
    // Update user tokens
    const newTokenBalance = user.tokens + bonus.tokenAmount;
    await this.updateUserTokens(userId, newTokenBalance);
    
    if (userBonus) {
      // Update existing user bonus
      const [updatedUserBonus] = await db
        .update(userBonuses)
        .set({
          claimed: true,
          claimedAt: now,
          transactionId: transaction.id
        })
        .where(eq(userBonuses.id, userBonus.id))
        .returning();
      
      // Add notification for bonus claim
      await db.insert(notifications).values({
        userId,
        type: 'transaction',
        title: `${bonus.name} Claimed`,
        message: `You've received ${bonus.tokenAmount} tokens from ${bonus.name}!`,
        data: { bonusId: bonus.id, tokenAmount: bonus.tokenAmount },
        read: false
      });
      
      return updatedUserBonus;
    } else {
      // Create new user bonus record
      const [newUserBonus] = await db
        .insert(userBonuses)
        .values({
          userId,
          bonusId,
          claimed: true,
          eligibleAt: now,
          claimedAt: now,
          transactionId: transaction.id
        })
        .returning();
      
      // Add notification for bonus claim
      await db.insert(notifications).values({
        userId,
        type: 'transaction',
        title: `${bonus.name} Claimed`,
        message: `You've received ${bonus.tokenAmount} tokens from ${bonus.name}!`,
        data: { bonusId: bonus.id, tokenAmount: bonus.tokenAmount },
        read: false
      });
      
      return newUserBonus;
    }
  }

  async checkDailyBonusEligibility(userId: number): Promise<boolean> {
    // Find daily login bonus
    const dailyBonuses = await this.getBonusByType('daily_login');
    if (dailyBonuses.length === 0) return false;
    
    const dailyBonus = dailyBonuses[0];
    
    // Check if user has claimed a daily bonus today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userBonusesResult = await db
      .select()
      .from(userBonuses)
      .where(
        and(
          eq(userBonuses.userId, userId),
          eq(userBonuses.bonusId, dailyBonus.id),
          eq(userBonuses.claimed, true),
          sql`DATE(${userBonuses.claimedAt}) = DATE(${today})`
        )
      );
    
    // User is eligible if they haven't claimed today
    return userBonusesResult.length === 0;
  }
}

export const storage = new DatabaseStorage();