import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { OnboardingProvider } from "./hooks/use-onboarding";
import { NotificationsProvider } from "./hooks/use-notifications";
import { ProtectedRoute } from "./lib/protected-route";
import { PageTransition } from "@/components/ui/page-transition";
import { OnboardingTour } from "@/components/onboarding-tour";
import { WelcomeCard } from "@/components/welcome-card";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import GameDetailsPage from "@/pages/game-details";
import WalletPage from "@/pages/wallet";
import ProfilePage from "@/pages/profile";
import TournamentsPage from "@/pages/tournaments";
import TournamentDetailsPage from "@/pages/tournament-details";
import NotificationTestPage from "@/pages/notification-test";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminSetupPage from "@/pages/admin-setup";
import SocialPage from "@/pages/social";
import TeamsPage from "@/pages/teams";
import TeamDetailsPage from "@/pages/team-details";
import LobbiesPage from "@/pages/lobbies";
import LobbyDetailsPage from "@/pages/lobby-details";
import AnimationDemoPage from "@/pages/animation-demo";
import AchievementsPage from "@/pages/achievements";
import BonusesPage from "@/pages/bonuses";

function Router() {
  return (
    <PageTransition>
      <Switch>
        <ProtectedRoute path="/" component={Home} />
        <ProtectedRoute path="/wallet" component={WalletPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/games/:id" component={GameDetailsPage} />
        <Route path="/tournaments" component={TournamentsPage} />
        <Route path="/tournaments/:id" component={TournamentDetailsPage} />
        <ProtectedRoute path="/lobbies" component={LobbiesPage} />
        <ProtectedRoute path="/lobbies/:id" component={LobbyDetailsPage} />
        <ProtectedRoute path="/notification-test" component={NotificationTestPage} />
        <ProtectedRoute path="/admin" component={AdminDashboardPage} />
        <Route path="/admin-setup" component={AdminSetupPage} />
        <ProtectedRoute path="/social" component={SocialPage} />
        <ProtectedRoute path="/teams" component={TeamsPage} />
        <ProtectedRoute path="/teams/:id" component={TeamDetailsPage} />
        <ProtectedRoute path="/achievements" component={AchievementsPage} />
        <ProtectedRoute path="/bonuses" component={BonusesPage} />
        <Route path="/animation-demo" component={AnimationDemoPage} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <OnboardingProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <OnboardingTour />
              <WelcomeCard />
            </TooltipProvider>
          </OnboardingProvider>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
