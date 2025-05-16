import { Button } from "@/components/ui/button";
import { X, Wallet, Trophy, Award, Gift } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}

export default function MobileMenu({ isOpen, onClose, activeSection }: MobileMenuProps) {
  const { user } = useAuth();
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 md:hidden">
      <div className="h-full w-full max-w-sm bg-[hsl(var(--surface))] shadow-lg flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-primary/30">
          <span className="text-primary text-xl font-orbitron font-bold tracking-wider">
            Cash<span className="text-white">Arena</span>
          </span>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex-1">
          <button
            onClick={() => scrollToSection('hero')}
            className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
              activeSection === 'home' ? 'text-primary' : 'text-[hsl(var(--text-tertiary))] hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('dashboard')}
            className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
              activeSection === 'dashboard' ? 'text-primary' : 'text-[hsl(var(--text-tertiary))] hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => scrollToSection('games')}
            className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
              activeSection === 'games' ? 'text-primary' : 'text-[hsl(var(--text-tertiary))] hover:text-white'
            }`}
          >
            Games
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
              activeSection === 'how-it-works' ? 'text-primary' : 'text-[hsl(var(--text-tertiary))] hover:text-white'
            }`}
          >
            How It Works
          </button>
          <Link href="/tournaments" onClick={onClose}>
            <div className="block px-3 py-2 rounded-md text-base font-medium text-[hsl(var(--text-tertiary))] hover:text-white">
              <div className="flex items-center">
                <Trophy className="mr-2 h-4 w-4 text-primary" />
                Tournaments
              </div>
            </div>
          </Link>
          
          {user && (
            <>
              <Link href="/achievements" onClick={onClose}>
                <div className="block px-3 py-2 rounded-md text-base font-medium text-[hsl(var(--text-tertiary))] hover:text-white">
                  <div className="flex items-center">
                    <Award className="mr-2 h-4 w-4 text-primary" />
                    Achievements
                  </div>
                </div>
              </Link>
              
              <Link href="/bonuses" onClick={onClose}>
                <div className="block px-3 py-2 rounded-md text-base font-medium text-[hsl(var(--text-tertiary))] hover:text-white">
                  <div className="flex items-center">
                    <Gift className="mr-2 h-4 w-4 text-primary" />
                    Bonuses
                  </div>
                </div>
              </Link>
              
              <Link href="/wallet" onClick={onClose}>
                <div className="block px-3 py-2 rounded-md text-base font-medium text-[hsl(var(--text-tertiary))] hover:text-white">
                  <div className="flex items-center">
                    <Wallet className="mr-2 h-4 w-4 text-primary" />
                    Wallet
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
        {user && (
          <div className="px-4 py-3 border-t border-primary/20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium">{user.username}</div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <span className="font-medium text-primary">{user.tokens.toLocaleString()}</span>
                  <span className="ml-1">WinTokens</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
