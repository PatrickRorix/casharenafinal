import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { apiRequest } from "@/lib/queryClient";

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type TypingUser = {
  userId: number;
  username: string;
  timestamp: number;
};

export function useLobbyWebSocket(lobbyId?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [lobbyUpdates, setLobbyUpdates] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear typing indicator after inactivity
  useEffect(() => {
    // Clean up typing users who haven't typed in 3 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => (now - user.timestamp) < 3000)
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Initialize the WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
      // Authenticate with the server
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
      
      // Subscribe to lobby if provided
      if (lobbyId) {
        socket.send(JSON.stringify({
          type: 'subscribe_lobby',
          lobbyId
        }));
      }
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle authentication success
        if (data.type === 'auth_success') {
          setConnected(true);
        }
        
        // Handle unread notifications count
        if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        }
        
        // Handle lobby updates
        if (data.type === 'LOBBY_UPDATE') {
          // Handle different lobby update types
          switch (data.data.action) {
            case 'NEW_MESSAGE':
              // Add new messages to the chat
              setMessages(prev => [data.data.message, ...prev]);
              break;
            
            case 'MEMBER_JOINED':
              // Show notification for new member
              toast({
                title: "Player Joined",
                description: `${data.data.user.username} has joined the lobby`,
              });
              // Add update to the list
              setLobbyUpdates(prev => [data.data, ...prev]);
              break;
            
            case 'MEMBER_LEFT':
              // Show notification for member leaving
              toast({
                title: "Player Left",
                description: `${data.data.user.username} has left the lobby`,
              });
              // Add update to the list
              setLobbyUpdates(prev => [data.data, ...prev]);
              break;
            
            case 'READY_STATUS_CHANGED':
              // Show notification for ready status change
              toast({
                title: `${data.data.ready ? "Ready" : "Not Ready"}`,
                description: `${data.data.userId === user?.id ? 
                  "You are" : 
                  `${data.data.lobby.members.find((m: any) => m.userId === data.data.userId)?.user?.username || 'A player'} is`} 
                  now ${data.data.ready ? "ready" : "not ready"}`,
                variant: data.data.ready ? "default" : "destructive",
              });
              // Add update to the list
              setLobbyUpdates(prev => [data.data, ...prev]);
              break;
            
            case 'MATCH_STARTED':
              // Show notification for match starting
              toast({
                title: "Match Started",
                description: "The match has started!",
                variant: "default",
              });
              // Add update to the list
              setLobbyUpdates(prev => [data.data, ...prev]);
              break;
            
            case 'TYPING':
              // Handle typing indicator
              // Don't show typing indicator for the current user
              if (data.data.userId !== user?.id) {
                const typingUser = {
                  userId: data.data.userId,
                  username: data.data.username,
                  timestamp: Date.now()
                };
                
                setTypingUsers(prev => {
                  // If user is already in typing list, update timestamp
                  if (prev.some(u => u.userId === typingUser.userId)) {
                    return prev.map(u => 
                      u.userId === typingUser.userId 
                        ? { ...u, timestamp: Date.now() } 
                        : u
                    );
                  }
                  // Otherwise add to typing list
                  return [...prev, typingUser];
                });
              }
              break;
              
            default:
              // Add other lobby updates
              setLobbyUpdates(prev => [data.data, ...prev]);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setConnected(false);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      // Unsubscribe from lobby if subscribed
      if (connected && lobbyId && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current?.send(JSON.stringify({
          type: 'unsubscribe_lobby',
          lobbyId
        }));
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Close the connection
      socket.close();
    };
  }, [user, lobbyId, toast]);
  
  // Function to send a message to the lobby
  const sendMessage = useCallback((content: string) => {
    if (!connected || !lobbyId) return;
    
    console.log('Sending message:', content);
    
    // Use a direct API request to ensure messages are sent
    // even if there are WebSocket issues
    apiRequest('POST', `/api/lobbies/${lobbyId}/messages`, { content })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        return response.json();
      })
      .then(data => {
        console.log('Message sent successfully:', data);
      })
      .catch(error => {
        console.error('Error sending message:', error);
        toast({
          title: "Failed to send message",
          description: error.message,
          variant: "destructive",
        });
      });
  }, [connected, lobbyId, toast]);
  
  // Function to send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (!connected || !lobbyId || !socketRef.current || !user) return;
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    console.log('Sending typing indicator for user:', user.username, 'in lobby:', lobbyId);
    
    // Send typing indicator
    try {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        lobbyId,
        userId: user.id,
        username: user.username
      }));
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
    
    // Set timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  }, [connected, lobbyId, user]);
  
  return {
    connected,
    messages,
    lobbyUpdates,
    typingUsers,
    unreadCount,
    sendMessage,
    sendTypingIndicator
  };
}