import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export default function HeroSection() {
  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      window.scrollTo({
        top: howItWorksSection.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="hero" className="relative overflow-hidden py-20 md:py-28">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--surface))/50] to-background"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,65,0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-white mb-6 tracking-tight leading-tight">
            <span className="text-primary">Play</span>. <span className="text-primary">Win</span>. <span className="text-primary">Earn</span>.
          </h1>
          <p className="text-xl md:text-2xl text-[hsl(var(--text-secondary))] mb-10 font-rajdhani">
            Join the ultimate competitive gaming platform where skill meets reward.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="neon-button bg-primary text-background px-8 py-3 rounded-lg font-bold text-lg shadow-md transition-all duration-300 h-auto">
              Start Gaming
            </Button>
            <Button 
              variant="outline" 
              onClick={scrollToHowItWorks}
              className="neon-button bg-transparent border border-primary text-primary px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 h-auto"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> How It Works
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <div className="bg-[hsl(var(--surface))/70] backdrop-blur-sm rounded-lg p-4 stat-card">
              <div className="text-2xl md:text-3xl font-rajdhani font-bold text-primary">15K+</div>
              <div className="text-sm text-[hsl(var(--text-tertiary))]">Active Players</div>
            </div>
            <div className="bg-[hsl(var(--surface))/70] backdrop-blur-sm rounded-lg p-4 stat-card">
              <div className="text-2xl md:text-3xl font-rajdhani font-bold text-primary">₹2.5M</div>
              <div className="text-sm text-[hsl(var(--text-tertiary))]">Rewards Paid</div>
            </div>
            <div className="bg-[hsl(var(--surface))/70] backdrop-blur-sm rounded-lg p-4 stat-card">
              <div className="text-2xl md:text-3xl font-rajdhani font-bold text-primary">50+</div>
              <div className="text-sm text-[hsl(var(--text-tertiary))]">Games</div>
            </div>
            <div className="bg-[hsl(var(--surface))/70] backdrop-blur-sm rounded-lg p-4 stat-card">
              <div className="text-2xl md:text-3xl font-rajdhani font-bold text-primary">24/7</div>
              <div className="text-sm text-[hsl(var(--text-tertiary))]">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
