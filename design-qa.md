# LUTA Mobile Persistent Install Actions — Design QA

qa_date: 2026-08-12 Asia/Shanghai
route: `/global/zh-cn`
browser: Microsoft Edge DevTools device emulation
scope: mobile-only viewport-fixed platform selector plus synchronized install CTA

## Source visual truth

- Approved visual target: `/Users/drinkle/.codex/generated_images/019ff404-8044-70e0-89dd-689a98bcadc4/exec-8c7a2d99-a19b-4d57-8ee4-e6d1a894c3c8.png`
- Source pixels: `965 × 1630`; generated-raster density and CSS viewport are unknown.
- The source establishes the product shape of the floating action group: a circular platform selector on the left, one primary CTA on the right, both completely visible above the viewport bottom.

## Rendered implementation

- Local URL: `http://127.0.0.1:4173/global/zh-cn`
- Primary implementation screenshot, iOS selected: `/Users/drinkle/Downloads/127.0.0.1_4173_global_zh-cn(iPhone 16 Pro Max) (1).png.crdownload`
- Android state screenshot: `/Users/drinkle/Downloads/127.0.0.1_4173_global_zh-cn(iPhone 16 Pro Max) (2).png.crdownload`
- Implementation pixels: `1320 × 2868`.
- CSS viewport: `440 × 956`; effective device scale factor: `3`.
- Additional compact-device checks: iPhone SE `375 × 667` and narrow responsive `320 × 568`, at both page top and footer.

The Edge downloads have a temporary `.crdownload` suffix because Edge requires a secondary save choice; file inspection confirms both are complete `1320 × 2868` PNG images.

## Comparison evidence and normalization

### Full view

The source and iOS implementation were opened in one comparison input. The source is a conceptual artboard with an outer canvas and a different aspect ratio, so the full-view comparison is used for composition and hierarchy only; it is not treated as an equal-viewport pixel comparison.

- Source: `965 × 1630`.
- Implementation: `1320 × 2868` at `440 × 956` CSS pixels and `3×` density.
- Normalization: no density-only findings were filed from the full view.

### Focused CTA region

The source, iOS implementation, and Android implementation were cropped from their actual images and opened together in one comparison input:

- Source focus: `/Users/drinkle/.codex/visualizations/2026/08/12/019ff404-8044-70e0-89dd-689a98bcadc4/floating-cta-qa/source-cta-focus.png` (`650 × 220`).
- iOS focus: `/Users/drinkle/.codex/visualizations/2026/08/12/019ff404-8044-70e0-89dd-689a98bcadc4/floating-cta-qa/implementation-ios-cta-focus.png` (`649 × 222`).
- Android focus: `/Users/drinkle/.codex/visualizations/2026/08/12/019ff404-8044-70e0-89dd-689a98bcadc4/floating-cta-qa/implementation-android-cta-focus.png` (`649 × 222`).
- The implementation crops were downsampled only for same-scale visual judgment; no source or product asset was modified.

## Fixed-position evidence

The action group is rendered by `PageShell` after the footer and outside the Hero and section document flow. At `440 × 956`:

- page top: `position=fixed`, `scrollY=0`, `top=836`, `bottom=892`, `height=56`
- page footer: `position=fixed`, `scrollY=5843`, `top=836`, `bottom=892`, `height=56`
- viewport: `innerHeight=956`, `visualViewport.height=956`

The group therefore remains at the same viewport coordinates and keeps a `64px` bottom clearance at both scroll positions. At iPhone SE `375 × 667`, the footer state measured `top=547`, `bottom=603`, `height=56`, again leaving `64px` of bottom clearance. A separate `320 × 568` top/footer visual check confirmed both controls remain fully visible without horizontal overflow. Footer padding reserves content space behind the persistent control.

## Findings

No actionable P0, P1, or P2 mismatch remains.

| Fidelity surface | Result | Evidence |
| --- | --- | --- |
| Fonts and typography | passed | Primary CTA remains centered and readable; iOS and Android labels stay legible inside the circular selector without truncation. |
| Spacing and layout rhythm | passed | Selector and CTA share one aligned fixed group; the 56px controls remain fully inside both long and compact viewports with a constant 64px bottom offset. |
| Colors and tokens | passed | Existing pine field, action green, paper selector, white borders, and restrained elevation match the approved direction and existing Marketing tokens. |
| Image and icon fidelity | passed | Existing product screenshots remain unchanged. Platform and action affordances use Lucide library icons; no placeholder, emoji, CSS drawing, or handcrafted SVG was introduced. |
| Copy and content | passed | CTA remains `免费开始阅读`; selector exposes explicit `iOS` or `Android` text plus platform icon and chevron. |
| Accessibility and interaction | passed | Selector exposes `aria-haspopup=menu`, expanded state, radio-menu semantics, current selection, keyboard navigation, Escape, outside-click dismissal, and focus restoration. |

Accepted P3 variance: the implementation uses the project's outline Apple icon rather than the mock's filled Apple glyph. The explicit `iOS` label, accessible name, and menu make the function unambiguous, so this does not block acceptance.

## Comparison history

1. **P1 — CTA belonged to the Hero and disappeared after the Hero left the viewport.**
   Fix: removed Hero visibility observation and mounted one persistent action group at `PageShell` level with `position: fixed`.

2. **P1 — the control sat too close to the viewport edge and appeared clipped in long-screen emulation.**
   Fix: replaced the edge-adjacent dock with a viewport token of `4rem + safe-area-inset-bottom`; verified identical geometry at page top and footer.

3. **P2 — the first circular resource-switch icon did not explain its purpose.**
   Fix: replaced it with the selected platform icon, explicit `iOS` / `Android` label, chevron, and a two-option accessible menu.

4. **P2 — the Android label and chevron were cramped in the 56px circle.**
   Fix: changed the trigger to a centered vertical flex layout, sized the Android label independently, and absolutely positioned the chevron. The post-fix Android focused comparison shows both elements clearly.

## Browser and engineering checks

- Platform menu opened and switched between iPhone and Android/HarmonyOS.
- The visible primary CTA synchronized with the selected platform.
- Android CTA opened `https://play.google.com/store/apps/details?id=com.luta.reader`.
- iOS CTA route was verified against the App Store path.
- Fixed geometry passed at `440 × 956` and `375 × 667`; the narrow `320 × 568` visual state also passed at page top and footer.
- Browser application errors: `0`. Visible console entries were the React development prompt, a browser extension message, and Edge's lazy-image intervention.
- `npm run test:attribution`: `141 / 141` passed.
- Targeted ESLint for all changed source and tests: passed.
- `npm run build`: passed; only the existing `>500 kB` chunk warning remains.
- Repository-wide lint still reports six pre-existing unrelated errors in `GlitchText.jsx`, `Silk.jsx`, `Toast.jsx`, and shared UI files; no changed file is implicated.
- `git diff --check`: passed.

final result: passed
