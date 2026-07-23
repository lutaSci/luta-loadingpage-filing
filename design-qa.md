# LUTA 海外中文 Landing v1 — Design QA

qa_date: 2026-07-22 Asia/Shanghai
scope: `/`, `/global/zh-cn`, `/global/zh-tw`, `/global/en`, `/global/ja`, `/global/ko`
visual_direction: `Quiet Field / 留白成境 v3`
release_scope: five-locale dynamic-first-view interactive-Hero production release `eac5e6bcbddbb60759134b0ba23953a7b6edfff1`
qa_status: Pass 7 released and verified in production; native-copy review remains an explicit accepted exception

> Current-status note: Pass 1–6 below are retained as historical implementation and production evidence. Pass 7 is the current production release: five Marketing locales, a dynamic first viewport, and an accessible user-controlled Hero carousel at commit `eac5e6bcbddbb60759134b0ba23953a7b6edfff1`. On 2026-07-22 the user explicitly approved publication without first completing native English/Japanese/Korean copy review; that review remains an accepted production exception, not a completed check. Route-level social metadata, the five-person test and system-wide Token adoption also remain open; the broader UI-system `design_status` stays `candidate`.

## 1. Visual source of truth

- Desktop full-page reference: `/Users/drinkle/luta/code/luta-docs/docs/domains/official-website-experience/tasks/2026-07-22-overseas-chinese-landing-ui-system/previews/preview-desktop-full-cn-v3.png` (`1440 × 5716`).
- Mobile full-page reference: `/Users/drinkle/luta/code/luta-docs/docs/domains/official-website-experience/tasks/2026-07-22-overseas-chinese-landing-ui-system/previews/preview-mobile-full-cn-v3.png` (`390 × 5064`).
- Deterministic design source: `/Users/drinkle/luta/code/luta-docs/docs/domains/official-website-experience/tasks/2026-07-22-overseas-chinese-landing-ui-system/previews/quiet-field-v3/`.
- Product UI evidence: Figma file `bemKpiN0BdFlds1QC2AOGb`, nodes `8586:43338`, `8586:81834`, `8586:81286`, `8395:44452`.
- Historical implementation baseline: local Vite development build at `/global/zh-cn` and `/global/zh-tw`, originally based on `bf6bddc27be6cbdb0b583af6bf1fb2efad9edb8a`.
- Current Pass 7 implementation under test: uncommitted working tree based on production `260eda9a0a7ffe32a3dea7ad52c43d3765e9b95c`, covering `/` and all five explicit Marketing locale routes.

The references are approved deterministic previews rather than final production-asset sheets. The concept itself uses the same provisional text wordmark and the same state-covered home screenshot, so those limitations are tracked as release gates instead of implementation-fidelity defects.

## 2. Acquisition and normalization

- Tool: Codex in-app browser, 2026-07-22, local server `http://127.0.0.1:5173`.
- Desktop comparison viewport: CSS width `1440`; source hero cropped to the corresponding `1440 × 900` region.
- Mobile comparison viewport: CSS width `390`; implementation captured at approximately `390 × 844`; source cropped to the same first-screen region.
- Sticky Header regression viewports: `1159 × 964` desktop and `390 × 844` mobile, covering `zh-CN` and `zh-TW` after the 2026-07-22 browser annotation.
- Full mobile comparison: implementation stitched from deterministic scroll positions at CSS width `390`; source kept at native `390` width and padded only after its natural `5064` px end so that section sequence can be compared in one image.
- Browser scrollbar/chrome visible in stitched evidence is a capture-tool artifact. DOM measurement at every audited width reported `scrollWidth === clientWidth`.
- The mobile browser capture uses a desktop user agent; therefore the desktop platform tabs are visible in that screenshot. Native iOS/Android selection is validated separately by the pure state-matrix tests.
- Current acquisition: the Codex in-app browser used same-viewport segmented screenshots and DOM/computed-style checks at 320, 360, 390, 428, 768, 1024, 1280 and 1440 px, plus `zh-CN` / `zh-TW` at 390 px. Its full-page stitched capture repeated or omitted regions, so that artifact was excluded as a capture-tool limitation rather than treated as a product defect.

Same-input comparison evidence:

