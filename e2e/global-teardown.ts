import { Pool } from 'pg';

const TEST_USER_EMAIL = 'test@example.com';

/**
 * Global teardown for Playwright tests.
 * Deletes test user and related data after all tests complete.
 */
async function globalTeardown() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://mravinale@localhost:5432/nestjs-api-starter';
  
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Get test user ID
    const userResult = await pool.query(
      `SELECT id FROM "user" WHERE email = $1`,
      [TEST_USER_EMAIL]
    );

    if (userResult.rowCount === 0) {
      console.log('ℹ️ Test user not found, nothing to clean up');
      return;
    }

    const userId = userResult.rows[0].id;

    // Delete in correct order to respect foreign key constraints
    // 1. Delete sessions
    await pool.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);
    
    // 2. Delete organization memberships
    await pool.query(`DELETE FROM member WHERE "userId" = $1`, [userId]);
    
    // 3. Delete account (credentials)
    await pool.query(`DELETE FROM account WHERE "userId" = $1`, [userId]);
    
    // 4. Delete user
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [userId]);

    console.log(`🧹 Cleaned up test user: ${TEST_USER_EMAIL}`);
  } catch (error) {
    console.error('❌ Failed to clean up test user:', error);
  } finally {
    await pool.end();
  }
}

export default globalTeardown;
