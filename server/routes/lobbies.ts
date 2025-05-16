import { Request, Response } from "express";
import { db } from "../db";
import { 
  lobbies, 
  lobbyMembers, 
  lobbyMessages, 
  users, 
  games, 
  teams, 
  insertLobbySchema,
  insertLobbyMessageSchema
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import type { Application } from "express";

// Get active websocket connections for lobby notifications
const getLobbyConnections = (wss: WebSocketServer, lobbyId: number) => {
  const connections: { userId: number; ws: WebSocket }[] = [];
  
  wss.clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN && 
        client.userId && 
        client.subscribedLobbies && 
        client.subscribedLobbies.includes(lobbyId)) {
      connections.push({ userId: client.userId, ws: client });
    }
  });
  
  return connections;
};

// Broadcast message to all users in a lobby
const broadcastToLobby = (wss: WebSocketServer, lobbyId: number, message: any) => {
  const connections = getLobbyConnections(wss, lobbyId);
  
  console.log(`Broadcasting to lobby ${lobbyId}:`, message.action, 'to', connections.length, 'connections');
  
  connections.forEach(({ ws }) => {
    try {
      ws.send(JSON.stringify({
        type: "LOBBY_UPDATE",
        lobbyId,
        data: message
      }));
    } catch (error) {
      console.error('Error broadcasting to client:', error);
    }
  });
};

