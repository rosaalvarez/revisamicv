# RevisaMiCV marketing measurement setup

## Recommended free stack

1. **Microsoft Clarity** — free heatmaps + session recordings. Best replacement/complement for Vercel Analytics when you want to see where users click, scroll, hesitate, or abandon.
2. **Google Analytics 4 (GA4)** — free traffic sources, funnels, campaign attribution, search/ads reporting.
3. **Google Ads conversion tracking** — only when campaigns start; records analysis/checkout/purchase conversions.
4. **Vercel Analytics** — keep as lightweight technical backup, but do not rely on it as the main product-learning tool.

## Environment variables supported by the app

Add these in Vercel → Project → Settings → Environment Variables → Production:

```txt
NEXT_PUBLIC_CLARITY_PROJECT_ID=...
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-...
NEXT_PUBLIC_GOOGLE_ADS_ANALYSIS_LABEL=...
NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL=...
NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL=...
```

Only `NEXT_PUBLIC_CLARITY_PROJECT_ID` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` are needed for organic testing. Google Ads variables can wait until paid traffic.

## Events already emitted

Important events:

- `landing_cta_click`
- `signup_view`
- `cv_file_selected`
- `analysis_started`
- `analysis_completed`
- `analysis_failed`
- `revision_started`
- `revision_completed`
- `download_started`
- `download_completed`
- `checkout_started`
- `payment_recovery_completed`

The same `trackEvent()` call now sends to:

- Vercel Analytics
- GA4, if configured
- Google Ads conversion events, if configured and labels exist
- Microsoft Clarity custom events, if configured

## Test/review communities to consider

Use these for low-cost external feedback before paid ads:

- Indie Hackers — product feedback / landing page feedback.
- Reddit: r/resumes, r/careerguidance, r/jobsearchhacks, r/SideProject, r/SaaS. Post carefully; ask for feedback, do not spam.
- Product Hunt Upcoming / Ship — after one more real smoke test.
- BetaList / Startup Stash submit pages — slower, but can bring testers.
- LinkedIn posts in job-search/freelance communities — useful for CV products.
- Discord/Slack founder communities where self-promo is allowed.

Suggested ask:

> Estoy probando una herramienta que compara tu CV contra una vacante real y te da score, brechas, keywords ATS y una versión adaptada descargable. El primer análisis es gratis. Busco feedback brutal: ¿qué parte te dio confianza, qué parte te dio desconfianza y pagarías $5 por 5 análisis?

## Do not do yet

- Do not start Google Ads until nephew/external smoke test reports no serious blockers.
- Do not spend large budget before Clarity + GA4 are active.
- Do not optimize SEO forever before getting real user feedback.
