import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables.');
}

test.describe('Authentication - Login', () => {
  // The test user is prepared in Playwright global setup.
  // This test focuses only on verifying the login functionality.

  test('should log in a user with valid credentials', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.error).toBeNull();
    expect(body.data).toBeTruthy();
    expect(body.data.userId).toBeTruthy();
    expect(body.data.token).toBeTruthy();

    const authHeader = response.headers()['auth-token'];
    expect(authHeader).toBeTruthy();
  });

});