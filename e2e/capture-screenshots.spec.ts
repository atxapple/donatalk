import { test } from '@playwright/test';

const LISTENER_UID = 'ASrRQKr2g8NRBsAGOQAUZ7txzXi2';
const PITCHER_UID = 'ASrRQKr2g8NRBsAGOQAUZ7txzXi2';

// These tests deliberately don't assert — they exist to capture screenshots
// of the production-rendered states for visual review.
test.describe('Visual capture — anonymous flows', () => {
  test('listener page anonymous gate', async ({ page }) => {
    await page.goto(`/listener/${LISTENER_UID}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-screenshots/01-listener-anon-gate.png', fullPage: true });
  });

  test('pitcher page anonymous gate or inactive', async ({ page }) => {
    await page.goto(`/pitcher/${PITCHER_UID}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-screenshots/02-pitcher-anon-gate.png', fullPage: true });
  });

  test('login page', async ({ page }) => {
    await page.goto(`/login?return=${encodeURIComponent(`/listener/${LISTENER_UID}`)}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-screenshots/03-login.png', fullPage: true });
  });

  test('pitcher signup with return param', async ({ page }) => {
    await page.goto(`/pitcher/signup?return=${encodeURIComponent(`/listener/${LISTENER_UID}`)}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-screenshots/04-pitcher-signup.png', fullPage: true });
  });

  test('listener signup with return param', async ({ page }) => {
    await page.goto(`/listener/signup?return=${encodeURIComponent(`/pitcher/${PITCHER_UID}`)}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-screenshots/05-listener-signup.png', fullPage: true });
  });

  test('arrange-meeting fallback', async ({ page }) => {
    await page.goto('/listener/arrange-meeting');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-screenshots/06-arrange-meeting-deleted.png', fullPage: true });
  });
});
