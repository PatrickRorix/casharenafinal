import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, ClockIcon, CheckCircle } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

type DailyBonusProps = {
  isEligible: boolean;
  tokenAmount: number;
  onClaimDailyBonus: () => void;
  isClaimingBonus: boolean;
};

export function DailyBonus({
  isEligible,
  tokenAmount = 25,
  onClaimDailyBonus,
  isClaimingBonus
}: DailyBonusProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary">
      <div className="h-2 w-full bg-primary"></div>
      <CardHeader className="pb-2 text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          Daily Login Bonus
        </CardTitle>
        <CardDescription>
          Login each day to claim your bonus tokens!
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        {isEligible ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{tokenAmount}</div>
            <div className="text-sm text-gray-500 mb-4">WinTokens Available</div>
            <Gift className="w-16 h-16 text-primary mx-auto animate-pulse" />
          </div>
        ) : (
          <div className="text-center">
            <div className="text-xl font-bold text-gray-500 mb-2">Already Claimed</div>
            <div className="text-sm text-gray-500 mb-4">Come back tomorrow for more tokens!</div>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onClaimDailyBonus}
          disabled={!isEligible || isClaimingBonus}
        >
          {isEligible ? (
            <>
              <Gift className="w-4 h-4 mr-2" />
              Claim Daily Bonus
            </>
          ) : (
            <>
              <ClockIcon className="w-4 h-4 mr-2" />
              Come Back Tomorrow
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}