- Desktop hero, final pass: `/Users/drinkle/.codex/visualizations/2026/07/22/019f8851-130f-7f60-ba81-c9bfbaf2ba96/qa-desktop-hero-side-by-side-final.png`.
- Mobile hero, final pass: `/Users/drinkle/.codex/visualizations/2026/07/22/019f8851-130f-7f60-ba81-c9bfbaf2ba96/qa-mobile-hero-side-by-side-final-v2.png`.
- Mobile complete page: `/Users/drinkle/.codex/visualizations/2026/07/22/019f8851-130f-7f60-ba81-c9bfbaf2ba96/qa-mobile-full-side-by-side.png`.
- Traditional Chinese mobile evidence: `/Users/drinkle/.codex/visualizations/2026/07/22/019f8851-130f-7f60-ba81-c9bfbaf2ba96/marketing-implementation-mobile-tw.jpg`.

## 3. Fidelity review — Pass 1–4 baseline only

| Surface | Result | Evidence and reasoning |
| --- | --- | --- |
| Information architecture | pass | Hero → why → reading → practice → history → principles → final action → footer is identical to the approved v3 sequence. |
| Palette and atmosphere | pass | Mineral off-white, white, deep pine green and one action green are preserved; no gradient, glow, glass, WebGL, particle field or decorative gold was introduced. |
| Desktop composition | pass | Independent two-column hero, title hierarchy, phone scale, quiet field and section proportions align with the 1440 reference. It is not a scaled mobile layout. |
| Mobile composition | pass | Final 390 px pass restores the approved two-line 38 px hero title and product-phone rhythm; primary action remains visible within the first screen. |
| Typography | pass | Modern sans-serif carries marketing hierarchy; serif is limited to the classic quotation. Simplified and Traditional Chinese remain in the same component tree without overflow. |
| Product visuals | pass for implementation; historical pre-release gate | Three real exported App UI images are used with explicit intrinsic dimensions, meaningful `alt`, eager hero loading and lazy below-fold loading. The source images are only 375 px and one home image contains a state overlay; higher-density derivatives were a pre-release gate and were later carried as an explicit post-release exception rather than reported complete. |
| CTA presentation | pass with intentional contract difference | The static concept CTA is replaced by the real CN/Global, platform, readiness and recovery states. This is an approved product-contract requirement and does not alter the quiet visual direction. |
| Responsive reflow | pass | 320, 360, 390, 428, 768, 1024, 1280 and 1440 px all measured without horizontal overflow. Production sections are naturally taller than the fixed concept frames so long translations, real CTA states and 200% text reflow are not clipped. |
| State and focus styling | pass | Tabs, disclosure, loading/disabled/recovery, modal, hover, active and `focus-visible` use scoped tokens; loading is non-interactive with `aria-busy`; reduced-motion removes non-essential transition behavior. Deep surfaces use a white focus token and clipped tabs use an inset outline. |

## 4. Interaction and browser evidence — Pass 1–4 baseline only

- `zh-CN` and `zh-TW` paths set the matching document language and metadata.
- Locale switching preserves `route_market`, UTM, `click_id` and hash while changing only the content path.
- Smart Link recovery removes only `smart_link_status`, preserves the remaining attribution context and moves focus to `#download-options`.
- TestFlight disclosure exposes both existing steps; confirmation modal receives initial focus, closes with keyboard semantics and restores focus to the trigger.
- Desktop checks under CN and Global `route_market` contexts used `iPhone` / `Android-HarmonyOS` platform tabs without rewriting the locale path; they were not CN/Global market tabs.
- The route-scoped Marketing Header remains sticky at `top: 0` after scrolling: `84 px` on desktop and `64 px` on mobile. Page anchors reserve the matching Header height plus `16 px`; the desktop `#product-capabilities` check landed with exactly `16 px` clearance instead of hiding the section under the Header.
- CTA option-view events are emitted only after the action group has viewport evidence; the below-fold final group is not counted on mount. Deduplication includes locale and market, and TestFlight expansion has one impression path.
- WeChat is routed to an external-browser guide; HarmonyOS NEXT fails closed to a recovery/documentation action instead of Google Play or APK.
- Every audited image loaded with the expected natural width and reserved layout space.
- Browser console errors: `0`; browser console warnings: `0`.

## 5. Comparison history

### Pass 1

The 390 px hero title rendered smaller than the approved reference. It still fit, but weakened the intended first-screen hierarchy. This was classified as a P3 visual-fidelity drift because it did not break content, behavior or accessibility.

### Fix

The route-scoped responsive title formula was adjusted to resolve to `38 px` at a 390 px viewport while remaining proportional at 320–360 px.

### Pass 2

