import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDown,
  ArrowUp,
  ChartLine,
  Coins,
  Gamepad,
  Trophy,
  Users
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  timestamp: string;
}

interface Match {
  id: number;
  gameId: number;
  name: string;
  schedule: string;
  maxPlayers: number;
  currentPlayers: number;
  prize: number;
}

interface Stats {
  id: number;
  userId: number;
  winRate: number;
  matchesPlayed: number;
  totalEarnings: number;
  avgPosition: number;
}

interface DashboardSectionProps {
  currentUser?: {
    id: number;
    username: string;
    tokens: number;
  };
  userStats?: Stats;
  transactions?: Transaction[];
  matches?: Match[];
  isUserLoading: boolean;
  isStatsLoading: boolean;
  isTransactionsLoading: boolean;
  isMatchesLoading: boolean;
}

export default function DashboardSection({
  currentUser,
  userStats,
  transactions,
  matches,
  isUserLoading,
  isStatsLoading,
  isTransactionsLoading,
  isMatchesLoading
}: DashboardSectionProps) {
  return (
    <section id="dashboard" className="py-16 bg-[hsl(var(--surface))/30]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl font-orbitron font-bold text-white mb-2">
            Your Gaming <span className="text-primary">Dashboard</span>
          </h2>
          <p className="text-[hsl(var(--text-tertiary))] max-w-2xl">
            Track your performance, manage your balance, and join matches all in one place.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Section */}
          <div className="lg:col-span-1">
            <Card className="bg-[hsl(var(--surface))] rounded-xl border border-primary/20 shadow-sm h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-rajdhani font-semibold text-white mb-4">Balance</h3>
                
                <div className="neon-border p-4 rounded-lg bg-[hsl(var(--surface-light))/50] mb-6 wallet-info">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[hsl(var(--text-tertiary))]">WinTokens</span>
                    {isUserLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <span className="text-right font-rajdhani text-2xl font-bold text-primary">
                        {currentUser?.tokens.toLocaleString() || 0}
                      </span>
                    )}
                  </div>
                  <Progress value={65} className="w-full h-1.5 mb-1" />
                  <div className="flex justify-between text-xs text-[hsl(var(--text-tertiary))]">
                    <span>Level 3</span>
                    <span>500 to Level 4</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-white font-medium mb-3">Quick Deposit</h4>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Button variant="outline" className="bg-[hsl(var(--surface-light))] hover:bg-[hsl(var(--surface-light))/80] text-white rounded-lg p-2 h-auto">₹100</Button>
                    <Button variant="outline" className="bg-[hsl(var(--surface-light))] hover:bg-[hsl(var(--surface-light))/80] text-white rounded-lg p-2 h-auto">₹500</Button>
                    <Button variant="outline" className="bg-[hsl(var(--surface-light))] hover:bg-[hsl(var(--surface-light))/80] text-white rounded-lg p-2 h-auto">₹1000</Button>
                  </div>
                  <Button className="neon-button w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-lg py-2 px-4 font-medium transition-all duration-300 h-auto">
                    <Coins className="mr-2 h-4 w-4" /> Deposit Now
                  </Button>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-3">Recent Transactions</h4>
                  {isTransactionsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.slice(0, 3).map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-2 rounded bg-[hsl(var(--surface-light))/30]">
                          <div className="flex items-center">
                            {transaction.type === 'deposit' && (
                              <ArrowDown className="text-green-400 mr-2 h-4 w-4" />
                            )}
                            {transaction.type === 'win' && (
                              <Gamepad className="text-primary mr-2 h-4 w-4" />
                            )}
                            {transaction.type === 'match_entry' && (
                              <Gamepad className="text-red-400 mr-2 h-4 w-4" />
                            )}
                            <span>
                              {transaction.type === 'deposit' && 'Deposit'}
                              {transaction.type === 'win' && 'Match Win'}
                              {transaction.type === 'match_entry' && 'Match Entry'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-white">
                              {transaction.amount > 0 ? '+' : ''}₹{transaction.amount}
                            </div>
                            <div className="text-xs text-[hsl(var(--text-tertiary))]">
                              {format(new Date(transaction.timestamp), 'PP')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[hsl(var(--text-tertiary))]">
                      No transactions yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Stats Section */}
          <div className="lg:col-span-2">
            <Card className="bg-[hsl(var(--surface))] rounded-xl border border-primary/20 shadow-sm mb-6 dashboard-stats">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-rajdhani font-semibold text-white">Performance Stats</h3>
                  <div className="flex space-x-2">
                    <Button variant="ghost" className="bg-[hsl(var(--surface-light))] px-3 py-1 rounded-full text-xs text-[hsl(var(--text-tertiary))] hover:text-white transition h-auto">Week</Button>
                    <Button variant="ghost" className="bg-primary/20 px-3 py-1 rounded-full text-xs text-primary transition h-auto">Month</Button>
                    <Button variant="ghost" className="bg-[hsl(var(--surface-light))] px-3 py-1 rounded-full text-xs text-[hsl(var(--text-tertiary))] hover:text-white transition h-auto">All Time</Button>
                  </div>
                </div>
                
                {isStatsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : userStats ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[hsl(var(--surface-light))/50] rounded-lg p-3">
                      <div className="text-[hsl(var(--text-tertiary))] text-sm mb-1">Win Rate</div>
                      <div className="text-2xl font-bold text-white">{userStats.winRate}<span className="text-primary">%</span></div>
                      <div className="text-xs text-green-400"><ArrowUp className="inline mr-1 h-3 w-3" />4% vs last month</div>
                    </div>
                    <div className="bg-[hsl(var(--surface-light))/50] rounded-lg p-3">
                      <div className="text-[hsl(var(--text-tertiary))] text-sm mb-1">Matches Played</div>
                      <div className="text-2xl font-bold text-white">{userStats.matchesPlayed}</div>
                      <div className="text-xs text-green-400"><ArrowUp className="inline mr-1 h-3 w-3" />12 more</div>
                    </div>
                    <div className="bg-[hsl(var(--surface-light))/50] rounded-lg p-3">
                      <div className="text-[hsl(var(--text-tertiary))] text-sm mb-1">Total Earnings</div>
                      <div className="text-2xl font-bold text-white">₹{userStats.totalEarnings.toLocaleString()}</div>
                      <div className="text-xs text-green-400"><ArrowUp className="inline mr-1 h-3 w-3" />₹820 more</div>
                    </div>
                    <div className="bg-[hsl(var(--surface-light))/50] rounded-lg p-3">
                      <div className="text-[hsl(var(--text-tertiary))] text-sm mb-1">Avg. Position</div>
                      <div className="text-2xl font-bold text-white">{userStats.avgPosition}<span className="text-primary">rd</span></div>
                      <div className="text-xs text-green-400"><ArrowUp className="inline mr-1 h-3 w-3" />2 positions</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[hsl(var(--surface-light))/50] rounded-lg p-6 mb-6 text-center">
                    <p className="text-[hsl(var(--text-tertiary))]">No stats available yet. Start playing to see your performance.</p>
                  </div>
                )}
                
                {/* Chart Area */}
                <div className="h-64 bg-[hsl(var(--surface-light))/30] rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center text-[hsl(var(--text-tertiary))]">
                    <ChartLine className="text-primary text-4xl mb-2 mx-auto" />
                    <p>Performance chart visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Upcoming Matches */}
            <Card className="bg-[hsl(var(--surface))] rounded-xl border border-primary/20 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-rajdhani font-semibold text-white mb-4">Upcoming Matches</h3>
                
                {isMatchesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : matches && matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-[hsl(var(--surface-light))/50] rounded-lg border border-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                        <div className="flex items-center mb-3 lg:mb-0">
                          <div className="w-12 h-12 rounded bg-[hsl(var(--surface-light))] mr-3 flex items-center justify-center">
                            <Gamepad className="text-primary h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{match.name}</div>
                            <div className="text-[hsl(var(--text-tertiary))] text-sm">
                              {format(new Date(match.schedule), 'PPpp')}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            <Users className="inline mr-1 h-3 w-3" /> {match.currentPlayers}/{match.maxPlayers} Players
                          </div>
                          <div className="px-3 py-1 bg-[hsl(var(--surface-light))] rounded-full text-white text-sm">
                            <Trophy className="inline mr-1 h-3 w-3" /> ₹{match.prize.toLocaleString()} Prize
                          </div>
                          <Button className="neon-button bg-primary/10 hover:bg-primary/20 text-primary border border-primary rounded-lg px-4 py-1 text-sm font-medium transition-all duration-300 h-auto">
                            Join
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[hsl(var(--text-tertiary))]">
                    No upcoming matches at the moment
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
