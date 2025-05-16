import { useAuth } from "../hooks/use-auth";
import { useOnboarding } from "../hooks/use-onboarding";
import { useRef, useState } from "react";
import { User as UserIcon, LogOut, Wallet, Shield, Settings, HelpCircle, Trophy, Users, UsersRound, Award, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const { user, logoutMutation } = useAuth();
  const { startTour } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleStartTour = () => {
    setIsOpen(false);
    startTour("home" as const);
  };

  // Get initials from username
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (!user) {
    return (
      <Button variant="outline" className="rounded-full" asChild>
        <a href="/auth">
          <UserIcon className="mr-2 h-4 w-4" /> Login
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          className="relative h-8 w-8 rounded-full user-menu"
        >
          <Avatar className="h-8 w-8 border border-primary/50">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.tokens} WinTokens
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href="/profile">
              <Shield className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/tournaments">
              <Trophy className="mr-2 h-4 w-4" />
              <span>Tournaments</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/wallet">
              <Wallet className="mr-2 h-4 w-4" />
              <span>Wallet</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/social">
              <Users className="mr-2 h-4 w-4" />
              <span>Social</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/teams">
              <UsersRound className="mr-2 h-4 w-4" />
              <span>Teams</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/achievements">
              <Award className="mr-2 h-4 w-4" />
              <span>Achievements</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/bonuses">
              <Gift className="mr-2 h-4 w-4" />
              <span>Bonuses</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/profile?tab=settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </a>
          </DropdownMenuItem>
          {user.role === 'admin' && (
            <DropdownMenuItem asChild>
              <a href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </a>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleStartTour} className="tour-option">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Take Tour</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserMenuSkeleton() {
  return <Skeleton className="h-8 w-8 rounded-full" />;
}