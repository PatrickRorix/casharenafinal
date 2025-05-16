import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Game, Match } from "@shared/schema";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { getQueryFn } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarClock,
  Users,
  Trophy,
  ChevronLeft,
  Gamepad2,
  CircleAlert,
  Clock,
  LayoutGrid,
  Info,
  Star,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

type GameDetailsResponse = {
  game: Game;
  matches: Match[];
};

export default function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const {
    data,
    isLoading,
    error,
  } = useQuery<GameDetailsResponse, Error>({
    queryKey: ["/api/games", id],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return <GameDetailsPageSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <CircleAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-4">
          Error Loading Game Details
        </h1>
        <p className="text-muted-foreground mb-6">
          {error?.message || "Unable to load this game. Please try again later."}
        </p>
        <Button asChild>
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  // Create a properly typed default game object that matches the Game type from schema
  const defaultGame: Game = {
    id: 0,
    name: "Game",
    category: "Unknown",
    platform: "Unknown",
    image: "",
    players: 0,
    isPopular: false,
    isNew: false
  };
  
  const { game = defaultGame, matches = [] } = data || {};

  // Format schedule dates
  const formattedMatches = matches.map(match => ({
    ...match,
    formattedSchedule: new Date(match.schedule).toLocaleString(),
    startingSoon: new Date(match.schedule).getTime() - new Date().getTime() < 3600000, // less than 1 hour
    joinable: match.currentPlayers < match.maxPlayers
  }));

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <BackToDashboard />
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
        </Link>
      </Button>

      {/* Hero Section */}
      <div className="bg-[hsl(var(--surface))] rounded-xl p-6 md:p-8 mb-8 shadow-lg border border-primary/30">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Game Image */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="aspect-square rounded-xl bg-[hsl(var(--surface-light))] relative overflow-hidden border border-primary/30 flex items-center justify-center">
              {game.image ? (
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Gamepad2 className="h-24 w-24 text-primary/40" />
              )}
              {game.isNew && (
                <Badge className="absolute top-3 right-3 bg-blue-500">New</Badge>
              )}
              {game.isPopular && (
                <Badge className="absolute top-12 right-3 bg-orange-500">Popular</Badge>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="outline" className="text-xs font-normal">
                {game.category}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                {game.platform}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                <Users className="mr-1 h-3 w-3" /> {game.players} Players
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">{game.name}</h1>
            
            <p className="text-muted-foreground mb-6">
              Join thrilling matches in {game.name} to compete with players from around the world. 
              Showcase your skills, climb the leaderboards, and win exciting rewards!
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[hsl(var(--surface-light))] rounded-lg p-3 border border-primary/20">
                <div className="flex items-center mb-1">
                  <Trophy className="h-4 w-4 text-primary mr-2" />
                  <h3 className="text-sm font-medium">Prize Pool</h3>
                </div>
                <p className="text-2xl font-semibold">
                  {matches.reduce((sum, match) => sum + match.prize, 0).toLocaleString()} WinTokens
                </p>
              </div>
              
              <div className="bg-[hsl(var(--surface-light))] rounded-lg p-3 border border-primary/20">
                <div className="flex items-center mb-1">
                  <LayoutGrid className="h-4 w-4 text-primary mr-2" />
                  <h3 className="text-sm font-medium">Active Matches</h3>
                </div>
                <p className="text-2xl font-semibold">{matches.length}</p>
              </div>
              
              <div className="bg-[hsl(var(--surface-light))] rounded-lg p-3 border border-primary/20">
                <div className="flex items-center mb-1">
                  <Users className="h-4 w-4 text-primary mr-2" />
                  <h3 className="text-sm font-medium">Players</h3>
                </div>
                <p className="text-2xl font-semibold">
                  {matches.reduce((sum, match) => sum + match.currentPlayers, 0)}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-auto">
              <Button className="bg-primary text-background h-auto py-2 px-6">
                <Gamepad2 className="mr-2 h-5 w-5" /> Play Now
              </Button>
              <Button variant="outline" className="h-auto py-2 px-6">
                <Info className="mr-2 h-5 w-5" /> Game Rules
              </Button>
              <Button variant="outline" className="h-auto py-2 px-6">
                <Star className="mr-2 h-5 w-5" /> Leaderboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Match List Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <CalendarClock className="mr-2 h-6 w-6 text-primary" /> 
          Upcoming Matches
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedMatches.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-[hsl(var(--surface))] rounded-xl border border-primary/30">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium mb-2">No Matches Scheduled</h3>
              <p className="text-muted-foreground mb-4">
                There are currently no matches scheduled for this game. Check back later!
              </p>
            </div>
          ) : (
            formattedMatches.map((match) => (
              <Card key={match.id} className={`border ${match.startingSoon ? 'border-amber-500' : 'border-primary/30'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{match.name}</CardTitle>
                    {match.startingSoon && (
                      <Badge className="bg-amber-500">Starting Soon</Badge>
                    )}
                  </div>
                  <CardDescription>
                    <div className="flex items-center">
                      <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                      {match.formattedSchedule}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Prize Pool</div>
                      <div className="text-lg font-semibold text-primary">
                        {match.prize.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">WinTokens</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Players</div>
                      <div className="text-lg font-semibold">
                        {match.currentPlayers} / {match.maxPlayers}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${!match.joinable || !user ? 'bg-muted text-muted-foreground' : 'bg-primary'}`}
                    disabled={!match.joinable || !user}
                  >
                    {match.joinable ? (
                      user ? "Join Match" : "Login to Join"
                    ) : (
                      "Match Full"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Game Description Section */}
      <div className="bg-[hsl(var(--surface))] rounded-xl p-6 md:p-8 mb-12 border border-primary/30">
        <h2 className="text-2xl font-bold mb-4">About {game.name}</h2>
        <p className="text-muted-foreground mb-6">
          {game.name} is a fast-paced competitive game where strategy and skill determine the winner. 
          Players from around the world compete in various match formats to climb the leaderboards 
          and win rewards.
        </p>
        
        <h3 className="text-xl font-bold mb-3">Game Features</h3>
        <ul className="list-disc list-inside text-muted-foreground mb-6 space-y-2 pl-4">
          <li>Competitive multiplayer gameplay with real-time challenges</li>
          <li>Regular tournaments with increasing prize pools</li>
          <li>Rank system to match you with players of similar skill level</li>
          <li>Detailed statistics to track your performance</li>
          <li>Customization options to personalize your experience</li>
        </ul>
        
        <h3 className="text-xl font-bold mb-3">How to Play</h3>
        <ol className="list-decimal list-inside text-muted-foreground pl-4 space-y-2">
          <li>Join a match from the available list above</li>
          <li>Compete against other players according to the game rules</li>
          <li>Winners receive WinTokens based on their performance</li>
          <li>Track your progress on the leaderboard and improve your skills</li>
        </ol>
      </div>
    </div>
  );
}

function GameDetailsPageSkeleton() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Skeleton className="h-10 w-32 mb-6" />

      <div className="bg-[hsl(var(--surface))] rounded-xl p-6 md:p-8 mb-8 shadow-lg border border-primary/30">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 lg:w-1/4">
            <Skeleton className="aspect-square rounded-xl" />
          </div>

          <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            
            <Skeleton className="h-10 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            
            <div className="flex flex-wrap gap-4 mt-auto">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <Skeleton className="h-8 w-48 mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="bg-[hsl(var(--surface))] rounded-xl p-6 md:p-8 mb-12 border border-primary/30">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5 mb-6" />
        
        <Skeleton className="h-6 w-40 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-4 w-full mb-2" />
        ))}
        
        <Skeleton className="h-6 w-40 mb-3 mt-6" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-4 w-full mb-2" />
        ))}
      </div>
    </div>
  );
}