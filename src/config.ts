import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

export interface Prompt {
  id: string;
  category: string;
  prompt: string;
  /** Appended when submitting to Assist (e.g. Iterable campaign IDs) so names disambiguate. */
  disambiguation?: string;
  expected?: string;
}

export interface Config {
  baseUrl: string;
  cookieDomain: string;
  sessionCookie: string;
  xsrfToken: string;
  headed: boolean;
  viewport: { width: number; height: number };
  prompts: Prompt[];
  filterIds: string[];
  screenshotDir: string;
  runTimestamp: string;
}

function fatal(msg: string): never {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exit(1);
}

export function loadConfig(argv: string[]): Config {
  const sessionCookie = process.env.ITERABLE_SESSION;
  const xsrfToken = process.env.XSRF_TOKEN;

  if (!sessionCookie) fatal('ITERABLE_SESSION not set. Copy .env.example → .env and fill in your session cookie.');
  if (!xsrfToken) fatal('XSRF_TOKEN not set. Copy .env.example → .env and fill in your XSRF token.');

  const promptsPath = path.resolve('prompts.json');
  if (!fs.existsSync(promptsPath)) fatal('prompts.json not found. Copy prompts.example.json → prompts.json and fill in real campaign data.');

  const allPrompts: Prompt[] = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));

  const cliFlags = argv.slice(2);
  const headed = cliFlags.includes('--headed') || (!cliFlags.includes('--headless') && process.env.BROWSER_MODE !== 'headless');
  const filterIds = cliFlags.filter((f) => !f.startsWith('--'));

  const now = new Date();
  const runTimestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  const screenshotDir = path.resolve('screenshots', runTimestamp);

  const baseUrl = process.env.BASE_URL || 'https://app.iterable.com';
  const cookieDomain = new URL(baseUrl).hostname;

  return {
    baseUrl,
    cookieDomain,
    sessionCookie,
    xsrfToken,
    headed,
    viewport: {
      width: Number(process.env.VIEWPORT_WIDTH) || 1440,
      height: Number(process.env.VIEWPORT_HEIGHT) || 900,
    },
    prompts: filterIds.length > 0 ? allPrompts.filter((p) => filterIds.includes(p.id)) : allPrompts,
    filterIds,
    screenshotDir,
    runTimestamp,
  };
}
