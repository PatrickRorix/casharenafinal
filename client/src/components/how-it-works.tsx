import { Button } from "@/components/ui/button";
import { UserPlus, Gamepad, Trophy } from "lucide-react";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(0,255,65,0.08),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-orbitron font-bold text-white mb-4">
            How <span className="text-primary">CashArena</span> Works
          </h2>
          <p className="text-[hsl(var(--text-tertiary))] max-w-2xl mx-auto">
            Join competitive gaming matches, showcase your skills, and win real rewards in three simple steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary font-orbitron font-bold text-xl">
              1
            </div>
            <div className="bg-[hsl(var(--surface))] rounded-xl p-6 border border-primary/20 shadow-sm h-full pt-12">
              <div className="mb-6 text-center">
                <UserPlus className="h-14 w-14 text-primary mx-auto" />
              </div>
              <h3 className="text-xl font-rajdhani font-semibold text-white mb-2 text-center">Create Account & Deposit</h3>
              <p className="text-[hsl(var(--text-tertiary))] text-center">
                Sign up in seconds and deposit funds to your CashArena wallet to get started. Use secure payment methods for instant deposits.
              </p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary font-orbitron font-bold text-xl">
              2
            </div>
            <div className="bg-[hsl(var(--surface))] rounded-xl p-6 border border-primary/20 shadow-sm h-full pt-12">
              <div className="mb-6 text-center">
                <Gamepad className="h-14 w-14 text-primary mx-auto" />
              </div>
              <h3 className="text-xl font-rajdhani font-semibold text-white mb-2 text-center">Join Matches & Compete</h3>
              <p className="text-[hsl(var(--text-tertiary))] text-center">
                Browse upcoming tournaments, select your favorite games, and join matches that match your skill level to compete against other players.
              </p>
            </div>
          </div>
          
          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary font-orbitron font-bold text-xl">
              3
            </div>
            <div className="bg-[hsl(var(--surface))] rounded-xl p-6 border border-primary/20 shadow-sm h-full pt-12">
              <div className="mb-6 text-center">
                <Trophy className="h-14 w-14 text-primary mx-auto" />
              </div>
              <h3 className="text-xl font-rajdhani font-semibold text-white mb-2 text-center">Win & Withdraw Rewards</h3>
              <p className="text-[hsl(var(--text-tertiary))] text-center">
                Top performers win real cash rewards immediately credited to their wallet. Withdraw anytime to your preferred payment method.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Button className="neon-button bg-primary text-background px-8 py-3 rounded-lg font-bold text-lg shadow-md transition-all duration-300 h-auto">
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
}
