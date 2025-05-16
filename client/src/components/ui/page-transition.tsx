import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  // Simplified page transition component
  // We're removing the complex transition to avoid bugs
  return (
    <div className="h-full">
      {children}
    </div>
  );
}

// For use in transitioning between specific game screens
export function GameScreenTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1], // Custom easing curve for gaming feel
        opacity: { duration: 0.25 } 
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

// Special transition for game launch
export function GameLaunchTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1], // Custom spring-like ease
        }
      }}
      exit={{ 
        opacity: 0,
        scale: 1.05,
        transition: {
          duration: 0.3,
        }
      }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}