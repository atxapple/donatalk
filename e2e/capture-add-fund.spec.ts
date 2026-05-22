import { test, Page } from '@playwright/test';

const MOK_EMAIL = process.env.E2E_USER_MOK_EMAIL!;
const MOK_PASSWORD = process.env.E2E_USER_MOK_PASSWORD!;

async function loginAsMok(page: Page) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(MOK_EMAIL);
  await page.locator('input[name="password"]').fill(MOK_PASSWORD);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
}

test('add-fund picker — no min', async ({ page }) => {
  await loginAsMok(page);
  await page.goto('/pitcher/add-fund');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'e2e-screenshots/add-fund-01-no-min.png', fullPage: true });
});

test('add-fund picker — with ?min=12.45 from listener page', async ({ page }) => {
  await loginAsMok(page);
  await page.goto('/pitcher/add-fund?min=12.45&return=%2Flistener%2FASrRQKr2g8NRBsAGOQAUZ7txzXi2');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'e2e-screenshots/add-fund-02-with-min.png', fullPage: true });
});
