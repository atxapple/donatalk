import { test, Page } from '@playwright/test';

const YUN_EMAIL = process.env.E2E_USER_YUN_EMAIL!;
const YUN_PASSWORD = process.env.E2E_USER_YUN_PASSWORD!;
const MOK_EMAIL = process.env.E2E_USER_MOK_EMAIL!;
const MOK_PASSWORD = process.env.E2E_USER_MOK_PASSWORD!;

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
}

test('Yun listener dashboard screenshot', async ({ page }) => {
  await loginAs(page, YUN_EMAIL, YUN_PASSWORD);
  await page.goto('/listener/profile');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'e2e-screenshots/dash-01-yun-listener.png', fullPage: true });
});

test('Mok pitcher dashboard screenshot', async ({ page }) => {
  await loginAs(page, MOK_EMAIL, MOK_PASSWORD);
  await page.goto('/pitcher/profile');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'e2e-screenshots/dash-02-mok-pitcher.png', fullPage: true });
});
