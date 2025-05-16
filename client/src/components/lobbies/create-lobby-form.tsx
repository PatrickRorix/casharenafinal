import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Game, Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Form schema with string fields for compatibility with form inputs
const createLobbySchema = z.object({
  name: z.string().min(1, "Lobby name is required"),
  gameId: z.string().min(1, "Game selection is required"),
  type: z.enum(["solo", "team"]).default("solo"),
  maxPlayers: z.string(),
  entryFee: z.string().default("0"),
  prizePool: z.string().default("0"),
  teamId: z.string().optional(),
  hasPassword: z.boolean().optional(),
  password: z.string().optional(),
  map: z.string().optional(),
  rules: z.string().optional(),
});

// Type for our form
type CreateLobbyFormValues = z.infer<typeof createLobbySchema>;

export function CreateLobbyForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isTeamLobby, setIsTeamLobby] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  // Fetch games
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ['/api/games'],
    enabled: !!user,
  });

  // Fetch user's teams
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/my-teams'],
    enabled: !!user && isTeamLobby,
  });

  // Create lobby mutation
  const createLobbyMutation = useMutation({
    mutationFn: async (values: CreateLobbyFormValues) => {
      // Convert string values to numbers for the backend
      const formData = {
        name: values.name,
        gameId: parseInt(values.gameId), 
        type: isTeamLobby ? "team" : "solo",
        maxPlayers: parseInt(values.maxPlayers),
        entryFee: parseInt(values.entryFee), 
        prizePool: parseInt(values.prizePool),
        teamId: values.teamId ? parseInt(values.teamId) : undefined,
        ownerId: user?.id,
        password: hasPassword ? values.password : undefined,
        map: values.map,
        rules: values.rules
      };
      
      const res = await apiRequest("POST", "/api/lobbies", formData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/lobbies'] });
      toast({
        title: "Success!",
        description: "Your lobby has been created.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Navigate to the new lobby
      navigate(`/lobbies/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating lobby",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Default values for the form
  const defaultValues: CreateLobbyFormValues = {
    name: "",
    gameId: "",
    type: "solo",
    maxPlayers: isTeamLobby ? "10" : "2", // Default: 2 for 1v1, 10 for 5v5
    entryFee: "0",
    prizePool: "0",
    hasPassword: false,
    password: "",
    map: "",
    rules: ""
  };

  // Define form
  const form = useForm<CreateLobbyFormValues>({
    resolver: zodResolver(createLobbySchema),
    defaultValues,
  });

  // Submit handler
  function onSubmit(values: CreateLobbyFormValues) {
    createLobbyMutation.mutate(values);
  }

  // Handle changing lobby type
  function handleLobbyTypeChange(isTeam: boolean) {
    setIsTeamLobby(isTeam);
    form.setValue("maxPlayers", isTeam ? "10" : "2");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lobby Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a name for your lobby" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {games.map((game) => (
                        <SelectItem key={game.id} value={game.id.toString()}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Lobby Type</FormLabel>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={isTeamLobby ? "outline" : "default"}
                  onClick={() => handleLobbyTypeChange(false)}
                  className={!isTeamLobby ? "bg-primary hover:bg-primary/90 text-white" : ""}
                >
                  Solo (1v1)
                </Button>
                <Button
                  type="button"
                  variant={isTeamLobby ? "default" : "outline"}
                  onClick={() => handleLobbyTypeChange(true)}
                  className={isTeamLobby ? "bg-primary hover:bg-primary/90 text-white" : ""}
                >
                  Team (5v5)
                </Button>
              </div>
            </div>
          </div>

          {isTeamLobby && (
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Team</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.length > 0 ? (
                        teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No teams available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {teams.length === 0 && (
                    <FormDescription className="text-amber-500">
                      You need to create or join a team first
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entryFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Fee (WinTokens)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    0 for free entry
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prizePool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Pool (WinTokens)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Total prize pool for winners
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="password-protected" 
              checked={hasPassword}
              onCheckedChange={setHasPassword}
            />
            <label
              htmlFor="password-protected"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Password Protected
            </label>
          </div>

          {hasPassword && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lobby Password</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Enter a password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="map"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Map (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Specify map if applicable" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rules (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe any specific rules for this lobby"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={createLobbyMutation.isPending}
          >
            {createLobbyMutation.isPending ? "Creating..." : "Create Lobby"}
          </Button>
        </div>
      </form>
    </Form>
  );
}