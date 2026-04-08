import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './config.js';
import { openAssistPanel, ensureAssistOpen, submitPrompt, waitForResponse, scrollToBottom } from './assist.js';
import { writeReport, type TestResult } from './report.js';

async function main() {
  const config = loadConfig(process.argv);

  console.log(`\n  Iterable Assist Test Runner`);
  console.log(`  Env: ${config.env} (${config.baseUrl})`);
  console.log(`  Run: ${config.runTimestamp}`);
  console.log(`  Mode: ${config.headed ? 'headed' : 'headless'}`);
  console.log(`  Tests: ${config.prompts.length}${config.filterIds.length ? ` (filtered: ${config.filterIds.join(', ')})` : ''}`);
  console.log(`  Screenshots: ${config.screenshotDir}\n`);

  fs.mkdirSync(config.screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: !config.headed,
    channel: 'chrome',
  });
  const context = await browser.newContext({ viewport: config.viewport });

  await context.addCookies([
    {
      name: 'ITERABLE_SESSION',
      value: config.sessionCookie,
      domain: config.cookieDomain,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'XSRF-TOKEN',
      value: config.xsrfToken,
      domain: config.cookieDomain,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();
  const baseUrl = `${config.baseUrl}/?aggregatedMetrics=true`;

  console.log('Navigating to Iterable...');
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const url = page.url();
  if (url.includes('login') || url.includes('signin') || url.includes('auth')) {
    console.error('ERROR: Landed on login page — session expired. Update .env with fresh cookies.');
    await browser.close();
    process.exit(1);
  }

  console.log('Opening Assist panel...');
  const opened = await openAssistPanel(page);
  if (!opened) {
    console.error('ERROR: Could not open Assist panel. Check selectors.');
    await page.screenshot({ path: path.join(config.screenshotDir, '00_debug.png') });
    await browser.close();
    process.exit(1);
  }

  const results: TestResult[] = [];

  for (const { id, category, prompt, expected } of config.prompts) {
    console.log(`\n[${id}] ${category}: ${prompt}`);

    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await ensureAssistOpen(page);

    await submitPrompt(page, prompt);
    console.log('  Submitted, waiting for response...');

    const { waitSeconds, timedOut } = await waitForResponse(page);
    await scrollToBottom(page);

    const filename = `${id}_${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    const screenshotPath = path.join(config.screenshotDir, filename);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Screenshot: ${filename}`);

    results.push({ id, category, prompt, expected, waitSeconds, timedOut, screenshotFile: filename });
  }

  const reportPath = writeReport(config, results);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  All ${results.length} tests complete!`);
  console.log(`  Screenshots: ${config.screenshotDir}`);
  console.log(`  Report: ${reportPath}`);
  console.log(`${'='.repeat(60)}\n`);

  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
