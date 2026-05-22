import { test, expect, Page, BrowserContext } from '@playwright/test';

const LISTENER_UID_YUN = 'ASrRQKr2g8NRBsAGOQAUZ7txzXi2';
const YUN_EMAIL = process.env.E2E_USER_YUN_EMAIL!;
const YUN_PASSWORD = process.env.E2E_USER_YUN_PASSWORD!;
const MOK_EMAIL = process.env.E2E_USER_MOK_EMAIL!;
const MOK_PASSWORD = process.env.E2E_USER_MOK_PASSWORD!;
const EXPECTED = 1.05;
const NOTE = 'E2E-ESCROW-MOK-TO-YUN';

test.beforeAll(() => {
  if (!YUN_EMAIL || !YUN_PASSWORD || !MOK_EMAIL || !MOK_PASSWORD) {
    throw new Error('E2E_USER_*_{EMAIL,PASSWORD} env vars required.');
  }
});

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
}

async function logout(page: Page) {
  await page.goto('/choose-a-profile');
  const btn = page.getByRole('button', { name: /Logout/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(() => {});
  }
}

async function readMokTotal(page: Page): Promise<number> {
  await page.goto('/pitcher/profile');
  await expect(page.getByText('Total')).toBeVisible({ timeout: 20_000 });
  const txt = await page.locator(':text("Total") + div, .balance-total').first().textContent().catch(() => null);
  // BalanceBreakdown renders Total cell — read the third balance value.
  const cells = await page.locator('text=/^\\$[0-9]/').allTextContents();
  // Fallback: parse the "Total" cell specifically.
  const totalCell = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('*')).filter((e) => e.textContent?.trim() === 'Total');
    for (const l of labels) {
      const sib = l.nextElementSibling || l.parentElement?.querySelector('div:last-child');
      const v = sib?.textContent?.replace(/[^\d.]/g, '');
      if (v) return parseFloat(v);
    }
    return null;
  });
  void txt; void cells;
  if (totalCell === null) throw new Error('could not read Total balance');
  return totalCell;
}

test.describe.configure({ retries: 0 });

test.describe.serial('Escrow lifecycle: book → accept → no-show refund', () => {
  let context: BrowserContext;
  let page: Page;
  let totalBefore: number;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });
  test.afterAll(async () => { await context.close(); });

  test('0. pre-clean: Yun clears any stale reserved + escrowed meetings', async () => {
    await loginAs(page, YUN_EMAIL, YUN_PASSWORD);
    await page.goto('/listener/profile');
    // Decline stale reserved (Incoming pitch requests).
    const inboxHeading = page.getByRole('heading', { name: /Incoming pitch requests/i });
    if (await inboxHeading.isVisible({ timeout: 12_000 }).catch(() => false)) {
      for (let i = 0; i < 20; i++) {
        const decline = page.getByRole('button', { name: /Decline/i }).first();
        if (!(await decline.isVisible().catch(() => false))) break;
        page.once('dialog', (d) => d.accept());
        const p = page.waitForResponse((r) => r.url().endsWith('/respond') && r.request().method() === 'POST', { timeout: 30_000 });
        await decline.click();
        await p;
        await page.waitForTimeout(400);
      }
    }
    // No-show any stale escrowed (Upcoming meetings) to release Mok's balance.
    await page.goto('/listener/profile');
    const upcoming = page.getByRole('heading', { name: /Upcoming meetings/i });
    if (await upcoming.isVisible({ timeout: 8_000 }).catch(() => false)) {
      for (let i = 0; i < 20; i++) {
        const noShow = page.getByRole('button', { name: /No-show/i }).first();
        if (!(await noShow.isVisible().catch(() => false))) break;
        page.once('dialog', (d) => d.accept());
        const p = page.waitForResponse((r) => r.url().endsWith('/report-no-show') && r.request().method() === 'POST', { timeout: 30_000 });
        await noShow.click();
        await p;
        await page.waitForTimeout(400);
      }
    }
    await logout(page);
  });

  test('1. Mok books on Yun listener page → success card appears', async () => {
    await loginAs(page, MOK_EMAIL, MOK_PASSWORD);
    totalBefore = await readMokTotal(page);
    console.log('Mok total before:', totalBefore);

    await page.goto(`/listener/${LISTENER_UID_YUN}`);
    await expect(page.getByRole('button', { name: /Book meeting/i })).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder(/Available times or message/i).fill(NOTE);

    const bookPromise = page.waitForResponse(
      (r) => r.url().endsWith('/api/book-meeting-from-balance') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await page.getByRole('button', { name: /Book meeting/i }).click();
    const res = await bookPromise;
    expect(res.status()).toBe(200);

    // The success card (the original ask) should replace the form.
    await expect(page.getByRole('heading', { name: /Reservation made/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/held in escrow/i)).toBeVisible();
    await expect(page.getByText(/refunded to you/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /View my Pitcher Profile/i })).toBeVisible();
    await page.screenshot({ path: 'e2e-screenshots/escrow-01-success-card.png', fullPage: true });
  });

  test('2. Yun accepts → meeting moves to escrow', async () => {
    await logout(page);
    await loginAs(page, YUN_EMAIL, YUN_PASSWORD);
    await page.goto('/listener/profile');
    await expect(page.getByRole('heading', { name: /Incoming pitch requests/i })).toBeVisible({ timeout: 20_000 });
    const respondPromise = page.waitForResponse((r) => r.url().endsWith('/respond') && r.request().method() === 'POST', { timeout: 30_000 });
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /Accept/i }).first().click();
    const res = await respondPromise;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.action).toBe('accepted');

    // Now Yun's dashboard should show it under Upcoming meetings.
    await page.goto('/listener/profile');
    await expect(page.getByRole('heading', { name: /Upcoming meetings/i })).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: 'e2e-screenshots/escrow-02-yun-upcoming.png', fullPage: true });
  });

  test('3. Mok dashboard shows the escrowed meeting', async () => {
    await logout(page);
    await loginAs(page, MOK_EMAIL, MOK_PASSWORD);
    await page.goto('/pitcher/profile');
    await expect(page.getByRole('heading', { name: /Escrowed meetings/i })).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: 'e2e-screenshots/escrow-03-mok-escrowed.png', fullPage: true });
  });

  test('4. Mok reports no-show → refund, balance restored', async () => {
    await page.goto('/pitcher/profile');
    await expect(page.getByRole('heading', { name: /Escrowed meetings/i })).toBeVisible({ timeout: 20_000 });
    const refundPromise = page.waitForResponse((r) => r.url().endsWith('/report-no-show') && r.request().method() === 'POST', { timeout: 30_000 });
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /No-show/i }).first().click();
    const res = await refundPromise;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('refunded');
    expect(body.refundedAmount).toBeCloseTo(EXPECTED, 2);

    const totalAfter = await readMokTotal(page);
    console.log('Mok total after refund:', totalAfter, 'before:', totalBefore);
    // Net zero: reserved at booking, refunded at no-show.
    expect(totalAfter).toBeCloseTo(totalBefore, 1);
    await page.screenshot({ path: 'e2e-screenshots/escrow-04-mok-after-refund.png', fullPage: true });
  });
});
