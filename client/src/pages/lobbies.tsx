import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, Users, Shield, Trophy, Swords, Filter, ArrowLeft } from "lucide-react";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Game, Lobby } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { CreateLobbyForm } from "@/components/lobbies/create-lobby-form";
import { LobbyCard } from "@/components/lobbies/lobby-card";
// Temporary empty state data until we have the real API
const EMPTY_LOBBIES: Lobby[] = [];

export default function LobbiesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Helper function to close dialog
  const closeDialog = () => {
    const closeButton = document.querySelector('button[aria-label="Close"]');
    if (closeButton instanceof HTMLElement) {
      closeButton.click();
    }
  };

  // Fetch all available lobbies
  const {
    data: lobbies = EMPTY_LOBBIES,
    isLoading: isLoadingLobbies,
  } = useQuery<Lobby[]>({
    queryKey: ["/api/lobbies"],
    enabled: !!user,
  });

  // Fetch available games for filtering
  const {
    data: games = [],
    isLoading: isLoadingGames,
  } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    enabled: !!user,
  });

  // Filter lobbies based on search term and filters
  const filteredLobbies = lobbies.filter((lobby) => {
    const matchesSearch = lobby.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = gameFilter === "all" || lobby.gameId.toString() === gameFilter;
    const matchesType = typeFilter === "all" || lobby.type === typeFilter;
    return matchesSearch && matchesGame && matchesType;
  });

  return (
    <div className="container mx-auto py-6">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Game Lobbies</h1>
          <p className="text-muted-foreground">
            Join or create lobbies to play with friends and others
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="mr-2 h-4 w-4" /> Create Lobby
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lobby</DialogTitle>
              <DialogDescription>
                Set up a new game lobby to play with friends or find new teammates
              </DialogDescription>
            </DialogHeader>
            <CreateLobbyForm onSuccess={() => {
              const closeButton = document.querySelector('button[aria-label="Close"]');
              if (closeButton instanceof HTMLElement) {
                closeButton.click();
              }
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Filters sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Filter className="mr-2 h-5 w-5" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="game-filter" className="text-sm font-medium">
                  Game
                </label>
                <Select
                  value={gameFilter}
                  onValueChange={setGameFilter}
                >
                  <SelectTrigger id="game-filter">
                    <SelectValue placeholder="All Games" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    {games.map((game) => (
                      <SelectItem key={game.id} value={game.id.toString()}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="type-filter" className="text-sm font-medium">
                  Lobby Type
                </label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="solo">Solo (1v1)</SelectItem>
                    <SelectItem value="team">Team (5v5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setGameFilter("all");
                    setTypeFilter("all");
                    setSearchTerm("");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Trophy className="mr-2 h-5 w-5" /> Quick Join
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full"
                onClick={() => {
                  setGameFilter("9");  // CS2 ID
                  setTypeFilter("solo");
                }}
              >
                CS2 Solo Lobbies
              </Button>
              <Button 
                className="w-full"
                onClick={() => {
                  setGameFilter("9");  // CS2 ID
                  setTypeFilter("team");
                }}
              >
                CS2 Team 5v5
              </Button>
              <Button 
                className="w-full"
                onClick={() => {
                  setGameFilter("1");  // PUBG Mobile ID
                  setTypeFilter("all");
                }}
              >
                PUBG Battle Royale
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lobbies list */}
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search lobbies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoadingLobbies ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))
            ) : filteredLobbies.length > 0 ? (
              // Lobby list
              filteredLobbies.map((lobby) => {
                const game = games.find(g => g.id === lobby.gameId);
                return (
                  <LobbyCard 
                    key={lobby.id} 
                    lobby={lobby} 
                    game={game} 
                  />
                );
              })
            ) : (
              // Empty state
              <Card className="py-8">
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="rounded-full bg-background p-3 mb-4">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Lobbies Found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {searchTerm || gameFilter !== "all" || typeFilter !== "all"
                      ? "No lobbies match your current filters. Try adjusting them or create your own lobby."
                      : "There are no active lobbies right now. Be the first to create one!"}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Create Lobby
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Lobby</DialogTitle>
                        <DialogDescription>
                          Set up a new game lobby to play with friends or find new teammates
                        </DialogDescription>
                      </DialogHeader>
                      <CreateLobbyForm onSuccess={() => {
                        const closeButton = document.querySelector('button[aria-label="Close"]');
                        if (closeButton instanceof HTMLElement) {
                          closeButton.click();
                        }
                      }} />
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}