import React from 'react';
import { AchievementsGrid } from '@/components/achievements/achievements-grid';
import { useAchievements } from '@/hooks/use-achievements';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AchievementsPage() {
  const { user } = useAuth();
  const {
    achievements,
    isLoadingAchievements,
    claimReward,
    isClaimingReward
  } = useAchievements(user?.id);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Please log in to view achievements</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">Track your progress and earn rewards by completing achievements</p>
      </div>
      
      {isLoadingAchievements ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <AchievementsGrid
          achievements={achievements as any[] || []}
          isLoading={isLoadingAchievements}
          onClaimReward={claimReward}
          isClaimingReward={isClaimingReward}
        />
      )}
    </div>
  );
}