The final same-input mobile comparison shows the approved two-line wrap, scale and vertical rhythm. No remaining P0, P1 or P2 mismatch was found in desktop hero, mobile hero, complete-page sequence, Simplified Chinese, Traditional Chinese or CTA state presentation.

### Pass 3 — engineering and accessibility review

A read-only React/a11y review found six P2 implementation defects: premature final-CTA impressions, duplicate TestFlight impressions, locale-insensitive impression deduplication, missing loading semantics, clipped tab focus and insufficient small-text/deep-surface contrast. All six were corrected before the final pass. Follow-up review also moved the TestFlight toggle side effect out of the state updater and verified the correct focus color for nested light dialogs and the programmatically focused recovery target. The action color is now `#087a49` (`4.84:1` against the weakest light surface), deep surfaces use a white focus ring, tab focus is inset, and the 390 px heading uses its actual content container so a desktop-style scrollbar cannot force a third line.

### Pass 4 — sticky Header browser annotation

The Marketing Header was changed from normal flow to route-scoped sticky positioning after the user annotated the local desktop preview. Browser geometry checks confirmed `top: 0`, `z-index: 100` and the intended `84 px` / `64 px` desktop/mobile heights after scrolling. Simplified and Traditional mobile routes both remained overflow-free, desktop anchor navigation retained `16 px` visible clearance, and the console reported no warning or error.

### Pass 5 — browser-feedback revision

The user’s 12 browser annotations established a new implementation baseline:

- Header remains route-scoped sticky; Header and Footer use the existing App icon plus `汝塔 / LUTA` as a provisional lockup. The production combined Logo remains a release gate.
- Desktop tabs are `iPhone` and `Android / HarmonyOS` platform choices. Hero and final CTA share the selected platform; `/global/zh-*` changes content language only and does not override `route_market`. `/install` remains the complete download-directory choice surface.
- `website_download_option_viewed` is action-level: each real CTA must become visible before the event is sent; hidden tabs, below-fold actions and unexpanded TestFlight steps are not counted early.
- Reading, practice and history use focus-field, staged-path and accumulation visualizations respectively; principles use a relational field instead of three plain list rows.
- Non-hero sections use one-shot, short-distance reveal with limited stagger. `prefers-reduced-motion: reduce` forces immediate visibility without transform or stagger.
- The final CTA is centered within its deep-green action container, and Footer content is centered by the shared white content container.

The latest engineering gates passed (`test:attribution 75 / 75`, targeted ESLint, production build and `git diff --check`). The build retains only the repository’s existing `>500 kB` chunk warning. The in-app browser reloaded the local tab, but Browser URL policy rejected the post-change DOM snapshot; therefore visual, Simplified/Traditional responsive geometry and console evidence remain pending user acceptance. No Pass 1–4 screenshot or console result is reused as Pass 5 evidence.

### Pass 6 — emotion-first Hero and soft-surface refinement

The current refinement kept the approved content and behavior contracts while increasing warmth and product presence without reintroducing decorative noise:

- Hero now uses a fixed three-screen fan as one focal composition: start = today wisdom (`8586:81286`, `-6deg`), center = reading (`8586:43338`, unrotated), end = Tabao (`8395:44452`, `+6deg`). It is not a carousel; only the center reading image is eager / high priority.
- The current palette is warm field `#f8f6f0`, paper `#fffefb`, mist `#edf4ef`, pine `#073c32` and restrained earth accent `#9a744c`. Feature and principle relationships use soft surfaces, weak borders and spacing instead of plain list rows or ornamental layers.
- Public download UI no longer exposes internal `marketLabels`, `deviceNote`, `desktopDeviceNote`, “当前展示” or “保留地区” explanations. Privacy, recovery, TestFlight and safe-install guidance remain where they are necessary to complete the action.
- Header remains sticky with computed `border-bottom: 0px`. Footer copyright uses `formatMarketingCopyright(owner, rights, year = current year)` and rendered `2026` in both `zh-CN` and `zh-TW` DOM.
- `PageShell` reveal now uses `threshold: 0.12` and `rootMargin: '0px 0px -4% 0px'`; the final CTA and Footer reach visible state at the end of a normal scroll.
- Four Figma-derived 375×812 assets have locally verified SHA-256 records: reading `ca76b87a450bc91df65d355c59a5084c86d3b5fe4588ab25593ae08c9ab52c41`, updated practice plan with the current plan icon `ce82267a0b3310f6a487b3f87e6b76160c9d7cfcf9abb8d21b0c3db25eb65c5c`, today wisdom `6a219cd7878ce946e6a8ea7534699462327f17b6b157e8e51d597b4ef228d698`, and Tabao `edf948ad99900fdb5f6e7c89197bd406ce21fc794c5c3862a4f4c5c2608e211e`.

