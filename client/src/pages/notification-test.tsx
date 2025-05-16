import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function NotificationTest() {
  const { toast } = useToast();

  const createTestNotifications = async () => {
    try {
      const res = await apiRequest("POST", "/api/test-notifications");
      const data = await res.json();
      
      toast({
        title: "Success",
        description: `Created ${data.count} test notifications`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test notifications. Are you logged in?",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-primary mb-8">Notification System Test</h1>
      
      <div className="bg-[hsl(var(--surface))] p-6 rounded-lg border border-primary/20 shadow-md">
        <p className="mb-4">
          Click the button below to create test notifications of different types. You should see 
          them appear in real-time in the notification bell in the header.
        </p>
        
        <Button 
          onClick={createTestNotifications}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Create Test Notifications
        </Button>
      </div>
      
      <div className="mt-8 bg-[hsl(var(--surface))] p-6 rounded-lg border border-primary/20 shadow-md">
        <h2 className="text-xl font-bold mb-4">Notification Types</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span className="font-medium">Tournament</span> - Notifications about tournament invitations and updates
          </li>
          <li className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <span className="font-medium">Match</span> - Notifications about upcoming matches and results
          </li>
          <li className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="font-medium">Transaction</span> - Notifications about token deposits, withdrawals, and earnings
          </li>
          <li className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <span className="font-medium">System</span> - System-wide announcements and information
          </li>
        </ul>
      </div>
    </div>
  );
}