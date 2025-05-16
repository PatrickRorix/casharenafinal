import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  content?: string; // For backward compatibility
  read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  refetchNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from the API
  const {
    data: notifications = [],
    isLoading,
    refetch: refetchNotifications
  } = useQuery<Notification[]>({
    queryKey: [`/api/users/${user?.id}/notifications`],
    enabled: !!user,
  });

  // Set up WebSocket connection when user authenticates
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);
    
    newSocket.onopen = () => {
      console.log("WebSocket connection established");
      // Authenticate with user ID
      newSocket.send(JSON.stringify({
        type: "auth",
        userId: user.id
      }));
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === "notification") {
          // Add new notification to the list and update count
          toast({
            title: "New Notification",
            description: data.data.content,
          });
          
          // Update notifications cache
          queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/notifications`] });
          
          // Update unread count
          setUnreadCount(prev => prev + 1);
        } else if (data.type === "unread_count") {
          // Update unread count from server
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    newSocket.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    // Clean up on component unmount or when user changes
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [user, toast]);

  // Fetch unread count
  useEffect(() => {
    if (!user) return;
    
    // Only fetch unread count if WebSocket isn't connected yet
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      apiRequest("GET", `/api/users/${user.id}/notifications/unread-count`)
        .then(res => res.json())
        .then(data => {
          setUnreadCount(data.count);
        })
        .catch(error => {
          console.error("Error fetching unread count:", error);
        });
    }
  }, [user, socket]);

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      // Update notifications and unread count
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/notifications`] });
      if (unreadCount > 0) {
        setUnreadCount(prev => prev - 1);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark notification as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const res = await apiRequest("PATCH", `/api/users/${user.id}/notifications/read-all`);
      return await res.json();
    },
    onSuccess: () => {
      // Update notifications and reset unread count
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/notifications`] });
      setUnreadCount(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark all notifications as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("DELETE", `/api/notifications/${notificationId}`);
      return await res.json();
    },
    onSuccess: () => {
      // Update notifications
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/notifications`] });
      // Recalculate unread count
      apiRequest("GET", `/api/users/${user?.id}/notifications/unread-count`)
        .then(res => res.json())
        .then(data => {
          setUnreadCount(data.count);
        });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete notification: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead: (id) => markAsReadMutation.mutate(id),
        markAllAsRead: () => markAllAsReadMutation.mutate(),
        deleteNotification: (id) => deleteNotificationMutation.mutate(id),
        refetchNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}