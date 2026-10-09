# Independent iOS connecting-code pilot — preparation

Owner: yuhaoliu / Growth; implementation and evidence: Engineering.
Status: page wiring and separate artifact prepared; account activation and real-device acceptance pending.

The user approved an independent iOS pilot on 2026-10-09, conditional on Singular
confirming current entitlement, a dedicated base link and native reading/data-use
boundaries. Additional fees require alignment. The four formal links and the
unified formal Android/iOS release remain on their existing plan. The goal is to
connect a real promotion click to a fresh installation, registration and 今日觀照;
a store redirect, SDK event receipt or generated connecting URL is insufficient.

Authoritative project task: [coverage repair §9.21](https://github.com/lutaSci/luta-docs/blob/main/docs/domains/growth-attribution/tasks/2026-09-30-singular-attribution-coverage-repair-plan.md).
Company support record: [189319](https://support.singular.net/hc/en-us/requests/189319?page=1).

## Prepared here

- `singular-ios-pilot.html` is a standalone local QA page, outside the normal
  React app and default Vite production build. PR #35 (page) and #36 (bootstrap)
  were merged on 2026-10-09. The page now imports the coordinator; default false
  prerequisites and absent credentials keep it inactive. Importing or mounting
  does not request a vendor script, initialize, copy, or record a page visit.
- The first entry is fixed to the Facebook QA campaign/account. A bounded entry
  and optional `QA_` content ID survive refresh. Query credentials, user IDs,
  provider IDs, redirects and caller-selected formal campaign values are removed
  before SDK bootstrap can observe the page URL.
- The explicit copy choice and direct App Store action are separate. The SDK
  adapter requires account/native prerequisites and the exact approved HTTPS QA
  origin. It calls the two separate methods synchronously from a user click;
  repeated actions reuse the result and a later refusal bypasses copy work.
- SDK failure falls back to an ordinary download. SDK 1.4.8 does not acknowledge
  successful copying; `ecid` alone is recorded as **unknown**, never as installed,
  registered or correctly attributed. Clipboard contents and generated codes are
  not logged or persisted by this preparation.
- `bootstrap.js` prepares an inert coordinator and official-version loader.
  Only trusted prerequisites, runtime-injected SDK credentials, an explicit
  measurement choice and the exact QA page may start it. It sanitizes/read-checks
  the URL before loading the reviewed 1.4.8 bundle with subresource integrity.
  It initializes once and waits for the SDK's initialization callback. Load or
  readiness failure leaves the direct-download path available. A timed-out or
  cancelled attempt cannot initialize from a late library response.
  No real credentials are provided. `page-controller.js` starts it only after
  the explicit checkbox choice and waits for readiness before enabling download.
  Unchecking, direct download, page exit, failures or URL changes prevent a late
  hand-off. Retrying after cancellation requires refreshing, avoiding a second
  initialization under different privacy context on the same coordinator.

The bootstrap does not copy anything or claim install/source success. Page wiring
prepares after the explicit choice, then enables a separate synchronous download
click; copying after awaiting a script load can lose browser activation.
`cancel()` cancels preparation/hand-off only. It cannot retract a page visit already
emitted by SDK initialization and is not a vendor privacy-withdrawal API. SDK storage,
native initialization, real paste prompts and privacy lifecycle need separate review.

## Checks and reproducible local preview

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run test:attribution
npm run lint
npm run build
npm run build:singular-ios-pilot
npm run dev -- --host 127.0.0.1 --port 4319 --strictPort
```

Open `http://127.0.0.1:4319/singular-ios-pilot.html?entry=profile&content=QA_FB_01`.
The copy action stays disabled because approved account configuration and runtime
credentials are absent. Do not install an SDK by pasting script URLs into this page.
`build:singular-ios-pilot` emits only the standalone page and its JS/CSS into
`dist-singular-ios-pilot`; it does not copy normal website assets or redirects.
CI checks that normal `dist` excludes the pilot HTML and SDK loader. This build
does not deploy the page or include a mobile test package.

For an approved activation, configure `config.js` with verified account facts and
inject only the vendor Web SDK credentials into the deployment-owned
`window.lutaSingularIosPilotCredentials` before the module executes. Never read
credentials, entitlement or source authority from URL parameters or storage.
Any Web SDK credential used in a browser is necessarily visible to that browser;
do not reuse a reporting, admin, REST or CAPI credential. The QA host must provide
the reviewed CSP/noindex policy before deployment. Callback readiness enables the
button but is not evidence of a vendor page visit or matched installation.

The separate offline SDK check takes a previously obtained official bundle:

```bash
node scripts/preflight-singular-ios.mjs /absolute/path/to/singular-web-sdk-1.4.8.js
```

The harness verifies the reviewed bundle hash, uses fake browser/storage/network
objects and mock credentials, and performs no real network requests, clipboard
writes, navigation or device test. It verifies both copying accepted/refused by
the fixture and marketing forwarding, without claiming native-browser success.
The vendor bundle is not committed or redistributed here.

## Remaining activation and acceptance

1. Current Apps Configuration already contains Web `https://lutaai.com/` with the
   same Bundle ID (the Web SDK Product ID), SDK not integrated. This self-service
   field does not require a vendor answer. Confirm whether to use it or a separate
   QA Web App, plus current entitlement/fees and the dedicated Web-to-App QA base
   link from Singular. Blank gated values must not be filled from an ordinary
   Custom tracker URL. The account's Starter plan and optional Web Attribution
   upgrade listing alone do not prove this pilot is enabled or that fees apply.
2. Confirm the iOS native reading scope and timing, compatible Flutter/native
   SDK versions and initialization threading. Current Reader initializes with
   `clipboardAttribution=false`. No client flag is changed in this PR: the native
   12.13.0 header warns about synchronous blocking reads, which is a candidate
   integration risk rather than a reproduced phone freeze or the current root cause.
3. Page wiring and its separate build are now implemented. Under the confirmed
   constraints, provision credentials and reviewed deployment/CSP, complete the
   consent/storage lifecycle review, and implement the test client. SDK initialization itself emits
   a page visit; no live initialization is part of this preparation. An integrity
   or CSP/CORS failure must preserve ordinary download, not disable browser checks.
4. Build only the independently authorized Global iOS test channel after the
   prerequisites are satisfied. Do not resume the unified formal release or China.
5. Verify the real Facebook entry on a clean iPhone installation, including first
   open, mock new registration and 今日觀照. Test refused/overwritten clipboard,
   privacy withdrawal and repeated actions; compare first-party facts, Singular
   receipt/source and mature report fields separately. Test-build results do not
   substitute for final public-store acceptance or establish 80% attribution.

If Singular confirms a simpler account-supported hosted connection, prefer that
route rather than adding unnecessary clipboard integration. Fees, excessive reading,
unsupported initialization or UI blocking return to the owner for a route decision.
Keeping the pilot default-inactive and outside the public build preserves the current paths.
