import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchLoadingScreen } from "@/components/game/match-loading-screen";
import { GameScreenWrapper } from "@/components/game/screen-wrapper";
import { ScreenTransition, TransitionEffect } from "@/components/game/transition-effects";
import { AnimationType } from "@/components/game/screen-wrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function AnimationDemoPage() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "matchLoading" | "gamePlay" | "results">("home");
  const [animationType, setAnimationType] = useState<AnimationType>("FADE");
  const [duration, setDuration] = useState(0.4);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState("page-transitions");
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [waitTime, setWaitTime] = useState(45); // Default estimated wait time in seconds
  
  // Handle transition to different screens
  const transitionTo = (screen: typeof currentScreen) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);
    }, duration * 1000);
  };
  
  return (
    <div className="container mx-auto py-6">
      <BackToDashboard />
      
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Animation Transitions Demo</h1>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-controls">Show Controls</Label>
            <Switch
              id="show-controls"
              checked={showControlPanel}
              onCheckedChange={setShowControlPanel}
            />
          </div>
        </div>
        
        {showControlPanel && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Animation Settings</CardTitle>
              <CardDescription>
                Customize transitions between game screens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="page-transitions">Page Transitions</TabsTrigger>
                  <TabsTrigger value="animation-preview">Animation Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="page-transitions" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Animation Type</Label>
                      <Select
                        value={animationType}
                        onValueChange={(value) => setAnimationType(value as AnimationType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select animation type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FADE">Fade</SelectItem>
                          <SelectItem value="SLIDE_UP">Slide Up</SelectItem>
                          <SelectItem value="SLIDE_LEFT">Slide Left</SelectItem>
                          <SelectItem value="SCALE">Scale</SelectItem>
                          <SelectItem value="GAME_START">Game Start</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duration: {duration.toFixed(1)}s</Label>
                      <Slider
                        value={[duration]}
                        min={0.1}
                        max={1.5}
                        step={0.1}
                        onValueChange={(values) => setDuration(values[0])}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Estimated Wait Time: {waitTime} seconds</Label>
                    <Slider
                      value={[waitTime]}
                      min={10}
                      max={120}
                      step={5}
                      onValueChange={(values) => setWaitTime(values[0])}
                    />
                    <p className="text-xs text-muted-foreground">
                      This controls the countdown timer in the match loading screen
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      onClick={() => transitionTo("home")}
                      variant={currentScreen === "home" ? "default" : "outline"}
                      disabled={isTransitioning || currentScreen === "home"}
                    >
                      Home Screen
                    </Button>
                    <Button
                      onClick={() => transitionTo("matchLoading")}
                      variant={currentScreen === "matchLoading" ? "default" : "outline"}
                      disabled={isTransitioning || currentScreen === "matchLoading"}
                    >
                      Match Loading
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="animation-preview">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Preview different transition effects between game elements
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {["fade", "slideUp", "slideDown", "slideLeft", "slideRight", "zoom", "flash", "gameStart"].map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          className="h-auto py-2"
                          onClick={() => {
                            // This could trigger a demo animation
                          }}
                        >
                          {type.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        {/* Main Demo Area */}
        <div className="relative w-full h-[600px] bg-black/10 rounded-lg overflow-hidden border">
          <GameScreenWrapper animation={animationType} className="absolute inset-0">
            {currentScreen === "home" && (
              <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-background to-background/50 p-6">
                <h2 className="text-3xl font-bold mb-6 text-center">Welcome to CashArena <span className="text-primary">Transitions</span></h2>
                <p className="text-center text-muted-foreground mb-8 max-w-lg">
                  This demo showcases smooth transitions between different game screens. 
                  Customize the transition effects using the controls above.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                  <Button 
                    className="h-16 text-lg flex flex-col"
                    onClick={() => transitionTo("matchLoading")}
                    disabled={isTransitioning}
                  >
                    Start Match
                    <span className="text-xs opacity-70 mt-1">With Loading Screen</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 text-lg"
                    onClick={() => transitionTo("gamePlay")}
                    disabled={isTransitioning}
                  >
                    Game Preview
                  </Button>
                </div>
              </div>
            )}
            
            {currentScreen === "matchLoading" && (
              <MatchLoadingScreen 
                gameName="CS2"
                matchId="MM-7289"
                playerCount={8}
                maxPlayers={10}
                matchType="ranked"
                estimatedWaitTime={waitTime}
                onReady={() => {
                  // Handle player ready
                }}
                onCancel={() => transitionTo("home")}
              />
            )}
            
            {currentScreen === "gamePlay" && (
              <div className="flex flex-col items-center justify-center h-full bg-gray-800 p-6">
                <div className="absolute top-4 right-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => transitionTo("home")}
                  >
                    Exit Game
                  </Button>
                </div>
                
                <h2 className="text-2xl font-bold mb-4 text-white">Game Screen Simulation</h2>
                
                <div className="w-full max-w-xl aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                  <p className="text-white/70">Game Viewport</p>
                </div>
                
                <div className="mt-6 flex gap-4">
                  <Button>Action 1</Button>
                  <Button variant="secondary">Action 2</Button>
                </div>
              </div>
            )}
          </GameScreenWrapper>
        </div>
      </div>
    </div>
  );
}