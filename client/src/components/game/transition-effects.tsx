import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TransitionType = 
  | "fade" 
  | "slideUp" 
  | "slideDown" 
  | "slideLeft" 
  | "slideRight" 
  | "zoom" 
  | "flash"
  | "gameStart";

interface TransitionEffectProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  className?: string;
  onAnimationComplete?: () => void;
}

export function TransitionEffect({
  children,
  type = "fade",
  duration = 0.3,
  delay = 0,
  className,
  onAnimationComplete,
}: TransitionEffectProps) {
  // Configure variants based on transition type
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    slideDown: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
    },
    slideLeft: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 },
    },
    slideRight: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 },
    },
    zoom: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.1 },
    },
    flash: {
      initial: { opacity: 0, filter: "brightness(2)" },
      animate: { opacity: 1, filter: "brightness(1)" },
      exit: { opacity: 0, filter: "brightness(2)" },
    },
    gameStart: {
      initial: { opacity: 0, scale: 0.95, y: 20 },
      animate: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: {
          scale: { 
            type: "spring",
            damping: 12,
            stiffness: 100
          },
          opacity: { duration: duration * 0.8 },
          y: { 
            type: "spring",
            damping: 15,
            stiffness: 80 
          }
        } 
      },
      exit: { 
        opacity: 0,
        scale: 1.03,
        transition: { duration: duration * 0.7 } 
      },
    },
  };

  return (
    <motion.div
      variants={variants[type]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Custom easing
      }}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  visible?: boolean;
  className?: string;
}

// Component for handling transitions between game screens
export function ScreenTransition({
  children,
  type = "fade",
  duration = 0.4,
  visible = true,
  className,
}: ScreenTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <TransitionEffect 
          type={type} 
          duration={duration} 
          className={className}
        >
          {children}
        </TransitionEffect>
      )}
    </AnimatePresence>
  );
}

// Specialized game overlay transitions
export function GameOverlayTransition({
  children,
  isVisible,
  className,
}: {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "absolute inset-0 backdrop-blur-sm bg-black/30 z-30 flex items-center justify-center",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: 0.1,
              type: "spring",
              damping: 15 
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}