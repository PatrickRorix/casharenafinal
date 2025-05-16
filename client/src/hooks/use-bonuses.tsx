import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export function useBonuses(userId?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentUserId = userId || (user ? user.id : undefined);
  
  // Fetch active bonuses
  const {
    data: activeBonuses,
    isLoading: isLoadingActiveBonuses,
    error: activeBonusesError,
    refetch: refetchActiveBonuses
  } = useQuery({
    queryKey: ["/api/bonuses", { active: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/bonuses?active=true");
      return res.json();
    }
  });
  
  // Check daily bonus eligibility
  const {
    data: dailyBonusEligibility,
    isLoading: isLoadingEligibility,
    error: eligibilityError,
    refetch: refetchEligibility
  } = useQuery({
    queryKey: currentUserId ? [`/api/users/${currentUserId}/daily-bonus`] : ['no-user-daily'],
    enabled: !!currentUserId
  });
  
  // Fetch user bonuses
  const {
    data: userBonuses,
    isLoading: isLoadingUserBonuses,
    error: userBonusesError,
    refetch: refetchUserBonuses
  } = useQuery({
    queryKey: currentUserId ? [`/api/users/${currentUserId}/bonuses`] : ['no-user-bonuses'],
    enabled: !!currentUserId
  });
  
  // Claim bonus
  const claimBonusMutation = useMutation({
    mutationFn: async (bonusId: number) => {
      if (!currentUserId) throw new Error("User not authenticated");
      const res = await apiRequest("POST", `/api/users/${currentUserId}/bonuses/${bonusId}/claim`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/bonuses`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/daily-bonus`] });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user data to get updated token balance
      }
      
      toast({
        title: "Bonus claimed",
        description: "The bonus tokens have been added to your account!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim bonus",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Function to claim daily login bonus
  const claimDailyBonus = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to claim the daily bonus.",
        variant: "destructive",
      });
      return;
    }
    
    if (!(dailyBonusEligibility as any)?.eligible) {
      toast({
        title: "Already claimed",
        description: "You have already claimed your daily bonus today.",
        variant: "destructive",
      });
      return;
    }
    
    // Get daily login bonus type
    const dailyBonus = activeBonuses?.find((bonus: any) => bonus.type === 'daily_login');
    if (!dailyBonus) {
      toast({
        title: "No daily bonus available",
        description: "There is no daily bonus available at this time.",
        variant: "destructive",
      });
      return;
    }
    
    // Claim the bonus
    claimBonusMutation.mutate(dailyBonus.id);
  };
  
  return {
    activeBonuses,
    isLoadingActiveBonuses,
    activeBonusesError,
    refetchActiveBonuses,
    
    dailyBonusEligibility,
    isLoadingEligibility,
    eligibilityError,
    refetchEligibility,
    
    userBonuses,
    isLoadingUserBonuses,
    userBonusesError,
    refetchUserBonuses,
    
    claimBonus: claimBonusMutation.mutate,
    isClaimingBonus: claimBonusMutation.isPending,
    claimDailyBonus,
    isDailyBonusEligible: (dailyBonusEligibility as any)?.eligible || false,
  };
}