export const registerLobbyRoutes = (app: Application, wss: WebSocketServer) => {
  // Get all lobbies
  app.get("/api/lobbies", async (req: Request, res: Response) => {
    try {
      const results = await db.query.lobbies.findMany({
        orderBy: [desc(lobbies.createdAt)],
        with: {
          game: true,
          owner: true,
          team: true,
        },
      });
      
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get a single lobby by ID
  app.get("/api/lobbies/:id", async (req: Request, res: Response) => {
    try {
      const lobbyId = parseInt(req.params.id);
      
      const result = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
        with: {
          game: true,
          owner: true,
          team: true,
          members: {
            with: {
              user: true,
              team: true,
            }
          },
          messages: {
            with: {
              user: true,
            },
            orderBy: [desc(lobbyMessages.createdAt)],
          },
        },
      });
      
      if (!result) {
        return res.status(404).json({ error: "Lobby not found" });
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create a new lobby
  app.post("/api/lobbies", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Parse and validate the request body
      const createLobbyData = insertLobbySchema.parse(req.body);
      
      // Create the lobby
      const [newLobby] = await db.insert(lobbies)
        .values({
          ...createLobbyData,
          ownerId: req.user.id,
        })
        .returning();
        
      // Add the owner as the first member
      await db.insert(lobbyMembers)
        .values({
          lobbyId: newLobby.id,
          userId: req.user.id,
          teamId: createLobbyData.teamId,
          ready: true, // Owner is automatically ready
        });
        
      // Return the created lobby with relationships
      const lobbyWithRelations = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, newLobby.id),
        with: {
          game: true,
          owner: true,
          team: true,
          members: {
            with: {
              user: true,
              team: true,
            }
          },
        },
      });
      
      res.status(201).json(lobbyWithRelations);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // Join a lobby
  app.post("/api/lobbies/:id/join", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      const { teamId, password } = req.body;
      
      // Check if the lobby exists
      const lobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
      });
      
      if (!lobby) {
        return res.status(404).json({ error: "Lobby not found" });
      }
      
      // Check if the lobby is full
      if (lobby.currentPlayers >= lobby.maxPlayers) {
        return res.status(400).json({ error: "Lobby is full" });
      }
      
      // Check if the lobby is open
      if (lobby.status !== "open") {
        return res.status(400).json({ error: "Lobby is not open for joining" });
      }
      
      // Check password if required
      if (lobby.password && lobby.password !== password) {
        return res.status(403).json({ error: "Invalid password" });
      }
      
      // Check if user is already in the lobby
      const existingMember = await db.query.lobbyMembers.findFirst({
        where: and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, req.user.id)
        ),
      });
      
      if (existingMember) {
        return res.status(400).json({ error: "You are already in this lobby" });
      }
      
      // Add the user to the lobby
      await db.insert(lobbyMembers)
        .values({
          lobbyId,
          userId: req.user.id,
          teamId: teamId ? parseInt(teamId) : undefined,
        });
        
      // Update the lobby's current players count
      await db.update(lobbies)
        .set({ currentPlayers: lobby.currentPlayers + 1 })
        .where(eq(lobbies.id, lobbyId));
        
      // Get updated lobby with members
      const updatedLobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
        with: {
          game: true,
          owner: true,
          team: true,
          members: {
            with: {
              user: true,
              team: true,
            }
          },
        },
      });
      
      // Broadcast to lobby members
      broadcastToLobby(wss, lobbyId, {
        action: "MEMBER_JOINED",
        lobby: updatedLobby,
        user: req.user,
      });
      
      res.json(updatedLobby);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Leave a lobby
  app.delete("/api/lobbies/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      
      // Check if the lobby exists
      const lobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
      });
      
      if (!lobby) {
        return res.status(404).json({ error: "Lobby not found" });
      }
      
      // Check if user is in the lobby
      const member = await db.query.lobbyMembers.findFirst({
        where: and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, req.user.id)
        ),
      });
      
      if (!member) {
        return res.status(400).json({ error: "You are not in this lobby" });
      }
      
      // If user is the owner and game hasn't started, cancel the lobby
      if (lobby.ownerId === req.user.id && lobby.status === "open") {
        // Update lobby status to cancelled
        await db.update(lobbies)
          .set({ status: "cancelled" })
          .where(eq(lobbies.id, lobbyId));
          
        // Get updated lobby
        const updatedLobby = await db.query.lobbies.findFirst({
          where: eq(lobbies.id, lobbyId),
        });
        
        // Broadcast to lobby members
        broadcastToLobby(wss, lobbyId, {
          action: "LOBBY_CANCELLED",
          lobby: updatedLobby,
        });
        
        return res.json({ success: true, message: "Lobby cancelled" });
      }
      
      // Otherwise, just remove the user from the lobby
      await db.delete(lobbyMembers)
        .where(and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, req.user.id)
        ));
        
      // Update the lobby's current players count
      await db.update(lobbies)
        .set({ currentPlayers: lobby.currentPlayers - 1 })
        .where(eq(lobbies.id, lobbyId));
        
      // Get updated lobby
      const updatedLobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
        with: {
          members: {
            with: {
              user: true,
            }
          },
        },
      });
      
      // Broadcast to lobby members
      broadcastToLobby(wss, lobbyId, {
        action: "MEMBER_LEFT",
        lobby: updatedLobby,
        userId: req.user.id,
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Set ready status
  app.patch("/api/lobbies/:id/ready", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      const { ready } = req.body;
      
      // Check if user is in the lobby
      const member = await db.query.lobbyMembers.findFirst({
        where: and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, req.user.id)
        ),
      });
      
      if (!member) {
        return res.status(400).json({ error: "You are not in this lobby" });
      }
      
      // Update ready status
      await db.update(lobbyMembers)
        .set({ ready: !!ready })
        .where(and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, req.user.id)
        ));
        
      // Get updated lobby
      const updatedLobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
        with: {
          members: {
            with: {
              user: true,
              team: true,
            }
          },
        },
      });
      
      // Broadcast to lobby members
      broadcastToLobby(wss, lobbyId, {
        action: "READY_STATUS_CHANGED",
        lobby: updatedLobby,
        userId: req.user.id,
        ready: !!ready,
      });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a lobby (owner or admin only)
  app.delete("/api/lobbies/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      
      // Check if the lobby exists
      const lobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
      });
      
      if (!lobby) {
        return res.status(404).json({ error: "Lobby not found" });
      }
      
      // Check if user is authorized (owner or admin)
      if (lobby.ownerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to delete this lobby" });
      }
      
      // Don't allow deletion of in-progress lobbies except by admin
      if (lobby.status === "in_progress" && req.user.role !== "admin") {
        return res.status(400).json({ error: "Cannot delete an in-progress lobby" });
      }
      
      // First delete all lobby members
      await db.delete(lobbyMembers)
        .where(eq(lobbyMembers.lobbyId, lobbyId));
      
      // Then delete all lobby messages
      await db.delete(lobbyMessages)
        .where(eq(lobbyMessages.lobbyId, lobbyId));
      
      // Finally delete the lobby
      await db.delete(lobbies)
        .where(eq(lobbies.id, lobbyId));
      
      // Broadcast to lobby members
      broadcastToLobby(wss, lobbyId, {
        action: "LOBBY_DELETED",
        lobbyId,
      });
      
      res.json({ success: true, message: "Lobby deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Start the match
  app.post("/api/lobbies/:id/start", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      
      // Check if the lobby exists
      const lobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
        with: {
          members: true,
        },
      });
      
      if (!lobby) {
        return res.status(404).json({ error: "Lobby not found" });
      }
      
      // Check if user is the owner
      if (lobby.ownerId !== req.user.id) {
        return res.status(403).json({ error: "Only the lobby owner can start the match" });
      }
      
      // Check if lobby is in a valid state to start
      if (lobby.status !== "open") {
        return res.status(400).json({ error: "Lobby is not in a valid state to start" });
      }
      
      // Check if all members are ready
      const allReady = lobby.members.every(member => member.ready);
      if (!allReady) {
        return res.status(400).json({ error: "Not all players are ready" });
      }
      
      // Start the match
      await db.update(lobbies)
        .set({ 
          status: "in_progress", 
          startedAt: new Date(),
        })
        .where(eq(lobbies.id, lobbyId));
        
      // Get updated lobby
      const updatedLobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, lobbyId),
        with: {
          game: true,
          members: {
            with: {
              user: true,
              team: true,
            }
          },
        },
      });
      
      // Broadcast to lobby members
      broadcastToLobby(wss, lobbyId, {
        action: "MATCH_STARTED",
        lobby: updatedLobby,
      });
      
      res.json(updatedLobby);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Send a message in the lobby chat
  app.post("/api/lobbies/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      console.log(`Received message for lobby ${lobbyId} from user ${req.user.id}: ${req.body.content.substring(0, 20)}...`);
      
      // Validate input data
      let messageData;
      try {
        messageData = insertLobbyMessageSchema.parse({
          lobbyId,
          userId: req.user.id,
          content: req.body.content
        });
        
        if (!messageData.content || messageData.content.trim() === "") {
          return res.status(400).json({ error: "Message content is required" });
        }
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ error: validationError.errors });
        }
        throw validationError;
      }
      
      // Check if user is in the lobby
      const member = await db.query.lobbyMembers.findFirst({
        where: and(
          eq(lobbyMembers.lobbyId, lobbyId),
          eq(lobbyMembers.userId, req.user.id)
        ),
      });
      
      if (!member) {
        return res.status(400).json({ error: "You are not in this lobby" });
      }
      
      // Create the message
      const [message] = await db.insert(lobbyMessages)
        .values(messageData)
        .returning();
        
      // Get the message with user data
      const messageWithUser = await db.query.lobbyMessages.findFirst({
        where: eq(lobbyMessages.id, message.id),
        with: {
          user: true,
        },
      });
      
      // Broadcast to lobby members
      broadcastToLobby(wss, lobbyId, {
        action: "NEW_MESSAGE",
        message: messageWithUser,
      });
      
      // Send success response
      res.status(201).json(messageWithUser);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: error.message });
    }
  });
};