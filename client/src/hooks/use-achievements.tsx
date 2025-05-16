import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export function useAchievements(userId?: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentUserId = userId || (user ? user.id : undefined);
  
  // Fetch user's achievements
  const {
    data: achievements,
    isLoading: isLoadingAchievements,
    error: achievementsError,
    refetch: refetchAchievements
  } = useQuery({
    queryKey: currentUserId ? [`/api/users/${currentUserId}/achievements`] : ['no-user'],
    enabled: !!currentUserId
  });
  
  // Update achievement progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ achievementId, progress }: { achievementId: number, progress: number }) => {
      if (!currentUserId) throw new Error("User not authenticated");
      const res = await apiRequest("POST", `/api/users/${currentUserId}/achievements/${achievementId}/progress`, { progress });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/achievements`] });
      toast({
        title: "Progress updated",
        description: "Your achievement progress has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Complete achievement
  const completeAchievementMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      if (!currentUserId) throw new Error("User not authenticated");
      const res = await apiRequest("POST", `/api/users/${currentUserId}/achievements/${achievementId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/achievements`] });
      toast({
        title: "Achievement completed",
        description: "Congratulations! You've completed an achievement.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete achievement",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Claim achievement reward
  const claimRewardMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      if (!currentUserId) throw new Error("User not authenticated");
      const res = await apiRequest("POST", `/api/users/${currentUserId}/achievements/${achievementId}/claim`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/achievements`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user data to get updated token balance
      toast({
        title: "Reward claimed",
        description: "The achievement reward has been added to your tokens!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim reward",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  return {
    achievements,
    isLoadingAchievements,
    achievementsError,
    refetchAchievements,
    updateProgress: updateProgressMutation.mutate,
    isUpdatingProgress: updateProgressMutation.isPending,
    completeAchievement: completeAchievementMutation.mutate,
    isCompletingAchievement: completeAchievementMutation.isPending,
    claimReward: claimRewardMutation.mutate,
    isClaimingReward: claimRewardMutation.isPending
  };
}