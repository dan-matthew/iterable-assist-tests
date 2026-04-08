# Iterable Assist Test Suite

Browser-based test runner for **Iterable Assist (Nova Agent)**. Sends prompts to the Assist panel, waits for streamed responses to complete, and captures screenshots with a markdown report.

## Quick Start (with Cursor)

If you're using [Cursor](https://cursor.sh), just open this repo and ask:

> "Run the Iterable Assist tests"

The built-in Cursor skill will walk you through everything — collecting your session cookies, building prompts with real campaign data, running the tests, and reviewing results. No manual setup needed.

## Quick Start (manual)

```bash
# 1. Install dependencies
npm install
npx playwright install chromium

# 2. Set up config
cp .env.example .env          # Add your session cookies
cp prompts.example.json prompts.json  # Add real campaign data

# 3. Validate setup
npm run validate

# 4. Run tests
npm test
```

## Inputs

Drop your test data into the `inputs/` folder (gitignored). The Cursor skill uses these to auto-generate `prompts.json` with real campaign data.

| File | Format | How to get it |
|------|--------|---------------|
| **Bug bash test sheet** | PDF or CSV | The test specification doc with expected behaviors per scenario |
| **Campaign CSV** | CSV | Messaging Insights → Campaigns tab → Export metrics |
| **MI overview screenshot** | PNG/JPG | Screenshot of Messaging Insights overview page |

```
inputs/
├── bug-bash-scenarios.pdf   # Test spec with expected behaviors
├── campaigns.csv            # Real campaign names, IDs, metrics
└── mi-overview.png          # Channel breakdown and health dashboard
```

With these files in place, the Cursor skill can read the bug bash expectations, find campaigns with real data, and generate `prompts.json` automatically.

## Configuration

### `.env` — Session & browser settings

| Variable | Required | Description |
|----------|----------|-------------|
| `ITERABLE_SESSION` | Yes | Session cookie from `app.iterable.com` |
| `XSRF_TOKEN` | Yes | XSRF token cookie from `app.iterable.com` |
| `BASE_URL` | No | Default: `https://app.iterable.com` |
| `BROWSER_MODE` | No | `headed` (default) or `headless` |
| `VIEWPORT_WIDTH` | No | Default: `1440` |
| `VIEWPORT_HEIGHT` | No | Default: `900` |

**Getting cookies:** Open `app.iterable.com` → DevTools → Application → Cookies → copy `ITERABLE_SESSION` and `XSRF-TOKEN` values.

### `prompts.json` — Test scenarios

JSON array of prompts to run. Each entry:

```json
{
  "id": "01",
  "category": "Summary",
  "prompt": "How did my Presidents Day Sale campaign perform?",
  "expected": "Should return summary with Total Sent, CTR, Open Rate, Unsub Rate."
}
```

See `prompts.example.json` for all 16 test scenarios from the Analytics Agent Bug Bash.

## Usage

```bash
# Run all tests (headed browser)
npm test

# Run in headless mode
npm run test:headless

# Run specific tests by ID
npm test -- 01 03 07

# Run specific tests headless
npm run test:headless -- 01 03 07
```

## Output

Each run creates a timestamped folder under `screenshots/`:

```
screenshots/
└── 20260401_160035/
    ├── 01_summary.png
    ├── 02_metrics.png
    ├── ...
    └── REPORT.md          ← Markdown summary with table + embedded screenshots
```

The `REPORT.md` includes:
- Run metadata (date, URL, mode)
- Results table with wait times and pass/timeout status
- Detailed section per test with prompt, expected behavior, and screenshot

## How It Works

1. Launches Chrome via Playwright with your session cookies
2. Navigates to Iterable and opens the Assist (Nova Agent) panel
3. For each prompt:
   - Navigates to a fresh page (new conversation thread)
   - Opens the Assist panel
   - Types and submits the prompt
   - Waits for "Responding..." to appear (streaming started)
   - Waits for "Responding..." to disappear (response complete)
   - Adds a 3s buffer for charts/animations to render
   - Takes a screenshot
4. Generates a `REPORT.md` summary

## Bug Bash Scenarios

The test suite covers the [Analytics Agent Bug Bash V1](prompts.example.json) scenarios:

| # | Category | Tests |
|---|----------|-------|
| 01 | Summary | Single campaign performance summary |
| 02 | Metrics | Aggregated counts (Email clicks) |
| 03 | Visualization | Time series chart for a campaign |
| 04 | Visualization | Multi-campaign comparison chart |
| 05 | Summary | Weekly performance summary |
| 06 | Ranking | Top Push campaigns by Open Rate |
| 07 | Rates | Campaign outside requested timeframe |
| 08 | Rates | Aggregated rate rejection (SMS) |
| 09 | Ambiguity | Disambiguating duplicate campaign names |
| 10 | Pre-Nov | Pre-November 11, 2025 data boundary |
| 11 | Not Found | Non-existent campaign handling |
| 12 | Unsupported | Unsupported metric (revenue) |
| 13 | Filtered | Bot-filtered metrics rejection |
| 14 | Summary-Nov | Partial month summary (Nov 2025) |
| 15 | Scale | Dual Y-axis / different metric scales |
| 16 | Comparison | Side-by-side campaign comparison |
