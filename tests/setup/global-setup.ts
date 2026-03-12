

import dotenvFlow from 'dotenv-flow';

// Load environment variables
dotenvFlow.config();

export default async function globalSetup() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:4000';
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be defined in the environment.');
  }

  try {
    await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
  } catch (error) {
    console.error('Global setup: unable to ensure test user exists', error);
    throw error;
  }
}