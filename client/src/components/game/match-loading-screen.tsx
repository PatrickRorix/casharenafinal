import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GameLoadingSpinner } from "@/components/ui/game-loading-spinner";
import { GameScreenWrapper } from "@/components/game/screen-wrapper";
import { cn } from "@/lib/utils";
import { Gamepad2, Users, Trophy, ShieldAlert, Clock, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MatchLoadingScreenProps {
  gameName: string;
  matchId: string | number;
  playerCount?: number;
  maxPlayers?: number;
  waitingForPlayers?: boolean;
  matchType?: "ranked" | "casual" | "tournament";
  prize?: string | number;
  matchTime?: string;
  gameLogo?: string;
  onReady?: () => void;
  onCancel?: () => void;
  loadingSteps?: string[];
  className?: string;
  estimatedWaitTime?: number; // Estimated wait time in seconds
}

export function MatchLoadingScreen({
  gameName,
  matchId,
  playerCount = 1,
  maxPlayers = 2,
  waitingForPlayers = true,
  matchType = "casual",
  prize,
  matchTime,
  gameLogo,
  onReady,
  onCancel,
  loadingSteps = ["Connecting to server...", "Preparing match...", "Waiting for players..."],
  className,
  estimatedWaitTime = 60, // Default to 60 seconds wait time
}: MatchLoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [readyState, setReadyState] = useState<"idle" | "ready" | "error">("idle");
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "unstable" | "disconnected">("connecting");
  const [timeRemaining, setTimeRemaining] = useState(estimatedWaitTime);
  
  // Simulate progressing through loading steps
  useEffect(() => {
    if (currentStep < loadingSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        
        // If we're at the last step, update connection status
        if (currentStep === loadingSteps.length - 2) {
          setConnectionStatus("connected");
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, loadingSteps.length]);
  
  // Countdown timer for estimated wait time
  useEffect(() => {
    // Only start countdown when we're in the "waiting for players" step
    if (currentStep === loadingSteps.length - 1 && timeRemaining > 0 && playerCount < maxPlayers) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentStep, loadingSteps.length, timeRemaining, playerCount, maxPlayers]);
  
  // Format time remaining into minutes and seconds
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle ready state
  const handleReady = () => {
    setReadyState("ready");
    if (onReady) {
      onReady();
    }
  };
  
  // Match type styles
  const matchTypeStyles = {
    ranked: "bg-orange-500/20 text-orange-500 border-orange-500/50",
    casual: "bg-blue-500/20 text-blue-500 border-blue-500/50",
    tournament: "bg-purple-500/20 text-purple-500 border-purple-500/50",
  };
  
  // Connection status indicators
  const connectionIcon = {
    connecting: <Wifi className="h-4 w-4 animate-pulse text-amber-400" />,
    connected: <Wifi className="h-4 w-4 text-green-500" />,
    unstable: <Wifi className="h-4 w-4 animate-pulse text-amber-400" />,
    disconnected: <Wifi className="h-4 w-4 text-red-500" />,
  };
  
  return (
    <GameScreenWrapper
      animation="GAME_START"
      isLoading={false}
      loadingDuration={0}
      className={cn("bg-black/90", className)}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background/80 to-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 text-center"
        >
          {gameLogo ? (
            <img 
              src={gameLogo} 
              alt={gameName} 
              className="h-16 mb-4 mx-auto filter drop-shadow-glow"
            />
          ) : (
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-primary">{gameName}</h2>
          )}
          
          <p className="text-sm text-muted-foreground">Match ID: {matchId}</p>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs border",
              matchTypeStyles[matchType]
            )}>
              {matchType.toUpperCase()}
            </span>
            
            {prize && (
              <span className="px-2 py-1 rounded-full text-xs border bg-green-500/20 text-green-500 border-green-500/50 flex items-center">
                <Trophy className="h-3 w-3 mr-1" /> {prize}
              </span>
            )}
            
            {matchTime && (
              <span className="px-2 py-1 rounded-full text-xs border bg-blue-500/20 text-blue-500 border-blue-500/50 flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {matchTime}
              </span>
            )}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <GameLoadingSpinner size="lg" text={loadingSteps[currentStep]} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              <span className="text-lg font-medium">
                {playerCount}/{maxPlayers} Players
              </span>
            </div>
            
            <div className="h-6 w-px bg-border mx-4" />
            
            <div className="flex items-center">
              {connectionIcon[connectionStatus]}
              <span className="ml-2 text-sm">
                {connectionStatus === "connecting" && "Connecting..."}
                {connectionStatus === "connected" && "Connected"}
                {connectionStatus === "unstable" && "Unstable Connection"}
                {connectionStatus === "disconnected" && "Disconnected"}
              </span>
            </div>
            
            {/* Show countdown timer when waiting for players and in the last loading step */}
            {waitingForPlayers && currentStep === loadingSteps.length - 1 && playerCount < maxPlayers && (
              <>
                <div className="h-6 w-px bg-border mx-4" />
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-amber-400" />
                  <span className="text-lg font-medium text-amber-400">
                    {formatTimeRemaining()}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Countdown progress bar */}
          {waitingForPlayers && currentStep === loadingSteps.length - 1 && playerCount < maxPlayers && (
            <motion.div 
              className="w-full max-w-md mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-muted-foreground mb-2 text-center">
                Estimated time until match begins
              </p>
              <Progress 
                value={(timeRemaining / estimatedWaitTime) * 100} 
                className="h-2 bg-muted"
              />
            </motion.div>
          )}
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleReady}
              disabled={readyState === "ready" || connectionStatus !== "connected"}
              className={cn(
                "min-w-[100px]",
                readyState === "ready" && "bg-green-600 hover:bg-green-700"
              )}
            >
              {readyState === "ready" ? "Ready!" : "Ready"}
            </Button>
          </div>
        </motion.div>
      </div>
    </GameScreenWrapper>
  );
}