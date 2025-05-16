import React from "react";
import { Team } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, ChevronRight } from "lucide-react";

// Extended Team type to include ranking and wins for UI display
interface TeamWithStats extends Team {
  ranking?: number;
  wins?: number;
}

interface TeamCardProps {
  team: TeamWithStats;
  role?: string; // Current user's role in the team (if applicable)
  memberCount?: number;
  onClick?: () => void;
}

export function TeamCard({ team, role, memberCount, onClick }: TeamCardProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/teams/${team.id}`);
    }
  };

  // Determine background style based on team rank or achievements
  const getBadgeColor = () => {
    const ranking = (team as TeamWithStats)?.ranking;
    if (ranking === 1) return "bg-yellow-500";
    if (ranking && ranking <= 3) return "bg-indigo-600";
    if (ranking && ranking <= 10) return "bg-emerald-600";
    return "bg-slate-600";
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={handleClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-heading">{team.name}</CardTitle>
          {(team as TeamWithStats)?.ranking && (
            <Badge className={getBadgeColor()}>
              Rank #{(team as TeamWithStats)?.ranking}
            </Badge>
          )}
        </div>
        {role && (
          <Badge variant="outline" className="mt-1 text-xs">
            {role}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground text-sm truncate">{team.description}</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-sm">
            <Users size={16} className="text-muted-foreground" />
            <span>{memberCount || "?"} members</span>
          </div>
          {((team as TeamWithStats)?.wins ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Trophy size={16} className="text-yellow-500" />
              <span>
                {(team as TeamWithStats)?.wins} 
                {((team as TeamWithStats)?.wins ?? 0) === 1 ? " win" : " wins"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-auto gap-1"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teams/${team.id}`);
          }}
        >
          View Team <ChevronRight size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}