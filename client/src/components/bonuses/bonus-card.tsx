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
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Coins, CalendarDays, Clock, Gift } from "lucide-react";
import { formatDistance, format } from 'date-fns';

type BonusCardProps = {
  bonus: {
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
  userBonus?: {
    id: number;
    userId: number;
    bonusId: number;
    claimed: boolean;
    claimedAt: string | null;
  };
  onClaimBonus: (bonusId: number) => void;
  isClaimingBonus: boolean;
};

export function BonusCard({ 
  bonus, 
  userBonus,
  onClaimBonus,
  isClaimingBonus
}: BonusCardProps) {
  const {
    id,
    name,
    description,
    tokenAmount,
    type,
    startDate,
    endDate,
    isActive
  } = bonus;
  
  const isClaimed = userBonus && userBonus.claimed;
  const startDateObj = new Date(startDate);
  const endDateObj = endDate ? new Date(endDate) : null;
  const now = new Date();
  
  const isAvailable = isActive && startDateObj <= now && (!endDateObj || endDateObj > now);
  const isExpired = endDateObj && endDateObj < now;
  const isUpcoming = startDateObj > now;
  
  const getTimeframe = () => {
    if (isExpired) {
      return `Expired ${formatDistance(endDateObj!, now, { addSuffix: true })}`;
    } else if (isUpcoming) {
      return `Available ${formatDistance(startDateObj, now, { addSuffix: true })}`;
    } else if (endDateObj) {
      return `Expires ${formatDistance(endDateObj, now, { addSuffix: true })}`;
    } else {
      return 'Permanent bonus';
    }
  };
  
  const handleClaimBonus = () => {
    onClaimBonus(id);
  };
  
  const getBonusTypeLabel = (type: string) => {
    switch (type) {
      case 'daily_login':
        return 'Daily Login';
      case 'first_win':
        return 'First Win';
      case 'weekend':
        return 'Weekend Special';
      case 'seasonal':
        return 'Seasonal';
      case 'referral':
        return 'Referral';
      default:
        return type.replace('_', ' ');
    }
  };
  
  return (
    <Card className={`overflow-hidden border-2 transition-all ${
      isClaimed ? 'border-green-500' :
      isExpired ? 'border-gray-700 opacity-70' :
      isUpcoming ? 'border-blue-500' :
      'border-primary'
    }`}>
      <div className={`h-2 w-full ${
        isClaimed ? 'bg-green-500' :
        isExpired ? 'bg-gray-500' :
        isUpcoming ? 'bg-blue-500' :
        'bg-primary'
      }`}></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {name}
            </CardTitle>
            <CardDescription className="text-sm mt-1">{description}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="capitalize">
                  {getBonusTypeLabel(type)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bonus type: {getBonusTypeLabel(type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="flex items-center gap-1">
            <Coins size={16} className="text-yellow-500" />
            Reward Amount
          </span>
          <span className="font-medium">{tokenAmount} WinTokens</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <Clock size={16} className="text-blue-500" />
            Status
          </span>
          <span className="font-medium">
            {isClaimed ? 'Claimed' : isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : 'Available'}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="flex items-center gap-1">
            <CalendarDays size={16} className="text-gray-500" />
            Timeframe
          </span>
          <span className="text-xs">{getTimeframe()}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {isAvailable && !isClaimed && (
          <Button 
            className="w-full" 
            onClick={handleClaimBonus}
            disabled={isClaimingBonus || !isActive}
          >
            <Gift size={16} className="mr-2" />
            Claim Bonus
          </Button>
        )}
        {isClaimed && (
          <div className="text-center w-full text-sm text-green-500">
            Claimed on {format(new Date(userBonus!.claimedAt!), 'MMM d, yyyy')}
          </div>
        )}
        {isUpcoming && (
          <div className="text-center w-full text-sm text-blue-500">
            Available from {format(startDateObj, 'MMM d, yyyy')}
          </div>
        )}
        {isExpired && (
          <div className="text-center w-full text-sm text-gray-500">
            Expired on {format(endDateObj!, 'MMM d, yyyy')}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}