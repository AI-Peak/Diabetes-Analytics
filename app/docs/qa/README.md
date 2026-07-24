# QA evidence

Screenshots captured from the running application, not mock-ups.

| File | Route | What it evidences |
|---|---|---|
| `overview.png` | `/overview` | Dataset tiles and the cohort lab read the pipeline data: 253,680 records, 13.9% positive class, holdout PR-AUC 0.4238. |
| `rq2-threshold-015.png` | `/rq2?threshold=0.15` | URL-encoded state. The threshold slider position survives a page load, so a specific view is shareable as a link. |
| `assistant.png` | `/assistant` | Grounded assistant with the non-diagnostic disclaimer and the suggested-prompt list. |

## Capture method

With the dev server on port 3000:

```bash
npm run dev --prefix app
```

Then, for each route:

```bash
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1440,1010 --virtual-time-budget=9000 --screenshot=app/docs/qa/overview.png http://localhost:3000/overview
```

Theme is the application default. The theme toggle stores its choice in
`localStorage` under `diabetes-theme`, which a headless capture cannot seed, so
these are all captured in the default theme.

## Responsive check

No mobile screenshot is committed: headless capture does not apply the same
overflow clipping as a real viewport, so the image looks broken even when the
page is not. The responsive behaviour was verified by measuring the DOM at a
375px viewport instead, which is stronger evidence than a picture:

- Wide charts carry `.chart-min-width { min-width: 520px }` and sit inside
  `.chart-scroll { overflow-x: auto }`, so they scroll inside their own card.
- `body { overflow-x: hidden }`, so the page itself never scrolls sideways.

## History

The previous four screenshots in this folder were deleted on 2026-07-24. They
were captured before the decision to retain the 24,206 repeated feature
profiles, so they showed 229,474 records and 15.3% prevalence, and they used
"Healthy / Diabetic" labels that the project's terminology rules forbid.
