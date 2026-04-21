

import dotenvFlow from 'dotenv-flow';
import { getTestEmail, requireTestPassword, TEST_USERNAME } from '../helpers/testUser';

// Load environment variables
dotenvFlow.config();

export default async function globalSetup() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:4000';
  const email = getTestEmail();
  const password = requireTestPassword();

  try {
    await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        email,
        password
      })
    });
  } catch (error) {
    console.error('Global setup: unable to ensure test user exists', error);
    throw error;
  }
}
