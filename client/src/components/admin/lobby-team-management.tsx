import { useQuery, useMutation } from "@tanstack/react-query";
import { Lobby, Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

export function LobbiesManagement() {
  const { toast } = useToast();
  
  const { data: lobbies, isLoading, error, refetch } = useQuery<Lobby[]>({
    queryKey: ["/api/admin/lobbies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/lobbies");
      if (!response.ok) {
        throw new Error("Failed to fetch lobbies");
      }
      return response.json();
    }
  });

  const deletelobbyMutation = useMutation({
    mutationFn: async (lobbyId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/lobbies/${lobbyId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete lobby");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lobby deleted",
        description: "Lobby has been deleted successfully",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteLobby = (lobbyId: number) => {
    if (window.confirm("Are you sure you want to delete this lobby? This action cannot be undone.")) {
      deletelobbyMutation.mutate(lobbyId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Error loading lobbies</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lobbies Management</CardTitle>
        <CardDescription>Delete test lobbies from the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lobbies && lobbies.length > 0 ? (
                lobbies.map((lobby) => (
                  <TableRow key={lobby.id}>
                    <TableCell>{lobby.id}</TableCell>
                    <TableCell>{lobby.name}</TableCell>
                    <TableCell>{lobby.gameId}</TableCell>
                    <TableCell>{lobby.ownerId}</TableCell>
                    <TableCell>{lobby.type}</TableCell>
                    <TableCell>
                      <Badge variant={
                        lobby.status === "open" ? "default" :
                        lobby.status === "in_progress" ? "secondary" : "outline"
                      }>
                        {lobby.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(lobby.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteLobby(lobby.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No lobbies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TeamsManagement() {
  const { toast } = useToast();
  
  const { data: teams, isLoading, error, refetch } = useQuery<Team[]>({
    queryKey: ["/api/admin/teams"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      return response.json();
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/teams/${teamId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete team");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team deleted",
        description: "Team has been deleted successfully",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteTeam = (teamId: number) => {
    if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Error loading teams</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams Management</CardTitle>
        <CardDescription>Delete test teams from the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams && teams.length > 0 ? (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.id}</TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.tag}</TableCell>
                    <TableCell>{team.creatorId}</TableCell>
                    <TableCell>{new Date(team.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No teams found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}