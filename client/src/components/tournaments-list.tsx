import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tournament } from "@shared/schema";
import { CalendarDays, Trophy, User, Users } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";

interface TournamentsListProps {
  tournaments?: Tournament[];
  isLoading: boolean;
  showGameName?: boolean;
  gameNames?: Record<number, string>;
}

export default function TournamentsList({ 
  tournaments,
  isLoading,
  showGameName = false,
  gameNames = {}
}: TournamentsListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TournamentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="py-8 text-center">
        <h3 className="mb-2 text-lg font-semibold">No tournaments found</h3>
        <p className="text-muted-foreground">Check back later for upcoming tournaments.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {tournaments.map((tournament) => (
        <TournamentCard 
          key={tournament.id} 
          tournament={tournament}
          showGameName={showGameName}
          gameName={gameNames[tournament.gameId]}
        />
      ))}
    </div>
  );
}

interface TournamentCardProps {
  tournament: Tournament;
  showGameName?: boolean;
  gameName?: string;
}

function TournamentCard({ tournament, showGameName = false, gameName }: TournamentCardProps) {
  const startDate = new Date(tournament.startDate);
  const now = new Date();
  const isUpcoming = startDate > now;
  const statusColor = tournament.status === 'active' 
    ? "bg-green-500" 
    : tournament.status === 'completed' 
      ? "bg-blue-500" 
      : tournament.status === 'cancelled' 
        ? "bg-red-500" 
        : "bg-yellow-500";

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="bg-muted/50 relative pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex gap-2 items-center">
              <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
              <Badge variant={tournament.status === 'active' ? "default" : "secondary"} className="capitalize">
                {tournament.status}
              </Badge>
              {showGameName && gameName && (
                <Badge variant="outline">{gameName}</Badge>
              )}
            </div>
            <CardTitle className="mt-2">{tournament.name}</CardTitle>
          </div>
          <div className="flex gap-1 items-center text-sm text-muted-foreground">
            <Trophy size={16} className="text-primary" />
            <span className="font-semibold text-primary">{tournament.prizePool.toLocaleString()}</span>
            <span>tokens</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-muted-foreground" />
              <span>{format(startDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-muted-foreground" />
              <span>{tournament.currentParticipants}/{tournament.maxParticipants}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {tournament.format === 'bracket' 
                  ? 'Single Elimination' 
                  : tournament.format === 'round_robin' 
                    ? 'Round Robin' 
                    : 'Swiss Format'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User size={16} className="text-muted-foreground" />
              <span>
                {tournament.entryFee > 0 
                  ? `${tournament.entryFee} tokens` 
                  : 'Free Entry'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 border-t border-border/40 pt-3">
        <Link to={`/tournaments/${tournament.id}`}>
          <Button variant="default" className="w-full">
            {isUpcoming ? 'View Details' : 'View Results'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function TournamentCardSkeleton() {
  return (
    <Card>
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-7 w-48 mt-2" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 border-t border-border/40 pt-3">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}