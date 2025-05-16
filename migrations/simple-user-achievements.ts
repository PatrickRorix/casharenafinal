import { db } from '../server/db';

async function main() {
  try {
    console.log('Linking achievements and bonuses to users...');
    
    // Get all users
    const users = await db.execute(`SELECT id FROM users`);
    
    if (users.rows.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    // Get all achievements
    const achievements = await db.execute(`SELECT id FROM achievements`);
    
    if (achievements.rows.length === 0) {
      console.log('No achievements found in the database.');
      return;
    }
    
    // Get all bonuses
    const bonuses = await db.execute(`SELECT id FROM bonuses`);
    
    if (bonuses.rows.length === 0) {
      console.log('No bonuses found in the database.');
      return;
    }
    
    // For each user, link them to achievements with varying progress
    for (const user of users.rows) {
      // First, check if user already has achievements to avoid duplicates
      const existingUserAchievements = await db.execute(`
        SELECT COUNT(*) FROM user_achievements WHERE user_id = ${user.id}
      `);
      
      if (parseInt(existingUserAchievements.rows[0].count) === 0) {
        // Create achievements with varying progress for the user
        for (const achievement of achievements.rows) {
          // Randomly determine if achievement is complete (1 in 3 chance)
          const completed = Math.random() < 0.33;
          const progress = completed ? 100 : Math.floor(Math.random() * 90);
          const completedAt = completed ? 'NOW()' : 'NULL';
          const claimedReward = completed && Math.random() < 0.5;
          const claimedAt = claimedReward ? 'NOW()' : 'NULL';
          
          await db.execute(`
            INSERT INTO user_achievements (
              user_id, 
              achievement_id, 
              progress, 
              completed, 
              completed_at, 
              claimed_reward, 
              claimed_at
            )
            VALUES (
              ${user.id}, 
              ${achievement.id}, 
              ${progress}, 
              ${completed}, 
              ${completedAt}, 
              ${claimedReward}, 
              ${claimedAt}
            )
          `);
        }
        console.log(`Added achievements for user ID ${user.id}`);
      } else {
        console.log(`User ID ${user.id} already has achievements, skipping.`);
      }
      
      // Now link user to bonuses
      const existingUserBonuses = await db.execute(`
        SELECT COUNT(*) FROM user_bonuses WHERE user_id = ${user.id}
      `);
      
      if (parseInt(existingUserBonuses.rows[0].count) === 0) {
        for (const bonus of bonuses.rows) {
          // Randomly determine if bonus can be claimed
          const claimed = Math.random() < 0.3;
          
          await db.execute(`
            INSERT INTO user_bonuses (
              user_id,
              bonus_id,
              claimed,
              eligible_at,
              claimed_at
            )
            VALUES (
              ${user.id},
              ${bonus.id},
              ${claimed},
              NOW() - INTERVAL '1 day',
              ${claimed ? 'NOW()' : 'NULL'}
            )
          `);
        }
        console.log(`Added bonuses for user ID ${user.id}`);
      } else {
        console.log(`User ID ${user.id} already has bonuses, skipping.`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

main();