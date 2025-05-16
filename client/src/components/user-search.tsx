import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Search, UserPlus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [pendingFriendRequests, setPendingFriendRequests] = useState<number[]>([]);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: true,
  });

  // Handle sending friend request
  const handleSendFriendRequest = async (userId: number) => {
    try {
      // Add user ID to pending requests to show the pending UI
      setPendingFriendRequests(prev => [...prev, userId]);

      const response = await fetch(`/api/friends/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error("Failed to send friend request");
      }

      // Invalidate friends and friend requests queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests"] });

      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });
    } catch (error) {
      // Remove from pending on error
      setPendingFriendRequests(prev => prev.filter(id => id !== userId));
      
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  // Filter users based on search query
  const filteredUsers = searchQuery.trim() 
    ? users.filter((user: any) => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {searchQuery.trim() === "" ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Enter a username to search for friends</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No users found matching "{searchQuery}"</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredUsers.map((user: any) => (
              <li key={user.id} className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    {user.role === "admin" && (
                      <p className="text-xs text-primary">Admin</p>
                    )}
                  </div>
                </div>
                {pendingFriendRequests.includes(user.id) ? (
                  <Button variant="outline" size="sm" disabled>
                    <Check className="h-4 w-4 mr-1" />
                    Request Sent
                  </Button>
                ) : user.isFriend ? (
                  <Button variant="outline" size="sm" disabled>
                    <Check className="h-4 w-4 mr-1" />
                    Friends
                  </Button>
                ) : user.friendRequestSent ? (
                  <Button variant="outline" size="sm" disabled>
                    <Check className="h-4 w-4 mr-1" />
                    Request Sent
                  </Button>
                ) : user.friendRequestReceived ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSendFriendRequest(user.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Friend
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}