import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface Game {
  id: number;
  name: string;
  category: string;
  platform: string;
  players: number;
  image: string;
  isPopular: boolean;
  isNew: boolean;
}

interface GameListProps {
  games?: Game[];
  isLoading: boolean;
}

export default function GameList({ games, isLoading }: GameListProps) {
  return (
    <section id="games" className="py-16 bg-[hsl(var(--surface))/30] games-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-orbitron font-bold text-white mb-2">
            Supported <span className="text-primary">Games</span>
          </h2>
          <p className="text-[hsl(var(--text-tertiary))] max-w-2xl">
            Choose from a variety of competitive games across different platforms and genres.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <Card className="game-card bg-[hsl(var(--surface))] rounded-xl overflow-hidden border border-primary/20 cursor-pointer hover:border-primary transition-colors duration-300 hover:shadow-[0_0_15px_rgba(0,255,65,0.15)]">
                  <div className="relative">
                    <div className="w-full h-40 bg-[hsl(var(--surface-light))] flex items-center justify-center">
                      <Gamepad game={game} />
                    </div>
                    {game.isPopular && (
                      <div className="absolute top-2 right-2 bg-primary/80 text-background text-xs px-2 py-1 rounded">
                        Popular
                      </div>
                    )}
                    {game.isNew && (
                      <div className="absolute top-2 right-2 bg-primary/80 text-background text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-medium mb-1">{game.name}</h3>
                    <div className="flex items-center text-[hsl(var(--text-tertiary))] text-sm mb-3">
                      <Users className="mr-1 h-3.5 w-3.5" /> {game.players.toLocaleString()}+ players
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-xs bg-[hsl(var(--surface-light))] px-2 py-1 rounded">{game.category}</div>
                        <div className="text-xs bg-[hsl(var(--surface-light))] px-2 py-1 rounded">{game.platform}</div>
                      </div>
                      <div className="text-primary hover:text-white transition-colors p-1">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[hsl(var(--text-tertiary))]">
            No games available at the moment
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Button variant="outline" className="neon-button bg-transparent border border-primary text-primary px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 h-auto">
            View All Games <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// Custom component to display game icon based on game name
function Gamepad({ game }: { game: Game }) {
  // Map game names to appropriate SVG icons
  const getGameIcon = () => {
    switch (game.name.toLowerCase()) {
      case 'pubg mobile':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-primary" stroke="currentColor" strokeWidth="1">
            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
            <path d="M8 12H16M12 8V16" />
          </svg>
        );
      case 'call of duty: mobile':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-primary" stroke="currentColor" strokeWidth="1">
            <path d="M5 8H19M5 8C3.89543 8 3 7.10457 3 6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6C21 7.10457 20.1046 8 19 8M5 8L5 18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V8M10 12L15 15" />
          </svg>
        );
      case 'fortnite':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-primary" stroke="currentColor" strokeWidth="1">
            <path d="M3.35288 8.95043C4.00437 6.17301 6.17301 4.00437 8.95043 3.35287C10.9563 2.88237 13.0437 2.88237 15.0496 3.35287C17.827 4.00437 19.9956 6.17301 20.6471 8.95043C21.1176 10.9563 21.1176 13.0437 20.6471 15.0496C19.9956 17.827 17.827 19.9956 15.0496 20.6471C13.0437 21.1176 10.9563 21.1176 8.95044 20.6471C6.17301 19.9956 4.00437 17.827 3.35288 15.0496C2.88237 13.0437 2.88237 10.9563 3.35288 8.95043Z" />
            <path d="M12 8V16M16 12H8" />
          </svg>
        );
      case 'free fire':
        return (
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-primary" stroke="currentColor" strokeWidth="1">
            <path d="M9 6.6L12 3L15 6.6" />
            <path d="M12 3V14" />
            <path d="M15 17.4L12 21L9 17.4" />
            <path d="M12 21V10" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-primary" stroke="currentColor" strokeWidth="1">
            <path d="M6 11V13H8M18 11V13H16M8 9H14M8 9V7C8 6.44772 8.44772 6 9 6H15C15.5523 6 16 6.44772 16 7V9M8 9V15C8 15.5523 8.44772 16 9 16H15C15.5523 16 16 15.5523 16 15V9M16 9H18M4 8V16C4 16.5523 4.44772 17 5 17H6C6.55228 17 7 16.5523 7 16V8C7 7.44772 6.55228 7 6 7H5C4.44772 7 4 7.44772 4 8ZM17 8V16C17 16.5523 17.4477 17 18 17H19C19.5523 17 20 16.5523 20 16V8C20 7.44772 19.5523 7 19 7H18C17.4477 7 17 7.44772 17 8Z" />
          </svg>
        );
    }
  };

  return getGameIcon();
}
