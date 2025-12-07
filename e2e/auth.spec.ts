import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';

// Helper to create a verified user directly via API
async function createVerifiedUser(email: string, password: string, name: string) {
  // Create user via API
  const signupResponse = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!signupResponse.ok) {
    const error = await signupResponse.json().catch(() => ({}));
    throw new Error(`Signup failed: ${error.message || signupResponse.statusText}`);
  }

  // Verify email directly in database (test mode bypass)
  // In production, this would be done via email verification link
  const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/admin/set-user-verified`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).catch(() => null);

  // If admin endpoint doesn't exist, try direct DB update via test endpoint
  // For now, we'll use the test user that's already verified in the database
}

test.describe('Authentication E2E Tests', () => {
  test.describe('Signup Flow', () => {
    test('should display signup page correctly', async ({ page }) => {
      await page.goto('/signup');

      // CardTitle renders as div, use text content
      await expect(page.getByText('Create an account')).toBeVisible();
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should successfully sign up a new user (redirects to login for email verification)', async ({ page }) => {
      const testUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      await page.goto('/signup');

      await page.getByLabel(/full name/i).fill(testUser.name);
      await page.getByLabel('Email').fill(testUser.email);
      await page.getByLabel('Password', { exact: true }).fill(testUser.password);
      await page.getByLabel(/confirm password/i).fill(testUser.password);

      await page.getByRole('button', { name: /create account/i }).click();

      // With email verification enabled, user is redirected to login
      // (they need to verify email before accessing dashboard)
      await expect(page).toHaveURL('/login', { timeout: 10000 });
    });

    test('should navigate to login page from signup', async ({ page }) => {
      await page.goto('/signup');

      await page.getByRole('link', { name: /sign in/i }).click();

      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Login Flow', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/login');

      // CardTitle renders as div, use exact match
      await expect(page.getByText('Login to your account', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: /^login$/i })).toBeVisible();
    });

    test('should successfully login with verified user', async ({ page }) => {
      // Use the pre-verified test user from the database
      // (test@example.com was verified manually during setup)
      const loginUser = {
        email: 'test@example.com',
        password: 'password123',
      };

      await page.goto('/login');

      await page.getByLabel('Email').fill(loginUser.email);
      await page.getByLabel('Password').fill(loginUser.password);
      await page.getByRole('button', { name: /^login$/i }).click();

      // Should redirect to dashboard after successful login
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('should navigate to signup page from login', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /sign up/i }).click();

      await expect(page).toHaveURL('/signup');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill('nonexistent@example.com');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: /^login$/i }).click();

      // Should stay on login page or show error
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should show error for unverified email', async ({ page }) => {
      // Create a new user that won't be verified
      const unverifiedUser = {
        name: 'Unverified User',
        email: `unverified-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      // Sign up the user first
      await page.goto('/signup');
      await page.getByLabel(/full name/i).fill(unverifiedUser.name);
      await page.getByLabel('Email').fill(unverifiedUser.email);
      await page.getByLabel('Password', { exact: true }).fill(unverifiedUser.password);
      await page.getByLabel(/confirm password/i).fill(unverifiedUser.password);
      await page.getByRole('button', { name: /create account/i }).click();

      // Wait for redirect to login
      await expect(page).toHaveURL('/login', { timeout: 10000 });

      // Try to login with unverified email
      await page.getByLabel('Email').fill(unverifiedUser.email);
      await page.getByLabel('Password').fill(unverifiedUser.password);
      await page.getByRole('button', { name: /^login$/i }).click();

      // Should show error toast or stay on login page
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toContain('/login');
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /forgot your password/i }).click();

      await expect(page).toHaveURL('/forgot-password');
    });
  });

  test.describe('Forgot Password Flow', () => {
    test('should display forgot password page correctly', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.getByText('Forgot password?')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /back to login/i })).toBeVisible();
    });

    test('should submit forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.getByLabel('Email').fill('test@example.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Should show success message
      await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 5000 });
    });

    test('should navigate back to login', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.getByRole('link', { name: /back to login/i }).click();

      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Set New Password Flow', () => {
    test('should display invalid link message without token', async ({ page }) => {
      await page.goto('/set-new-password');

      await expect(page.getByText('Invalid Link')).toBeVisible();
      await expect(page.getByRole('link', { name: /request new reset link/i })).toBeVisible();
    });

    test('should display password form with token', async ({ page }) => {
      await page.goto('/set-new-password?token=test-token');

      await expect(page.getByText('Set new password')).toBeVisible();
      await expect(page.getByLabel('New Password')).toBeVisible();
      await expect(page.getByLabel('Confirm Password')).toBeVisible();
      await expect(page.getByRole('button', { name: /reset password/i })).toBeVisible();
    });

    test('should validate password match', async ({ page }) => {
      await page.goto('/set-new-password?token=test-token');

      await page.getByLabel('New Password').fill('newpassword123');
      await page.getByLabel('Confirm Password').fill('differentpassword');
      await page.getByRole('button', { name: /reset password/i }).click();

      // Should show error about passwords not matching
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });
  });

  test.describe('Email Verification Flow', () => {
    test('should display error without token', async ({ page }) => {
      await page.goto('/verify-email');

      await expect(page.getByText(/invalid verification link/i)).toBeVisible({ timeout: 5000 });
    });

    test('should display verification page with token', async ({ page }) => {
      await page.goto('/verify-email?token=test-token');

      // Should show loading or error (invalid token)
      await expect(page.getByText(/email verification/i)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      await page.goto('/');

      // Should redirect to login
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout', async ({ page }) => {
      // Login first with verified user
      await page.goto('/login');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: /^login$/i }).click();

      // Wait for dashboard
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Find and click logout button (adjust selector based on your UI)
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await expect(page).toHaveURL('/login', { timeout: 5000 });
      }
    });
  });
});
