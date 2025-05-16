import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GameLoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function GameLoadingSpinner({ 
  size = "md", 
  className, 
  text 
}: GameLoadingSpinnerProps) {
  // Size mappings
  const sizeMap = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4"
  };
  
  // Animation variants
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1.2,
        ease: "linear",
        repeat: Infinity
      }
    }
  };
  
  const glowVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [0.98, 1.02, 0.98],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity
      }
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        variants={glowVariants}
        animate="animate"
        className="relative"
      >
        <motion.div
          variants={spinnerVariants}
          animate="animate"
          className={cn(
            sizeMap[size],
            "rounded-full border-primary border-t-transparent animate-spin"
          )}
        />
        
        {/* Glow effect */}
        <div className={cn(
          sizeMap[size],
          "absolute inset-0 rounded-full border-primary opacity-30 blur-[5px]"
        )} />
      </motion.div>
      
      {text && (
        <motion.p 
          className="mt-4 text-sm text-center text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}