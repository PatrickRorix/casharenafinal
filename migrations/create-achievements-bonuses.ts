import { db } from '../server/db';
import { achievements, userAchievements, bonuses, userBonuses } from '../shared/schema';

async function main() {
  try {
    console.log('Creating achievements and bonuses tables...');
    
    // Create the achievements table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        category TEXT NOT NULL,
        rarity TEXT NOT NULL DEFAULT 'common',
        token_reward INTEGER NOT NULL DEFAULT 0,
        criteria JSONB NOT NULL,
        game_id INTEGER REFERENCES games(id),
        is_hidden BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create the user_achievements table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        achievement_id INTEGER NOT NULL REFERENCES achievements(id),
        progress INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        claimed_reward BOOLEAN NOT NULL DEFAULT false,
        claimed_at TIMESTAMP
      );
    `);
    
    // Create the bonuses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS bonuses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        token_amount INTEGER NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        requirements JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create the user_bonuses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_bonuses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        bonus_id INTEGER NOT NULL REFERENCES bonuses(id),
        claimed BOOLEAN NOT NULL DEFAULT false,
        eligible_at TIMESTAMP NOT NULL,
        claimed_at TIMESTAMP,
        transaction_id INTEGER REFERENCES transactions(id)
      );
    `);
    
    // Create sample daily bonus
    const dailyBonusExists = await db.execute(`
      SELECT id FROM bonuses WHERE type = 'daily_login' LIMIT 1;
    `);
    
    if (dailyBonusExists.rows.length === 0) {
      await db.execute(`
        INSERT INTO bonuses (name, description, type, token_amount, start_date, requirements, is_active)
        VALUES (
          'Daily Login Bonus', 
          'Earn tokens just by logging in each day!', 
          'daily_login', 
          100, 
          NOW(), 
          '{"login": true}'::jsonb, 
          true
        );
      `);
      console.log('Created sample daily login bonus');
    }
    
    // Create sample special bonus
    const specialBonusExists = await db.execute(`
      SELECT id FROM bonuses WHERE type = 'special_event' LIMIT 1;
    `);
    
    if (specialBonusExists.rows.length === 0) {
      await db.execute(`
        INSERT INTO bonuses (name, description, type, token_amount, start_date, end_date, requirements, is_active)
        VALUES (
          'Welcome Bonus', 
          'Special bonus for new players!', 
          'special_event', 
          500, 
          NOW(), 
          NOW() + INTERVAL '30 days', 
          '{"new_user": true}'::jsonb, 
          true
        );
      `);
      console.log('Created sample welcome bonus');
    }
    
    // Create sample achievements
    const achievementsExist = await db.execute(`
      SELECT id FROM achievements LIMIT 1;
    `);
    
    if (achievementsExist.rows.length === 0) {
      // Create a few sample achievements
      await db.execute(`
        INSERT INTO achievements (name, description, icon, category, rarity, token_reward, criteria)
        VALUES 
          (
            'First Victory', 
            'Win your first match in any game', 
            'trophy', 
            'platform', 
            'common', 
            50, 
            '{"wins": 1}'::jsonb
          ),
          (
            'Social Butterfly', 
            'Add 5 friends to your network', 
            'users', 
            'social', 
            'uncommon', 
            100, 
            '{"friends": 5}'::jsonb
          ),
          (
            'Tournament Champion', 
            'Win a tournament in any game', 
            'award', 
            'competitive', 
            'rare', 
            250, 
            '{"tournament_wins": 1}'::jsonb
          );
      `);
      console.log('Created sample achievements');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

main();