import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BackToDashboard } from "@/components/back-to-dashboard";
import {
  ArrowLeft,
  Send,
  Users,
  Trophy,
  Swords,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Lobby, LobbyMessage, Game, User, Team } from "@shared/schema";

// Extended types that include username from API
interface LobbyMember {
  id: number;
  lobbyId: number;
  userId: number;
  teamId: number | null;
  joinedAt: Date;
  ready: boolean;
  side: string | null;
  username: string; // Added by API
}

// Extended message type with username
interface ExtendedLobbyMessage extends LobbyMessage {
  username: string; // Added by API
}
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLobbyWebSocket } from "@/hooks/use-lobby-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Placeholder data until we have real API
const EMPTY_MESSAGES: ExtendedLobbyMessage[] = [];
const EMPTY_MEMBERS: LobbyMember[] = [];

// Match status types
const MATCH_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

export default function LobbyDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [showCopied, setShowCopied] = useState(false);
  const [matchDetails, setMatchDetails] = useState<{
    id: number;
    status: string;
    prize: number;
    serverDetails?: {
      ip?: string;
      port?: string;
      password?: string;
      map?: string;
      gameMode?: string;
      instructions?: string;
    } | string | null;
  } | null>(null);
  const [showMatchDetailsDialog, setShowMatchDetailsDialog] = useState(false);
  const [combinedMessages, setCombinedMessages] = useState<ExtendedLobbyMessage[]>([]);
  
  // Use our custom WebSocket hook to handle lobby connections
  const lobbyIdNumber = id ? parseInt(id) : undefined;
  const { 
    connected, 
    messages: wsMessages, 
    typingUsers,
    sendMessage: sendWebSocketMessage,
    sendTypingIndicator
  } = useLobbyWebSocket(lobbyIdNumber);

  // Fetch lobby details
  const {
    data: lobby,
    isLoading: isLoadingLobby,
  } = useQuery<Lobby>({
    queryKey: [`/api/lobbies/${id}`],
    enabled: !!user && !!id,
  });

  // Fetch lobby members
  const {
    data: members = EMPTY_MEMBERS,
    isLoading: isLoadingMembers,
  } = useQuery<LobbyMember[]>({
    queryKey: [`/api/lobbies/${id}/members`],
    enabled: !!user && !!id,
  });

  // Fetch lobby messages
  const {
    data: messages = EMPTY_MESSAGES,
    isLoading: isLoadingMessages,
  } = useQuery<ExtendedLobbyMessage[]>({
    queryKey: [`/api/lobbies/${id}/messages`],
    enabled: !!user && !!id,
  });

  // Fetch game details
  const {
    data: game,
    isLoading: isLoadingGame,
  } = useQuery<Game>({
    queryKey: [`/api/games/${lobby?.gameId}`],
    enabled: !!lobby?.gameId,
  });

  // Get unique user IDs from members to fetch
  const memberUserIds = members.map(member => member.userId);
  
  // We no longer need a separate users query since the API now returns 
  // member data with usernames included
  const isLoadingUsers = false;

  // Fetch teams for team details
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
  } = useQuery<Team[]>({
    queryKey: [`/api/teams`],
    enabled: !!members.some(m => m.teamId),
  });

  // Join lobby mutation
  const joinLobbyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/lobbies/${id}/join`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lobbies/${id}/members`] });
      toast({
        title: "Joined Lobby",
        description: "You have successfully joined the lobby!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Join",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave lobby mutation
  const leaveLobbyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/lobbies/${id}/members`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lobbies/${id}/members`] });
      toast({
        title: "Left Lobby",
        description: "You have successfully left the lobby.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Leave",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle ready status mutation
  const toggleReadyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/lobbies/${id}/ready`, { ready: !isReady });
      return await res.json();
    },
    onSuccess: () => {
      setIsReady(!isReady);
      queryClient.invalidateQueries({ queryKey: [`/api/lobbies/${id}/members`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/lobbies/${id}/messages`, { content });
      return await res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/lobbies/${id}/messages`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start match mutation (for lobby owner)
  const startMatchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/lobbies/${id}/start-match`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/lobbies/${id}`] });
      
      console.log("Match started with data:", data);
      
      // Show match details in a toast with server connection info
      toast({
        title: "Match Started!",
        description: "The CS2 match has been created. All players have been notified with server connection details.",
        variant: "default",
        duration: 10000, // Show for 10 seconds
      });
      
      // Ensure we have a properly formatted match object with default values if needed
      const match = {
        id: data.match?.id || 0,
        status: data.match?.status || "in_progress",
        prize: data.match?.prize || 0,
        serverDetails: data.match?.serverDetails || {
          ip: "game.server.casharena.gg",
          port: "27015",
          password: "generated-password",
          map: "de_dust2",
          gameMode: "competitive",
          instructions: "Connect to the server using the console command: connect game.server.casharena.gg:27015; password generated-password"
        }
      };
      
      // Show match connection details in a dialog
      setMatchDetails(match);
      setShowMatchDetailsDialog(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Start Match",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Find current member's ready status and set invite URL
  useEffect(() => {
    if (!user || !id) return;
    
    // Find current member's ready status
    const currentMember = members.find(m => m.userId === user.id);
    if (currentMember) {
      setIsReady(currentMember.ready);
    }

    // Generate invite URL
    setInviteUrl(`${window.location.origin}/lobbies/${id}`);
  }, [user, id, members]);

  // Combine messages from API and WebSocket
  useEffect(() => {
    if (messages && wsMessages) {
      // Create a map of existing message IDs
      const messageMap = new Map();
      
      // Add API fetched messages
      messages.forEach(msg => {
        messageMap.set(msg.id, msg);
      });
      
      // Add WebSocket messages (these will override API messages if same ID)
      wsMessages.forEach(msg => {
        if (msg.id) {
          messageMap.set(msg.id, msg);
        }
      });
      
      // Convert map to array and sort by creation date (newest first)
      const combined = Array.from(messageMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setCombinedMessages(combined);
    }
  }, [messages, wsMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [combinedMessages]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && id) {
      console.log("Sending message with content:", message);
      
      // Create a temporary message to show immediately
      const tempMessage: ExtendedLobbyMessage = {
        id: -Date.now(), // Temporary negative ID that won't conflict with real IDs
        lobbyId: Number(id),
        userId: user!.id,
        content: message,
        createdAt: new Date(),
        username: user!.username
      };
      
      // Add temporary message to combined messages
      setCombinedMessages(prev => [tempMessage, ...prev]);
      
      // Clear input right away for better UX
      setMessage("");
      
      // Send via WebSocket only - this already calls the API internally in the hook
      sendWebSocketMessage(message);
      
      // We no longer need this as it causes duplicate messages
      // sendMessageMutation.mutate(message);
    }
  };

  // Copy invite link
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  // Check if current user is in lobby
  const isUserInLobby = !!members.find(m => m.userId === user?.id);
  
  // Check if current user is lobby owner
  const isLobbyOwner = lobby?.ownerId === user?.id;

  // Calculate teams (for team lobbies)
  const team1Members = members.filter(m => m.side === "team1");
  const team2Members = members.filter(m => m.side === "team2");

  // No longer needed since we have usernames directly on member objects

  // Loading state
  if (isLoadingLobby || !lobby) {
    return (
      <div className="container mx-auto py-6">
        <BackToDashboard />
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/lobbies">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <Skeleton className="h-8 w-72" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="h-[300px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/lobbies">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lobbies
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center">
              {lobby.name}
              {lobby.password && (
                <Shield className="ml-2 h-5 w-5 text-amber-500" />
              )}
            </h1>
            <p className="text-muted-foreground">
              {game?.name || "Loading game..."} • 
              {lobby.type === "solo" ? " 1v1" : " Team 5v5"} • 
              {lobby.status === "open" 
                ? " Open for players" 
                : lobby.status === "in_progress" 
                  ? " Match in progress" 
                  : " Closed"}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {isUserInLobby ? (
            <>
              {isLobbyOwner && lobby.status === "open" && (
                <Button 
                  onClick={() => startMatchMutation.mutate()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={members.some(m => !m.ready)}
                >
                  <Swords className="mr-2 h-4 w-4" />
                  Start Match
                </Button>
              )}
              
              <Button 
                variant={isReady ? "default" : "outline"}
                className={isReady ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                onClick={() => toggleReadyMutation.mutate()}
              >
                {isReady ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Ready
                  </>
                ) : (
                  "Ready Up"
                )}
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => leaveLobbyMutation.mutate()}
              >
                <X className="mr-2 h-4 w-4" />
                Leave
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => joinLobbyMutation.mutate()}
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={
                lobby.status !== "open" ||
                lobby.currentPlayers >= lobby.maxPlayers
              }
            >
              {lobby.status !== "open" 
                ? "Lobby Closed" 
                : lobby.currentPlayers >= lobby.maxPlayers 
                  ? "Lobby Full" 
                  : "Join Lobby"}
            </Button>
          )}
          
          {isLobbyOwner && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Players</DialogTitle>
                  <DialogDescription>
                    Share this link to invite other players to your lobby
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex">
                  <Input 
                    readOnly 
                    value={inviteUrl} 
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    className="ml-2"
                    onClick={copyInviteLink}
                  >
                    {showCopied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Or invite your friends:</h4>
                  <div className="max-h-[200px] overflow-y-auto">
                    {/* Friend list will be implemented later */}
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Friend invitation coming soon
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="w-full">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Lobby details */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Lobby Details
                </CardTitle>
                {user && lobby.ownerId === user.id && lobby.status === "open" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Lobby
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the lobby
                          and remove all members.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              const response = await apiRequest("DELETE", `/api/lobbies/${id}`);
                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || "Failed to delete lobby");
                              }
                              
                              toast({
                                title: "Lobby deleted",
                                description: "The lobby has been deleted successfully",
                              });
                              
                              // Invalidate cache and navigate to lobbies page
                              queryClient.invalidateQueries({ queryKey: ["/api/lobbies"] });
                              window.location.href = "/lobbies";
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Game</h4>
                  <p>{game?.name || "Loading..."}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                  <p>{lobby.type === "solo" ? "Solo (1v1)" : "Team (5v5)"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge 
                    className={lobby.status === "open" ? "bg-green-500 hover:bg-green-600" : 
                             lobby.status === "in_progress" ? "bg-amber-500 hover:bg-amber-600" : ""}
                    variant={lobby.status === "open" ? "default" : 
                            lobby.status === "in_progress" ? "default" : "secondary"}
                  >
                    {lobby.status === "open" 
                      ? "Open" 
                      : lobby.status === "in_progress" 
                        ? "In Progress" 
                        : "Closed"}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Entry Fee</h4>
                  <p>{lobby.entryFee > 0 ? `${lobby.entryFee} WinTokens` : "Free Entry"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Prize</h4>
                  <p>{lobby.prizePool > 0 ? `${lobby.prizePool} WinTokens` : "No Prize"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p>{new Date(lobby.createdAt).toLocaleString()}</p>
                </div>
                {lobby.map && (
                  <div className="col-span-full">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Map</h4>
                    <p>{lobby.map}</p>
                  </div>
                )}
                {lobby.rules && (
                  <div className="col-span-full">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Rules</h4>
                    <p className="whitespace-pre-line">{lobby.rules}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Chat/Roster tabs for team lobbies */}
          {lobby.type === "team" && (
            <Tabs defaultValue="chat">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="roster">Team Roster</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat">
                <Card className="border-t-0 rounded-tl-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Lobby Chat</CardTitle>
                    <CardDescription>
                      Communicate with other players in the lobby
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      ref={chatContainerRef}
                      className="h-[300px] overflow-y-auto mb-4 space-y-4 pr-2"
                    >
                      {isLoadingMessages ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-start space-x-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-48" />
                            </div>
                          </div>
                        ))
                      ) : messages.length > 0 ? (
                        messages.map((msg) => {
                          // Username is included directly in the message object
                          const isSelf = msg.userId === user?.id;
                          
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex items-start space-x-3 ${
                                isSelf ? 'justify-end' : ''
                              }`}
                            >
                              {!isSelf && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {msg.username?.charAt(0).toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div 
                                className={`p-3 rounded-lg max-w-[80%] ${
                                  isSelf 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                {!isSelf && (
                                  <p className="text-xs font-medium mb-1">
                                    {msg.username || 'Unknown User'}
                                  </p>
                                )}
                                <p className="break-words">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1 text-right">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              {isSelf && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {user.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No messages yet. Start the conversation!
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col space-y-2">
                    {typingUsers.length > 0 && (
                      <div className="text-xs text-muted-foreground italic w-full">
                        {typingUsers.length === 1 
                          ? `${typingUsers[0].username} is typing...` 
                          : `${typingUsers.length} people are typing...`}
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="w-full flex space-x-2">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          // Send typing indicator when user types
                          if (e.target.value.trim()) {
                            sendTypingIndicator();
                            console.log('Sending typing indicator from input change');
                          }
                        }}
                        disabled={!isUserInLobby}
                      />
                      <Button 
                        type="submit" 
                        disabled={!message.trim() || !isUserInLobby}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="roster">
                <Card className="border-t-0 rounded-tl-none">
                  <CardHeader>
                    <CardTitle className="text-xl">Team Rosters</CardTitle>
                    <CardDescription>
                      Current team lineups for the match
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Team 1 */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Team 1</h3>
                        {team1Members.length > 0 ? (
                          <div className="space-y-3">
                            {team1Members.map((member) => {
                              return (
                                <div key={member.id} className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarFallback>
                                      {member.username?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">{member.username || 'Loading...'}</p>
                                  </div>
                                  {member.ready ? (
                                    <Badge className="bg-green-600">Ready</Badge>
                                  ) : (
                                    <Badge variant="outline">Not Ready</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 text-center text-muted-foreground">
                            Waiting for players...
                          </div>
                        )}
                      </div>
                      
                      {/* Team 2 */}
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Team 2</h3>
                        {team2Members.length > 0 ? (
                          <div className="space-y-3">
                            {team2Members.map((member) => {
                              return (
                                <div key={member.id} className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarFallback>
                                      {member.username?.charAt(0).toUpperCase() || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">{member.username || 'Loading...'}</p>
                                  </div>
                                  {member.ready ? (
                                    <Badge className="bg-green-600">Ready</Badge>
                                  ) : (
                                    <Badge variant="outline">Not Ready</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 text-center text-muted-foreground">
                            Waiting for players...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(isLobbyOwner && lobby.status === "open") && (
                      <div className="mt-6">
                        <Button
                          className="w-full"
                          disabled={members.some(m => !m.ready)}
                          onClick={() => startMatchMutation.mutate()}
                        >
                          <Swords className="mr-2 h-4 w-4" />
                          Start Match
                        </Button>
                        {members.some(m => !m.ready) && (
                          <p className="text-center text-sm text-muted-foreground mt-2">
                            Waiting for all players to be ready
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          {/* Chat for solo lobbies */}
          {lobby.type === "solo" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Lobby Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  ref={chatContainerRef}
                  className="h-[300px] overflow-y-auto mb-4 space-y-4 pr-2"
                >
                  {isLoadingMessages ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                    ))
                  ) : combinedMessages.length > 0 ? (
                    combinedMessages.map((msg) => {
                      // Username is included in the message object from the API
                      const isSelf = msg.userId === user?.id;
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex items-start space-x-3 ${
                            isSelf ? 'justify-end' : ''
                          }`}
                        >
                          {!isSelf && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {msg.username?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div 
                            className={`p-3 rounded-lg max-w-[80%] ${
                              isSelf 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            {!isSelf && (
                              <p className="text-xs font-medium mb-1">
                                {msg.username || 'Unknown User'}
                              </p>
                            )}
                            <p className="break-words">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {isSelf && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-2">
                {typingUsers.length > 0 && (
                  <div className="text-xs text-muted-foreground italic w-full">
                    {typingUsers.length === 1 
                      ? `${typingUsers[0].username} is typing...` 
                      : `${typingUsers.length} people are typing...`}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="w-full flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      // Send typing indicator when user types
                      if (e.target.value.trim()) {
                        sendTypingIndicator();
                        console.log('Sending typing indicator from solo lobby input');
                      }
                    }}
                    disabled={!isUserInLobby}
                  />
                  <Button 
                    type="submit" 
                    disabled={!message.trim() || !isUserInLobby}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* Participants sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Players {`(${members.length}/${lobby.maxPlayers})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center mb-4">
                    <Skeleton className="h-8 w-8 rounded-full mr-3" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))
              ) : members.length > 0 ? (
                <div className="space-y-4">
                  {/* Owner first */}
                  {members
                    .filter(m => m.userId === lobby.ownerId)
                    .map((member) => {
                      // Username comes directly from member object
                      const isCurrentUser = member.userId === user?.id;
                      
                      return (
                        <div key={member.id} className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarFallback className="bg-amber-500/20 text-amber-500">
                              {member.username?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium flex items-center">
                              {member.username || 'Loading...'}
                              <Badge 
                                variant="outline" 
                                className="ml-2 text-amber-500 border-amber-500"
                              >
                                Owner
                              </Badge>
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (You)
                                </span>
                              )}
                            </p>
                          </div>
                          {member.ready ? (
                            <Badge className="bg-green-600">Ready</Badge>
                          ) : (
                            <Badge variant="outline">Not Ready</Badge>
                          )}
                        </div>
                      );
                    })}
                  
                  {/* Other members */}
                  {members
                    .filter(m => m.userId !== lobby.ownerId)
                    .map((member) => {
                      // Username comes directly from member object
                      const isCurrentUser = member.userId === user?.id;
                      
                      return (
                        <div key={member.id} className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarFallback>
                              {member.username?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {member.username || 'Loading...'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (You)
                                </span>
                              )}
                            </p>
                          </div>
                          {member.ready ? (
                            <Badge className="bg-green-600">Ready</Badge>
                          ) : (
                            <Badge variant="outline">Not Ready</Badge>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No players have joined yet
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-stretch">
              {/* Player actions */}
              {isUserInLobby ? (
                <div className="space-y-2 w-full">
                  <Button 
                    variant={isReady ? "default" : "outline"}
                    className={`w-full ${isReady ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                    onClick={() => toggleReadyMutation.mutate()}
                  >
                    {isReady ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        I'm Ready
                      </>
                    ) : (
                      "Ready Up"
                    )}
                  </Button>
                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={() => leaveLobbyMutation.mutate()}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Leave Lobby
                  </Button>
                </div>
              ) : (
                <>
                  {lobby.status === "open" && lobby.currentPlayers < lobby.maxPlayers ? (
                    <div className="space-y-2 w-full">
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        onClick={() => joinLobbyMutation.mutate()}
                      >
                        Join Lobby
                      </Button>
                      {lobby.entryFee > 0 && (
                        <p className="text-xs text-center text-muted-foreground">
                          Entry fee: {lobby.entryFee} WinTokens
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
                        {lobby.status !== "open" 
                          ? "This lobby is no longer accepting players" 
                          : "This lobby is currently full"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
          
          {/* Game info */}
          {game && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Game Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  {game.image ? (
                    <img 
                      src={game.image} 
                      alt={game.name} 
                      className="h-24 object-contain rounded-md"
                    />
                  ) : (
                    <div className="h-24 w-full bg-muted rounded-md flex items-center justify-center">
                      <p className="text-muted-foreground">{game.name}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Category: </span>
                    <span>{game.category}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Platform: </span>
                    <span>{game.platform}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/games/${game.id}`}>
                    View Game Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
      
      {/* Match Details Dialog */}
      <Dialog open={showMatchDetailsDialog} onOpenChange={setShowMatchDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Swords className="mr-2 h-5 w-5 text-primary" />
              Match Created Successfully
            </DialogTitle>
            <DialogDescription>
              Your CS2 match has been created. All players will receive a notification with the connection details.
            </DialogDescription>
          </DialogHeader>
          
          {matchDetails && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Match Details:</h3>
                <p className="mb-1"><span className="text-muted-foreground">Match ID:</span> {matchDetails.id}</p>
                <p className="mb-1"><span className="text-muted-foreground">Game:</span> {game?.name}</p>
                <p className="mb-1"><span className="text-muted-foreground">Status:</span> {matchDetails.status}</p>
                <p className="mb-1"><span className="text-muted-foreground">Prize:</span> {matchDetails.prize} WinTokens</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Connection Details:</h3>
                <div className="font-mono text-sm whitespace-pre-wrap bg-secondary/50 p-2 rounded">
                  {matchDetails.serverDetails ? (
                    typeof matchDetails.serverDetails === 'object' ? (
                      <>
                        <p><strong>Server:</strong> {matchDetails.serverDetails.ip || 'N/A'}:{matchDetails.serverDetails.port || 'N/A'}</p>
                        <p><strong>Password:</strong> {matchDetails.serverDetails.password || 'N/A'}</p>
                        <p><strong>Map:</strong> {matchDetails.serverDetails.map || 'N/A'}</p>
                        <p><strong>Mode:</strong> {matchDetails.serverDetails.gameMode || 'N/A'}</p>
                        {matchDetails.serverDetails.instructions && (
                          <p className="mt-2 text-green-500">{matchDetails.serverDetails.instructions}</p>
                        )}
                      </>
                    ) : (
                      <p>{typeof matchDetails.serverDetails === 'string' ? 
                        matchDetails.serverDetails : "Server details in unexpected format."}</p>
                    )
                  ) : (
                    <p>No server details available yet. The CS2 server is being provisioned and details will be updated shortly.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowMatchDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}