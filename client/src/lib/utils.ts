import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Tournament } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTournamentsByStatus(tournaments: Tournament[]) {
  const now = new Date();
  
  return tournaments.reduce((acc, tournament) => {
    const startDate = new Date(tournament.startDate);
    const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
    
    // Explicit status check first
    if (tournament.status === 'upcoming') {
      acc.upcoming.push(tournament);
    }
    else if (tournament.status === 'active') {
      acc.active.push(tournament);
    }
    else if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      acc.completed.push(tournament);
    }
    // Fall back to date-based logic if status isn't explicitly set
    else if (startDate > now) {
      acc.upcoming.push(tournament);
    }
    else if (!endDate || endDate > now) {
      acc.active.push(tournament);
    }
    else {
      acc.completed.push(tournament);
    }
    return acc;
  }, {
    upcoming: [] as Tournament[],
    active: [] as Tournament[],
    completed: [] as Tournament[]
  });
}
