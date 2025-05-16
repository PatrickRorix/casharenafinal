import { Request, Response } from "express";
import { isAdmin } from "../middleware/admin";
import { storage } from "../storage";
import { insertGameSchema, insertTournamentSchema } from "@shared/schema";
import { z } from "zod";

export function registerAdminRoutes(app: any) {
  // Get all users (admin only)
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get platform stats (admin only)
  app.get("/api/admin/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const userCount = await storage.getUserCount();
      const gameCount = await storage.getGameCount();
      const tournamentCount = await storage.getTournamentCount();
      const totalTransactions = await storage.getTotalTransactions();
      
      return res.json({
        userCount,
        gameCount,
        tournamentCount,
        totalTransactions,
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      return res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // Create a new game (admin only)
  app.post("/api/admin/games", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(validatedData);
      return res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      console.error("Error creating game:", error);
      return res.status(500).json({ message: "Failed to create game" });
    }
  });
  
  // Update a game (admin only)
  app.patch("/api/admin/games/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id, 10);
      const game = await storage.updateGame(gameId, req.body);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      return res.json(game);
    } catch (error) {
      console.error("Error updating game:", error);
      return res.status(500).json({ message: "Failed to update game" });
    }
  });
  
  // Delete a game (admin only) - BE CAREFUL!
  app.delete("/api/admin/games/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id, 10);
      const success = await storage.deleteGame(gameId);
      
      if (!success) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting game:", error);
      return res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // Create a new tournament (admin only)
  app.post("/api/admin/tournaments", isAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      return res.status(201).json(tournament);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tournament data", errors: error.errors });
      }
      console.error("Error creating tournament:", error);
      return res.status(500).json({ message: "Failed to create tournament" });
    }
  });
  
  // Update user role (admin only)
  app.patch("/api/admin/users/:id/role", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { role } = req.body;
      
      if (!role || (role !== "user" && role !== "admin")) {
        return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
      }
      
      const user = await storage.updateUserRole(userId, role);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      return res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Adjust user balance (admin only)
  app.patch("/api/admin/users/:id/tokens", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { tokens, reason } = req.body;
      
      if (typeof tokens !== "number") {
        return res.status(400).json({ message: "Invalid tokens amount" });
      }
      
      const user = await storage.updateUserTokens(userId, tokens);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a transaction record for this adjustment
      if (reason) {
        await storage.createTransaction({
          userId,
          amount: tokens,
          type: tokens > 0 ? "admin_grant" : "admin_deduction",
          timestamp: new Date()
        });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error adjusting user tokens:", error);
      return res.status(500).json({ message: "Failed to adjust user tokens" });
    }
  });
  
  // Get all lobbies (admin only)
  app.get("/api/admin/lobbies", isAdmin, async (req: Request, res: Response) => {
    try {
      const lobbies = await storage.getAllLobbies();
      return res.json(lobbies);
    } catch (error) {
      console.error("Error fetching lobbies:", error);
      return res.status(500).json({ message: "Failed to fetch lobbies" });
    }
  });
  
  // Delete a lobby (admin only)
  app.delete("/api/admin/lobbies/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const lobbyId = parseInt(req.params.id, 10);
      const success = await storage.deleteLobby(lobbyId);
      
      if (!success) {
        return res.status(404).json({ message: "Lobby not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lobby:", error);
      return res.status(500).json({ message: "Failed to delete lobby" });
    }
  });
  
  // Get all teams (admin only)
  app.get("/api/admin/teams", isAdmin, async (req: Request, res: Response) => {
    try {
      const teams = await storage.getAllTeams();
      return res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      return res.status(500).json({ message: "Failed to fetch teams" });
    }
  });
  
  // Delete a team (admin only)
  app.delete("/api/admin/teams/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id, 10);
      const success = await storage.deleteTeam(teamId);
      
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team:", error);
      return res.status(500).json({ message: "Failed to delete team" });
    }
  });
}