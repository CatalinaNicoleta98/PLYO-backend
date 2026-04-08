import { expect, test } from "@playwright/test";

const duplicateEmail = process.env.TEST_USER_EMAIL ?? "playwright-test@plyo.com";
const duplicatePassword = process.env.TEST_USER_PASSWORD ?? "123456";

test("should reject duplicate email registration", async ({ request }) => {
  const user = {
    email: duplicateEmail,
    password: duplicatePassword,
  };

  const response = await request.post("/api/auth/register", {
    data: user,
  });

  const responseBody = await response.json();

  expect([400, 409]).toContain(response.status());
  expect(JSON.stringify(responseBody).toLowerCase()).toContain("already");
});