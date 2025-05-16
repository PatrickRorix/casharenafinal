import React, { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AchievementCard } from '@/components/achievements/achievement-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

type Achievement = {
  id: number;
  achievementId: number;
  name: string;
  description: string;
  icon?: string;
  category: string;
  rarity: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  claimedReward: boolean;
  tokenReward: number;
  isHidden?: boolean;
  criteria: any;
  gameId?: number;
};

type AchievementsGridProps = {
  achievements: Achievement[];
  isLoading: boolean;
  onClaimReward: (achievementId: number) => void;
  isClaimingReward: boolean;
};

export function AchievementsGrid({
  achievements = [],
  isLoading,
  onClaimReward,
  isClaimingReward
}: AchievementsGridProps) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!achievements || achievements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-500">No achievements found</p>
      </div>
    );
  }
  
  // Get unique categories and rarities
  const uniqueCategories = achievements.map(a => a.category).filter((v, i, a) => a.indexOf(v) === i);
  const uniqueRarities = achievements.map(a => a.rarity).filter((v, i, a) => a.indexOf(v) === i);
  const categories = ['all', ...uniqueCategories];
  const rarities = ['all', ...uniqueRarities];
  
  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    // Check status filter
    if (filter === 'completed' && !achievement.completed) return false;
    if (filter === 'in-progress' && achievement.completed) return false;
    if (filter === 'unclaimed' && (!achievement.completed || achievement.claimedReward)) return false;
    
    // Check category filter
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    
    // Check rarity filter
    if (rarityFilter !== 'all' && achievement.rarity !== rarityFilter) return false;
    
    // Check search query
    if (searchQuery && !achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-1/3"
        />
        
        <div className="flex gap-2 flex-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              {rarities.map(rarity => (
                <SelectItem key={rarity} value={rarity}>
                  {rarity === 'all' ? 'All Rarities' : rarity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="unclaimed">Unclaimed Rewards</TabsTrigger>
        </TabsList>
        <TabsContent value={filter} className="mt-4">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-500">No achievements found with current filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClaimReward={onClaimReward}
                  isClaimingReward={isClaimingReward}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}