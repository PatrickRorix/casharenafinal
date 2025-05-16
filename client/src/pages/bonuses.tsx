import React from 'react';
import { BonusesGrid } from '@/components/bonuses/bonuses-grid';
import { useBonuses } from '@/hooks/use-bonuses';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function BonusesPage() {
  const { user } = useAuth();
  const {
    activeBonuses,
    isLoadingActiveBonuses,
    userBonuses,
    isLoadingUserBonuses,
    claimBonus,
    claimDailyBonus,
    isClaimingBonus,
    isDailyBonusEligible
  } = useBonuses(user?.id);
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Please log in to view bonuses</p>
      </div>
    );
  }
  
  const isLoading = isLoadingActiveBonuses || isLoadingUserBonuses;
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Bonuses</h1>
        <p className="text-muted-foreground">Claim daily bonuses and special rewards to earn extra tokens</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <BonusesGrid
          bonuses={activeBonuses as any[] || []}
          userBonuses={userBonuses as any[] || []}
          isLoading={isLoading}
          isDailyBonusEligible={isDailyBonusEligible}
          onClaimBonus={claimBonus}
          onClaimDailyBonus={claimDailyBonus}
          isClaimingBonus={isClaimingBonus}
        />
      )}
    </div>
  );
}