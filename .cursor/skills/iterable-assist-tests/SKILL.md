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

## Setup Workflow

When the user asks to run Assist tests, follow this workflow to gather everything needed.

### Step 1: Check dependencies

Run `npm run validate` from the repo root. If it fails on missing packages:

```bash
npm install
npx playwright install chromium
```

### Step 2: Check `.env` — collect cookies from user if missing

Run `npm run validate`. If it reports `.env` missing or cookies not set:

1. Tell the user: "I need your Iterable session cookies. Please do the following:"
   - Open `app.iterable.com` in Chrome
   - Open DevTools (Cmd+Option+I) → Application tab → Cookies → `app.iterable.com`
   - Copy the value of `ITERABLE_SESSION`
   - Copy the value of `XSRF-TOKEN`
   - Paste both values here
2. Once the user provides cookies, write the `.env` file:

```
ITERABLE_SESSION=<value from user>
XSRF_TOKEN=<value from user>
BASE_URL=https://app.iterable.com
BROWSER_MODE=headed
```

### Step 3: Check `prompts.json` — collect campaign data from user if missing

If `prompts.json` doesn't exist, you need real campaign names. Ask the user:

"I need real campaign names from your Iterable project to build the test prompts. Can you either:
  - **Option A**: Share a CSV export from Messaging Insights → Campaigns tab, or
  - **Option B**: Tell me 3-5 campaign names that have recent activity (sent in the last 7-30 days)"

Once you have campaign data, build `prompts.json` using these rules:

| Test # | Category | What campaign data is needed |
|--------|----------|------------------------------|
| 01 | Summary | A campaign with recent sends + clicks + opens |
| 02 | Metrics | No specific campaign needed (aggregates all Email) |
| 03 | Visualization | A **uniquely named** campaign with recent activity (not a name shared by multiple campaigns) |
| 04 | Visualization | 3 campaigns with recent activity in the same week |
| 05 | Summary | No specific campaign needed (weekly aggregate) |
| 06 | Ranking | Use "last month" if current month just started. Need Push campaigns with data, or change to Email |
| 07 | Rates | Any campaign name + a time period BEFORE the campaign was sent |
| 08 | Rates | No specific campaign needed (aggregates SMS) |
| 09 | Ambiguity | A campaign name that appears MORE THAN ONCE in the data (e.g., "welcome email") |
| 10 | Pre-Nov | Any campaign name + "October 2025" (before Nov 11 2025 data boundary) |
| 11 | Not Found | A campaign name that does NOT exist (e.g., "Cyber Monday Deals") |
| 12 | Unsupported | Any real campaign name (asks about "revenue" which is unsupported) |
| 13 | Filtered | Any real campaign name (asks about "excluding bot traffic") |
| 14 | Summary-Nov | No specific campaign needed (asks about November 2025) |
| 15 | Scale | No specific campaign needed (asks for sends + clicks chart — different scales) |
| 16 | Comparison | 2 campaigns with recent activity + include "over the past week" in the prompt |

Use `prompts.example.json` as the template structure. Write the completed file to `prompts.json`.

### Step 4: Validate and run

```bash
npm run validate    # Should pass now
npm test            # Run all tests (headed browser)
```

To run specific tests: `npm test -- 01 03 07`
To run headless: `npm run test:headless`

### Step 5: Review results

After the run completes:
1. Open the timestamped screenshot folder: `open screenshots/<timestamp>`
2. Read the `REPORT.md` inside that folder for a summary table
3. Review screenshots for any that show "Responding..." (need re-run) or unexpected responses

### Step 6: Re-run failures

If any tests need re-running: `npm test -- 03 09` (pass the specific IDs)

## Bug Bash Scenario Reference

| # | Category | Expected behavior |
|---|----------|-------------------|
| 01 | Summary | Returns Total Sent, CTR, Open Rate, Unsub Rate. Compares to top 3. Default 7 days. |
| 02 | Metrics | Aggregated count. No aggregated CTR. |
| 03 | Visualization | Time series chart with daily granularity. 2-4 sentence summary. |
| 04 | Visualization | Chart with 3 campaign series + legend with names. |
| 05 | Summary | # campaigns by channel, channel-level counts, top 3 by CTR. |
| 06 | Ranking | Ranked by Open Rate (not CTR). Flag if Unsub >1%. Show top 3, offer next 2. |
| 07 | Rates | Detects campaign outside timeframe. Offers to show original period. |
| 08 | Rates | Refuses aggregated rate. Offers individual rates or count aggregates. |
| 09 | Ambiguity | Lists all matches with name, channel, ID. Asks user to clarify. |
| 10 | Pre-Nov | Explains no data before Nov 11, 2025. |
| 11 | Not Found | Says not found. Shows 3 most recent campaigns. Asks if user wants those. |
| 12 | Unsupported | Says revenue not supported. Lists supported metrics. Asks "Would any help?" |
| 13 | Filtered | Says bot-filtered not available. Provides unfiltered CTR instead. |
| 14 | Summary-Nov | Summarizes Nov 11-30 only. Displays data boundary warning. |
| 15 | Scale | Charts two metrics with different scales. Dual Y-axis or log scale. |
| 16 | Comparison | Side-by-side comparison with supported metrics. |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Landed on login page" | Session expired. Ask user for fresh cookies → update `.env` |
| "Could not open Assist panel" | Assist button selector changed. Check `src/assist.ts` |
| Screenshots show "Responding..." | Response took >90s. Re-run: `npm test -- <id>` |
| "prompts.json not found" | Need campaign data from user. Follow Step 3 above. |
| Campaign "not found" by Assist | Campaign has no data in the time window. Ask user for active campaigns. |