Current Browser QA passed at 320, 360, 390, 428, 768, 1024, 1280 and 1440 px without horizontal overflow. Both locale routes passed at 390 px; console errors and warnings were `0`. The in-app browser’s full-page stitched image repeated or blanked some regions, so same-viewport segmented captures are the accepted QA method for this pass. This is a capture-tool limitation, not a page defect. Final visual acceptance still belongs to the user and is not implied by these checks.

## 6. Latest engineering gates

- `npm run test:attribution`: `83 / 83` passed, including content-contract, six-state, WeChat, HarmonyOS NEXT, loading/disabled/recovery, TestFlight, action-level impressions, shared platform-tab contract, legal-filing identity, UX/reduced-motion guards, focus-surface guards, current-year copyright, Hero fan hierarchy, terminal reveal and URL-ownership assertions.
- Targeted ESLint for every changed/new source and test file: passed with `0` findings.
- `npm run build`: passed after the Pass 6 refinement. The pre-existing `>500 kB` chunk warning remains and is not attributed to this change.
- `git diff --check`: passed.
- Root route, `/install`, legal pages, Smart Link API, Feishu form and backend distribution contracts were not refactored.

## 7. Release decision and deferred validation

The user explicitly authorized root replacement and production release after reviewing Pass 6. The release therefore uses the following bounded v1 decision:

1. `/` becomes locale-aware: `zh` uses the new Simplified Marketing Landing, `zhTW` uses the Traditional version, and `en` / `ja` / `ko` retain the existing homepage until separately approved Marketing content exists.
2. The provisional App-icon + text lockup, current Figma screenshots and 1× PNG delivery are accepted as a v1 production exception; they are not reclassified as final brand assets or modern responsive image coverage.
3. The five-person, unprompted five-second test remains incomplete and moves to post-release product validation; it must not be reported as passed.
4. Real mobile/desktop Core Web Vitals p75 remains a post-release success metric because it requires production traffic; the local production build is the pre-release engineering gate.
5. The route-scoped Token values may ship with this homepage, while the cross-page UI-system `design_status` remains `candidate`.
6. Remote source, production checkout, rollback image, live bundle, root DOM, `/install`, legal routes, Smart Link, Admin compatibility and CORS still require release-time verification.

final result: release candidate passed — user authorized root replacement and production release; live verification is still required, while five-person testing, real p75 performance and asset upgrades remain explicitly deferred

## 8. Pass 7 — five-locale dynamic first view and interactive Hero (production release)

### Source and acquisition

- Source: the user’s 2026-07-22 browser annotations requiring Header + Hero to fill the first viewport, PC/Mobile horizontal switching of the three product screens, and English/Japanese/Korean to retain the same Marketing UI as Simplified/Traditional Chinese.
- Acquisition: Codex in-app browser first checked `http://127.0.0.1:5173`, then verified `https://lutaai.com/` after deployment on 2026-07-22 Asia/Shanghai. Release source is commit `eac5e6bcbddbb60759134b0ba23953a7b6edfff1`; production image is `sha256:1ce7d15e392438fc227dda461e62f238fdd37174ef29c770ce5d63c01de56031`.
- Same-viewport evidence: production-baseline source and final local implementation at 1280×720 are combined in `/Users/drinkle/.codex/visualizations/2026/07/22/019f8851-130f-7f60-ba81-c9bfbaf2ba96/hero-first-view-side-by-side-final-1280x720.png`; the final implementation frame is `/Users/drinkle/.codex/visualizations/2026/07/22/019f8851-130f-7f60-ba81-c9bfbaf2ba96/hero-first-view-implementation-final-1280x720.png`.

### Analysis and theory

