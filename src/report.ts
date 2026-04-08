import * as fs from 'fs';
import * as path from 'path';
import type { Config } from './config.js';

export interface TestResult {
  id: string;
  category: string;
  prompt: string;
  expected?: string;
  waitSeconds: number;
  timedOut: boolean;
  screenshotFile: string;
}

export function generateReport(config: Config, results: TestResult[]): string {
  const lines: string[] = [];

  lines.push('# Iterable Assist — Test Run Report');
  lines.push('');
  lines.push(`**Date:** ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}`);
  lines.push(`**Run ID:** ${config.runTimestamp}`);
  lines.push(`**URL:** ${config.baseUrl}`);
  lines.push(`**Tests run:** ${results.length} / ${config.prompts.length}`);
  lines.push(`**Mode:** ${config.headed ? 'headed' : 'headless'}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Results');
  lines.push('');
  lines.push('| # | Category | Prompt | Wait (s) | Status | Screenshot |');
  lines.push('|---|----------|--------|----------|--------|------------|');

  for (const r of results) {
    const status = r.timedOut ? '⚠️ Timed out' : '✅ Complete';
    const truncatedPrompt = r.prompt.length > 60 ? r.prompt.slice(0, 57) + '...' : r.prompt;
    lines.push(`| ${r.id} | ${r.category} | ${truncatedPrompt} | ${r.waitSeconds} | ${status} | ${r.screenshotFile} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Detailed Results');
  lines.push('');

  for (const r of results) {
    lines.push(`### ${r.id} — ${r.category}`);
    lines.push('');
    lines.push(`**Prompt:** ${r.prompt}`);
    if (r.expected) {
      lines.push('');
      lines.push(`**Expected:** ${r.expected}`);
    }
    lines.push('');
    lines.push(`**Wait time:** ${r.waitSeconds}s${r.timedOut ? ' (timed out)' : ''}`);
    lines.push('');
    lines.push(`![${r.id} screenshot](${r.screenshotFile})`);
    lines.push('');
  }

  return lines.join('\n');
}

export function writeReport(config: Config, results: TestResult[]): string {
  const markdown = generateReport(config, results);
  const reportPath = path.join(config.screenshotDir, 'REPORT.md');
  fs.writeFileSync(reportPath, markdown, 'utf-8');
  return reportPath;
}
