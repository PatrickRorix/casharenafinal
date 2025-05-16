import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { UserSearch } from "@/components/user-search";
import { BackToDashboard } from "@/components/back-to-dashboard";

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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProtectedRoute } from "@/lib/protected-route";

import { UsersRound, MessageSquare, Shield, UserPlus, Send, Users } from "lucide-react";

function SocialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  
  // Friends query
  const { 
    data: friends = [],
    isLoading: isLoadingFriends,
  } = useQuery({
    queryKey: ["/api/friends"],
    enabled: !!user,
  });
  
  // Friend requests query
  const { 
    data: friendRequests = [],
    isLoading: isLoadingRequests,
  } = useQuery({
    queryKey: ["/api/friend-requests"],
    enabled: !!user,
  });
  
  // Teams query
  const { 
    data: teams = [],
    isLoading: isLoadingTeams,
  } = useQuery({
    queryKey: ["/api/my-teams"],
    enabled: !!user,
  });
  
  // Messages/conversations query
  const { 
    data: conversations = [],
    isLoading: isLoadingConversations,
  } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });
  
  // Active chat messages query
  const { 
    data: activeMessages = [],
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ["/api/messages", activeChat],
    enabled: !!activeChat,
  });
  
  // Social feed query
  const { 
    data: feed = [],
    isLoading: isLoadingFeed,
  } = useQuery({
    queryKey: ["/api/feed"],
    enabled: !!user,
  });
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;
    
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: activeChat,
          content: messageText,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      setMessageText("");
      // Invalidate messages query for this conversation
      queryClient.invalidateQueries({ queryKey: ["/api/messages", activeChat] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };
  
  // Handle accepting a friend request
  const handleAcceptFriend = async (friendshipId: number) => {
    try {
      const response = await fetch(`/api/friendships/${friendshipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "accepted",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }
      
      toast({
        title: "Success",
        description: "Friend request accepted",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };
  
  // Handle rejecting a friend request
  const handleRejectFriend = async (friendshipId: number) => {
    try {
      const response = await fetch(`/api/friendships/${friendshipId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reject friend request");
      }
      
      toast({
        title: "Success",
        description: "Friend request rejected",
      });
      
      // Invalidate friend requests query
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <BackToDashboard />
      <h1 className="text-3xl font-bold mb-6">Social Center</h1>
      
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            <span>Friends</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Teams</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Feed</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Friends Tab */}
        <TabsContent value="friends">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Friends List */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Friends</CardTitle>
                  <CardDescription>Your connected friends on CashArena</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFriends ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>You don't have any friends yet.</p>
                      <p className="text-sm mt-2">Search for players to add as friends!</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {friends.map((friend: any) => (
                        <li key={friend.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{friend.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {friend.isOnline ? (
                                  <span className="text-green-500">● Online</span>
                                ) : (
                                  <span className="text-muted-foreground">● Offline</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setActiveChat(friend.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              
              {/* Friend Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Friend Requests</CardTitle>
                  <CardDescription>People who want to connect with you</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingRequests ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : friendRequests.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No pending friend requests.</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {friendRequests.map((request: any) => (
                        <li key={request.id} className="flex items-center justify-between p-3 rounded-md border">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{request.username?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.username || 'Unknown user'}</p>
                              <p className="text-xs text-muted-foreground">{request.status}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleAcceptFriend(request.id)}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectFriend(request.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Find Friends */}
            <div>
              <UserSearch />
            </div>
          </div>
        </TabsContent>
        
        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Chat with your friends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                {/* Conversations List */}
                <div className="border rounded-md md:col-span-1">
                  <div className="p-3 border-b">
                    <h3 className="font-medium">Conversations</h3>
                  </div>
                  <ScrollArea className="h-[520px]">
                    {isLoadingConversations ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No conversations yet.</p>
                        <p className="text-sm mt-2">Start chatting with your friends!</p>
                      </div>
                    ) : (
                      <ul className="space-y-1 p-1">
                        {conversations.map((convo: any) => (
                          <li 
                            key={convo.userId}
                            className={`flex items-center gap-3 p-3 cursor-pointer rounded-md ${activeChat === convo.userId ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                            onClick={() => setActiveChat(convo.userId)}
                          >
                            <Avatar>
                              <AvatarFallback>{convo.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{convo.username}</p>
                              <p className="text-xs truncate text-muted-foreground">
                                {convo.lastMessage || 'Start a conversation'}
                              </p>
                            </div>
                            {convo.unreadCount > 0 && (
                              <Badge variant="default" className="ml-auto">
                                {convo.unreadCount}
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </div>
                
                {/* Messages */}
                <div className="border rounded-md md:col-span-2 flex flex-col">
                  {activeChat ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-3 border-b flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {conversations.find((c: any) => c.userId === activeChat)?.username.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {conversations.find((c: any) => c.userId === activeChat)?.username || 'User'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Messages Area */}
                      <ScrollArea className="flex-1 p-4">
                        {isLoadingMessages ? (
                          <div className="flex justify-center py-6">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : activeMessages.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>No messages yet.</p>
                            <p className="text-sm mt-2">Send a message to start the conversation!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activeMessages.map((message: any) => (
                              <div 
                                key={message.id}
                                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[80%] p-3 rounded-md ${
                                    message.senderId === user?.id 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-secondary'
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p className="text-xs mt-1 opacity-70">
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                      
                      {/* Message Input */}
                      <div className="p-3 border-t mt-auto">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSendMessage();
                              }
                            }}
                          />
                          <Button onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Your Messages</h3>
                      <p className="text-muted-foreground">
                        Select a conversation or start a new one with a friend
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Teams Tab */}
        <TabsContent value="teams">
          <div className="grid grid-cols-1 gap-6">
            {/* Teams List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Teams</CardTitle>
                  <CardDescription>Teams and clans you're a member of</CardDescription>
                </div>
                <Button>
                  Create Team
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingTeams ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-12 border rounded-md bg-muted/30">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Teams Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You aren't a member of any teams yet
                    </p>
                    <Button>
                      <Shield className="h-4 w-4 mr-2" />
                      Create Your Team
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team: any) => (
                      <div key={team.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-secondary w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold">
                              {team.tag}
                            </div>
                            <div>
                              <h4 className="font-medium">{team.name}</h4>
                              <p className="text-xs text-muted-foreground">{team.memberCount} members</p>
                            </div>
                          </div>
                          <Badge variant={team.role === 'leader' ? 'default' : 'outline'}>
                            {team.role}
                          </Badge>
                        </div>
                        <p className="text-sm line-clamp-2 mb-3">{team.description}</p>
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Social Feed Tab */}
        <TabsContent value="feed">
          <Card>
            <CardHeader>
              <CardTitle>Social Feed</CardTitle>
              <CardDescription>See what your friends are up to</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFeed ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : feed.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/30">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Activity Yet</h3>
                  <p className="text-muted-foreground">
                    There's no activity from your friends yet
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {feed.map((activity: any) => (
                    <div key={activity.id} className="border p-4 rounded-md">
                      <div className="flex gap-3 mb-2">
                        <Avatar>
                          <AvatarFallback>{activity.username?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{activity.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="mb-2">{activity.content}</p>
                      
                      {activity.type === 'tournament_join' && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="font-medium">{activity.data?.tournamentName}</p>
                          <p className="text-sm">Joined a tournament</p>
                        </div>
                      )}
                      
                      {activity.type === 'team_join' && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="font-medium">{activity.data?.teamName}</p>
                          <p className="text-sm">Joined a team</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Social() {
  return <ProtectedRoute path="/social" component={SocialPage} />;
}