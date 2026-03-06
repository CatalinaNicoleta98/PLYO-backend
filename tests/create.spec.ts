import { test, expect } from '@playwright/test';

test.describe('Applications - Create', () => {

  test('should create a new application', async ({ request }) => {

    const response = await request.post('/api/applications', {
      data: {
        companyName: 'Playwright Test Company',
        roleTitle: 'Backend Developer Intern',
        createdBy: 'playwright-test-user'
      }
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.companyName).toBe('Playwright Test Company');
    expect(body.roleTitle).toBe('Backend Developer Intern');
    expect(body.createdBy).toBe('playwright-test-user');

    expect(body._id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
  });

});