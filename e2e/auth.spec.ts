import { test, expect } from '@playwright/test';

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

    test('should successfully sign up a new user', async ({ page }) => {
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

      // Should redirect to dashboard after successful signup
      await expect(page).toHaveURL('/', { timeout: 10000 });
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

    test('should successfully login with valid credentials', async ({ page }) => {
      // First create a user via signup
      const loginUser = {
        name: 'Login Test User',
        email: `login-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      await page.goto('/signup');
      await page.getByLabel(/full name/i).fill(loginUser.name);
      await page.getByLabel('Email').fill(loginUser.email);
      await page.getByLabel('Password', { exact: true }).fill(loginUser.password);
      await page.getByLabel(/confirm password/i).fill(loginUser.password);
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Clear cookies to simulate logout
      await page.context().clearCookies();
      await page.goto('/login');

      // Login with the created user
      await page.getByLabel('Email').fill(loginUser.email);
      await page.getByLabel('Password').fill(loginUser.password);
      await page.getByRole('button', { name: /^login$/i }).click();

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
});
