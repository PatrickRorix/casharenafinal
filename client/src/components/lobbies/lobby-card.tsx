import { Link } from "wouter";
import { Shield, Users, Swords } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lobby, Game } from "@shared/schema";

interface LobbyCardProps {
  lobby: Lobby;
  game?: Game;
  compact?: boolean;
}

export function LobbyCard({ lobby, game, compact = false }: LobbyCardProps) {
  // Status colors
  const statusColor = 
    lobby.status === "open" 
      ? "bg-green-500" 
      : lobby.status === "in_progress" 
        ? "bg-amber-500" 
        : "bg-neutral-500";
  
  // Format created at time
  const createdAt = new Date(lobby.createdAt);
  const timeAgo = () => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Card className={`overflow-hidden ${compact ? 'h-full' : ''}`}>
      <div className={`h-1 ${statusColor}`} />
      <CardHeader className={compact ? "p-3 pb-2" : "pb-2"}>
        <div className="flex justify-between items-start">
          <CardTitle className={`flex items-start gap-2 ${compact ? 'text-base' : ''}`}>
            {lobby.name}
            {lobby.password && (
              <Shield className="h-4 w-4 text-amber-500" />
            )}
          </CardTitle>
          <Badge variant={lobby.type === 'solo' ? 'outline' : 'default'}>
            {lobby.type === 'solo' ? '1v1' : 'Team 5v5'}
          </Badge>
        </div>
        <CardDescription>
          {game?.name || 'Unknown Game'} • {compact ? timeAgo() : createdAt.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? "p-3 pb-2" : "pb-2"}>
        <div className="flex justify-between text-sm">
          <span className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            {lobby.currentPlayers} / {lobby.maxPlayers} players
          </span>
          <span className="flex items-center">
            <Swords className="mr-2 h-4 w-4" />
            {lobby.entryFee > 0 
              ? `${lobby.entryFee} WinTokens entry` 
              : 'Free entry'}
          </span>
        </div>
      </CardContent>
      <CardFooter className={compact ? "p-3" : ""}>
        <Button 
          asChild
          className="bg-primary hover:bg-primary/90 text-white"
          disabled={lobby.status !== "open" || lobby.currentPlayers >= lobby.maxPlayers}
        >
          <Link to={`/lobbies/${lobby.id}`}>
            {lobby.status !== "open" 
              ? "Lobby Closed" 
              : lobby.currentPlayers >= lobby.maxPlayers 
                ? "Lobby Full" 
                : "Join Lobby"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}