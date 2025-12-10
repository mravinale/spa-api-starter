import { Pool } from 'pg';

/**
 * Global setup for Playwright tests.
 * Sets the test user as admin and clears their sessions to force fresh login.
 */
async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://mravinale@localhost:5432/nestjs-api-starter';
  
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Set test user as admin
    const result = await pool.query(
      `UPDATE "user" SET role = 'admin' WHERE email = $1 RETURNING id, email, role`,
      ['test@example.com']
    );

    if (result.rowCount === 0) {
      console.log('⚠️ Test user not found. Make sure test@example.com exists in the database.');
    } else {
      const userId = result.rows[0].id;
      console.log(`✅ Set ${result.rows[0].email} as admin (id: ${userId})`);
      
      // Clear all sessions for this user to force fresh login with new role
      const sessionsResult = await pool.query(
        `DELETE FROM "session" WHERE "userId" = $1`,
        [userId]
      );
      console.log(`✅ Cleared ${sessionsResult.rowCount} existing sessions`);
    }
  } catch (error) {
    console.error('❌ Failed to set up admin user:', error);
    // Don't throw - let tests run and fail with clear message
  } finally {
    await pool.end();
  }
}

export default globalSetup;
