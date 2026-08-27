# Advertising Measurement Consent — Design QA

## Scope and reference

- Source mobile concept: `/Users/drinkle/.codex/generated_images/01a00e4a-a649-70e2-a6c7-558a3c385688/exec-c3dd86da-7903-422d-84fd-3aa8f83dadf2.png` (`853 × 1844`).
- Source desktop concept: `/Users/drinkle/.codex/generated_images/01a00e4a-a649-70e2-a6c7-558a3c385688/exec-b50eec16-479a-4fdf-bbcf-4c294bfc328b.png` (`1370 × 1148`).
- Implemented component: `src/components/MeasurementConsentBanner.jsx`.
- Responsive coordination: `src/components/marketing/marketing.css`.
- Re-entry controls: `src/components/marketing/MarketingFooter.jsx` and `src/pages/Privacy.jsx`.
- Intentional deviation: the user approved the concept, then explicitly requested a smaller mobile surface. The implemented mobile card therefore prioritizes the same choices and hierarchy in a more compact form instead of matching the concept's height.

## Comparison evidence

| State | Requested CSS viewport | Exported image | Evidence |
| --- | ---: | ---: | --- |
| Simplified Chinese mobile, first visit | `390 × 844` | `375 × 812` | `/Users/drinkle/.codex/visualizations/2026/08/20/smart-link-consent-compact/mobile-390x844-final.png` |
| Simplified Chinese narrow mobile, first visit | `320 × 568` | `305 × 541` | `/Users/drinkle/.codex/visualizations/2026/08/20/smart-link-consent-compact/mobile-320x568.png` |
| Simplified Chinese desktop, first visit | `1440 × 900` | `1425 × 891` | `/Users/drinkle/.codex/visualizations/2026/08/20/smart-link-consent-compact/desktop-1440x900-final.png` |
| Mobile side-by-side, source left / implementation right | normalized to `812px` high | `751 × 812` | `/Users/drinkle/.codex/visualizations/2026/08/20/smart-link-consent-compact/mobile-comparison-final.png` |
| Desktop side-by-side, source left / implementation right | normalized to `891px` high | `2488 × 891` | `/Users/drinkle/.codex/visualizations/2026/08/20/smart-link-consent-compact/desktop-comparison-final.png` |

The browser tool exports the page area smaller than the requested CSS viewport because of the in-app browser frame. DOM geometry below was measured against the requested CSS viewport rather than inferred from exported pixels.

## Fidelity and responsive checks

- Typography: existing marketing type system retained; compact mobile labels remain readable and desktop copy keeps the full explanation.
- Spacing: first-visit mobile card is `78.5px` high at both `390px` and `320px` requested widths. Buttons remain `44px` minimum height.
- CTA clearance: the fixed install action and consent card keep an `8.5px` measured gap with `0px` overlap at both mobile widths.
- Adaptive structure: a `ResizeObserver` derives the fixed CTA clearance from the actual rendered prompt top edge. This covers language wrapping and future copy changes without per-locale offsets.
- Color and shape: white compact surface, emerald positive action, neutral necessary action, and existing marketing radii match the approved direction and the site design system.
- Content: mobile uses `广告衡量 · Meta/Google：到达/下载点击 · 隐私政策`; desktop retains the complete sentence. Both expose explicit `仅必要` and `允许衡量` choices.
- Images and core page layout: existing hero images, content order, header, language switch, and primary installation actions were not replaced or restyled.
- Overflow: measured document width did not exceed the browser viewport at `320px`, `390px`, or `1440px`.

## Interaction and console verification

- First visit cannot be dismissed without choosing `仅必要` or `允许衡量`.
- `允许衡量` removes the prompt and clears its layout dataset and CSS clearance variable.
- Footer `广告测量设置` reopens the prompt after a choice.
- Reopened settings expose an explicit close control.
- Changing from allowed to necessary reloads the page and removes provider measurement state.
- Privacy page exposes the same durable settings entry.
- Browser console after final mobile and desktop render: `0` errors, `0` warnings.

## Iteration history

1. Replaced the full modal with a compact responsive region and moved persistent settings access into the footer and privacy page.
2. Initial narrow-screen QA found the fixed install action overlapping a wrapped Traditional Chinese prompt by about `12px` at `320px`.
3. Replaced the fixed offset with geometry-driven clearance; re-test showed `0px` overlap.
4. Further compressed the first-visit mobile surface from about `103px` to `78.5px` by using a single-line compact disclosure while preserving two `44px` choices and the privacy link.
5. Re-tested Simplified Chinese at `320 × 568` and `390 × 844`, desktop at `1440 × 900`, allow/reopen/withdraw interactions, overflow, and console output.

## Automated verification

- `npm run test:attribution`: `157/157` passed.
- `npm run build`: passed; only the repository's existing bundle-size warning remains.
- Targeted ESLint across all changed JavaScript, JSX, and test files: passed.
- `git diff --check`: passed.

final result: passed
