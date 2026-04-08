import type { Page } from '@playwright/test';

const ASSIST_SELECTORS = [
  'button[aria-label*="Assist"]',
  'button[aria-label*="assist"]',
  'button[aria-label*="AI"]',
  'button[data-test*="assist"]',
  'button[data-test*="iterable-assist"]',
  '[class*="assist"] button',
  '[class*="Assist"] button',
  'nav button:last-child',
  'header button:last-child',
];

const TEXTAREA_SELECTOR = 'textarea[name="input"], textarea[placeholder="Ask anything"]';

export async function openAssistPanel(page: Page): Promise<boolean> {
  for (const sel of ASSIST_SELECTORS) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        console.log(`  Found Assist button: ${sel}`);
        await btn.click();
        await page.waitForTimeout(2000);
        return true;
      }
    } catch {
      // try next
    }
  }

  console.log('  Trying top-bar buttons as fallback...');
  const topButtons = page.locator('nav button, header button, [role="banner"] button');
  const count = await topButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    try {
      await topButtons.nth(i).click();
      await page.waitForTimeout(1500);
      if (await page.locator(TEXTAREA_SELECTOR).first().isVisible({ timeout: 1000 })) {
        console.log(`  Textarea appeared after clicking button ${i}`);
        return true;
      }
    } catch {
      // continue
    }
  }

  return false;
}

export async function ensureAssistOpen(page: Page): Promise<void> {
  const ta = page.locator(TEXTAREA_SELECTOR).first();
  if (await ta.isVisible({ timeout: 2000 }).catch(() => false)) return;
  await openAssistPanel(page);
}

export async function submitPrompt(page: Page, prompt: string): Promise<void> {
  const textarea = page.locator(TEXTAREA_SELECTOR).first();
  await textarea.waitFor({ state: 'visible', timeout: 10000 });
  await textarea.click();
  await textarea.fill(prompt);
  await page.waitForTimeout(500);
  await textarea.press('Enter');
}

export async function waitForResponse(page: Page): Promise<{ waitSeconds: number; timedOut: boolean }> {
  // Phase 1: wait for "Responding..." to APPEAR
  let streamingDetected = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    const isResponding = await page.evaluate(() => document.body.textContent?.includes('Responding...') ?? false);
    if (isResponding) {
      console.log(`    Streaming started after ${(i + 1) * 0.5}s`);
      streamingDetected = true;
      break;
    }
  }

  if (!streamingDetected) {
    console.log('    No "Responding..." detected — waiting 15s for safety');
    await page.waitForTimeout(15000);
    return { waitSeconds: 25, timedOut: false };
  }

  // Phase 2: wait for "Responding..." to DISAPPEAR
  let timedOut = false;
  let elapsed = 0;
  for (let attempt = 0; attempt < 90; attempt++) {
    await page.waitForTimeout(1000);
    elapsed = attempt + 1;
    const isResponding = await page.evaluate(() => document.body.textContent?.includes('Responding...') ?? false);
    if (!isResponding) {
      console.log(`    Response complete after ${elapsed}s of streaming`);
      break;
    }
    if (attempt === 89) {
      console.log('    WARNING: Still streaming after 90s, capturing anyway');
      timedOut = true;
    }
  }

  // Buffer for rendering, charts, animations
  await page.waitForTimeout(3000);
  return { waitSeconds: elapsed + 3, timedOut };
}

export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    const viewport = document.querySelector('[class*="thread-viewport"]');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  });
  await page.waitForTimeout(1000);
}
