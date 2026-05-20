import { test, expect, Page, BrowserContext } from '@playwright/test';

const LISTENER_UID_YUN = 'ASrRQKr2g8NRBsAGOQAUZ7txzXi2';
const YUN_EMAIL = process.env.E2E_USER_YUN_EMAIL!;
const YUN_PASSWORD = process.env.E2E_USER_YUN_PASSWORD!;
const MOK_EMAIL = process.env.E2E_USER_MOK_EMAIL!;
const MOK_PASSWORD = process.env.E2E_USER_MOK_PASSWORD!;
const EXPECTED_RESERVED = 1.05; // Yun's $1.00 donation × 1.049 fee, ceil to cent
const TEST_AVAILABILITY = 'E2E-AVAIL-MOK-TO-YUN';

test.beforeAll(() => {
  if (!YUN_EMAIL || !YUN_PASSWORD || !MOK_EMAIL || !MOK_PASSWORD) {
    throw new Error('E2E_USER_*_{EMAIL,PASSWORD} env vars required.');
  }
});

async function loginAs(page: Page, email: string, password: string, returnPath?: string) {
  const url = returnPath ? `/login?return=${encodeURIComponent(returnPath)}` : '/login';
  await page.goto(url);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
}

async function logout(page: Page) {
  await page.goto('/choose-a-profile');
  const btn = page.getByRole('button', { name: /Logout/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(() => {});
  }
}

async function readMokBalances(page: Page): Promise<{ available: number; reserved: number; total: number }> {
  await page.goto('/pitcher/profile');
  await expect(page.getByText('Available Balance ($):')).toBeVisible({ timeout: 20_000 });
  const get = async (label: string) => {
    const v = await page.locator(`:text("${label}") + div`).first().textContent();
    return v ? parseFloat(v.replace(/[^\d.]/g, '')) : 0;
  };
  const available = await get('Available Balance ($):');
  const reserved = await page.getByText('Reserved (pending pitches):').isVisible()
    ? await get('Reserved (pending pitches):')
    : 0;
  const total = await get('Total Balance ($):');
  return { available, reserved, total };
}

// Single shared context so cookies / Firebase IndexedDB persist across the steps
// we deliberately log in and out within.
test.describe.configure({ retries: 0 });

test.describe.serial('Full book → in-app accept flow', () => {
  let context: BrowserContext;
  let page: Page;
  let initialBalance: { available: number; reserved: number; total: number };
  let bookedMeetingId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('0. cleanup: as Yun, decline any stale pre-existing Mok reservations from earlier runs', async () => {
    await loginAs(page, YUN_EMAIL, YUN_PASSWORD);
    await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
    await page.goto('/listener/profile');
    // Wait for the Firestore-backed inbox to settle. `isVisible()` is a passive
    // check (does not wait), so use the expect-based form to actually block.
    const inboxHeading = page.getByRole('heading', { name: /Incoming pitch requests/i });
    let hasInbox = true;
    try {
      await expect(inboxHeading).toBeVisible({ timeout: 15_000 });
    } catch {
      hasInbox = false;
    }
    if (!hasInbox) {
      console.log('Pre-cleanup: no stale reservations to clear.');
      await logout(page);
      return;
    }

    for (let i = 0; i < 20; i++) {
      const decline = page.getByRole('button', { name: /Decline/i }).first();
      if (!(await decline.isVisible().catch(() => false))) break;
      page.once('dialog', (d) => d.accept());
      const respondPromise = page.waitForResponse(
        (r) => r.url().endsWith('/respond') && r.request().method() === 'POST',
        { timeout: 30_000 },
      );
      await decline.click();
      await respondPromise;
      await page.waitForTimeout(400);
    }
    console.log('Pre-cleanup done — Yun listener inbox cleared.');
    await logout(page);
  });

  test('1. as Mok: read starting balances', async () => {
    await loginAs(page, MOK_EMAIL, MOK_PASSWORD);
    await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
    initialBalance = await readMokBalances(page);
    console.log('Mok starting balances:', initialBalance);
    expect(initialBalance.available).toBeGreaterThanOrEqual(EXPECTED_RESERVED);
    await page.screenshot({ path: 'e2e-screenshots/flow-01-mok-initial-balance.png', fullPage: true });
  });

  test('2. as Mok: book a meeting on Yun listener page', async () => {
    const bookPromise = page.waitForResponse(
      (r) => r.url().endsWith('/api/book-meeting-from-balance') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await page.goto(`/listener/${LISTENER_UID_YUN}`);
    await expect(page.getByRole('button', { name: /Book meeting/i })).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder(/Available times or message/i).fill(TEST_AVAILABILITY);
    await page.getByRole('button', { name: /Book meeting/i }).click();

    const res = await bookPromise;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('reserved');
    expect(body.reservedAmount).toBeCloseTo(EXPECTED_RESERVED, 2);
    bookedMeetingId = body.meetingId;
    console.log(`Booking succeeded — meetingId=${bookedMeetingId}, reservedAmount=$${body.reservedAmount}`);

    await expect(page.getByText(/Request sent/i)).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e-screenshots/flow-02-mok-booking-success.png', fullPage: true });
  });

  test('3. as Mok: reservedBalance increased by exactly the donation amount', async () => {
    const after = await readMokBalances(page);
    console.log('Mok after booking:', after);
    expect(after.reserved).toBeCloseTo(initialBalance.reserved + EXPECTED_RESERVED, 1);
    expect(after.available).toBeCloseTo(initialBalance.available - EXPECTED_RESERVED, 1);
    expect(after.total).toBeCloseTo(initialBalance.total, 1);
    // Pending pitches section visible
    await expect(page.getByRole('heading', { name: /Pending pitches/i })).toBeVisible();
    await page.screenshot({ path: 'e2e-screenshots/flow-03-mok-pending-shown.png', fullPage: true });
  });

  test('4. switch to Yun, accept the most recent incoming request in-app', async () => {
    await logout(page);
    await loginAs(page, YUN_EMAIL, YUN_PASSWORD);
    await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
    await page.goto('/listener/profile');

    await expect(page.getByRole('heading', { name: /Incoming pitch requests/i })).toBeVisible({ timeout: 20_000 });
    await page.screenshot({ path: 'e2e-screenshots/flow-04-yun-inbox.png', fullPage: true });

    const respondPromise = page.waitForResponse(
      (r) => r.url().includes('/api/meeting/') && r.url().endsWith('/respond') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );

    page.once('dialog', (d) => d.accept());
    // Cards are sorted desc by reservedAt — first Accept button is the newest meeting.
    await page.getByRole('button', { name: /Accept/i }).first().click();

    const res = await respondPromise;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.action).toBe('accepted');
    expect(body.amount).toBeCloseTo(EXPECTED_RESERVED, 2);
    console.log(`Accept succeeded — amount=$${body.amount}`);
    await page.screenshot({ path: 'e2e-screenshots/flow-05-yun-accepted.png', fullPage: true });
  });

  test('5. switch back to Mok: credit_balance reduced by reserved amount', async () => {
    await logout(page);
    await loginAs(page, MOK_EMAIL, MOK_PASSWORD);
    await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
    const finalBalance = await readMokBalances(page);
    console.log('Mok final balances:', finalBalance);
    // After accept: credit_balance went down by 1.05 (committed), reservedBalance also down by 1.05.
    // Net effect on available: still initial - 1.05 (because reserved went down too, but credit dropped equally).
    expect(finalBalance.total).toBeCloseTo(initialBalance.total - EXPECTED_RESERVED, 1);
    expect(finalBalance.available).toBeCloseTo(initialBalance.available - EXPECTED_RESERVED, 1);
    await page.screenshot({ path: 'e2e-screenshots/flow-06-mok-final-balance.png', fullPage: true });
  });

  test('6. cleanup: as Yun, decline any remaining stale E2E reservations from earlier retries', async () => {
    await logout(page);
    await loginAs(page, YUN_EMAIL, YUN_PASSWORD);
    await page.waitForURL(/\/choose-a-profile/, { timeout: 20_000 });
    await page.goto('/listener/profile');
    await page.waitForLoadState('domcontentloaded');

    // Loop and decline until the inbox is empty.
    for (let i = 0; i < 20; i++) {
      const stale = page.getByRole('button', { name: /Decline/i }).first();
      if (!(await stale.isVisible().catch(() => false))) break;
      page.once('dialog', (d) => d.accept());
      const respondPromise = page.waitForResponse(
        (r) => r.url().endsWith('/respond') && r.request().method() === 'POST',
        { timeout: 30_000 },
      );
      await stale.click();
      await respondPromise;
      // give the UI a tick to remove the card
      await page.waitForTimeout(300);
    }
    console.log('Cleanup complete — no more pending entries for Yun.');
    await page.screenshot({ path: 'e2e-screenshots/flow-07-yun-after-cleanup.png', fullPage: true });
  });
});
