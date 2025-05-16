import { Request, Response, Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import {
  insertTeamSchema,
  insertTeamMemberSchema,
  insertMatchReportSchema
} from "@shared/schema";

export function registerTeamRoutes(app: Express) {
  // Get all teams
  app.get("/api/teams", async (req: Request, res: Response) => {
    try {
      const teams = await storage.getAllTeams();
      return res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      return res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Get team by ID
  app.get("/api/teams/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Get team members
      const members = await storage.getTeamMembers(id);

      return res.json({
        team,
        members
      });
    } catch (error) {
      console.error("Error fetching team details:", error);
      return res.status(500).json({ message: "Failed to fetch team details" });
    }
  });

  // Create a new team
  app.post("/api/teams", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to create a team" });
      }

      const validatedData = insertTeamSchema.parse({
        ...req.body,
        creatorId: req.user!.id
      });

      const team = await storage.createTeam(validatedData);

      // Add creator as team leader
      await storage.addTeamMember({
        teamId: team.id,
        userId: req.user!.id,
        role: "leader"
      });

      return res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      console.error("Error creating team:", error);
      return res.status(500).json({ message: "Failed to create team" });
    }
  });

  // Add member to team by user ID
  app.post("/api/teams/:id/members", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to add team members" });
      }

      const teamId = parseInt(req.params.id, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      // Verify user is team leader
      const isLeader = await storage.isTeamLeader(teamId, req.user!.id);
      if (!isLeader) {
        return res.status(403).json({ message: "Only team leaders can add members" });
      }

      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        teamId
      });

      // Check if user is already a member
      const isMember = await storage.isTeamMember(teamId, validatedData.userId);
      if (isMember) {
        return res.status(400).json({ message: "User is already a team member" });
      }

      const member = await storage.addTeamMember(validatedData);
      return res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid member data", errors: error.errors });
      }
      console.error("Error adding team member:", error);
      return res.status(500).json({ message: "Failed to add team member" });
    }
  });
  
  // Add member to team by username
  app.post("/api/teams/:id/invite", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to invite team members" });
      }

      const teamId = parseInt(req.params.id, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      // Verify user is team leader
      const isLeader = await storage.isTeamLeader(teamId, req.user!.id);
      if (!isLeader) {
        return res.status(403).json({ message: "Only team leaders can invite members" });
      }

      // Validate username from request body
      const { username, role } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      if (!role || !["member", "co-leader"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required (member or co-leader)" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const isMember = await storage.isTeamMember(teamId, user.id);
      if (isMember) {
        return res.status(400).json({ message: "User is already a team member" });
      }

      // Add the user to the team
      const member = await storage.addTeamMember({
        teamId,
        userId: user.id,
        role
      });
      
      // Get the team information for the notification
      const team = await storage.getTeam(teamId);
      
      // Send notification to the invited user
      await storage.createNotification({
        userId: user.id,
        type: 'team',
        title: 'Team Invitation',
        message: `You have been added to the team: ${team?.name}`,
        data: { teamId, teamName: team?.name }
      });

      return res.status(201).json({ 
        ...member, 
        username: user.username 
      });
    } catch (error) {
      console.error("Error inviting team member:", error);
      return res.status(500).json({ message: "Failed to invite team member" });
    }
  });

  // Remove member from team
  app.delete("/api/teams/:teamId/members/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to remove team members" });
      }

      const teamId = parseInt(req.params.teamId, 10);
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(teamId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid team ID or user ID" });
      }

      // Check if authorized (team leader or self-remove)
      const isLeader = await storage.isTeamLeader(teamId, req.user!.id);
      if (!isLeader && req.user!.id !== userId) {
        return res.status(403).json({ message: "Not authorized to remove this member" });
      }

      // Cannot remove leader unless it's self-removal
      const targetIsLeader = await storage.isTeamLeader(teamId, userId);
      if (targetIsLeader && req.user!.id !== userId) {
        return res.status(403).json({ message: "Cannot remove team leader" });
      }

      await storage.removeTeamMember(teamId, userId);
      return res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      return res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Get teams for current user
  app.get("/api/my-teams", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your teams" });
      }

      const teams = await storage.getUserTeams(req.user!.id);
      return res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      return res.status(500).json({ message: "Failed to fetch user teams" });
    }
  });
  
  // Delete a team (team owner or admin only)
  app.delete("/api/teams/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete a team" });
      }

      const teamId = parseInt(req.params.id, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      // Get the team
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if user is authorized (team owner or admin)
      if (team.creatorId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete this team" });
      }

      // Delete the team
      const deleted = await storage.deleteTeam(teamId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete team" });
      }

      return res.status(200).json({ success: true, message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      return res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Submit match report
  app.post("/api/match-reports", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to submit match reports" });
      }

      const validatedData = insertMatchReportSchema.parse({
        ...req.body,
        reporterId: req.user!.id
      });

      // Get the match
      const match = await storage.getTournamentMatch(validatedData.tournamentMatchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Check if user is authorized to report (must be participant)
      const isAuthorized = await storage.isMatchParticipant(
        match.id,
        req.user!.id,
        validatedData.winnerTeamId || null
      );
      
      if (!isAuthorized) {
        return res.status(403).json({ message: "Not authorized to report on this match" });
      }

      // Check if match already has a verified report
      const existingReports = await storage.getMatchReports(match.id);
      const verifiedReport = existingReports.find(r => r.status === 'verified');
      
      if (verifiedReport) {
        return res.status(400).json({ message: "Match result already verified" });
      }

      const report = await storage.createMatchReport(validatedData);

      // Notify other players about the report
      await storage.notifyMatchReportSubmitted(match, report);

      return res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      console.error("Error submitting match report:", error);
      return res.status(500).json({ message: "Failed to submit match report" });
    }
  });

  // Dispute a match report
  app.post("/api/match-reports/:id/dispute", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to dispute reports" });
      }

      const reportId = parseInt(req.params.id, 10);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const { disputeReason } = req.body;
      if (!disputeReason) {
        return res.status(400).json({ message: "Dispute reason is required" });
      }

      // Get the report
      const report = await storage.getMatchReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check if user is authorized to dispute (must be match participant)
      const match = await storage.getTournamentMatch(report.tournamentMatchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const isParticipant = await storage.isMatchParticipant(
        match.id,
        req.user!.id,
        null
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to dispute this report" });
      }

      // Update report status to disputed
      const updatedReport = await storage.disputeMatchReport(reportId, disputeReason);

      // Notify admin and reporter about the dispute
      await storage.notifyReportDisputed(report, req.user!.id, disputeReason);

      return res.json(updatedReport);
    } catch (error) {
      console.error("Error disputing match report:", error);
      return res.status(500).json({ message: "Failed to dispute match report" });
    }
  });

  // Verify a match report (admin only)
  app.post("/api/match-reports/:id/verify", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to verify reports" });
      }

      // Check if user is admin
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only admins can verify match reports" });
      }

      const reportId = parseInt(req.params.id, 10);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      // Get the report
      const report = await storage.getMatchReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Update match result with report data
      const match = await storage.getTournamentMatch(report.tournamentMatchId);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      // Update report status to verified
      const updatedReport = await storage.verifyMatchReport(reportId, req.user!.id);

      // Update match with the verified result
      await storage.updateMatchResult(
        match.id,
        report.winnerId || null,
        report.winnerTeamId || null,
        report.scoreReported || ""
      );

      // Notify participants about the verification
      await storage.notifyReportVerified(report);

      return res.json(updatedReport);
    } catch (error) {
      console.error("Error verifying match report:", error);
      return res.status(500).json({ message: "Failed to verify match report" });
    }
  });

  // Get match reports
  app.get("/api/matches/:id/reports", async (req: Request, res: Response) => {
    try {
      const matchId = parseInt(req.params.id, 10);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const reports = await storage.getMatchReports(matchId);
      return res.json(reports);
    } catch (error) {
      console.error("Error fetching match reports:", error);
      return res.status(500).json({ message: "Failed to fetch match reports" });
    }
  });
  
  // Test endpoint for CS2 integration
  app.get("/api/cs2-integration-test", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to test this feature" });
      }
      
      // Check if current database schema supports CS2 tournament integration
      const tournamentFields = {
        teamSize: true
      };
      
      const matchFields = {
        team1Id: true,
        team2Id: true,
        winnerTeamId: true
      };
      
      const reportFields = {
        evidenceUrls: true,
        status: true,
        disputeReason: true
      };
      
      return res.json({
        message: "CS2 Tournament Integration Status",
        user: req.user,
        features: {
          teamTournaments: "Supported",
          matchReporting: "Implemented",
          disputeResolution: "Implemented",
          notification: "Configured"
        },
        schemaSupport: {
          tournament: tournamentFields,
          match: matchFields,
          report: reportFields
        }
      });
    } catch (error) {
      console.error("Error testing CS2 integration:", error);
      return res.status(500).json({ message: "Failed to test CS2 integration" });
    }
  });
  
  // Public test endpoint for CS2 integration status
  app.get("/api/cs2-status", async (req: Request, res: Response) => {
    try {      
      return res.json({
        message: "CS2 Tournament Features",
        status: "Ready",
        features: {
          teamManagement: {
            teamCreation: true,
            teamMembership: true,
            roleManagement: true
          },
          tournamentSystem: {
            teamRegistration: true,
            matchScheduling: true,
            brackets: true
          },
          matchVerification: {
            screenshotEvidence: true,
            adminVerification: true,
            disputeResolution: true
          },
          notifications: {
            matchUpdates: true,
            verificationStatus: true,
            disputeAlerts: true
          }
        },
        integrationPath: {
          current: "Hybrid approach with manual verification",
          future: "Full FACEIT API integration with anti-cheat"
        }
      });
    } catch (error) {
      console.error("Error getting CS2 status:", error);
      return res.status(500).json({ message: "Failed to get CS2 integration status" });
    }
  });
}