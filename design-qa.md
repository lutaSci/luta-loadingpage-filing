# Footer social links — implementation QA

final result: passed

Verified: 2026-09-12. This result covers the local website implementation and visual comparison. It does not claim deployment, external group membership, or native mobile app handoff.

## Source and evidence

- The requester selected the third PC/Mobile concept and instructed: “以这个作为最终版本实现，请推进研发”. All regions see the same channels; team accounts serve cooperation enquiries and help.
- Source visual truth: [selected preview](https://github.com/lutaSci/luta-docs/blob/codex/footer-social-design-20260912/docs/domains/official-website-experience/tasks/2026-09-12-footer-social-design/preview-3.png).
- Owning decision and verification record: [footer design task](https://github.com/lutaSci/luta-docs/blob/codex/footer-social-design-20260912/docs/domains/official-website-experience/tasks/2026-09-12-footer-social-design/README.md).
- Implementation screenshots: [PC](https://github.com/lutaSci/luta-docs/blob/codex/footer-social-design-20260912/docs/domains/official-website-experience/tasks/2026-09-12-footer-social-design/implemented-footer-pc.png), [Mobile](https://github.com/lutaSci/luta-docs/blob/codex/footer-social-design-20260912/docs/domains/official-website-experience/tasks/2026-09-12-footer-social-design/implemented-footer-mobile.png).
- Combined source/implementation comparison inputs, opened and visually reviewed: [PC footer](https://github.com/lutaSci/luta-docs/blob/codex/footer-social-design-20260912/docs/domains/official-website-experience/tasks/2026-09-12-footer-social-design/comparison-pc.png), [Mobile footer](https://github.com/lutaSci/luta-docs/blob/codex/footer-social-design-20260912/docs/domains/official-website-experience/tasks/2026-09-12-footer-social-design/comparison-mobile.png).
- Local route: `http://127.0.0.1:4178/global/zh-cn`; initial website base: `628039944ba5a773c817aa138ee7f8dfbd7b6f09`.

## Comparison state and normalization

Both views show the light footer in simplified Chinese after scrolling to the bottom; the mobile install control is visible. The reference is a 1586 × 992 generated concept board, not a browser capture with known CSS dimensions. Its desktop and mobile footer regions were cropped, then placed alongside the actual captures at equal display widths (1000 px desktop; 390 px mobile). These focused footer comparisons include all new information groups and legal content; the uncropped implementation screenshots also include the preceding download area. Additional micro-crops were unnecessary because the mobile comparison makes all labels and icons readable.

The in-app browser used CSS viewport overrides of 1440 × 1100 and 390 × 1150. Saved screenshots are 1425 × 1089 and 375 × 1106 respectively; scrollbar exclusion and capture scaling mean they are not a claimed deviceScaleFactor=1 pixel baseline. Density was normalized only for comparison. The generated board has a different desktop frame width, so existing site container/font tokens take precedence over exact raster coordinates.

## Findings and iteration history

- Resolved P2: the initial mobile brand/title were too small relative to the selected hierarchy. Increased the footer wordmark icon to 40 px and the heading to a 28 px minimum. Revised screenshots and both combined comparisons above are the post-fix evidence.
- Resolved P2: narrow contact rows could compress WhatsApp text. The contact grid now falls back to one column at 320 px. Rechecked 320/390/430 px: no horizontal overflow or clipped social labels; every social target is at least 48 px high.
- Resolved P1 functional finding: same-tab external navigation followed by Back could remount the SPA at the page top. Store only scroll position on the originating history entry and consume it on history restoration. LINE group navigation and Back now return to the footer. Four behavioral tests cover restoration, ordinary/modifier navigation, invalid state/cancellation, and React StrictMode setup/cleanup.
- No actionable P0/P1/P2 visual differences remain within the selected footer scope.

## Required fidelity surfaces

- **Fonts and typography:** retained the site's existing Chinese/system font stack, with a large heading, readable platform names, 14 px legal links and 12 px fine print. Labels wrap rather than truncate. The generated font is not an authoritative font asset. Desktop type and content width follow the existing website scale.
- **Spacing and layout:** four equal community tiles at ≥1024 px, two columns at 768–1023 px, full-width rows below 768 px. Follow and contact share a secondary desktop row and stack on mobile. Thin separators and restrained radii match the selected structure. Mobile legal actions keep 44 px targets, giving them more vertical room than the concept. At the captured 390 px viewport, copyright ends about 16 px above the fixed install control.
- **Colors and tokens:** existing light paper, dark text, muted copy, border and green focus tokens retained. Source platform SVGs retain recognizable brand colors. No new dark/alternate theme or gradient illustration introduced.
- **Images and icons:** actual LUTA wordmark reused; platform marks are static Simple Icons assets with recorded license/provenance, not redrawn approximations. All footer image assets loaded. Generated logo/platform geometry was schematic and is intentionally replaced by source assets.
- **Copy and content:** all seven selected entries appear, with distinct group/page/team semantics. Simplified and traditional copy checked in the browser. Existing legal wording, copyright computation, download copy and install control remain authoritative. No generated response-time, membership, or service promises were imported.

## Functional verification

- `npm run lint`: passed.
- `npm run test:attribution`: 190 passed, zero failed/skipped.
- `npm run build`: passed, including prerender.
- Browser widths 320, 390, 430, 768, 1024, 1440: no horizontal overflow, no clipped footer labels; all seven social targets ≥48 px. Grid and link target switch at the intended breakpoints.
- `/`, `/global/zh-cn`, `/global/zh-tw`: same seven destinations; language changes labels only. Retained EN/JA/KO resources keep the existing locale contract; their retired public routes are not re-enabled.
- All social anchors use fixed HTTPS destinations, `noopener noreferrer` and `no-referrer`; page query/attribution state is not appended.
- Desktop source page remained open after clicking LINE; `_blank` is verified in DOM. The browser connector did not surface the external window, so complete new-window UI behavior is not claimed.
- Mobile-width LINE link navigated in the same tab to the supplied join page; Back returned to the footer after the fix. This used a desktop browser UA and is not an iOS/Android app test.
- Keyboard Tab advanced through community links; a 3 px green focus outline was visible. Advertising measurement settings reopened from the footer. Help handler and internal legal destinations are retained; a successful help destination visit is not claimed.
- Browser console error check on the local page returned none. Read-only HTTP requests reached all seven supplied platform destinations with status 200, which does not prove group identity, invite acceptance or team control.

## Remaining evidence boundary

Physical-device testing with installed/uninstalled apps and logged-in/logged-out accounts remains for release acceptance. Screen-reader speech and browser text-only zoom have not been tested. No group was joined, no account followed and no message sent. Merge and deployment are separate authorized steps.

## Implementation checklist

- [x] Implement selected PC/Mobile information hierarchy with existing site assets.
- [x] Correct and recheck observed responsive/return-navigation regressions.
- [x] Compare reference and final browser captures together.
- [x] Run existing checks and targeted history-restoration tests.
- [ ] Independent human PR review and scoped release authorization.
- [ ] Physical iOS/Android platform handoff and invitation acceptance checks.
