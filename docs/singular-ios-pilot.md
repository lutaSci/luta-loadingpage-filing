# Independent iOS connecting-code pilot — preparation

Owner: yuhaoliu / Growth; implementation and evidence: Engineering.
Status: offline preparation, not deployed or activated.

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
  React app and default Vite production build. It does not import the prepared
  bootstrap module or include an external SDK script, API calls, storage or a
  clipboard reader. PR #35 was merged on 2026-10-09; that does not activate it.
- The first entry is fixed to the Facebook QA campaign/account. A bounded entry
  and optional `QA_` content ID survive refresh. Query credentials, user IDs,
  provider IDs, redirects and caller-selected formal campaign values are removed
  before a future SDK bootstrap can observe the page URL.
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
  No real credentials are provided, and the current page does not call it.

The bootstrap does not copy anything or claim install/source success. Future page
wiring must prepare after the explicit choice, then enable a separate synchronous
download click; copying after awaiting a script load can lose browser activation.
`cancel()` cancels preparation/hand-off only. It cannot retract a page visit already
emitted by SDK initialization and is not a vendor privacy-withdrawal API. SDK storage,
native initialization, real paste prompts and privacy lifecycle need separate review.

## Checks and reproducible local preview

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run test:attribution
npm run lint
npm run build
npm run dev -- --host 127.0.0.1 --port 4319 --strictPort
```

Open `http://127.0.0.1:4319/singular-ios-pilot.html?entry=profile&content=QA_FB_01`.
The copy action stays disabled because no account configuration or SDK bootstrap
is supplied. Do not install an SDK by pasting script URLs into this page.

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

1. Obtain account-specific Web App/Product ID, entitlement/fees and the correct QA
   base link from Singular. Current blank values are intentional, not placeholders
   to populate from an ordinary Custom tracker URL.
2. Confirm the iOS native reading scope and timing, compatible Flutter/native
   SDK versions and initialization threading. Current Reader initializes with
   `clipboardAttribution=false`. No client flag is changed in this PR: the native
   12.13.0 header warns about synchronous blocking reads, which is a candidate
   integration risk rather than a reproduced phone freeze or the current root cause.
3. Under the confirmed constraints, wire the prepared bootstrap to the QA page
   and runtime-provisioned credentials, review consent/storage lifecycle and
   deployment/CSP, and implement the test client. SDK initialization itself emits
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
Keeping this branch unmerged/default-inactive preserves the current public paths.
