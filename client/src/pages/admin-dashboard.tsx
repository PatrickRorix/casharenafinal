import React, { useState } from "react";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Plus, Users, Trophy, Gamepad, Coins, Trash2, DoorOpen, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lobby, Team } from "@shared/schema";
import { LobbiesManagement, TeamsManagement } from "@/components/admin/lobby-team-management";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isManageUserOpen, setIsManageUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Redirect if user is not authenticated or not an admin
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, games, and tournaments</p>
      </header>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="lobbies">Lobbies</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PlatformOverview />
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement 
            onManageUser={(user) => {
              setSelectedUser(user);
              setIsManageUserOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="games">
          <GamesManagement />
        </TabsContent>

        <TabsContent value="tournaments">
          <TournamentsManagement />
        </TabsContent>
        
        <TabsContent value="lobbies">
          <LobbiesManagement />
        </TabsContent>
        
        <TabsContent value="teams">
          <TeamsManagement />
        </TabsContent>
      </Tabs>

      {/* User management dialog */}
      <Dialog open={isManageUserOpen} onOpenChange={setIsManageUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage User: {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Adjust user settings, role, or tokens balance.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <div className="mb-4">
                <h3 className="font-medium">User ID: {selectedUser.id}</h3>
                <p className="text-sm text-muted-foreground">
                  Current role: <Badge variant={selectedUser.role === "admin" ? "default" : "outline"}>
                    {selectedUser.role || "user"}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Tokens balance: <span className="font-medium">{selectedUser.tokens}</span>
                </p>
              </div>

              <Separator className="my-4" />
              
              <UserRoleForm userId={selectedUser.id} currentRole={selectedUser.role || "user"} />
              
              <Separator className="my-4" />
              
              <UserTokensForm userId={selectedUser.id} currentTokens={selectedUser.tokens || 0} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageUserOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlatformOverview() {
  const { toast } = useToast();
  
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch platform statistics");
      }
      return response.json();
    }
  });

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
        <p className="text-destructive">Error loading platform statistics</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Registered platform users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Games</CardTitle>
          <Gamepad className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.gameCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Available games on platform
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.tournamentCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total tournaments created
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total financial transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersManagement({ onManageUser }: { onManageUser: (user: any) => void }) {
  const { toast } = useToast();
  
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    }
  });

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
        <p className="text-destructive">Error loading users</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage platform users, adjust roles and tokens.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "outline"}>
                        {user.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.tokens}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onManageUser(user)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No users found
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

function UserRoleForm({ userId, currentRole }: { userId: number, currentRole: string }) {
  const { toast } = useToast();
  
  const roleSchema = z.object({
    role: z.enum(["user", "admin"])
  });
  
  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: currentRole as "user" | "admin",
    },
  });
  
  const updateRoleMutation = useMutation({
    mutationFn: async (values: z.infer<typeof roleSchema>) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, {
        role: values.role,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user role");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: z.infer<typeof roleSchema>) {
    updateRoleMutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Role</FormLabel>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...field}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateRoleMutation.isPending}>
          {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Role
        </Button>
      </form>
    </Form>
  );
}

function UserTokensForm({ userId, currentTokens }: { userId: number, currentTokens: number }) {
  const { toast } = useToast();
  
  const tokensSchema = z.object({
    tokens: z.number().int().min(0),
    reason: z.string().optional(),
  });
  
  const form = useForm<z.infer<typeof tokensSchema>>({
    resolver: zodResolver(tokensSchema),
    defaultValues: {
      tokens: currentTokens,
      reason: "",
    },
  });
  
  const updateTokensMutation = useMutation({
    mutationFn: async (values: z.infer<typeof tokensSchema>) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/tokens`, values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update tokens");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tokens updated",
        description: "User tokens have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: z.infer<typeof tokensSchema>) {
    updateTokensMutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tokens Balance</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Directly set the user's token balance
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason (optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Admin adjustment" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={updateTokensMutation.isPending}>
          {updateTokensMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Tokens
        </Button>
      </form>
    </Form>
  );
}

function GamesManagement() {
  const { toast } = useToast();
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  
  const { data: games, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/games"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/games");
      if (!response.ok) {
        throw new Error("Failed to fetch games");
      }
      return response.json();
    }
  });

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
        <p className="text-destructive">Error loading games</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Games Management</CardTitle>
            <CardDescription>Manage platform games and their settings</CardDescription>
          </div>
          <Dialog open={isCreateGameOpen} onOpenChange={setIsCreateGameOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Game
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Game</DialogTitle>
                <DialogDescription>
                  Create a new game on the platform
                </DialogDescription>
              </DialogHeader>
              
              <GameForm onSuccess={() => {
                setIsCreateGameOpen(false);
                refetch();
              }} />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateGameOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games && games.length > 0 ? (
                games.map((game: any) => (
                  <TableRow key={game.id}>
                    <TableCell>{game.id}</TableCell>
                    <TableCell className="font-medium">{game.name}</TableCell>
                    <TableCell>{game.category}</TableCell>
                    <TableCell>{game.platform}</TableCell>
                    <TableCell>{game.players}</TableCell>
                    <TableCell>
                      {game.isPopular && <Badge className="mr-1">Popular</Badge>}
                      {game.isNew && <Badge variant="outline">New</Badge>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No games found
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

function GameForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  
  const gameSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    category: z.string().min(1, "Category is required"),
    platform: z.string().min(1, "Platform is required"),
    players: z.number().int().min(1, "At least 1 player required"),
    image: z.string().url("Must be a valid URL").optional(),
    isPopular: z.boolean().default(false),
    isNew: z.boolean().default(true),
  });
  
  const form = useForm<z.infer<typeof gameSchema>>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      name: "",
      category: "",
      platform: "",
      players: 1,
      image: "",
      isPopular: false,
      isNew: true,
    },
  });
  
  const createGameMutation = useMutation({
    mutationFn: async (values: z.infer<typeof gameSchema>) => {
      const response = await apiRequest("POST", "/api/admin/games", values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create game");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game created",
        description: "New game has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: z.infer<typeof gameSchema>) {
    createGameMutation.mutate(values);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Name</FormLabel>
              <FormControl>
                <Input placeholder="Game name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Action, Strategy, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <FormControl>
                  <Input placeholder="PC, Mobile, Console" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="players"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Players</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isPopular"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Popular Game</FormLabel>
                  <FormDescription>
                    Mark this game as popular on the platform
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isNew"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>New Game</FormLabel>
                  <FormDescription>
                    Mark this game as newly added
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={createGameMutation.isPending}>
          {createGameMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Game
        </Button>
      </form>
    </Form>
  );
}

function TournamentsManagement() {
  const { toast } = useToast();
  
  const { data: tournaments, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/tournaments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tournaments");
      if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
      }
      return response.json();
    }
  });

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
        <p className="text-destructive">Error loading tournaments</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournaments Management</CardTitle>
        <CardDescription>View and manage platform tournaments</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Prize Pool</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Participants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments && tournaments.length > 0 ? (
                tournaments.map((tournament: any) => (
                  <TableRow key={tournament.id}>
                    <TableCell>{tournament.id}</TableCell>
                    <TableCell className="font-medium">{tournament.name}</TableCell>
                    <TableCell>{tournament.gameId}</TableCell>
                    <TableCell>{new Date(tournament.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>${tournament.prizePool}</TableCell>
                    <TableCell>
                      <Badge className={tournament.status === "active" ? "bg-green-500" : ""}>
                        {tournament.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tournament.currentParticipants}/{tournament.maxParticipants}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No tournaments found
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