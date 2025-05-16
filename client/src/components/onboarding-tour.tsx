import Joyride, { STATUS, CallBackProps, TooltipRenderProps, Step } from 'react-joyride';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

import { X } from 'lucide-react';

function Tooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-[hsl(var(--surface))] border border-primary/30 rounded-lg p-4 shadow-lg shadow-primary/20 max-w-md relative"
    >
      {/* Close button */}
      <button 
        {...closeProps}
        className="absolute top-2 right-2 text-[hsl(var(--text-tertiary))] hover:text-white p-1 rounded-full hover:bg-[hsl(var(--surface-light))] transition-colors"
        aria-label="Close tour"
      >
        <X size={16} />
      </button>

      {step.title && (
        <div className="text-lg font-semibold text-white mb-2 font-rajdhani pr-6">{step.title}</div>
      )}
      <div className="text-[hsl(var(--text-tertiary))] mb-4">{step.content}</div>
      
      <div className="flex justify-between items-center">
        {index > 0 && (
          <Button
            {...backProps}
            variant="ghost"
            className="text-[hsl(var(--text-tertiary))] hover:text-white"
            size="sm"
          >
            Back
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            {...closeProps}
            variant="ghost"
            className="text-[hsl(var(--text-tertiary))] hover:text-white"
            size="sm"
          >
            Skip
          </Button>
          {!isLastStep ? (
            <Button
              {...primaryProps}
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary rounded-lg transition-all"
              size="sm"
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              {...primaryProps}
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary rounded-lg transition-all"
              size="sm"
            >
              Finish <Check className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const { user } = useAuth();
  const { 
    isFirstVisit, 
    isRunning, 
    steps, 
    tourProgress, 
    incrementProgress, 
    awardToken, 
    resetTour,
    startTour,
    completeTour,
    hasCompletedTour
  } = useOnboarding();
  
  // Trigger confetti on tour completion
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  
  // Removed automatic tour start - will only start when manually triggered
  // Keep the useEffect for any future setup needs
  useEffect(() => {
    // Tour will only start when user explicitly clicks "Take a Tour" button
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;
    
    if (type === 'step:after' && action === 'next') {
      incrementProgress();
      
      // Award tokens for reaching specific milestones
      // This creates a reward experience for the user
      if (index === 2) {
        awardToken(5); // Award 5 tokens for reaching step 3
        triggerTokenConfetti();
      } else if (index === 4) {
        awardToken(10); // Award 10 tokens for reaching step 5
        triggerTokenConfetti();
      }
    } else if (status === STATUS.FINISHED) {
      // Tour completed
      awardToken(25); // Award 25 tokens for completing the entire tour
      triggerCompletionConfetti();
      setShowCompletionMessage(true);
      
      setTimeout(() => {
        setShowCompletionMessage(false);
      }, 5000);
      
      // Mark tour as completed and reset
      completeTour();
    } else if (status === STATUS.SKIPPED) {
      // Mark as completed even if skipped to prevent reappearing
      completeTour();
    } else if (type === 'error:target_not_found') {
      // Handle case where target elements aren't found (common in deployed environments)
      completeTour();
    }
  };
  
  const triggerTokenConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff41', '#ffffff', '#54febd']
    });
  };
  
  const triggerCompletionConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.6 },
      colors: ['#00ff41', '#ffffff', '#54febd']
    });
  };
  
  return (
    <>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton={false}
        run={isRunning}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: 'hsl(var(--surface))',
          },
          spotlight: {
            borderRadius: 8,
            boxShadow: '0 0 0 6px rgba(0, 255, 65, 0.3), 0 0 0 12px rgba(0, 255, 65, 0.2)'
          }
        }}
        tooltipComponent={Tooltip}
      />
      
      {showCompletionMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-[hsl(var(--surface))] border border-primary/30 rounded-lg p-4 shadow-lg shadow-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Tour Completed!</h3>
              <p className="text-[hsl(var(--text-tertiary))]">You've earned <span className="text-primary font-bold">25 WinTokens</span> for completing the tour.</p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}