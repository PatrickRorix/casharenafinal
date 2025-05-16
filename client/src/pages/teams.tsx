import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { TeamCard } from "@/components/teams/team-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, PlusCircle, Loader2, Users } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Team, TeamMember } from "@shared/schema";

// Schema for creating a new team
const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  tag: z.string().min(2, "Team tag must be at least 2 characters").max(5, "Team tag cannot exceed 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  game: z.string().min(1, "Please select a game")
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

export default function TeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-teams");

  // Query for user's teams
  const {
    data: myTeams,
    isLoading: isMyTeamsLoading,
    error: myTeamsError
  } = useQuery<Team[]>({
    queryKey: ["/api/my-teams"],
    enabled: !!user,
  });

  // Query for all teams
  const {
    data: allTeams,
    isLoading: isAllTeamsLoading,
    error: allTeamsError
  } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Form for creating a new team
  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      tag: "",
      description: "",
      game: "cs2"  // Default to CS2
    },
  });

  // Mutation for creating a new team
  const createTeamMutation = useMutation({
    mutationFn: async (values: CreateTeamValues) => {
      const response = await apiRequest("POST", "/api/teams", {
        name: values.name,
        tag: values.tag,
        description: values.description,
        gameId: 2, // CS2 game ID
        creatorId: user!.id,
        logo: "",  // Empty for now
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the teams queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      
      // Close the dialog and reset form
      setCreateTeamOpen(false);
      form.reset();
      
      // Show success toast
      toast({
        title: "Team created",
        description: "Your new team has been created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create team",
        description: "There was an error creating your team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler for the create team form
  const onSubmit = (values: CreateTeamValues) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a team",
        variant: "destructive",
      });
      return;
    }
    
    createTeamMutation.mutate(values);
  };

  if (!user) {
    return (
      <div className="container py-10">
        <BackToDashboard />
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-4">Teams</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to view your teams</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teams</h1>
        
        <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle size={16} />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new team</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your team name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Tag</FormLabel>
                      <FormControl>
                        <Input placeholder="TAG" maxLength={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your team's goals and achievements" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="game"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game</FormLabel>
                      <FormControl>
                        <Input disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={createTeamMutation.isPending}
                    className="w-full"
                  >
                    {createTeamMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Team"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="my-teams" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="my-teams" className="gap-2">
            <Users size={16} />
            My Teams
          </TabsTrigger>
          <TabsTrigger value="all-teams" className="gap-2">
            All Teams
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-teams">
          {isMyTeamsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : myTeamsError ? (
            <div className="text-center py-10">
              <p className="text-destructive">Error loading your teams</p>
            </div>
          ) : myTeams?.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-xl font-semibold mb-2">You haven't joined any teams yet</h3>
              <p className="text-muted-foreground mb-6">
                Create a new team or join an existing one to get started
              </p>
              <Button onClick={() => setCreateTeamOpen(true)}>Create Your First Team</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams?.map((team) => (
                <TeamCard 
                  key={team.id} 
                  team={team}
                  memberCount={5} // This would come from a team members query
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all-teams">
          {isAllTeamsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : allTeamsError ? (
            <div className="text-center py-10">
              <p className="text-destructive">Error loading teams</p>
            </div>
          ) : allTeams?.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-xl font-semibold mb-2">No teams have been created yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create a team and start competing!
              </p>
              <Button onClick={() => setCreateTeamOpen(true)}>Create First Team</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTeams?.map((team) => (
                <TeamCard 
                  key={team.id} 
                  team={team}
                  memberCount={5} // This would come from a team members query
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}