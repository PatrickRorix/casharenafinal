import { db } from "./db";
import { 
  users, games, matches, transactions, stats, 
  tournaments, tournamentParticipants, tournamentMatches 
} from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting seed script...");

  // Check if demo user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, "demouser")
  });

  let demoUserId = existingUser?.id;

  // Create demo user if not exists
  if (!existingUser) {
    console.log("Creating demo user...");
    const [demoUser] = await db
      .insert(users)
      .values({
        username: "demouser",
        password: "password123",
        tokens: 2500
      })
      .returning();

    demoUserId = demoUser.id;
  }

  // Check if games exist
  const existingGames = await db.select().from(games);
  
  // Create demo games if none exist
  if (existingGames.length === 0) {
    console.log("Creating demo games...");
    await db.insert(games).values([
      { name: "PUBG Mobile", category: "Battle Royale", platform: "Mobile", players: 15000, image: "/images/pubg.jpg", isPopular: true, isNew: false },
      { name: "Call of Duty: Mobile", category: "FPS", platform: "Mobile", players: 12000, image: "/images/cod.jpg", isPopular: false, isNew: false },
      { name: "Fortnite", category: "Battle Royale", platform: "Cross-platform", players: 10000, image: "/images/fortnite.jpg", isPopular: false, isNew: false },
      { name: "Free Fire", category: "Battle Royale", platform: "Mobile", players: 8000, image: "/images/freefire.jpg", isPopular: false, isNew: true },
      { name: "Valorant", category: "FPS", platform: "PC", players: 7000, image: "/images/valorant.jpg", isPopular: false, isNew: false },
      { name: "Mobile Legends", category: "MOBA", platform: "Mobile", players: 9000, image: "/images/ml.jpg", isPopular: false, isNew: false },
      { name: "Clash Royale", category: "Strategy", platform: "Mobile", players: 5000, image: "/images/clash.jpg", isPopular: false, isNew: false },
      { name: "FIFA Mobile", category: "Sports", platform: "Mobile", players: 6000, image: "/images/fifa.jpg", isPopular: false, isNew: false }
    ]);
  }

  // Get all games to create matches
  const allGames = await db.select().from(games);
  
  // Check if matches exist
  const existingMatches = await db.select().from(matches);
  
  // Create demo matches if none exist
  if (existingMatches.length === 0 && allGames.length > 0) {
    console.log("Creating demo matches...");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const saturday = new Date(today);
    saturday.setDate(saturday.getDate() + (6 - today.getDay()));
    
    await db.insert(matches).values([
      { 
        gameId: allGames[0].id, 
        name: "PUBG Mobile - Squad Battle", 
        schedule: new Date(today.setHours(20, 0, 0, 0)), 
        maxPlayers: 100, 
        currentPlayers: 24, 
        prize: 5000 
      },
      { 
        gameId: allGames[1].id, 
        name: "Call of Duty: Mobile - 5v5 Team", 
        schedule: new Date(tomorrow.setHours(18, 30, 0, 0)), 
        maxPlayers: 10, 
        currentPlayers: 8, 
        prize: 3000 
      },
      { 
        gameId: allGames[2].id, 
        name: "Fortnite - Solo Tournament", 
        schedule: new Date(saturday.setHours(21, 0, 0, 0)), 
        maxPlayers: 100, 
        currentPlayers: 45, 
        prize: 7500 
      }
    ]);
  }

  // Check if tournaments exist
  const existingTournaments = await db.select().from(tournaments);
  
  // Create demo tournaments if none exist
  if (existingTournaments.length === 0 && allGames.length > 0) {
    console.log("Creating demo tournaments...");
    const now = new Date();
    
    // Tournament dates
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const twoWeeks = new Date(now);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    
    const threeWeeks = new Date(now);
    threeWeeks.setDate(threeWeeks.getDate() + 21);
    
    // Add tournaments
    const [pubgTournament, codTournament, fortniteTournament] = await db.insert(tournaments).values([
      {
        gameId: allGames[0].id, // PUBG
        name: "PUBG Mobile Championship",
        description: "The ultimate PUBG Mobile battle royale tournament with multiple rounds",
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
        registrationDeadline: new Date(nextWeek.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
        maxParticipants: 100,
        entryFee: 200,
        prizePool: 10000,
        rules: "Standard PUBG Mobile rules apply. Squad mode (4 players per team). Top 10 teams advance to finals.",
        status: "upcoming"
      },
      {
        gameId: allGames[1].id, // Call of Duty
        name: "CoD Mobile Pro League",
        description: "Professional 5v5 Call of Duty Mobile tournament featuring top players",
        startDate: twoWeeks,
        endDate: new Date(twoWeeks.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
        registrationDeadline: new Date(twoWeeks.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before
        maxParticipants: 32,
        entryFee: 300,
        prizePool: 15000,
        rules: "Standard CoD Mobile rules apply. Team Deathmatch and Search & Destroy modes.",
        status: "upcoming"
      },
      {
        gameId: allGames[2].id, // Fortnite
        name: "Fortnite Solo Showdown",
        description: "Test your Fortnite skills in this intense solo tournament",
        startDate: threeWeeks,
        endDate: new Date(threeWeeks.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day later
        registrationDeadline: new Date(threeWeeks.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before
        maxParticipants: 150,
        entryFee: 250,
        prizePool: 20000,
        rules: "Standard Fortnite rules. Solo mode only. Points awarded for eliminations and placement.",
        status: "upcoming"
      }
    ]).returning();
    
    // Create a past tournament
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [pastTournament] = await db.insert(tournaments).values({
      gameId: allGames[3].id, // Free Fire
      name: "Free Fire Battle Cup",
      description: "The inaugural Free Fire tournament with intense squad battles",
      startDate: lastMonth,
      endDate: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
      registrationDeadline: new Date(lastMonth.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days before
      maxParticipants: 80,
      entryFee: 150,
      prizePool: 8000,
      rules: "Standard Free Fire rules apply. Squad mode (4 players per team).",
      status: "completed"
    }).returning();
    
    // If demo user exists, add them as participant and add tournament matches
    if (demoUserId) {
      // Add demo user to past tournament
      await db.insert(tournamentParticipants).values({
        tournamentId: pastTournament.id,
        userId: demoUserId,
        registrationDate: new Date(lastMonth.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days before
        status: "completed",
        placement: 3,
        prize: 800
      });
      
      // Add tournament matches for past tournament
      await db.insert(tournamentMatches).values([
        {
          tournamentId: pastTournament.id,
          name: "Qualification Round",
          startTime: new Date(lastMonth.getTime()),
          endTime: new Date(lastMonth.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
          status: "completed",
          results: JSON.stringify({
            "matches": [
              {
                "id": 1,
                "winner": "Team Alpha",
                "runnerUp": "Team Delta",
                "score": "45-32"
              },
              {
                "id": 2,
                "winner": "Team Echo",
                "runnerUp": "Team Bravo",
                "score": "51-49"
              }
            ]
          })
        },
        {
          tournamentId: pastTournament.id,
          name: "Final Round",
          startTime: new Date(lastMonth.getTime() + 24 * 60 * 60 * 1000), // 1 day later
          endTime: new Date(lastMonth.getTime() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours after start
          status: "completed",
          results: JSON.stringify({
            "matches": [
              {
                "id": 3,
                "winner": "Team Echo",
                "runnerUp": "Team Alpha",
                "score": "60-58"
              }
            ]
          })
        }
      ]);
      
      // Register demo user for an upcoming tournament
      await db.insert(tournamentParticipants).values({
        tournamentId: fortniteTournament.id,
        userId: demoUserId,
        registrationDate: new Date(), // today
        status: "registered",
        placement: null,
        prize: null
      });
    }
  }

  if (demoUserId) {
    // Check if user has stats
    const existingStats = await db.select().from(stats).where(eq(stats.userId, demoUserId));
    
    // Create demo stats if not exist
    if (existingStats.length === 0) {
      console.log("Creating demo stats...");
      await db.insert(stats).values({
        userId: demoUserId,
        winRate: 68,
        matchesPlayed: 47,
        totalEarnings: 3720,
        avgPosition: 3
      });
    }
    
    // Check if user has transactions
    const existingTransactions = await db.select().from(transactions).where(eq(transactions.userId, demoUserId));
    
    // Create demo transactions if not exist
    if (existingTransactions.length === 0) {
      console.log("Creating demo transactions...");
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      await db.insert(transactions).values([
        {
          userId: demoUserId,
          amount: 500,
          type: "deposit",
          timestamp: twoHoursAgo
        },
        {
          userId: demoUserId,
          amount: 120,
          type: "win",
          timestamp: yesterday
        },
        {
          userId: demoUserId,
          amount: -50,
          type: "match_entry",
          timestamp: yesterday
        },
        {
          userId: demoUserId,
          amount: -150,
          type: "tournament_entry",
          timestamp: new Date(lastMonth.getTime() - 10 * 24 * 60 * 60 * 1000)
        },
        {
          userId: demoUserId,
          amount: 800,
          type: "tournament_prize",
          timestamp: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000)
        }
      ]);
    }
  }

  console.log("Seed complete!");
  process.exit(0);
}

main().catch(error => {
  console.error("Seed error:", error);
  process.exit(1);
});