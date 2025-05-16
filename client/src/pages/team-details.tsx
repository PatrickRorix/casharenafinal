import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BackToDashboard } from "@/components/back-to-dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  UserPlus,
  ShieldCheck,
  Shield,
  User,
  ArrowLeft,
  Users,
  Trophy,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Team, TeamMember } from "@shared/schema";

// Type for team member with user details
interface TeamMemberWithUser extends TeamMember {
  username: string;
}

// Type for team details response
interface TeamDetailsResponse {
  team: Team;
  members: TeamMemberWithUser[];
}

export default function TeamDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("member");

  // Fetch team details
  const {
    data: teamDetails,
    isLoading,
    error,
  } = useQuery<TeamDetailsResponse>({
    queryKey: ["/api/teams", id],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team details");
      }
      
      const data = await response.json();
      
      console.log("Team details response:", data);
      
      // Return a properly formatted response object
      return {
        team: data.team || data, // Some endpoints return the team directly, others nested
        members: data.members || []
      };
    },
    enabled: !!id,
  });

  // Check if current user is team leader
  const isTeamLeader = teamDetails?.members.some(
    (member) => member.userId === user?.id && member.role === "leader"
  );

  // Check if current user is co-leader
  const isTeamCoLeader = teamDetails?.members.some(
    (member) => member.userId === user?.id && member.role === "co-leader"
  );

  // Check if current user is a member
  const isTeamMember = teamDetails?.members.some(
    (member) => member.userId === user?.id
  );

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ username, role }: { username: string; role: string }) => {
      const response = await apiRequest("POST", `/api/teams/${id}/invite`, {
        username,
        role,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", id] });
      setInviteDialogOpen(false);
      setUsername("");
      setRole("member");
      toast({
        title: "Team member invited",
        description: "The user has been added to your team",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to invite member",
        description: error.message || "There was an error inviting the team member",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/teams/${id}/members/${userId}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", id] });
      toast({
        title: "Member removed",
        description: "The member has been removed from the team",
      });
    },
    onError: () => {
      toast({
        title: "Failed to remove member",
        description: "There was an error removing the team member",
        variant: "destructive",
      });
    },
  });

  const handleInviteMember = () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a username to invite",
        variant: "destructive",
      });
      return;
    }

    inviteMemberMutation.mutate({ username, role });
  };

  const handleRemoveMember = (userId: number) => {
    if (window.confirm("Are you sure you want to remove this member from the team?")) {
      removeMemberMutation.mutate(userId);
    }
  };

  // Handle role icon display
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "leader":
        return <ShieldCheck className="h-4 w-4 text-yellow-500" />;
      case "co-leader":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !teamDetails) {
    return (
      <div className="container py-10 text-center">
        <BackToDashboard />
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">
          Failed to load team details. The team may not exist or you might not have permission to view it.
        </p>
        <Button onClick={() => navigate("/teams")}>Back to Teams</Button>
      </div>
    );
  }

  const { team, members } = teamDetails;

  return (
    <div className="container py-6">
      <BackToDashboard />
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/teams")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Teams
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Team Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <Badge variant="outline" className="mt-2">
                  {team.tag}
                </Badge>
              </div>
              {isTeamLeader && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Team
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your team
                        and remove all members from it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            const response = await apiRequest("DELETE", `/api/teams/${id}`);
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || "Failed to delete team");
                            }
                            
                            toast({
                              title: "Team deleted",
                              description: "Your team has been permanently deleted",
                            });
                            
                            // Invalidate cache and navigate to teams page
                            queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
                            navigate("/teams");
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {team.description}
            </p>

            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <span>{members.length} members</span>
              </div>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                <span>0 wins</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Team Members</CardTitle>
                {(isTeamLeader || isTeamCoLeader) && (
                  <Dialog
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <UserPlus className="h-4 w-4" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite a new team member</DialogTitle>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={role}
                            onValueChange={setRole}
                          >
                            <SelectTrigger id="role">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="co-leader">Co-Leader</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={handleInviteMember}
                          disabled={inviteMemberMutation.isPending}
                        >
                          {inviteMemberMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Inviting...
                            </>
                          ) : (
                            "Invite Member"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <CardDescription>
                {isTeamLeader
                  ? "As the team leader, you have full control over this team"
                  : isTeamCoLeader
                  ? "As a co-leader, you can invite and manage team members"
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        {member.username}
                        {member.userId === user?.id && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.role === "leader"
                              ? "default"
                              : member.role === "co-leader"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isTeamLeader &&
                          member.userId !== user?.id &&
                          member.role !== "leader" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={removeMemberMutation.isPending}
                            >
                              {removeMemberMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Remove"
                              )}
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}