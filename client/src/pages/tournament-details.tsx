import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Game, Tournament, TournamentMatch, TournamentParticipant } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import { CalendarDays, ChevronLeft, Clock, Crown, Gamepad2, Trophy, User, Users } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import { BackToDashboard } from "@/components/back-to-dashboard";

interface TournamentDetailsData {
  tournament: Tournament;
  game: Game;
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
}

interface UserInfo {
  id: number;
  username: string;
}

interface TournamentMatchData {
  match: TournamentMatch;
  player1: UserInfo | null;
  player2: UserInfo | null;
  winner: UserInfo | null;
}

export default function TournamentDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tournamentId = parseInt(id || '', 10);

  // Check if the id is a valid number
  if (isNaN(tournamentId)) {
    navigate('/tournaments');
    return null;
  }

  // Fetch tournament details
  const { 
    data, 
    isLoading,
    error
  } = useQuery<TournamentDetailsData>({
    queryKey: ['/api/tournaments', tournamentId],
  });

  // Register for tournament mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/tournaments/${tournamentId}/register`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "You have successfully registered for this tournament.",
      });
      // Refresh tournament data
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for tournament.",
        variant: "destructive",
      });
    }
  });

  // Handle registration
  const handleRegister = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to register for tournaments.",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate();
  };

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error Loading Tournament</h2>
          <p className="text-muted-foreground mt-2">{(error as Error).message || "Failed to load tournament details."}</p>
          <Button asChild className="mt-4">
            <Link to="/tournaments">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Tournaments
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !data || !data.tournament || !data.game) {
    return <TournamentDetailsSkeleton />;
  }

  const { tournament, game, participants = [], matches = [] } = data;
  const userParticipation = user ? participants.find(p => p.userId === user.id) : null;
  const isRegistered = Boolean(userParticipation);
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const hasStarted = tournament.status !== 'upcoming';
  const startDate = new Date(tournament.startDate);
  const isUpcoming = startDate > new Date();

  return (
    <div className="container mx-auto py-6">
      <BackToDashboard />
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/tournaments">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge className="capitalize">{tournament.status}</Badge>
                    <Badge variant="outline">{game.name}</Badge>
                    <Badge variant="secondary">
                      {tournament.format === 'bracket' 
                        ? 'Single Elimination' 
                        : tournament.format === 'round_robin' 
                          ? 'Round Robin' 
                          : 'Swiss Format'}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tournament.description && (
                <div className="mb-4">
                  <p className="text-muted-foreground">{tournament.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Start Date</div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays size={18} className="text-muted-foreground" />
                    <span className="font-medium">{format(startDate, 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Start Time</div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={18} className="text-muted-foreground" />
                    <span className="font-medium">{format(startDate, 'h:mm a')}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Entry Fee</div>
                  <div className="flex items-center gap-1.5">
                    <User size={18} className="text-muted-foreground" />
                    <span className="font-medium">
                      {tournament.entryFee > 0 
                        ? `${tournament.entryFee.toLocaleString()} tokens` 
                        : 'Free Entry'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Prize Pool</div>
                  <div className="flex items-center gap-1.5 text-primary">
                    <Trophy size={18} />
                    <span className="font-semibold">{tournament.prizePool.toLocaleString()} tokens</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Gamepad2 size={18} className="text-muted-foreground" />
                  <span>Game: <span className="font-medium">{game.name}</span></span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-muted-foreground" />
                  <span>
                    Participants: <span className="font-medium">{tournament.currentParticipants}/{tournament.maxParticipants}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="matches">
            <TabsList>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="matches" className="p-4 bg-card rounded-lg border mt-4">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <Crown className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No Matches Available</h3>
                  <p className="text-muted-foreground mt-1">
                    {tournament.status === 'upcoming' 
                      ? 'Matches will be available once the tournament starts' 
                      : 'No matches have been created yet'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {matches.map((match) => (
                    <div key={match.id} className="border rounded-md p-4 bg-muted/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">Round {match.round} - Match #{match.id}</h4>
                          {match.scheduledTime && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(match.scheduledTime), 'MMM d, yyyy - h:mm a')}
                            </p>
                          )}
                        </div>
                        <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>
                          {match.status === 'pending' ? 'Scheduled' : 
                          match.status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </Badge>
                      </div>
                      {match.player1Id && match.player2Id && (
                        <div className="mt-2 flex justify-around items-center text-sm">
                          <div className="flex items-center gap-1">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                              P1
                            </div>
                            <span>Player {match.player1Id}</span>
                          </div>
                          <div className="text-muted-foreground">vs</div>
                          <div className="flex items-center gap-1">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                              P2
                            </div>
                            <span>Player {match.player2Id}</span>
                          </div>
                        </div>
                      )}
                      {match.winnerId && (
                        <div className="mt-2 text-center text-sm">
                          <span className="text-green-500 font-medium">Winner: Player {match.winnerId}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="participants" className="p-4 bg-card rounded-lg border mt-4">
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No Participants Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Be the first to join this tournament
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  <div className="grid grid-cols-4 font-semibold py-2">
                    <div>Seed</div>
                    <div className="col-span-2">Player</div>
                    <div>Status</div>
                  </div>
                  <Separator />
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="grid grid-cols-4 py-2 items-center">
                      <div className="text-center">{participant.seed || index + 1}</div>
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {participant.userId.toString()[0].toUpperCase()}
                        </div>
                        <span>Player {participant.userId}</span>
                      </div>
                      <div>
                        <Badge className="capitalize">{participant.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="rules" className="p-4 bg-card rounded-lg border mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tournament Rules</h3>
                <p>
                  This tournament follows standard {tournament.format === 'bracket' 
                    ? 'single elimination bracket' 
                    : tournament.format === 'round_robin' 
                      ? 'round robin' 
                      : 'swiss format'} rules.
                </p>
                
                <h4 className="font-medium mt-4">Format</h4>
                <ul className="list-disc list-inside space-y-1">
                  {tournament.format === 'bracket' ? (
                    <>
                      <li>Single elimination bracket format</li>
                      <li>Players advance by winning their matches</li>
                      <li>One loss and you're eliminated</li>
                    </>
                  ) : tournament.format === 'round_robin' ? (
                    <>
                      <li>All players face each other once</li>
                      <li>Players earn points for each win</li>
                      <li>Final ranking determined by total points</li>
                    </>
                  ) : (
                    <>
                      <li>Swiss-system tournament format</li>
                      <li>Players matched against others with similar records</li>
                      <li>Final ranking determined by match points</li>
                    </>
                  )}
                </ul>
                
                <h4 className="font-medium mt-4">Prize Distribution</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>1st Place: 50% of prize pool</li>
                  <li>2nd Place: 30% of prize pool</li>
                  <li>3rd-4th Place: 10% of prize pool each</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isRegistered ? (
                  <div className="bg-green-500/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-600 dark:text-green-400">
                      You're Registered
                    </h3>
                    <p className="text-sm mt-1">
                      You're all set for this tournament!
                    </p>
                  </div>
                ) : isFull ? (
                  <div className="bg-yellow-500/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">
                      Tournament is Full
                    </h3>
                    <p className="text-sm mt-1">
                      This tournament has reached its maximum number of participants.
                    </p>
                  </div>
                ) : hasStarted ? (
                  <div className="bg-blue-500/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                      Tournament Has Started
                    </h3>
                    <p className="text-sm mt-1">
                      Registration is closed as the tournament is already in progress.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Entry Fee:</span>
                        <span className="font-semibold">
                          {tournament.entryFee > 0 
                            ? `${tournament.entryFee.toLocaleString()} tokens` 
                            : 'Free'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Your Balance:</span>
                        <span className="font-semibold">{user?.tokens?.toLocaleString() || 0} tokens</span>
                      </div>
                      {user && tournament.entryFee > user.tokens && (
                        <div className="bg-red-500/20 p-2 rounded text-sm text-red-600 dark:text-red-400">
                          Insufficient tokens for entry fee
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleRegister} 
                      className="w-full" 
                      disabled={registerMutation.isPending || (user && tournament.entryFee > user.tokens) || !user}
                    >
                      {registerMutation.isPending ? 'Registering...' : 'Register for Tournament'}
                    </Button>
                    
                    {!user && (
                      <p className="text-xs text-muted-foreground text-center">
                        You must be logged in to register
                      </p>
                    )}
                  </>
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Tournament Timeline</h3>
                <div className="space-y-3">
                  <div className="flex gap-2 items-start">
                    <div className="mt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div>
                      <div className="font-medium">Registration Open</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tournament.startDate), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-start">
                    <div className="mt-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                    <div>
                      <div className="font-medium">Tournament Start</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tournament.startDate), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  {tournament.endDate && (
                    <div className="flex gap-2 items-start">
                      <div className="mt-1">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      </div>
                      <div>
                        <div className="font-medium">Tournament End</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(tournament.endDate), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Prize Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary">
                    {tournament.prizePool.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-1">tokens</span>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Crown className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">1st Place</div>
                    </div>
                    <div className="font-semibold">
                      {Math.floor(tournament.prizePool * 0.5).toLocaleString()} tokens
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300/20 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">2nd Place</div>
                    </div>
                    <div className="font-semibold">
                      {Math.floor(tournament.prizePool * 0.3).toLocaleString()} tokens
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">3rd-4th Place</div>
                    </div>
                    <div className="font-semibold">
                      {Math.floor(tournament.prizePool * 0.1).toLocaleString()} tokens each
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TournamentMatchCard({ match }: { match: TournamentMatch }) {
  const [matchDetails, setMatchDetails] = useState<TournamentMatchData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const loadMatchDetails = async () => {
    if (matchDetails) return; // Already loaded
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tournament-matches/${match.id}`);
      const data = await res.json();
      setMatchDetails(data);
    } catch (error) {
      console.error('Error loading match details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="overflow-hidden" onClick={loadMatchDetails}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="mb-2">
              Round {match.round}
            </Badge>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {loading || !matchDetails ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <div className="font-medium">
                    {matchDetails.player1 ? matchDetails.player1.username : 'TBD'}
                    {matchDetails.winner?.id === matchDetails.player1?.id && (
                      <span className="ml-2 text-green-500 text-sm">(Winner)</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-muted-foreground">vs</div>
              <div className="flex items-center gap-2">
                {loading || !matchDetails ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <div className="font-medium">
                    {matchDetails.player2 ? matchDetails.player2.username : 'TBD'}
                    {matchDetails.winner?.id === matchDetails.player2?.id && (
                      <span className="ml-2 text-green-500 text-sm">(Winner)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <Badge variant={match.status === 'completed' ? 'default' : match.status === 'in_progress' ? 'secondary' : 'outline'} className="capitalize">
              {match.status}
            </Badge>
            {match.score && (
              <div className="mt-2 text-center font-mono">
                {match.score}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ParticipantRow({ participant, index }: { participant: TournamentParticipant, index: number }) {
  const [username, setUsername] = useState<string | null>(null);
  
  // Fetch username on component mount
  const fetchUsername = async () => {
    if (username) return;
    
    try {
      const res = await fetch(`/api/users/${participant.userId}`);
      const user = await res.json();
      setUsername(user.username);
    } catch (error) {
      setUsername('Unknown Player');
    }
  };
  
  // Call fetchUsername when component mounts
  fetchUsername();
  
  return (
    <div className={`grid grid-cols-4 py-2 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}>
      <div>{participant.seed || index + 1}</div>
      <div className="col-span-2 font-medium">
        {username || <Skeleton className="h-4 w-24" />}
      </div>
      <div>
        <Badge variant={participant.status === 'winner' ? 'default' : 'secondary'} className="capitalize">
          {participant.status}
        </Badge>
      </div>
    </div>
  );
}

function TournamentDetailsSkeleton() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-8 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full mb-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-40" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <Card>
              <CardContent className="p-8">
                <div className="flex justify-center">
                  <Skeleton className="h-28 w-28 rounded-full" />
                </div>
                <div className="mt-4 text-center">
                  <Skeleton className="h-6 w-48 mx-auto" />
                  <Skeleton className="h-4 w-64 mx-auto mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="mt-6">
                <Skeleton className="h-5 w-40 mb-2" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Skeleton className="h-3 w-3 rounded-full mt-1" />
                      <div className="w-full">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-24 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-40 mx-auto" />
                
                <Separator />
                
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-5 w-32 flex-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}