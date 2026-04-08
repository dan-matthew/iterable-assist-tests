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

1. Ask the user: **"I need your Iterable session cookies to run the tests. Please:**
   - **Open `app.iterable.com` in Chrome**
   - **DevTools (Cmd+Option+I) → Application → Cookies → `app.iterable.com`**
   - **Copy the `ITERABLE_SESSION` value**
   - **Copy the `XSRF-TOKEN` value**
   - **Paste both here"**
2. Once the user provides cookies, write `.env`:

```
ITERABLE_SESSION=<value from user>
XSRF_TOKEN=<value from user>
BASE_URL=https://app.iterable.com
BROWSER_MODE=headed
```

### Step 3: Check `prompts.json` — build from inputs

If `prompts.json` doesn't exist, you need real campaign data. Check the `inputs/` folder for any of these files (in priority order):

#### Option A: All 3 inputs available (best)

If `inputs/` contains a **bug bash doc** (PDF/CSV), a **campaign CSV**, and an **MI screenshot**:

1. Read the **bug bash doc** to understand each test category's expected behavior
2. Read the **campaign CSV** to find real campaign names, channels, IDs, and metrics
3. Read the **MI screenshot** to see which channels have activity and overall metric ranges
4. Generate `prompts.json` using the campaign mapping rules below

#### Option B: Only campaign CSV available

If `inputs/` has a campaign CSV but no bug bash doc:

1. Read the CSV for campaign names and metrics
2. Use the Bug Bash Scenario Reference table below for expected behaviors
3. Generate `prompts.json`

#### Option C: No inputs — ask the user

If `inputs/` is empty, ask the user to provide files:

**"To generate accurate test prompts, I need some data from your Iterable project. Please drop any of these into the `inputs/` folder:**

1. **Bug bash test sheet** (PDF or CSV) — the test specification with expected behaviors
2. **Campaign CSV** — export from Messaging Insights → Campaigns tab → Export metrics
3. **MI overview screenshot** — screenshot of the Messaging Insights overview page

**The more you provide, the better the prompts will be. At minimum I need either the campaign CSV or a list of 3-5 active campaign names."**

#### Campaign-to-prompt mapping rules

When building `prompts.json` from campaign data:

| Test # | Category | What to pick from the data |
|--------|----------|----------------------------|
| 01 | Summary | A campaign with high sends + clicks + opens (best data) |
| 02 | Metrics | No specific campaign (aggregates all Email clicks) |
| 03 | Visualization | A **uniquely named** campaign (no duplicates) with recent activity |
| 04 | Visualization | 3 campaigns with activity in the same week. Include "over the past week" |
| 05 | Summary | No specific campaign. Use "Give me a summary of my campaign performance last week" |
| 06 | Ranking | If today is early in the month, use "last month". Check if Push campaigns exist; if not, use Email |
| 07 | Rates | Pick any campaign + a time period BEFORE it was sent (e.g., campaign sent Mar 31 → ask about January) |
| 08 | Rates | No specific campaign. "What was my average click rate across all SMS campaigns this month?" |
| 09 | Ambiguity | A name that appears MORE THAN ONCE (e.g., "welcome email"). If none exist, use a partial/vague name |
| 10 | Pre-Nov | Any campaign name + "in October 2025" (before Nov 11, 2025 data boundary) |
| 11 | Not Found | A campaign name that does NOT exist (invent one like "Cyber Monday Deals") |
| 12 | Unsupported | Any real campaign name. Prompt asks about "revenue" (unsupported metric) |
| 13 | Filtered | Any real campaign name. Prompt asks about "excluding bot traffic" |
| 14 | Summary-Nov | No specific campaign. "Give me a summary of my campaign performance for November 2025" |
| 15 | Scale | No specific campaign. "Chart total sends and total clicks for all Email campaigns over the past month" (different scales) |
| 16 | Comparison | 2 campaigns with recent activity. Include "over the past week" in the prompt |

Use `prompts.example.json` as the template structure. Write the completed array to `prompts.json`.

### Step 4: Validate and run

```bash
npm run validate
npm test
```

To run specific tests: `npm test -- 01 03 07`
To run headless: `npm run test:headless`

### Step 5: Review results

After the run completes:
1. Open the timestamped screenshot folder: `open screenshots/<timestamp>`
2. Read `REPORT.md` inside that folder for a summary table
3. Review screenshots — check for "Responding..." (need re-run) or unexpected responses

### Step 6: Re-run failures

If any tests need re-running: `npm test -- 03 09` (pass specific IDs)

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
