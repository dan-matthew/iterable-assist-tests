---
name: iterable-assist-tests
description: >-
  Run Iterable Assist (Nova Agent) browser tests using the iterable-assist-tests
  suite. Sends prompts to the Assist panel, waits for streamed responses, captures
  screenshots, and generates markdown reports. Use when the user mentions Iterable
  Assist testing, bug bash, Nova Agent testing, Assist screenshots, or running
  Assist prompts in the browser.
---

# Iterable Assist Browser Test Suite

## Prerequisites

First-time setup from the repo root:

```bash
npm install
npx playwright install chromium
```

## Configuration (2 files, both gitignored)

### 1. `.env` — Session cookies

Copy from `.env.example` and fill in fresh cookies from `app.iterable.com` → DevTools → Application → Cookies:

```
ITERABLE_SESSION=<paste ITERABLE_SESSION cookie value>
XSRF_TOKEN=<paste XSRF-TOKEN cookie value>
BASE_URL=https://app.iterable.com
BROWSER_MODE=headed
```

**Cookies expire frequently.** If the runner lands on a login page, get fresh cookies.

### 2. `prompts.json` — Test scenarios

Copy from `prompts.example.json`. Each entry:

```json
{
  "id": "01",
  "category": "Summary",
  "prompt": "How did my Presidents Day Sale campaign perform?",
  "expected": "Should return summary with Total Sent, CTR, Open Rate, Unsub Rate."
}
```

Use **real campaign names** from the user's Iterable project. The `prompts.example.json` has placeholder names — replace `[Campaign Name]` with actual data.

## Running Tests

```bash
# Validate setup first
npm run validate

# Run all tests (headed browser, default)
npm test

# Run headless
npm run test:headless

# Run specific tests by ID
npm test -- 01 03 07

# Run specific tests headless
npm run test:headless -- 01 03 07
```

## Output

Each run creates a timestamped folder:

```
screenshots/
└── 20260401_160035/
    ├── 01_summary.png
    ├── 02_metrics.png
    ├── ...
    └── REPORT.md        ← Markdown summary with results table
```

Open the folder after a run: `open screenshots/<timestamp>`

## Workflow: Full Bug Bash Run

1. **Check cookies** — If stale, get fresh ones from browser and update `.env`
2. **Check prompts** — Ensure `prompts.json` has campaign names that currently have data (sent in last 7-30 days)
3. **Validate** — `npm run validate`
4. **Run** — `npm test`
5. **Review** — Open the timestamped screenshot folder and read `REPORT.md`
6. **Re-run failures** — `npm test -- 03 09` (pass specific IDs)

## Workflow: Updating Prompts with Real Data

When campaign data changes or prompts need updating:

1. Ask the user for a CSV export from Messaging Insights (Campaign tab) or use the Iterable MCP `get_campaigns` tool
2. Pick campaigns with recent activity (last 7-30 days) that have meaningful metrics (sends, clicks, opens)
3. Update `prompts.json` with real campaign names
4. For ambiguity tests, use campaign names that appear more than once (e.g., "welcome email")
5. For not-found tests, use a campaign name that doesn't exist
6. For pre-Nov tests, reference a date before November 11, 2025

## Bug Bash Scenario Reference

| # | Category | What it tests |
|---|----------|---------------|
| 01 | Summary | Single campaign performance (Total Sent, CTR, Open Rate, Unsub Rate) |
| 02 | Metrics | Aggregated counts across campaigns (no aggregated rates) |
| 03 | Visualization | Time series chart for single campaign |
| 04 | Visualization | Multi-campaign comparison chart |
| 05 | Summary | Weekly summary with channel breakdown + top 3 ranking |
| 06 | Ranking | Top Push campaigns ranked by Open Rate (not CTR) |
| 07 | Rates | Campaign outside requested timeframe detection |
| 08 | Rates | Aggregated rate rejection (rates across multiple campaigns) |
| 09 | Ambiguity | Disambiguation when multiple campaigns share a name |
| 10 | Pre-Nov | Data boundary: no analytics before Nov 11, 2025 |
| 11 | Not Found | Non-existent campaign → show recent alternatives |
| 12 | Unsupported | Unsupported metric (revenue) → list supported metrics |
| 13 | Filtered | Bot-filtered metrics rejection → offer unfiltered alternative |
| 14 | Summary-Nov | Partial month summary (Nov 11-30, 2025 only) |
| 15 | Scale | Dual Y-axis: two metrics with different scales |
| 16 | Comparison | Side-by-side campaign comparison |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Landed on login page" | Session expired. Get fresh cookies from browser → update `.env` |
| "Could not open Assist panel" | Assist button selector may have changed. Check `src/assist.ts` selectors |
| Screenshots show "Responding..." | Response took >90s. Re-run that specific test: `npm test -- 05` |
| "prompts.json not found" | `cp prompts.example.json prompts.json` and fill in real data |
| Campaign "not found" by Assist | Campaign name doesn't match or has no data in the requested window. Update `prompts.json` with active campaigns |
