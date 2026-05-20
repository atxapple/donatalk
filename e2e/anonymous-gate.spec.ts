import { test, expect } from '@playwright/test';

// Real listener uid that exists in production (Youngmok Yun, donation $1).
// If this account is removed, swap for any other set-up listener uid.
const LISTENER_UID = 'ASrRQKr2g8NRBsAGOQAUZ7txzXi2';
const PITCHER_UID = 'ASrRQKr2g8NRBsAGOQAUZ7txzXi2'; // same uid, dual-profile system

test.describe('Anonymous gate on /listener/{uid}', () => {
  test('shows Sign Up + Log In buttons; no anonymous form rendered', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`/listener/${LISTENER_UID}`);

    // Wait for client-side hydration to resolve (auth state -> render branch).
    await expect(page.getByRole('button', { name: /Sign up as Pitcher/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Log in/i })).toBeVisible();

    // No anonymous form: no "Your name" / "Your email" inputs.
    await expect(page.getByPlaceholder(/Your name/i)).toHaveCount(0);
    await expect(page.getByPlaceholder(/Your email/i)).toHaveCount(0);

    expect(errors, `page errors: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('Sign Up link carries ?return= to /pitcher/signup', async ({ page }) => {
    await page.goto(`/listener/${LISTENER_UID}`);
    const signUp = page.getByRole('link', { name: /Sign up as Pitcher/i });
    await expect(signUp).toBeVisible({ timeout: 15_000 });

    // Inspect href before clicking — verifies the ?return= encoding.
    const href = await signUp.getAttribute('href');
    expect(href).toBe(`/pitcher/signup?return=${encodeURIComponent(`/listener/${LISTENER_UID}`)}`);

    await signUp.click();
    await page.waitForURL(/\/pitcher\/signup/);
    expect(page.url()).toContain('return=');
    expect(page.url()).toContain(encodeURIComponent(`/listener/${LISTENER_UID}`));

    // Signup page rendered — the heading is unique even if buttons aren't.
    await expect(page.getByRole('heading', { name: /Sign Up as a Pitcher/i })).toBeVisible();
    // The form submit button is exactly "Sign Up" (not "Sign up with Google").
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
  });

  test('Log In link carries ?return= to /login', async ({ page }) => {
    await page.goto(`/listener/${LISTENER_UID}`);
    const login = page.getByRole('link', { name: /Log in/i });
    await expect(login).toBeVisible({ timeout: 15_000 });

    const href = await login.getAttribute('href');
    expect(href).toBe(`/login?return=${encodeURIComponent(`/listener/${LISTENER_UID}`)}`);

    await login.click();
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('return=');
  });
});

test.describe('Anonymous gate on /pitcher/{uid}', () => {
  test('shows the appropriate page or gate (not the anonymous form)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`/pitcher/${PITCHER_UID}`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Three valid outcomes:
    // (a) anonymous gate (Sign up as Listener + Log in) — if the pitcher side is set up + active
    // (b) "link inactive" infobox — if the pitcher's available balance is below required
    // (c) "not yet available" — if the pitcher profile is a stub
    const signUpVisible = await page.getByRole('button', { name: /Sign up as Listener/i }).isVisible().catch(() => false);
    const inactiveVisible = await page.getByText(/link is currently inactive/i).isVisible().catch(() => false);
    const notAvailableVisible = await page.getByText(/not yet available/i).isVisible().catch(() => false);

    expect(
      signUpVisible || inactiveVisible || notAvailableVisible,
      `Expected one of: anonymous-gate, link-inactive, not-yet-available. Page text: ${(await page.locator('body').innerText()).slice(0, 500)}`,
    ).toBe(true);

    // No anonymous booking form rendered regardless of which branch.
    await expect(page.getByPlaceholder(/Your name/i)).toHaveCount(0);

    expect(errors, `page errors: ${errors.join(' | ')}`).toHaveLength(0);
  });
});

test.describe('?return= validation on login/signup pages', () => {
  test('login page loads with safe return path', async ({ page }) => {
    await page.goto(`/login?return=${encodeURIComponent(`/listener/${LISTENER_UID}`)}`);
    // Login form submit button (exact match — there's also "Sign in with Google").
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    // Email/password inputs by name attribute (the page uses styled <Label> divs,
    // not real <label for>, so getByLabel won't match).
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('login page still loads with an unsafe return param (gracefully ignored)', async ({ page }) => {
    await page.goto(`/login?return=${encodeURIComponent('//evil.com')}`);
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    // We can't observe the post-login routing without auth, but rendering = pass.
  });

  test('pitcher signup loads with safe return', async ({ page }) => {
    await page.goto(`/pitcher/signup?return=${encodeURIComponent(`/listener/${LISTENER_UID}`)}`);
    await expect(page.getByRole('heading', { name: /Sign Up as a Pitcher/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
  });

  test('listener signup loads with safe return', async ({ page }) => {
    await page.goto(`/listener/signup?return=${encodeURIComponent(`/pitcher/${PITCHER_UID}`)}`);
    await expect(page.getByRole('heading', { name: /Sign Up as a Listener/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible();
  });
});

test.describe('Dead routes are gone', () => {
  test('/listener/arrange-meeting permanently redirects to /', async ({ page }) => {
    // Configured in next.config.ts. 308 → / → Next.js root redirects to /login.
    await page.goto('/listener/arrange-meeting');
    // End state: user lands somewhere usable, not on a "Listener not found" dead end.
    await page.waitForURL((url) => !url.pathname.startsWith('/listener/arrange-meeting'), { timeout: 15_000 });
    expect(page.url()).not.toContain('/listener/arrange-meeting');
  });

  test('POST /api/escrow-log returns 404 (route deleted)', async ({ request }) => {
    const res = await request.post('/api/escrow-log', { data: {} });
    expect(res.status()).toBe(404);
  });
});

test.describe('New booking endpoints exist and reject unauth properly', () => {
  test('POST /api/book-meeting-from-balance returns 401 without token', async ({ request }) => {
    const res = await request.post('/api/book-meeting-from-balance', { data: {} });
    expect(res.status()).toBe(401);
  });

  test('POST /api/request-meeting returns 401 without token', async ({ request }) => {
    const res = await request.post('/api/request-meeting', { data: {} });
    expect(res.status()).toBe(401);
  });

  test('GET /api/meeting/test/accept returns 400 without token query', async ({ request }) => {
    const res = await request.get('/api/meeting/test/accept');
    expect(res.status()).toBe(400);
  });

  test('GET /api/meeting/test/decline returns 400 without token query', async ({ request }) => {
    const res = await request.get('/api/meeting/test/decline');
    expect(res.status()).toBe(400);
  });

  test('POST /api/meeting/test/cancel returns 401 without token', async ({ request }) => {
    const res = await request.post('/api/meeting/test/cancel', { data: {} });
    expect(res.status()).toBe(401);
  });
});
