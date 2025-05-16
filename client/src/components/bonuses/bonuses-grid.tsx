import React, { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BonusCard } from '@/components/bonuses/bonus-card';
import { DailyBonus } from '@/components/bonuses/daily-bonus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

type Bonus = {
  id: number;
  name: string;
  description: string;
  tokenAmount: number;
  type: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  code?: string;
};

type UserBonus = {
  id: number;
  userId: number;
  bonusId: number;
  claimed: boolean;
  claimedAt: string | null;
  eligibleAt: string;
  transactionId: number | null;
};

type BonusesGridProps = {
  bonuses: Bonus[];
  userBonuses: UserBonus[];
  isLoading: boolean;
  isDailyBonusEligible: boolean;
  onClaimBonus: (bonusId: number) => void;
  onClaimDailyBonus: () => void;
  isClaimingBonus: boolean;
};

export function BonusesGrid({
  bonuses = [],
  userBonuses = [],
  isLoading,
  isDailyBonusEligible,
  onClaimBonus,
  onClaimDailyBonus,
  isClaimingBonus
}: BonusesGridProps) {
  const [filter, setFilter] = useState('available');
  const [typeFilter, setTypeFilter] = useState('all');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!bonuses || bonuses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-500">No bonuses found</p>
      </div>
    );
  }
  
  // Get unique bonus types
  const uniqueTypes = bonuses.map(b => b.type).filter((v, i, a) => a.indexOf(v) === i);
  const bonusTypes = ['all', ...uniqueTypes];
  
  // Map bonus types to readable names
  const getBonusTypeLabel = (type: string) => {
    switch (type) {
      case 'all': return 'All Types';
      case 'daily_login': return 'Daily Login';
      case 'first_win': return 'First Win';
      case 'weekend': return 'Weekend Special';
      case 'seasonal': return 'Seasonal';
      case 'referral': return 'Referral';
      default: return type.replace('_', ' ');
    }
  };
  
  // Find daily login bonus if it exists
  const dailyLoginBonus = bonuses.find(b => b.type === 'daily_login' && b.isActive);
  const dailyBonusAmount = dailyLoginBonus ? dailyLoginBonus.tokenAmount : 25;
  
  // Find user claimed status for each bonus
  const getUserBonusForBonus = (bonusId: number) => {
    return userBonuses.find(ub => ub.bonusId === bonusId);
  };
  
  // Filter bonuses
  const filteredBonuses = bonuses.filter(bonus => {
    // Don't show daily login in the grid as it has its own card
    if (bonus.type === 'daily_login') return false;
    
    const userBonus = getUserBonusForBonus(bonus.id);
    const now = new Date();
    const startDate = new Date(bonus.startDate);
    const endDate = bonus.endDate ? new Date(bonus.endDate) : null;
    
    const isExpired = endDate && endDate < now;
    const isUpcoming = startDate > now;
    const isAvailable = bonus.isActive && startDate <= now && (!endDate || endDate > now);
    const isClaimed = userBonus && userBonus.claimed;
    
    // Check status filter
    if (filter === 'available' && (!isAvailable || isClaimed)) return false;
    if (filter === 'claimed' && !isClaimed) return false;
    if (filter === 'upcoming' && !isUpcoming) return false;
    if (filter === 'expired' && !isExpired) return false;
    
    // Check type filter
    if (typeFilter !== 'all' && bonus.type !== typeFilter) return false;
    
    return true;
  });
  
  return (
    <div className="space-y-6">
      {/* Daily Bonus Card */}
      {dailyLoginBonus && (
        <div className="w-full max-w-sm mx-auto mb-8">
          <DailyBonus
            isEligible={isDailyBonusEligible}
            tokenAmount={dailyBonusAmount}
            onClaimDailyBonus={onClaimDailyBonus}
            isClaimingBonus={isClaimingBonus}
          />
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h3 className="text-lg font-semibold">Available Bonuses</h3>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Bonus Type" />
          </SelectTrigger>
          <SelectContent>
            {bonusTypes.map(type => (
              <SelectItem key={type} value={type}>
                {getBonusTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="claimed">Claimed</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4">
          {filteredBonuses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-500">No bonuses found with current filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBonuses.map(bonus => (
                <BonusCard
                  key={bonus.id}
                  bonus={bonus}
                  userBonus={getUserBonusForBonus(bonus.id)}
                  onClaimBonus={onClaimBonus}
                  isClaimingBonus={isClaimingBonus}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}