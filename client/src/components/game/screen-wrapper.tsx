import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameLoadingSpinner } from "@/components/ui/game-loading-spinner";
import { cn } from "@/lib/utils";

// Define types for animation variants
interface AnimationVariant {
  initial: { [key: string]: any };
  animate: { [key: string]: any };
  exit: { [key: string]: any };
  transition?: { [key: string]: any };
}

// ANIMATION PRESETS
const ANIMATIONS: Record<string, AnimationVariant> = {
  FADE: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  SLIDE_UP: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] }
  },
  SLIDE_LEFT: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] }
  },
  SCALE: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
    transition: { duration: 0.4 }
  },
  GAME_START: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } // Spring-like effect
      }
    },
    exit: { 
      opacity: 0,
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  }
};

export type AnimationType = keyof typeof ANIMATIONS;

interface GameScreenWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  animation?: AnimationType;
  className?: string;
  showLoadingSpinner?: boolean;
  loadingDuration?: number; // Optional minimum loading time in ms
  screenId?: string; // Used for keying AnimatePresence animations
}

export function GameScreenWrapper({
  children,
  isLoading = false,
  loadingText = "Loading...",
  animation = "FADE",
  className,
  showLoadingSpinner = true,
  loadingDuration = 0,
  screenId = "game-screen",
}: GameScreenWrapperProps) {
  const [isShowingLoader, setIsShowingLoader] = useState(isLoading);
  const [isContentReady, setIsContentReady] = useState(!isLoading);
  
  // Handle loading state changes
  useEffect(() => {
    if (isLoading) {
      setIsShowingLoader(true);
      setIsContentReady(false);
      
      // If loadingDuration is specified, ensure minimum loading time
      if (loadingDuration > 0) {
        const timer = setTimeout(() => {
          if (!isLoading) {
            setIsShowingLoader(false);
            // Short delay before showing content for smooth transition
            setTimeout(() => setIsContentReady(true), 300);
          }
        }, loadingDuration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsShowingLoader(false);
      // Short delay before showing content for smooth transition
      setTimeout(() => setIsContentReady(true), 300);
    }
  }, [isLoading, loadingDuration]);
  
  // Get animation settings
  const animationProps = ANIMATIONS[animation];
  
  // Handle the special case for GAME_START animation which has embedded transition
  const getTransitionProps = () => {
    if (animation === 'GAME_START') {
      return {}; // Transition is embedded in animate property for GAME_START
    }
    return {
      transition: animationProps.transition
    };
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <AnimatePresence mode="wait">
        {isShowingLoader && showLoadingSpinner && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50"
          >
            <GameLoadingSpinner size="lg" text={loadingText} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isContentReady && (
          <motion.div
            key={screenId}
            initial={animationProps.initial as any}
            animate={animationProps.animate as any}
            exit={animationProps.exit as any}
            transition={animation !== 'GAME_START' ? animationProps.transition as any : undefined}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}