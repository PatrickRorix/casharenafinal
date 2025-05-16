import { createContext, ReactNode, useContext, useState, useCallback, useEffect } from "react";
import { Step } from "react-joyride";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { apiRequest, queryClient } from "@/lib/queryClient";

export type TourType = "home" | "wallet" | "profile" | "game";

type OnboardingContextType = {
  isFirstVisit: boolean;
  setIsFirstVisit: (value: boolean) => void;
  startTour: (tourType: TourType) => void;
  resetTour: () => void;
  steps: Step[];
  isRunning: boolean;
  tourProgress: number;
  incrementProgress: () => void;
  awardToken: (amount: number) => Promise<void>;
  hasClaimedWelcomeBonus: boolean;
  claimWelcomeBonus: () => void;
  completeTour: () => void;
  hasCompletedTour: boolean;
};

export const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isFirstVisit, setIsFirstVisit] = useLocalStorage<boolean>("isFirstVisit", true);
  const [hasClaimedWelcomeBonus, setHasClaimedWelcomeBonus] = useLocalStorage<boolean>("hasClaimedWelcomeBonus", false);
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage<boolean>("hasCompletedTour", false);
  const [isRunning, setIsRunning] = useState(false);
  const [tourType, setTourType] = useState<TourType>("home");
  const [tourProgress, setTourProgress] = useState(0);
  const { toast } = useToast();

  // Prevent tour from starting automatically if it has already been completed
  useEffect(() => {
    if (hasCompletedTour && isRunning) {
      setIsRunning(false);
    }
  }, [hasCompletedTour, isRunning]);

  // Steps for different tour types
  const steps = getTourSteps(tourType);

  const startTour = useCallback((type: TourType) => {
    if (hasCompletedTour) return; // Don't start if already completed
    setTourType(type);
    setTourProgress(0);
    setIsRunning(true);
  }, [hasCompletedTour]);

  const resetTour = useCallback(() => {
    setIsRunning(false);
    setTourProgress(0);
  }, []);
  
  const completeTour = useCallback(() => {
    setHasCompletedTour(true);
    setIsFirstVisit(false);
    setIsRunning(false);
  }, [setHasCompletedTour, setIsFirstVisit]);

  const incrementProgress = useCallback(() => {
    setTourProgress(prev => prev + 1);
  }, []);

  const awardToken = useCallback(async (amount: number) => {
    try {
      // Get the current user data
      const user = queryClient.getQueryData<any>(["/api/user"]);
      
      if (!user) return;
      
      // Create a transaction to award tokens
      await apiRequest("POST", `/api/users/${user.id}/transactions`, {
        amount,
        type: "reward",
      });
      
      // Update the local user data with new tokens
      queryClient.setQueryData(["/api/user"], {
        ...user,
        tokens: user.tokens + amount,
      });
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/transactions`] });
      
      // Show toast notification
      toast({
        title: "Tokens awarded!",
        description: `You've earned ${amount} WinTokens`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to award tokens",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [toast]);

  const claimWelcomeBonus = useCallback(() => {
    setHasClaimedWelcomeBonus(true);
  }, [setHasClaimedWelcomeBonus]);

  return (
    <OnboardingContext.Provider
      value={{
        isFirstVisit,
        setIsFirstVisit,
        startTour,
        resetTour,
        steps,
        isRunning,
        tourProgress,
        incrementProgress,
        awardToken,
        hasClaimedWelcomeBonus,
        claimWelcomeBonus,
        completeTour,
        hasCompletedTour,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

// Helper function to get tour steps based on tour type
function getTourSteps(tourType: TourType): Step[] {
  switch (tourType) {
    case "home":
      return [
        {
          target: ".user-menu",
          content: "Welcome to CashArena! This is your user menu. Click here to access your profile, wallet, and settings.",
          disableBeacon: true,
          title: "User Menu",
          placement: "bottom",
        },
        {
          target: ".wallet-info",
          content: "This is your WinTokens balance. You can earn tokens by playing matches, completing tutorials, or by depositing money.",
          title: "Your Balance",
          placement: "top",
        },
        {
          target: ".dashboard-stats",
          content: "Track your gaming performance here. See your win rate, matches played, and total earnings.",
          title: "Performance Stats",
          placement: "left",
        },
        {
          target: ".games-section",
          content: "Browse available games and tournaments. Click on any game to view details and join matches.",
          title: "Games",
          placement: "top",
        },
        {
          target: "body",
          content: "That's it! You're all set to start playing. Explore the platform and join your first match!",
          placement: "center",
          title: "Ready to Play!",
        },
      ];
    case "wallet":
      return [
        {
          target: ".wallet-section",
          content: "This is your wallet dashboard. Here you can manage your WinTokens.",
          disableBeacon: true,
          title: "Wallet Dashboard",
        },
        {
          target: ".deposit-section",
          content: "Add funds to your account here. We support multiple payment methods.",
          title: "Deposit Funds",
        },
        {
          target: ".withdraw-section",
          content: "Cash out your winnings to your preferred payment method.",
          title: "Withdraw Funds",
        },
        {
          target: ".transaction-history",
          content: "View all your past transactions, including deposits, withdrawals, and match entries.",
          title: "Transaction History",
        },
      ];
    case "profile":
      return [
        {
          target: ".profile-tabs",
          content: "Navigate between different sections of your profile using these tabs.",
          disableBeacon: true,
          title: "Profile Navigation",
        },
        {
          target: ".profile-info-section",
          content: "Update your personal information and account details here.",
          title: "Personal Information",
        },
        {
          target: ".account-stats",
          content: "View your detailed gaming statistics and performance metrics.",
          title: "Gaming Statistics",
        },
        {
          target: ".settings-section",
          content: "Customize your account settings, including notifications and privacy preferences.",
          title: "Account Settings",
        },
      ];
    case "game":
      return [
        {
          target: ".game-header",
          content: "Here's all the information about the selected game.",
          disableBeacon: true,
          title: "Game Details",
        },
        {
          target: ".match-list",
          content: "Browse upcoming matches for this game and join the ones you're interested in.",
          title: "Available Matches",
        },
        {
          target: ".join-match-button",
          content: "Click here to join a match. Make sure you have enough tokens for the entry fee.",
          title: "Join Match",
        },
        {
          target: ".leaderboard-section",
          content: "Check the top players and their achievements in this game.",
          title: "Leaderboard",
        },
      ];
    default:
      return [];
  }
}