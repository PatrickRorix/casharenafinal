import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Game, Tournament } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { getTournamentsByStatus } from "../lib/utils";
import TournamentsList from "@/components/tournaments-list";
import { CalendarPlus, Trophy } from "lucide-react";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { CreateTournamentModal } from "@/components/create-tournament-modal";
import { useAuth } from "@/hooks/use-auth";

export default function TournamentsPage() {
  const { user } = useAuth();
  
  // Fetch all tournaments
  const { 
    data: tournaments, 
    isLoading: isLoadingTournaments 
  } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  // Fetch all games to show game names
  const { 
    data: games, 
    isLoading: isLoadingGames 
  } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  // Create a map of game IDs to game names
  const gameNames: Record<number, string> = {};
  if (games) {
    games.forEach(game => {
      gameNames[game.id] = game.name;
    });
  }

  // Split tournaments by status
  const { upcoming, active, completed } = getTournamentsByStatus(tournaments || []);

  const isLoading = isLoadingTournaments || isLoadingGames;

  return (
    <div className="container mx-auto py-6">
      <BackToDashboard />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground mt-1">
            Compete with other players and win prizes!
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          {games && games.length > 0 && user && (
            <CreateTournamentModal games={games}>
              <Button className="flex items-center gap-2">
                <CalendarPlus size={18} />
                <span>Create Tournament</span>
              </Button>
            </CreateTournamentModal>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      <div className="space-y-8">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="upcoming" className="relative">
              Upcoming
              {!isLoading && upcoming.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="relative">
              Active
              {!isLoading && active.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {active.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 rounded-lg shadow-sm mb-8">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/20 p-3">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Join Upcoming Tournaments</h3>
                  <p className="text-muted-foreground">
                    Register for tournaments, compete against other players and win WinTokens!
                  </p>
                </div>
              </div>
            </div>
            <TournamentsList 
              tournaments={upcoming} 
              isLoading={isLoading}
              showGameName={true}
              gameNames={gameNames}
            />
          </TabsContent>
          
          <TabsContent value="active" className="space-y-6">
            <div className="bg-gradient-to-r from-green-500/20 to-transparent p-6 rounded-lg shadow-sm mb-8">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-green-500/20 p-3">
                  <Trophy className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Live Tournaments</h3>
                  <p className="text-muted-foreground">
                    Currently active tournaments. Check your matches and track your progress!
                  </p>
                </div>
              </div>
            </div>
            <TournamentsList 
              tournaments={active} 
              isLoading={isLoading}
              showGameName={true}
              gameNames={gameNames}
            />
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-6">
            <TournamentsList 
              tournaments={completed} 
              isLoading={isLoading}
              showGameName={true}
              gameNames={gameNames}
            />
          </TabsContent>
          
          <TabsContent value="all" className="space-y-6">
            <TournamentsList 
              tournaments={tournaments} 
              isLoading={isLoading}
              showGameName={true}
              gameNames={gameNames}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}