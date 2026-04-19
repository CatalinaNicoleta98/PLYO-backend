import { test, expect } from '@playwright/test';
import { loginAndGetToken } from './helpers/auth.helper';

test.describe('Applications - Delete', () => {

  test('should delete an existing application', async ({ request }) => {

    // Step 1: login and get token
    const token = await loginAndGetToken(request);

    // Step 2: create a new application
    const createResponse = await request.post('/api/applications', {
      data: {
        companyName: 'Delete Test Company',
        roleTitle: 'Test Role',
        createdBy: 'playwright-test-user'
      }
    });

    expect(createResponse.status()).toBe(201);

    const createdApplication = await createResponse.json();

    expect(createdApplication.error).toBeNull();

    const applicationId = createdApplication.data._id;

    expect(applicationId).toBeTruthy();

    // Step 3: delete the application
    const deleteResponse = await request.delete(`/api/applications/${applicationId}`, {
      headers: {
        'auth-token': token
      }
    });

    expect(deleteResponse.status()).toBe(200);

    const body = await deleteResponse.json();

    expect(body.error).toBeNull();
    expect(body.data).toBe(true);

  });

});