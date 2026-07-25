# Diabetes Analytics Dashboard

An evidence-first research dashboard for a diabetes-risk study using the cleaned **CDC BRFSS 2015** dataset. It follows the CRISP-DM arc from statistical association (RQ1), through model and threshold comparison (RQ2), to SHAP explainability and statistical consistency (RQ3).

> This is a research and education tool, not a diagnostic device. Association and model importance do not establish causation, and the assistant does not provide personalized medical advice.

## Stack

- Next.js App Router, React, and strict TypeScript
- Tailwind CSS v4 with a shared light/dark clinical token system
- Recharts behind local chart wrappers
- Framer Motion and Lucide icons
- Zod validation for every generated data contract
- Google Gemini API for the optional live, grounded assistant

## Run locally

Node.js 20 or newer is required.

```bash
npm install
npm run prepare-data
npm run dev
```

Open `http://localhost:3000`; `/` redirects to `/overview`.

Production checks:

```bash
npm run prepare-data
npm run typecheck
npm run lint
npm run build
npm start
```

`npm run build` uses the generated JSON and figures committed under `app/`, so the web application can build independently on Vercel. Run `npm run build:with-data` locally when you want to regenerate those assets from the repository's analysis outputs before building.

## Data flow

```text
../data/processed/diabetes_cleaned.csv
../results/**/*.csv + exported PNG figures
                 |
                 v
scripts/build-data.mjs
                 |
                 +-- data/generated/{overview,rq1,rq2,rq3}.json
                 +-- public/figures/*.png
                              |
                              v
src/lib/data/load.ts -> Zod validation -> server-rendered pages
```

The browser never trains a model or runs statistical tests. It performs local interaction over 208 anonymous cohort cells, category-level prevalence summaries, threshold rows, model metrics, and SHAP/statistical ranks.

## Routes

- `/overview` - study scope plus linked cohort slicers for sex, age, BMI band, and blood pressure
- `/rq1` - selectable association ranking linked to category-level prevalence profiles
- `/rq2` - linked model scorecard and interactive screening-threshold lab
- `/rq3` - linked SHAP ranking, rank scatter, feature profile, and consistency table
- `/assistant` - grounded bilingual study assistant with an offline fallback

## Folder map

```text
app/
+-- data/generated/          # Validated JSON generated at build time
+-- docs/qa/                 # QA screenshots from desktop/mobile checks
+-- public/figures/          # Copied offline analysis figures
+-- scripts/build-data.mjs   # CSV -> JSON and figure-copy pipeline
+-- src/
    +-- app/                 # Routes and API endpoint
    +-- components/          # Shell, primitives, charts, interactions
    +-- lib/                 # Data schemas/loaders, formats, AI context
```

## Environment

Fill in `.env.local` if you want live Gemini answers:

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
GEMINI_MODEL=gemini-2.5-flash
```

The key is optional. Without it, `/api/chat` uses a deterministic keyword responder grounded in the same study context, so the portfolio demo remains functional offline.

## Deploy on Vercel

Import the GitHub repository and use these project settings:

- Root Directory: `app`
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: leave the Next.js default

Add these environment variables for Production, Preview, and Development as needed:

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Do not upload or commit `.env.local`; configure the API key in the Vercel project settings.

## Data provenance

All displayed metrics and figures trace to the repository's `data/processed/` and `results/` outputs. The build script trims padded CSV fields, preserves scientific-notation p-values, and fails on missing source files. RQ1 uses only observed min/max prevalence ranges, RQ3 derives four consistency groups from the source CSV, and no unavailable values are fabricated.
