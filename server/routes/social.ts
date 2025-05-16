import { Request, Response } from "express";
import { storage } from "../storage";
import { insertFriendshipSchema, insertMessageSchema, insertTeamSchema, insertTeamMemberSchema } from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "../middleware/admin";

export function registerSocialRoutes(app: any) {
  // ==== FRIENDSHIP ROUTES ====
  
  // Get current user's friends
  app.get("/api/friends", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const friends = await storage.getFriendsByUser(userId);
      res.json(friends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get friend requests for the current user
  app.get("/api/friend-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send a friend request
  app.post("/api/friends/:friendId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const friendId = parseInt(req.params.friendId);
      
      // Check if friendship already exists
      const friends = await storage.getFriendsByUser(userId);
      if (friends.some(f => f.id === friendId)) {
        return res.status(400).json({ error: "Already friends with this user" });
      }
      
      // Check if user exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Create friendship request
      const friendship = await storage.createFriendship({
        userId: userId,
        friendId: friendId,
        status: "pending"
      });
      
      // Create notification for the friend
      await storage.createNotification({
        userId: friendId,
        type: "friend_request",
        title: "Friend Request",
        message: `${req.user!.username} sent you a friend request`,
        data: { senderId: userId, friendshipId: friendship.id }
      });
      
      res.status(201).json(friendship);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept/reject friend request
  app.patch("/api/friendships/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const friendshipId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['accepted', 'rejected', 'blocked'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const friendship = await storage.updateFriendshipStatus(friendshipId, status);
      
      if (!friendship) {
        return res.status(404).json({ error: "Friendship not found" });
      }
      
      // Create notification for the other user if accepted
      if (status === 'accepted') {
        await storage.createNotification({
          userId: friendship.userId,
          type: "friend_accepted",
          title: "Friend Request Accepted",
          message: `Your friend request was accepted`,
          data: { friendId: friendship.friendId }
        });
      }
      
      res.json(friendship);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove friend
  app.delete("/api/friendships/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const friendshipId = parseInt(req.params.id);
      const success = await storage.deleteFriendship(friendshipId);
      
      if (!success) {
        return res.status(404).json({ error: "Friendship not found" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==== MESSAGING ROUTES ====
  
  // Get conversation list for current user
  app.get("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get messages between current user and another user
  app.get("/api/messages/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = parseInt(req.params.userId);
      
      const messages = await storage.getConversationMessages(currentUserId, otherUserId);
      
      // Mark messages as read
      for (const message of messages) {
        if (message.receiverId === currentUserId && !message.read) {
          await storage.markMessageAsRead(message.id);
        }
      }
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send a message
  app.post("/api/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const senderId = req.user!.id;
      const { receiverId, content } = req.body;
      
      // Validate input
      try {
        const validatedData = insertMessageSchema.parse({
          senderId,
          receiverId,
          content,
          read: false
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }
      
      // Check if receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ error: "Receiver not found" });
      }
      
      const messageData = {
        senderId,
        receiverId,
        content,
        read: false
      };
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark all messages as read
  app.post("/api/messages/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const success = await storage.markAllMessagesAsRead(userId);
      res.status(success ? 200 : 500).json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==== TEAM ROUTES ====
  
  // Get all teams
  app.get("/api/teams", async (req: Request, res: Response) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single team
  app.get("/api/teams/:id", async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Get team members
      const members = await storage.getTeamMembers(teamId);
      
      // Get member user details
      const memberDetails = [];
      for (const member of members) {
        const user = await storage.getUser(member.userId);
        if (user) {
          memberDetails.push({
            ...member,
            username: user.username
          });
        }
      }
      
      res.json({
        ...team,
        members: memberDetails
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get teams for current user
  app.get("/api/my-teams", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create team
  app.post("/api/teams", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const creatorId = req.user!.id;
      const { name, tag, logo, description } = req.body;
      
      // Validate input
      try {
        insertTeamSchema.parse({
          name,
          tag,
          logo,
          description,
          creatorId
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }
      
      // Check if team name or tag already exists
      const allTeams = await storage.getAllTeams();
      if (allTeams.some(t => t.name === name)) {
        return res.status(400).json({ error: "Team name already taken" });
      }
      
      if (allTeams.some(t => t.tag === tag)) {
        return res.status(400).json({ error: "Team tag already taken" });
      }
      
      const teamData = {
        name,
        tag,
        logo,
        description,
        creatorId
      };
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update team
  app.patch("/api/teams/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if user is team leader
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      const member = await storage.getTeamMember(teamId, userId);
      if (!member || member.role !== "leader") {
        return res.status(403).json({ error: "Only team leaders can update team details" });
      }
      
      const { name, tag, logo, description } = req.body;
      
      // Check if team name or tag already taken (if changed)
      if (name && name !== team.name) {
        const allTeams = await storage.getAllTeams();
        if (allTeams.some(t => t.name === name && t.id !== teamId)) {
          return res.status(400).json({ error: "Team name already taken" });
        }
      }
      
      if (tag && tag !== team.tag) {
        const allTeams = await storage.getAllTeams();
        if (allTeams.some(t => t.tag === tag && t.id !== teamId)) {
          return res.status(400).json({ error: "Team tag already taken" });
        }
      }
      
      const updatedTeam = await storage.updateTeam(teamId, { name, tag, logo, description });
      res.json(updatedTeam);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Join team
  app.post("/api/teams/:id/join", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Check if already a member
      const existingMember = await storage.getTeamMember(teamId, userId);
      if (existingMember) {
        return res.status(400).json({ error: "Already a member of this team" });
      }
      
      // Validate input
      try {
        insertTeamMemberSchema.parse({
          teamId,
          userId,
          role: "member"
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }
      
      const teamMemberData = {
        teamId,
        userId,
        role: "member"
      };
      const member = await storage.addTeamMember(teamMemberData);
      
      // Notify team leader
      const members = await storage.getTeamMembers(teamId);
      const leader = members.find(m => m.role === "leader");
      
      if (leader) {
        await storage.createNotification({
          userId: leader.userId,
          type: "team_joined",
          title: "New Team Member",
          message: `${req.user!.username} has joined your team ${team.name}`,
          data: { userId, teamId, teamName: team.name }
        });
      }
      
      res.status(201).json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Change member role
  app.patch("/api/teams/:teamId/members/:memberId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      const userId = req.user!.id;
      const { role } = req.body;
      
      if (!["leader", "co-leader", "member"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      // Check if user is team leader
      const member = await storage.getTeamMember(teamId, userId);
      if (!member || member.role !== "leader") {
        return res.status(403).json({ error: "Only team leaders can change roles" });
      }
      
      const updatedMember = await storage.updateTeamMemberRole(memberId, role);
      
      if (!updatedMember) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(updatedMember);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Leave team
  app.delete("/api/teams/:id/leave", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if member exists
      const member = await storage.getTeamMember(teamId, userId);
      if (!member) {
        return res.status(404).json({ error: "Not a member of this team" });
      }
      
      const success = await storage.removeTeamMember(member.id);
      res.status(success ? 204 : 500).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==== SOCIAL ACTIVITIES FEED ====
  
  // Get user's own activities
  app.get("/api/activities", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const activities = await storage.getUserSocialActivities(userId);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get social feed (friends' activities)
  app.get("/api/feed", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const feed = await storage.getFriendsSocialActivities(userId);
      
      // Enrich feed with user info
      const enrichedFeed = [];
      for (const activity of feed) {
        const user = await storage.getUser(activity.userId);
        if (user) {
          enrichedFeed.push({
            ...activity,
            username: user.username
          });
        }
      }
      
      res.json(enrichedFeed);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}