import { expect, test } from "@playwright/test";
import { getTestEmail, requireTestPassword, TEST_USERNAME } from "./helpers/testUser";

const duplicateEmail = getTestEmail();
const duplicatePassword = requireTestPassword();

test("should reject duplicate email registration", async ({ request }) => {
  const user = {
    username: TEST_USERNAME,
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
