import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, CheckCircle, Gift, LockIcon, Trophy } from "lucide-react";

type AchievementCardProps = {
  achievement: {
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
  };
  onClaimReward: (achievementId: number) => void;
  isClaimingReward: boolean;
};

export function AchievementCard({ 
  achievement, 
  onClaimReward,
  isClaimingReward
}: AchievementCardProps) {
  const {
    achievementId,
    name,
    description,
    category,
    rarity,
    progress,
    completed,
    claimedReward,
    tokenReward,
    isHidden,
    criteria
  } = achievement;
  
  const progressPercentage = criteria?.target 
    ? Math.min(100, Math.round((progress / criteria.target) * 100)) 
    : (completed ? 100 : 0);
  
  const rarityColors = {
    common: "bg-gray-500",
    uncommon: "bg-green-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-orange-500"
  };
  
  const rarityColor = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  
  const handleClaimReward = () => {
    onClaimReward(achievementId);
  };
  
  return (
    <Card className={`overflow-hidden border-2 transition-all ${completed ? 'border-green-500' : isHidden ? 'border-gray-700 opacity-70' : 'border-gray-700'}`}>
      <div className={`h-2 w-full ${rarityColor}`}></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isHidden && !completed ? <LockIcon size={16} /> : null}
              {name}
              {completed && <CheckCircle size={16} className="text-green-500" />}
            </CardTitle>
            <CardDescription className="text-sm mt-1">{description}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`${rarityColor} text-white capitalize`}
                >
                  {rarity}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Achievement rarity: {rarity}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge variant="outline" className="w-fit mt-1">
          {category}
        </Badge>
      </CardHeader>
      <CardContent className="pb-2">
        {!isHidden || completed ? (
          <>
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              {criteria?.target ? (
                <span>
                  {progress} / {criteria.target}
                </span>
              ) : (
                <span>{completed ? 'Completed' : 'In progress'}</span>
              )}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </>
        ) : (
          <div className="text-center text-sm text-gray-400 my-2">
            Hidden achievement - continue playing to discover
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full">
          {tokenReward > 0 && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="flex items-center gap-1">
                <Trophy size={16} className="text-yellow-500" />
                Reward
              </span>
              <span>{tokenReward} WinTokens</span>
            </div>
          )}
          {completed && tokenReward > 0 && !claimedReward && (
            <Button 
              className="w-full" 
              size="sm" 
              onClick={handleClaimReward}
              disabled={isClaimingReward}
            >
              <Gift size={16} className="mr-2" />
              Claim Reward
            </Button>
          )}
          {completed && claimedReward && (
            <div className="text-center text-sm text-green-500">
              Reward claimed
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}