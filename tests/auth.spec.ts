import { test, expect } from '@playwright/test';
import { requireTestPassword, TEST_USERNAME } from './helpers/testUser';

const TEST_PASSWORD = requireTestPassword();

test.describe('Authentication - Login', () => {
  // The test user is prepared in Playwright global setup.
  // This test focuses only on verifying the login functionality.

  test('should log in a user with valid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        username: TEST_USERNAME,
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
