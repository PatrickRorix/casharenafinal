import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTransactionSchema, 
  insertTournamentSchema,
  insertTournamentParticipantSchema,
  insertTournamentMatchSchema,
  insertNotificationSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  insertMatchReportSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { registerAdminRoutes } from "./routes/admin";
import { registerSocialRoutes } from "./routes/social";
import { registerTeamRoutes } from "./routes/teams";
import { registerLobbyRoutes } from "./routes/lobbies";
import Stripe from 'stripe';
import { WebSocketServer, WebSocket } from 'ws';

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key');
}

const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY) : 
  undefined;

// Map to store connected WebSocket clients with their user IDs
const clients: Map<number, Set<WebSocket>> = new Map();

// Function to broadcast notifications to connected clients
function broadcastNotification(userId: number, notification: any) {
  const userClients = clients.get(userId);
  
  if (userClients) {
    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });
    
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Function to create a notification and broadcast it
async function createAndBroadcastNotification(notification: any) {
  try {
    const savedNotification = await storage.createNotification(notification);
    broadcastNotification(notification.userId, savedNotification);
    return savedNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication middleware and routes
  setupAuth(app);
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Register social features routes
  registerSocialRoutes(app);
  
  // Register team and match reporting routes
  registerTeamRoutes(app);
  
  // Create HTTP server (defined here to be used by both Express and WebSocket)
  const httpServer = createServer(app);
  
  // Set up WebSocket server on a distinct path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth' && data.userId) {
          const userId = parseInt(data.userId);
          
          if (!isNaN(userId)) {
            // Add client to the user's set of connections
            if (!clients.has(userId)) {
              clients.set(userId, new Set());
            }
            clients.get(userId)?.add(ws);
            
            // Add user ID to the WebSocket object for later reference
            (ws as any).userId = userId;
            
            // Initialize lobby subscriptions array
            (ws as any).subscribedLobbies = [];
            
            // Send confirmation
            ws.send(JSON.stringify({ 
              type: 'auth_success',
              message: 'Authenticated successfully'
            }));
            
            // Send unread notifications count
            const unreadCount = await storage.getUnreadNotificationsCount(userId);
            ws.send(JSON.stringify({
              type: 'unread_count',
              count: unreadCount
            }));
          }
        }
        
        // Handle lobby subscription
        if (data.type === 'subscribe_lobby' && data.lobbyId && (ws as any).userId) {
          const lobbyId = parseInt(data.lobbyId);
          
          if (!isNaN(lobbyId)) {
            // Add lobby ID to subscribed lobbies
            if (!(ws as any).subscribedLobbies) {
              (ws as any).subscribedLobbies = [];
            }
            
            if (!(ws as any).subscribedLobbies.includes(lobbyId)) {
              (ws as any).subscribedLobbies.push(lobbyId);
              console.log(`User ${(ws as any).userId} subscribed to lobby ${lobbyId}`);
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'lobby_subscribed',
                lobbyId,
                message: `Subscribed to lobby ${lobbyId}`
              }));
              
              // Notify the user that they're now subscribed
              ws.send(JSON.stringify({
                type: 'LOBBY_UPDATE',
                lobbyId,
                data: {
                  action: 'SUBSCRIBED',
                  message: `You are now connected to lobby ${lobbyId}`
                }
              }));
            }
          }
        }
        
        // Handle lobby unsubscription
        if (data.type === 'unsubscribe_lobby' && data.lobbyId && (ws as any).subscribedLobbies) {
          const lobbyId = parseInt(data.lobbyId);
          
          if (!isNaN(lobbyId)) {
            // Remove lobby ID from subscribed lobbies
            (ws as any).subscribedLobbies = (ws as any).subscribedLobbies.filter(
              (id: number) => id !== lobbyId
            );
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'lobby_unsubscribed',
              lobbyId,
              message: `Unsubscribed from lobby ${lobbyId}`
            }));
          }
        }
        
        // Handle typing indicator
        if (data.type === 'typing' && data.lobbyId && data.userId && data.username) {
          const lobbyId = parseInt(data.lobbyId);
          const userId = parseInt(data.userId);
          
          if (!isNaN(lobbyId) && !isNaN(userId)) {
            console.log(`User ${data.username} (ID: ${userId}) is typing in lobby ${lobbyId}`);
            
            // Broadcast typing status to ALL users in the lobby (including sender for consistency)
            wss.clients.forEach((client: any) => {
              if (client.readyState === WebSocket.OPEN && 
                  client.subscribedLobbies && 
                  client.subscribedLobbies.includes(lobbyId)) {
                client.send(JSON.stringify({
                  type: 'LOBBY_UPDATE',
                  lobbyId,
                  data: {
                    action: 'TYPING',
                    userId: userId,
                    username: data.username
                  }
                }));
              }
            });
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });
    
    ws.on('close', () => {
      // Remove client from all user connection sets
      clients.forEach((userClients, userId) => {
        if (userClients.has(ws)) {
          userClients.delete(ws);
          
          // Remove empty sets
          if (userClients.size === 0) {
            clients.delete(userId);
          }
        }
      });
    });
  });
  
  // Register lobby routes - must be after WebSocket setup
  registerLobbyRoutes(app, wss);
  // Get all games
  app.get("/api/games", async (req: Request, res: Response) => {
    try {
      const games = await storage.getAllGames();
      return res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      return res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get game by ID with its matches
  app.get("/api/games/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGame(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      // Get matches for this game
      const matches = await storage.getMatchesByGame(id);
      
      return res.json({ 
        game, 
        matches 
      });
    } catch (error) {
      console.error("Error fetching game details:", error);
      return res.status(500).json({ message: "Failed to fetch game details" });
    }
  });

  // Get all matches
  app.get("/api/matches", async (req: Request, res: Response) => {
    try {
      const matches = await storage.getAllMatches();
      return res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      return res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Create a new user
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get user stats
  app.get("/api/users/:id/stats", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stats = await storage.getUserStats(userId);
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get user transactions
  app.get("/api/users/:id/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const transactions = await storage.getTransactionsByUser(userId);
      return res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      return res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Create transaction (deposit, etc.)
  app.post("/api/users/:id/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        userId
      });
      
      const transaction = await storage.createTransaction(validatedData);
      
      // Update user tokens based on transaction
      const newTokens = user.tokens + validatedData.amount;
      await storage.updateUserTokens(userId, newTokens);
      
      return res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      return res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Stripe payment intent creation for deposits
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        console.error("Stripe API key is missing or invalid");
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in to make a deposit" });
      }

      const { amount } = req.body;
      
      if (!amount || amount < 100) {
        return res.status(400).json({ error: "Amount must be at least 100 tokens" });
      }

      // Convert token amount to cents for Stripe (100 tokens = $1)
      const amountInCents = Math.round(amount / 100 * 100);
      
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          // Store user info in metadata for reference
          metadata: {
            userId: req.user.id.toString(),
            username: req.user.username,
            action: "deposit"
          },
        });

        if (!paymentIntent || !paymentIntent.client_secret) {
          throw new Error("Invalid payment intent created");
        }

        res.json({
          clientSecret: paymentIntent.client_secret,
          amount: amount
        });
      } catch (stripeError) {
        console.error("Stripe API error:", stripeError);
        res.status(502).json({ 
          error: "Payment service unavailable",
          details: process.env.NODE_ENV === 'development' ? stripeError.message : undefined
        });
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });
  
  // Verify payment status endpoint
  app.post("/api/verify-payment", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Check if the payment succeeded
      if (paymentIntent.status === 'succeeded') {
        // Verify that this payment was for the authenticated user
        if (paymentIntent.metadata.userId === req.user.id.toString()) {
          return res.json({ success: true, status: paymentIntent.status });
        } else {
          return res.status(403).json({ error: "Payment not associated with this user" });
        }
      } else {
        return res.json({ 
          success: false, 
          status: paymentIntent.status,
          message: "Payment has not succeeded yet" 
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Webhook to handle Stripe events (payment completions, etc.)
  app.post("/api/stripe-webhook", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const payload = req.body;
      const sig = req.headers['stripe-signature'] as string;

      // Verify webhook signature - add your webhook secret in production
      // let event;
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      // if (endpointSecret) {
      //   try {
      //     event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      //   } catch (err) {
      //     return res.status(400).send(`Webhook Error: ${err.message}`);
      //   }
      // } else {
      //   event = payload;
      // }

      // For now, we'll just use the raw payload without verification
      const event = payload;

      // Handle the event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        // Extract user info from metadata
        const userId = parseInt(paymentIntent.metadata.userId);
        // Convert cents back to tokens (100 cents = 100 tokens)
        const amount = paymentIntent.amount * 100 / 100;
        
        if (!isNaN(userId)) {
          const user = await storage.getUser(userId);
          if (user) {
            // Create a transaction record
            await storage.createTransaction({
              userId,
              amount,
              type: "deposit",
              timestamp: new Date()
            });
            
            // Update user tokens
            await storage.updateUserTokens(userId, user.tokens + amount);
          }
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id, 10);
      // Ensure users can only update their own profiles
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this user" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Update user settings
  app.patch("/api/users/:id/settings", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id, 10);
      // Ensure users can only update their own settings
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Not authorized to update settings for this user" });
      }
      
      const success = await storage.updateUserSettings(userId, req.body);
      if (!success) {
        return res.status(500).json({ message: "Failed to update settings" });
      }
      
      return res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating user settings:", error);
      return res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Get authenticated user
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Get all users (for search functionality)
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const currentUserId = req.isAuthenticated() ? req.user!.id : null;
      const users = await storage.getAllUsers();
      
      // If authenticated, enhance user objects with friendship status
      if (currentUserId) {
        const enhancedUsers = users.map(user => {
          // Don't include the current user in the results
          if (user.id === currentUserId) {
            return null;
          }
          
          // For security, remove password before sending
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }).filter(Boolean);
        
        return res.json(enhancedUsers);
      } else {
        // If not authenticated, just return users without passwords
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        return res.json(usersWithoutPasswords);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Send a friend request
  app.post("/api/friends/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const friendId = parseInt(req.params.userId, 10);
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already friends or request pending
      const myId = req.user!.id;
      
      // Create friend request
      const friendship = await storage.createFriendship({
        userId: myId,
        friendId: friendId,
        status: "pending"
      });
      
      // Create notification for friend
      await storage.createNotification({
        userId: friendId,
        type: "friend_request",
        title: "New Friend Request",
        message: `${req.user!.username} sent you a friend request`,
        read: false
      });
      
      return res.status(201).json(friendship);
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get current user's friends
  app.get("/api/friends", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const friends = await storage.getFriendsByUser(req.user!.id);
      return res.json(friends);
    } catch (error: any) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get current user's friend requests
  app.get("/api/friend-requests", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const requests = await storage.getFriendRequests(req.user!.id);
      return res.json(requests);
    } catch (error: any) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get conversations for the current user
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For now, returning an empty array until we implement the messages table
      return res.json([]);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get messages for a specific conversation
  app.get("/api/messages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For now, returning an empty array until we implement the messages table
      return res.json([]);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get team for current user
  app.get("/api/my-teams", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For now, returning an empty array until we implement the teams table
      return res.json([]);
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get social feed for current user
  app.get("/api/feed", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // For now, returning an empty array until we implement the social activities table
      return res.json([]);
    } catch (error: any) {
      console.error("Error fetching social feed:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // For demo purposes - get current user
  app.get("/api/current-user", async (req: Request, res: Response) => {
    try {
      // Try to find a demo user
      let demoUser = await storage.getUserByUsername("demouser");
      
      if (!demoUser) {
        // Create a demo user if none exists
        demoUser = await storage.createUser({
          username: "demouser",
          password: "password123"
        });
        
        // Add some demo transactions
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        await storage.createTransaction({
          userId: demoUser.id,
          amount: 500,
          type: "deposit",
          timestamp: twoHoursAgo
        });
        
        await storage.createTransaction({
          userId: demoUser.id,
          amount: 120,
          type: "win",
          timestamp: yesterday
        });
        
        await storage.createTransaction({
          userId: demoUser.id,
          amount: -50,
          type: "match_entry",
          timestamp: yesterday
        });
        
        // Create initial stats for the user
        await storage.createOrUpdateStats({
          userId: demoUser.id,
          winRate: 68,
          matchesPlayed: 47,
          totalEarnings: 3720,
          avgPosition: 3
        });
      }
      
      return res.json(demoUser);
    } catch (error) {
      console.error("Error getting current user:", error);
      return res.status(500).json({ message: "Failed to get current user" });
    }
  });

  // Tournament endpoints
  // Get all tournaments
  app.get("/api/tournaments", async (req: Request, res: Response) => {
    try {
      const tournaments = await storage.getAllTournaments();
      return res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      return res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  // Get tournaments by game
  app.get("/api/games/:id/tournaments", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id, 10);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const tournaments = await storage.getTournamentsByGame(gameId);
      return res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments by game:", error);
      return res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  // Get tournament by ID
  app.get("/api/tournaments/:id", async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id, 10);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      // Get participants and matches for this tournament
      const participants = await storage.getTournamentParticipants(tournamentId);
      const matches = await storage.getTournamentMatches(tournamentId);
      
      // Get the game data
      const game = await storage.getGame(tournament.gameId);

      return res.json({
        tournament,
        game,
        participants,
        matches
      });
    } catch (error) {
      console.error("Error fetching tournament details:", error);
      return res.status(500).json({ message: "Failed to fetch tournament details" });
    }
  });

  // Create a new tournament
  app.post("/api/tournaments", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Transform strings to proper types before validation
      const tournamentData = {
        ...req.body,
        // Convert dates
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : null,
        // Ensure numeric fields are numbers
        gameId: Number(req.body.gameId),
        maxParticipants: Number(req.body.maxParticipants),
        currentParticipants: Number(req.body.currentParticipants || 0),
        entryFee: Number(req.body.entryFee),
        prizePool: Number(req.body.prizePool),
      };
      
      console.log("Validating tournament data:", tournamentData);
      const validatedData = insertTournamentSchema.parse(tournamentData);
      
      // Verify the game exists
      const game = await storage.getGame(validatedData.gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const tournament = await storage.createTournament(validatedData);
      return res.status(201).json(tournament);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation error:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid tournament data", errors: error.errors });
      }
      console.error("Error creating tournament:", error);
      return res.status(500).json({ message: "Failed to create tournament" });
    }
  });

  // Update a tournament
  app.patch("/api/tournaments/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const tournamentId = parseInt(req.params.id, 10);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      const updatedTournament = await storage.updateTournament(tournamentId, req.body);
      return res.json(updatedTournament);
    } catch (error) {
      console.error("Error updating tournament:", error);
      return res.status(500).json({ message: "Failed to update tournament" });
    }
  });

  // Get user's tournaments (tournaments they've registered for)
  app.get("/api/users/:id/tournaments", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const participations = await storage.getUserTournaments(userId);
      
      // Get full tournament details for each participation
      const tournamentPromises = participations.map(async (p) => {
        const tournament = await storage.getTournament(p.tournamentId);
        const game = tournament ? await storage.getGame(tournament.gameId) : null;
        return {
          participation: p,
          tournament,
          game
        };
      });
      
      const tournaments = await Promise.all(tournamentPromises);
      return res.json(tournaments);
    } catch (error) {
      console.error("Error fetching user tournaments:", error);
      return res.status(500).json({ message: "Failed to fetch user tournaments" });
    }
  });

  // Register for a tournament
  app.post("/api/tournaments/:id/register", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const tournamentId = parseInt(req.params.id, 10);
      if (isNaN(tournamentId)) {
        return res.status(400).json({ message: "Invalid tournament ID" });
      }

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      // Check if tournament is full
      if (tournament.currentParticipants >= tournament.maxParticipants) {
        return res.status(400).json({ message: "Tournament is already full" });
      }

      // Check if tournament has already started
      if (tournament.status !== 'upcoming') {
        return res.status(400).json({ message: "Tournament has already started or ended" });
      }

      // Check if user has enough tokens for entry fee
      const user = req.user!;
      if (user.tokens < tournament.entryFee) {
        return res.status(400).json({ message: "Not enough tokens for entry fee" });
      }

      // Check if user is already registered
      const existingParticipations = await storage.getUserTournaments(user.id);
      const alreadyRegistered = existingParticipations.some(p => p.tournamentId === tournamentId);
      if (alreadyRegistered) {
        return res.status(400).json({ message: "Already registered for this tournament" });
      }

      // Create transaction for entry fee
      if (tournament.entryFee > 0) {
        await storage.createTransaction({
          userId: user.id,
          amount: -tournament.entryFee,
          type: "tournament_entry",
          timestamp: new Date()
        });

        // Update user tokens
        await storage.updateUserTokens(user.id, user.tokens - tournament.entryFee);
      }

      // Register user
      const participant = await storage.createTournamentParticipant({
        tournamentId,
        userId: user.id,
        status: "registered"
      });

      return res.status(201).json(participant);
    } catch (error) {
      console.error("Error registering for tournament:", error);
      return res.status(500).json({ message: "Failed to register for tournament" });
    }
  });

  // Tournament match endpoints
  app.get("/api/tournament-matches/:id", async (req: Request, res: Response) => {
    try {
      const matchId = parseInt(req.params.id, 10);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const match = await storage.getTournamentMatch(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Get player info
      const player1 = match.player1Id ? await storage.getUser(match.player1Id) : null;
      const player2 = match.player2Id ? await storage.getUser(match.player2Id) : null;
      const winner = match.winnerId ? await storage.getUser(match.winnerId) : null;

      return res.json({
        match,
        player1: player1 ? { id: player1.id, username: player1.username } : null,
        player2: player2 ? { id: player2.id, username: player2.username } : null,
        winner: winner ? { id: winner.id, username: winner.username } : null
      });
    } catch (error) {
      console.error("Error fetching tournament match:", error);
      return res.status(500).json({ message: "Failed to fetch tournament match" });
    }
  });

  // Update tournament match (report score, etc.)
  app.patch("/api/tournament-matches/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const matchId = parseInt(req.params.id, 10);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const match = await storage.getTournamentMatch(matchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Check if the user is a participant in this match
      const user = req.user!;
      if (match.player1Id !== user.id && match.player2Id !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this match" });
      }

      // Update match
      const updatedMatch = await storage.updateTournamentMatch(matchId, req.body);
      
      // If the match is completed and has a winner, update tournament/participant data
      if (updatedMatch && updatedMatch.status === 'completed' && updatedMatch.winnerId) {
        const tournament = await storage.getTournament(updatedMatch.tournamentId);
        
        // Update participant status for the winner and loser
        if (tournament) {
          const participants = await storage.getTournamentParticipants(tournament.id);
          
          // Find winner and loser participant records
          const winnerParticipant = participants.find(p => p.userId === updatedMatch.winnerId);
          
          // Determine the loser ID
          const loserId = updatedMatch.player1Id === updatedMatch.winnerId 
            ? updatedMatch.player2Id 
            : updatedMatch.player1Id;
            
          const loserParticipant = participants.find(p => p.userId === loserId);
          
          // Update the winner participant
          if (winnerParticipant) {
            await storage.updateTournamentParticipant(winnerParticipant.id, {
              status: "active"
            });
          }
          
          // Update the loser participant
          if (loserParticipant) {
            await storage.updateTournamentParticipant(loserParticipant.id, {
              status: "eliminated"
            });
          }
        }
      }
      
      return res.json(updatedMatch);
    } catch (error) {
      console.error("Error updating tournament match:", error);
      return res.status(500).json({ message: "Failed to update tournament match" });
    }
  });

  // Notification endpoints
  
  // Get user notifications
  app.get("/api/users/:id/notifications", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id, 10);
      
      // Users can only access their own notifications
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Not authorized to access these notifications" });
      }
      
      const notifications = await storage.getUserNotifications(userId);
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  // Get unread notifications count
  app.get("/api/users/:id/notifications/unread-count", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id, 10);
      
      // Users can only access their own notifications
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Not authorized to access these notifications" });
      }
      
      const count = await storage.getUnreadNotificationsCount(userId);
      return res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });
  
  // Create a notification
  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only allow admin users to create notifications for others
      const isAdmin = req.user!.username === "admin"; // Simple check, you might want to expand this
      
      const validatedData = insertNotificationSchema.parse(req.body);
      
      // If not admin, only allow creating notifications for themselves
      if (!isAdmin && validatedData.userId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to create notifications for other users" });
      }
      
      const notification = await storage.createNotification(validatedData);
      
      // Broadcast the notification to connected clients
      broadcastNotification(validatedData.userId, notification);
      
      return res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      console.error("Error creating notification:", error);
      return res.status(500).json({ message: "Failed to create notification" });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const notificationId = parseInt(req.params.id, 10);
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Mark all notifications as read
  app.patch("/api/users/:id/notifications/read-all", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id, 10);
      
      // Users can only access their own notifications
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "Not authorized to access these notifications" });
      }
      
      const success = await storage.markAllNotificationsAsRead(userId);
      
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ message: "Failed to mark all notifications as read" });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  
  // Delete a notification
  app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const notificationId = parseInt(req.params.id, 10);
      const success = await storage.deleteNotification(notificationId);
      
      if (success) {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      return res.status(500).json({ message: "Failed to delete notification" });
    }
  });
  
  // Create test notifications (for demo purposes)
  app.post("/api/test-notifications", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const notificationTypes = ["tournament", "match", "transaction", "system"];
      
      // Create one notification of each type
      const notifications = [];
      
      for (const type of notificationTypes) {
        let title = "";
        let message = "";
        
        switch(type) {
          case "tournament":
            title = "Tournament Invitation";
            message = "You've been invited to a new tournament: CashArena Championship!";
            break;
          case "match":
            title = "Upcoming Match";
            message = "Your match in PUBG Mobile starts in 30 minutes!";
            break;
          case "transaction":
            title = "Transaction Complete";
            message = "You received 500 WinTokens from a tournament victory!";
            break;
          case "system":
            title = "Welcome to CashArena";
            message = "Complete your profile to earn 100 bonus tokens.";
            break;
        }
        
        const notification = await storage.createNotification({
          userId,
          type,
          title,
          message,
          read: false
        });
        
        // Broadcast the notification to connected clients
        broadcastNotification(userId, notification);
        
        notifications.push(notification);
      }
      
      return res.status(201).json({ 
        message: "Test notifications created successfully",
        count: notifications.length,
        notifications
      });
    } catch (error) {
      console.error("Error creating test notifications:", error);
      return res.status(500).json({ message: "Failed to create test notifications" });
    }
  });

  // Achievement endpoints
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const gameId = req.query.gameId ? Number(req.query.gameId) : undefined;
      const category = req.query.category as string | undefined;
      
      let achievements;
      if (gameId) {
        achievements = await storage.getAchievementsByGame(gameId);
      } else if (category) {
        achievements = await storage.getAchievementsByCategory(category);
      } else {
        achievements = await storage.getAllAchievements();
      }
      
      // Filter out hidden achievements for non-admins
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        achievements = achievements.filter(achievement => !achievement.isHidden);
      }
      
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Error fetching achievements" });
    }
  });

  app.get("/api/achievements/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const achievement = await storage.getAchievement(id);
      
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      // Don't allow non-admins to see hidden achievements
      if (achievement.isHidden && (!req.isAuthenticated() || req.user.role !== 'admin')) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error("Error fetching achievement:", error);
      res.status(500).json({ message: "Error fetching achievement" });
    }
  });
  
  app.post("/api/achievements", async (req: Request, res: Response) => {
    try {
      // Only admins can create achievements
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const achievement = await storage.createAchievement(req.body);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      res.status(500).json({ message: "Error creating achievement" });
    }
  });
  
  app.patch("/api/achievements/:id", async (req: Request, res: Response) => {
    try {
      // Only admins can update achievements
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = Number(req.params.id);
      const achievement = await storage.updateAchievement(id, req.body);
      
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error("Error updating achievement:", error);
      res.status(500).json({ message: "Error updating achievement" });
    }
  });
  
  app.delete("/api/achievements/:id", async (req: Request, res: Response) => {
    try {
      // Only admins can delete achievements
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = Number(req.params.id);
      const success = await storage.deleteAchievement(id);
      
      if (!success) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting achievement:", error);
      res.status(500).json({ message: "Error deleting achievement" });
    }
  });
  
  // User Achievement endpoints
  app.get("/api/users/:id/achievements", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Only authenticated users can see their own achievements or admins can see anyone's
      if (!req.isAuthenticated() || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const achievements = await storage.getUserAchievementDetails(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Error fetching user achievements" });
    }
  });
  
  app.post("/api/users/:id/achievements/:achievementId/progress", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const achievementId = Number(req.params.achievementId);
      const { progress } = req.body;
      
      if (progress === undefined || typeof progress !== 'number') {
        return res.status(400).json({ message: "Progress is required and must be a number" });
      }
      
      // Only authenticated users can update their own progress or admins can update anyone's
      if (!req.isAuthenticated() || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const userAchievement = await storage.updateUserAchievementProgress(userId, achievementId, progress);
      
      if (!userAchievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json(userAchievement);
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      res.status(500).json({ message: "Error updating achievement progress" });
    }
  });
  
  app.post("/api/users/:id/achievements/:achievementId/complete", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const achievementId = Number(req.params.achievementId);
      
      // Only authenticated users can complete their own achievements or admins can complete anyone's
      if (!req.isAuthenticated() || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const userAchievement = await storage.completeUserAchievement(userId, achievementId);
      
      if (!userAchievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json(userAchievement);
    } catch (error) {
      console.error("Error completing achievement:", error);
      res.status(500).json({ message: "Error completing achievement" });
    }
  });
  
  app.post("/api/users/:id/achievements/:achievementId/claim", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const achievementId = Number(req.params.achievementId);
      
      // Only authenticated users can claim their own rewards
      if (!req.isAuthenticated() || req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const userAchievement = await storage.claimAchievementReward(userId, achievementId);
      
      if (!userAchievement) {
        return res.status(404).json({ message: "Achievement not found or already claimed" });
      }
      
      res.json(userAchievement);
    } catch (error) {
      console.error("Error claiming achievement reward:", error);
      res.status(500).json({ message: "Error claiming achievement reward" });
    }
  });
  
  // Bonus endpoints
  app.get("/api/bonuses", async (req: Request, res: Response) => {
    try {
      const active = req.query.active === 'true';
      const type = req.query.type as string | undefined;
      
      let bonuses;
      if (active) {
        bonuses = await storage.getActiveBonus();
      } else if (type) {
        bonuses = await storage.getBonusByType(type);
      } else {
        // Only admins can see all bonuses
        if (!req.isAuthenticated() || req.user.role !== 'admin') {
          return res.status(403).json({ message: "Unauthorized" });
        }
        bonuses = await storage.getAllBonuses();
      }
      
      res.json(bonuses);
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      res.status(500).json({ message: "Error fetching bonuses" });
    }
  });
  
  app.get("/api/bonuses/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const bonus = await storage.getBonus(id);
      
      if (!bonus) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      
      res.json(bonus);
    } catch (error) {
      console.error("Error fetching bonus:", error);
      res.status(500).json({ message: "Error fetching bonus" });
    }
  });
  
  app.post("/api/bonuses", async (req: Request, res: Response) => {
    try {
      // Only admins can create bonuses
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const bonus = await storage.createBonus(req.body);
      res.status(201).json(bonus);
    } catch (error) {
      console.error("Error creating bonus:", error);
      res.status(500).json({ message: "Error creating bonus" });
    }
  });
  
  app.patch("/api/bonuses/:id", async (req: Request, res: Response) => {
    try {
      // Only admins can update bonuses
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = Number(req.params.id);
      const bonus = await storage.updateBonus(id, req.body);
      
      if (!bonus) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      
      res.json(bonus);
    } catch (error) {
      console.error("Error updating bonus:", error);
      res.status(500).json({ message: "Error updating bonus" });
    }
  });
  
  app.post("/api/bonuses/:id/activate", async (req: Request, res: Response) => {
    try {
      // Only admins can activate bonuses
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = Number(req.params.id);
      const bonus = await storage.activateBonus(id);
      
      if (!bonus) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      
      res.json(bonus);
    } catch (error) {
      console.error("Error activating bonus:", error);
      res.status(500).json({ message: "Error activating bonus" });
    }
  });
  
  app.post("/api/bonuses/:id/deactivate", async (req: Request, res: Response) => {
    try {
      // Only admins can deactivate bonuses
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = Number(req.params.id);
      const bonus = await storage.deactivateBonus(id);
      
      if (!bonus) {
        return res.status(404).json({ message: "Bonus not found" });
      }
      
      res.json(bonus);
    } catch (error) {
      console.error("Error deactivating bonus:", error);
      res.status(500).json({ message: "Error deactivating bonus" });
    }
  });
  
  app.get("/api/users/:id/bonuses", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Only authenticated users can see their own bonuses or admins can see anyone's
      if (!req.isAuthenticated() || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const bonuses = await storage.getUserBonuses(userId);
      res.json(bonuses);
    } catch (error) {
      console.error("Error fetching user bonuses:", error);
      res.status(500).json({ message: "Error fetching user bonuses" });
    }
  });
  
  app.post("/api/users/:id/bonuses/:bonusId/claim", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const bonusId = Number(req.params.bonusId);
      
      // Only authenticated users can claim their own bonuses
      if (!req.isAuthenticated() || req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const userBonus = await storage.claimUserBonus(userId, bonusId);
      
      if (!userBonus) {
        return res.status(404).json({ message: "Bonus not found, not active, or already claimed" });
      }
      
      res.json(userBonus);
    } catch (error) {
      console.error("Error claiming bonus:", error);
      res.status(500).json({ message: "Error claiming bonus" });
    }
  });
  
  app.get("/api/users/:id/daily-bonus", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      
      // Only authenticated users can check their own daily bonus or admins can check anyone's
      if (!req.isAuthenticated() || (req.user.id !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const isEligible = await storage.checkDailyBonusEligibility(userId);
      res.json({ eligible: isEligible });
    } catch (error) {
      console.error("Error checking daily bonus eligibility:", error);
      res.status(500).json({ message: "Error checking daily bonus eligibility" });
    }
  });

  // Get lobby members with user information
  app.get("/api/lobbies/:id/members", async (req: Request, res: Response) => {
    try {
      const lobbyId = parseInt(req.params.id);
      const members = await storage.getLobbyMembers(lobbyId);
      
      // Get user details for each member
      const membersWithUserInfo = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            username: user?.username || 'Unknown'
          };
        })
      );
      
      res.json(membersWithUserInfo);
    } catch (error) {
      console.error("Error fetching lobby members:", error);
      res.status(500).json({ message: "Failed to fetch lobby members" });
    }
  });
  
  // Toggle ready status for a lobby member
  app.patch("/api/lobbies/:id/ready", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      const { ready } = req.body;
      
      // Update the member's ready status
      const member = await storage.updateLobbyMemberReadyStatus(lobbyId, req.user.id, ready);
      
      if (!member) {
        return res.status(404).json({ message: "You are not a member of this lobby" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error updating ready status:", error);
      res.status(500).json({ message: "Failed to update ready status" });
    }
  });
  
  // Join a lobby
  app.post("/api/lobbies/:id/join", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      const lobby = await storage.getLobby(lobbyId);
      
      if (!lobby) {
        return res.status(404).json({ message: "Lobby not found" });
      }
      
      if (lobby.status !== "open") {
        return res.status(400).json({ error: "This lobby is not open for joining" });
      }
      
      if (lobby.currentPlayers >= lobby.maxPlayers) {
        return res.status(400).json({ error: "This lobby is full" });
      }
      
      // Check if user is already in the lobby
      const existingMember = await storage.getLobbyMember(lobbyId, req.user.id);
      if (existingMember) {
        return res.status(400).json({ error: "You are already in this lobby" });
      }
      
      // Add user to the lobby
      const member = await storage.addLobbyMember({
        lobbyId,
        userId: req.user.id,
        ready: false,
        joinedAt: new Date(),
        teamId: null,
        side: null,
        role: "player"
      });
      
      // Update lobby player count
      await storage.updateLobby(lobbyId, {
        currentPlayers: lobby.currentPlayers + 1
      });
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining lobby:", error);
      res.status(500).json({ message: "Failed to join lobby" });
    }
  });
  
  // Leave a lobby (or kick a member if owner)
  app.delete("/api/lobbies/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const lobbyId = parseInt(req.params.id);
      const userId = parseInt(req.query.userId as string) || req.user.id;
      const lobby = await storage.getLobby(lobbyId);
      
      if (!lobby) {
        return res.status(404).json({ message: "Lobby not found" });
      }
      
      // Only the owner can remove other members
      if (userId !== req.user.id && lobby.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You can only remove yourself unless you're the lobby owner" });
      }
      
      // Remove the member
      const success = await storage.removeLobbyMember(lobbyId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Member not found in this lobby" });
      }
      
      // Update lobby player count if not the owner leaving
      if (lobby.ownerId !== userId) {
        await storage.updateLobby(lobbyId, {
          currentPlayers: Math.max(0, lobby.currentPlayers - 1)
        });
      } else {
        // If the owner is leaving, close the lobby
        await storage.updateLobby(lobbyId, {
          status: "closed"
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving lobby:", error);
      res.status(500).json({ message: "Failed to leave lobby" });
    }
  });
  
  // Start a match from a lobby
  app.post("/api/lobbies/:id/start-match", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const lobbyId = parseInt(req.params.id);
      const lobby = await storage.getLobby(lobbyId);
      
      if (!lobby) {
        return res.status(404).json({ message: "Lobby not found" });
      }
      
      // Check if the user is the lobby owner
      if (lobby.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Only the lobby owner can start a match" });
      }
      
      // Check if all players are ready
      const lobbyMembers = await storage.getLobbyMembers(lobbyId);
      const notReadyCount = lobbyMembers.filter(member => !member.ready).length;
      
      if (notReadyCount > 0) {
        return res.status(400).json({ message: "All players must be ready to start the match" });
      }
      
      // Generate CS2 server details (in a real implementation, this would interact with CS2 servers)
      const serverIp = "185.60.112.157"; // Example IP for a CS2 server
      const serverPort = "27015"; // Example port
      const serverPassword = Math.random().toString(36).substring(2, 10); // Random password
      
      const serverDetails = {
        ip: serverIp,
        port: serverPort,
        password: serverPassword,
        gameMode: "competitive",
        map: lobby.map || "de_dust2",
        instructions: "Connect to the server using console command: connect " + serverIp + ":" + serverPort + "; password " + serverPassword
      };
      
      // Create the match
      const match = await storage.createMatch({
        gameId: lobby.gameId,
        name: `${lobby.name} Match`,
        schedule: new Date(),
        maxPlayers: lobby.maxPlayers,
        currentPlayers: lobby.currentPlayers,
        prize: lobby.prizePool,
        lobbyId: lobbyId,
        status: "in_progress",
        serverDetails: JSON.stringify(serverDetails)
      });
      
      // Update the lobby status
      await storage.updateLobby(lobbyId, { 
        status: "in_progress", 
        startedAt: new Date() 
      });
      
      // Notify all lobby members
      for (const member of lobbyMembers) {
        await storage.createNotification({
          userId: member.userId,
          type: "match",
          title: "Match Started",
          message: `Your match for ${lobby.name} has started. Connect to the server now!`,
          data: JSON.stringify({ matchId: match.id, serverDetails }),
          read: false
        });
        
        // Broadcast via WebSocket
        broadcastNotification(member.userId, {
          type: "match_started",
          title: "Match Started",
          message: `Your match for ${lobby.name} has started. Connect to the server now!`,
          matchId: match.id,
          serverDetails
        });
      }
      
      // Return the match details
      // Parse server details safely, providing fallback if null or invalid
      let parsedServerDetails = { message: "No server details available" };
      if (match.serverDetails && typeof match.serverDetails === 'string') {
        try {
          parsedServerDetails = JSON.parse(match.serverDetails);
        } catch (e) {
          console.error("Error parsing server details:", e);
        }
      }
        
      return res.status(201).json({
        message: "Match started successfully",
        match: {
          ...match,
          serverDetails: parsedServerDetails
        }
      });
    } catch (error) {
      console.error("Error starting match:", error);
      return res.status(500).json({ message: "Failed to start match" });
    }
  });

  return httpServer;
}
