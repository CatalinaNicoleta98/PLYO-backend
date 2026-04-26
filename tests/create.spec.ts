/// <reference types="node" />
import { test, expect } from '@playwright/test';
import { requireTestPassword, TEST_USERNAME } from './helpers/testUser';

const TEST_PASSWORD = requireTestPassword();

test.describe('Applications - Create', () => {

  test('should create a new application', async ({ request }) => {

    // Login to get token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      }
    });

    const loginBody = await loginResponse.json();
    const token = loginBody.data.token;
    const userId = loginBody.data.userId;

    expect(token).toBeTruthy();
    expect(userId).toBeTruthy();

    // Create application with auth-token
    const response = await request.post('/api/applications', {
      headers: {
        'auth-token': token
      },
      data: {
        companyName: 'Playwright Test Company',
        roleTitle: 'Backend Developer Intern',
        createdBy: 'playwright-test-user'
      }
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.error).toBeNull();
    expect(body.data.companyName).toBe('Playwright Test Company');
    expect(body.data.roleTitle).toBe('Backend Developer Intern');
    expect(body.data.createdBy).toBe(userId);

    expect(body.data._id).toBeTruthy();
    expect(body.data.createdAt).toBeTruthy();
  });

});
