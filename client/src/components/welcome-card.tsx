import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X } from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";

export function WelcomeCard() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const { 
    hasClaimedWelcomeBonus, 
    claimWelcomeBonus, 
    awardToken,
    startTour
  } = useOnboarding();

  useEffect(() => {
    // Show welcome card after a short delay if user is logged in and hasn't claimed welcome bonus
    if (user && !hasClaimedWelcomeBonus) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, hasClaimedWelcomeBonus]);

  const handleClaimBonus = () => {
    // Award 50 tokens as welcome bonus
    awardToken(50);
    
    // Trigger confetti celebration
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.7 },
      colors: ['#00ff41', '#ffffff', '#54febd']
    });
    
    // Mark welcome bonus as claimed
    claimWelcomeBonus();
    
    // Hide the card
    setTimeout(() => {
      setIsVisible(false);
    }, 1500);
  };

  const handleStartTour = () => {
    // Close welcome card
    setIsVisible(false);
    
    // Start the home tour
    startTour("home" as const);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !user || hasClaimedWelcomeBonus) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-8 right-8 z-50 max-w-md"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <Card className="bg-[hsl(var(--surface))] border border-primary/30 overflow-hidden shadow-lg shadow-primary/20">
            <CardContent className="p-0">
              <div className="relative">
                <button 
                  onClick={handleClose}
                  className="absolute top-2 right-2 text-white/60 hover:text-white bg-black/20 p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="pt-6 px-6 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-primary/20 p-2 rounded-full">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Welcome to CashArena!</h3>
                  </div>
                  
                  <p className="text-[hsl(var(--text-tertiary))] mb-4">
                    Ready to start winning? Claim your welcome bonus and take a quick tour to learn how everything works.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleClaimBonus}
                      className="neon-button bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-lg font-medium transition-all duration-300 h-auto"
                    >
                      <Gift className="mr-2 h-4 w-4" /> Claim 50 WinTokens
                    </Button>
                    
                    <Button
                      onClick={handleStartTour}
                      variant="outline"
                      className="bg-[hsl(var(--surface-light))/50] hover:bg-[hsl(var(--surface-light))] border-[hsl(var(--surface-light))] text-white rounded-lg h-auto"
                    >
                      Take a Tour
                    </Button>
                  </div>
                </div>
                
                <div className="p-3 bg-[hsl(var(--surface-light))/50] text-xs text-[hsl(var(--text-tertiary))] text-center">
                  You can start a tour anytime from your user menu
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}