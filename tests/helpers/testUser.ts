export const TEST_USERNAME = process.env.TEST_USER_USERNAME || 'playwright-api-test-user';
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

export function getTestEmail(): string {
  const baseEmail = process.env.TEST_USER_EMAIL;

  if (!baseEmail) {
    throw new Error('TEST_USER_EMAIL must be defined in environment variables.');
  }

  const [localPart, domain] = baseEmail.split('@');

  if (!localPart || !domain) {
    throw new Error('TEST_USER_EMAIL must be a valid email address.');
  }

  return `${localPart}+${TEST_USERNAME}@${domain}`;
}

export function requireTestPassword(): string {
  if (!TEST_PASSWORD) {
    throw new Error('TEST_USER_PASSWORD must be defined in environment variables.');
  }

  return TEST_PASSWORD;
}
