import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Coins, Wallet, Menu, Trophy, Gamepad2, Award, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu, UserMenuSkeleton } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "../hooks/use-auth";

interface HeaderProps {
  toggleMobileMenu: () => void;
  activeSection: string;
}

export default function Header({ toggleMobileMenu, activeSection }: HeaderProps) {
  const { user, isLoading } = useAuth();
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--surface))] border-b border-primary/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="text-primary text-xl md:text-2xl font-orbitron font-bold tracking-wider">
                Cash<span className="text-white">Arena</span>
              </span>
            </Link>
          </div>
          
          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => scrollToSection('hero')}
              className={`transition-colors duration-200 font-medium ${
                activeSection === 'home' ? 'text-primary' : 'text-text-primary hover:text-primary'
              }`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('dashboard')} 
              className={`transition-colors duration-200 font-medium ${
                activeSection === 'dashboard' ? 'text-primary' : 'text-text-primary hover:text-primary'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => scrollToSection('games')} 
              className={`transition-colors duration-200 font-medium ${
                activeSection === 'games' ? 'text-primary' : 'text-text-primary hover:text-primary'
              }`}
            >
              Games
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className={`transition-colors duration-200 font-medium ${
                activeSection === 'how-it-works' ? 'text-primary' : 'text-text-primary hover:text-primary'
              }`}
            >
              How It Works
            </button>
          </nav>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <Skeleton className="h-8 w-32 rounded-full" />
            ) : user ? (
              <div className="hidden md:flex items-center space-x-2 bg-[hsl(var(--surface-light))] rounded-full px-3 py-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-white font-medium">{user.tokens.toLocaleString()}</span>
                <span className="text-xs text-[hsl(var(--text-tertiary))]">WinTokens</span>
              </div>
            ) : null}
            
            <Link href="/tournaments">
              <Button variant="outline" className="hidden md:flex neon-button bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-full px-4 py-1 text-sm font-medium transition-all duration-300 mr-2">
                <Trophy className="mr-1 h-4 w-4" /> Tournaments
              </Button>
            </Link>
            
            <Link href="/lobbies">
              <Button variant="outline" className="hidden md:flex neon-button bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-full px-4 py-1 text-sm font-medium transition-all duration-300 mr-2">
                <Gamepad2 className="mr-1 h-4 w-4" /> Lobbies
              </Button>
            </Link>
            
            <Link href="/achievements">
              <Button variant="outline" className="hidden md:flex neon-button bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-full px-4 py-1 text-sm font-medium transition-all duration-300 mr-2">
                <Award className="mr-1 h-4 w-4" /> Achievements
              </Button>
            </Link>
            
            <Link href="/bonuses">
              <Button variant="outline" className="hidden md:flex neon-button bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-full px-4 py-1 text-sm font-medium transition-all duration-300 mr-2">
                <Gift className="mr-1 h-4 w-4" /> Bonuses
              </Button>
            </Link>
            
            <Link href="/wallet">
              <Button variant="outline" className="neon-button bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-full px-4 py-1 text-sm font-medium transition-all duration-300">
                <Wallet className="mr-1 h-4 w-4" /> Wallet
              </Button>
            </Link>
            
            {user && (
              <div className="relative">
                <NotificationBell />
              </div>
            )}
            
            <div className="relative">
              {isLoading ? (
                <UserMenuSkeleton />
              ) : (
                <UserMenu />
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <Button 
              type="button" 
              variant="ghost" 
              onClick={toggleMobileMenu}
              className="md:hidden text-gray-400 hover:text-white"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
