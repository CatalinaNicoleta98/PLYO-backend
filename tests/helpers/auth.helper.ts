import { APIRequestContext } from '@playwright/test';
import { requireTestPassword, TEST_USERNAME } from './testUser';

/**
 * Logs in using the test credentials and returns the JWT token.
 * This helper is reused by tests that require authenticated requests.
 */
export async function loginAndGetToken(request: APIRequestContext): Promise<string> {
  const password = requireTestPassword();

  const response = await request.post('/api/auth/login', {
    data: {
      username: TEST_USERNAME,
      password
    }
  });

  if (response.status() !== 200) {
    const body = await response.text();
    throw new Error(`Login failed during test setup. Status: ${response.status()} Body: ${body}`);
  }

  const json = await response.json();

  const token = json?.data?.token;

  if (!token) {
    throw new Error('Login response did not contain a token.');
  }

  return token;
}