- The first-screen rule uses a current Header size token plus `vh`／`svh`／`dvh` `min-block-size`, not a fixed screenshot height. This follows content-first responsive design: standard viewports align exactly, while short screens, long translations and zoom may grow instead of clipping essential content.
- The product visual remains a single-focal-point fan. It adds user-controlled carousel behavior without autoplay: mouse drag, touch swipe, Arrow keys, Home／End and 44×44 pagination targets all move one screen at a time. `prefers-reduced-motion` retains the state change without spring motion.
- Five locale resources share one component schema and locale registry. Locale changes content, metadata identity and HTML `lang`; it does not change `route_market`, platform, store channel, waitlist, Smart Link or attribution ownership.
- The same-viewport visual comparison preserves the approved quiet green field, information hierarchy and one dominant product focus. The implementation compacts vertical spacing sufficiently to place the complete Hero within 1280×720 without shrinking the primary title or CTA below the approved hierarchy.

### Result

- Standard viewport coverage passed at 360×800, 390×844, 428×926, 768×1024, 1024×768, 1280×720 and 1440×900. Desktop breakpoint regression also passed at 1536×833, 1536×864, 1536×896 and 1536×900, with Header + Hero ending at the viewport bottom and no horizontal overflow.
- Short mobile viewports 320×568 and 390×667 intentionally extend vertically to preserve readable copy and 44 px targets; no horizontal overflow or content clipping was found.
- Root and explicit `zh-CN`, `zh-TW`, `en`, `ja`, `ko` routes use the same Marketing component tree. Five-language 390×844 checks passed without horizontal overflow; trailing-slash locale paths remain Marketing routes and no longer allow Legacy metadata to overwrite the page.
- Carousel behavior passed with mouse/desktop drag, touch/mobile swipe, figure-level keyboard navigation, pagination selection, non-bubbling pagination keys, screen-reader current-slide exposure, polite state announcement and reduced-motion code paths. Initial mount no longer springs all three screens from one position.
- The practice chapter now imports the updated Figma `8586:81834` export `practice-plan-ce82267a-375x812.png`; SHA-256 `ce82267a0b3310f6a487b3f87e6b76160c9d7cfcf9abb8d21b0c3db25eb65c5c`. The current plan icon is selected in the bottom navigation.
- Download and market boundaries passed: the same normalized state produces the same action, channel, market and status across all five locales; existing CN/Global, iOS/Android/HarmonyOS, waitlist, Smart Link and attribution builders remain authoritative.
- `npm run test:attribution`: `105 / 105` passed. Targeted ESLint passed with zero findings. Production build passed; only the existing `>500 kB` chunk warning remains. `git diff --check` passed. A clean Browser tab reported `0` console errors and `0` warnings.

### Risk and release boundary

- Production release completed on `luta-web` at commit `eac5e6bcbddbb60759134b0ba23953a7b6edfff1`; container image `sha256:1ce7d15e392438fc227dda461e62f238fdd37174ef29c770ce5d63c01de56031` is healthy. The direct rollback tag `luta-loadingpage-filing-app:rollback-five-locale-hero-20260722-260eda9` resolves to the previous image `sha256:18ba8184c87e99f84a2bc774a93f9c92e9b694cb646f417efb51c3bf3837a3fb`.
- Production HTTP checks returned `200` for `/`, `/healthz`, `/install`, all five explicit locale routes and the three legal/contact routes. Admin compatibility remained JSON `401` with `X-Luta-Compatibility: admin-api-legacy`; Smart Link invalid-state recovery and Admin CORS passed.
- Real production Browser checks confirmed the five Marketing routes at 390×844 with zero horizontal overflow; 1280×720 rendered an 84 px sticky Header plus a 636 px Hero ending exactly at the viewport bottom. Arrow-key interaction changed the central slide from reading to Tabao and back. Header “获取 App” generated a canonical `lclk_*` and reached the authoritative `/install` choice surface. Privacy, terms and contact headings rendered, and the tested tab reported zero console warnings/errors.
- English, Japanese and Korean content structure and product positioning are implemented. Native review of Buddhist terminology and product tone has not been completed; the user explicitly accepted that risk as a recorded production exception on 2026-07-22 and authorized publication.
- The Vite SPA still serves one static Simplified-Chinese OpenGraph/Twitter shell and has no route-level canonical/hreflang. Runtime page metadata is correct for users, but social crawlers may not execute it; route-level prerendering or server metadata is a separate SEO release decision and was not silently expanded into this UI change.
- The five-person unprompted test, real-user CWV p75, AVIF/WebP/srcset and final combined Logo remain open design-system gates.

final result: production released — the five-locale, dynamic-first-view, user-controlled Hero implementation is live at `lutaai.com`, with service, route, interaction, install-gate, legal-page and console smoke passed; native-copy review and the broader design-system gates remain explicitly open
