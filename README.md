# Diabetes-Analytics
End-to-end diabetes analytics project using the CDC BRFSS 2015 dataset, featuring SQL, EDA, statistical analysis, machine learning, and Explainable AI (SHAP).

## Research dashboard (web)

A Next.js research dashboard that renders the precomputed `results/` for RQ1-RQ3 and includes a grounded study assistant is maintained in this repository:

- **Path:** `app/`
- **Setup:** `cd app && npm install`
- **Run:** `npm run prepare-data && npm run dev`
- **Production checks:** `npm run typecheck && npm run lint && npm run build`
- **Documentation:** See [`app/README.md`](app/README.md) for routes, data flow, and environment variables.
- **Vercel:** Import this repository and select `app` as the Root Directory.
- **Note:** Research and education tool only; it is not a diagnostic device, and association does not imply causation.
