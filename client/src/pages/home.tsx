import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import DashboardSection from "@/components/dashboard-section";
import HowItWorks from "@/components/how-it-works";
import GameList from "@/components/game-list";
import Footer from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import MobileMenu from "@/components/mobile-menu";
import { useAuth } from "../hooks/use-auth";
import { Game, Match, Stats, Transaction } from "@shared/schema";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // User from auth context
  const { user, isLoading: isUserLoading } = useAuth();

  // Fetch games
  const { data: games, isLoading: isGamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  // Fetch matches
  const { data: matches, isLoading: isMatchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  // Fetch user stats if we have a user
  const { data: userStats, isLoading: isStatsLoading } = useQuery<Stats>({
    queryKey: [
      `/api/users/${user?.id}/stats`,
    ],
    enabled: !!user?.id,
  });

  // Fetch user transactions if we have a user
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: [
      `/api/users/${user?.id}/transactions`,
    ],
    enabled: !!user?.id,
  });

  // Track scroll position for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      const sections = [
        { id: "home", element: document.getElementById("hero") },
        { id: "dashboard", element: document.getElementById("dashboard") },
        { id: "how-it-works", element: document.getElementById("how-it-works") },
        { id: "games", element: document.getElementById("games") }
      ];
      
      for (const section of sections.reverse()) {
        if (section.element && scrollPosition >= section.element.offsetTop) {
          setActiveSection(section.id);
          break;
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Header 
        toggleMobileMenu={toggleMobileMenu}
        activeSection={activeSection}
      />
      
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        activeSection={activeSection}
      />
      
      <main className="flex-grow">
        <HeroSection />
        
        <DashboardSection 
          currentUser={user}
          userStats={userStats}
          transactions={transactions}
          matches={matches}
          isUserLoading={isUserLoading}
          isStatsLoading={isStatsLoading} 
          isTransactionsLoading={isTransactionsLoading}
          isMatchesLoading={isMatchesLoading}
        />
        
        <HowItWorks />
        
        <GameList 
          games={games}
          isLoading={isGamesLoading}
        />
      </main>
      
      <Footer />
    </div>
  );
}
