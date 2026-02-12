import { Pool } from 'pg';
import { DATABASE_URL, API_BASE_URL, TEST_USER } from './env';

const TEST_USER_EMAIL = TEST_USER.email;
const TEST_USER_PASSWORD = TEST_USER.password;

/**
 * Global setup for Playwright tests.
 * Creates test user if not exists, sets as admin, and clears sessions.
 */
async function globalSetup() {
  const databaseUrl = DATABASE_URL;
  
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Check if test user exists
    const existingUser = await pool.query(
      `SELECT id FROM "user" WHERE email = $1`,
      [TEST_USER_EMAIL]
    );

    if (existingUser.rowCount === 0) {
      // Create test user via Better Auth API
      console.log('📝 Creating test user via API...');
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD,
          name: 'Test User',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ Failed to create test user:', error);
      } else {
        console.log('✅ Test user created successfully');
      }
    }

    // Set test user as admin with verified email
    const result = await pool.query(
      `UPDATE "user" SET role = 'admin', "emailVerified" = true WHERE email = $1 RETURNING id, email, role`,
      [TEST_USER_EMAIL]
    );

    if (result.rowCount === 0) {
      console.log('⚠️ Test user not found after creation attempt.');
    } else {
      const userId = result.rows[0].id;
      console.log(`✅ Set ${result.rows[0].email} as admin (id: ${userId})`);
      
      // Clear all sessions for this user to force fresh login with new role
      const sessionsResult = await pool.query(
        `DELETE FROM session WHERE "userId" = $1`,
        [userId]
      );
      console.log(`✅ Cleared ${sessionsResult.rowCount} existing sessions`);
    }
  } catch (error) {
    console.error('❌ Failed to set up test user:', error);
  } finally {
    await pool.end();
  }
}

export default globalSetup;
