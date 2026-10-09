// The QA page wires this module, but approval and explicit choice still gate
// activation. No SDK load or initialization occurs on import or construction.
import { approvedPilotBase, sanitizePilotPageUrl } from './download.js'

export const PILOT_SDK_URL = 'https://web-sdk-cdn.singular.net/singular-sdk/1.4.8/singular-sdk.js'
export const PILOT_SDK_INTEGRITY = 'sha256-YlcC2z5oFWYGd5KTt4n+xs508WypaEAXyA0EvMsenXc='

// Constructing the loader is inert. Only the approved coordinator may call it.
// Missing account prerequisites keep the wired page inactive.
export function createPilotSdkLoader({ document, sdkGlobal }) {
    let loading
    return url => {
        if (url !== PILOT_SDK_URL) return Promise.reject(new Error('unsupported_sdk_source'))
        if (loading) return loading
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = PILOT_SDK_URL
            script.integrity = PILOT_SDK_INTEGRITY
            script.crossOrigin = 'anonymous'
            script.referrerPolicy = 'no-referrer'
            script.async = true
            script.onload = () => resolve({ sdk: sdkGlobal.singularSdk, Config: sdkGlobal.SingularConfig })
            script.onerror = () => reject(new Error('sdk_script_unavailable'))
            document.head.appendChild(script)
        })
        return loading
    }
}

const disabled = reason => ({ status: 'disabled', reason, sdk: null })
const failed = reason => ({ status: 'failed', reason, sdk: null })
const nonempty = value => typeof value === 'string' && value.trim().length > 0

export function createPilotBootstrap({ config, credentials, page, loadSdk, timeoutMs = 8000 }) {
    // Capture trusted deployment inputs; URL fields cannot grant eligibility.
    const trusted = { ...config }
    const keys = { ...credentials }
    let attempt = null
    let cancelled = false
    let finishAttempt

    return {
        start({ consent = false } = {}) {
            if (!consent) {
                if (attempt) {
                    cancelled = true
                    finishAttempt?.(disabled('measurement_not_requested'))
                }
                return Promise.resolve(disabled('measurement_not_requested'))
            }
            if (cancelled) return Promise.resolve(disabled('preparation_cancelled'))
            if (attempt) return attempt
            if (!approvedPilotBase(trusted) || !nonempty(keys.sdkKey) || !nonempty(keys.sdkSecret) ||
                typeof page?.getUrl !== 'function' || typeof page?.replaceUrl !== 'function' ||
                typeof loadSdk !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
                return Promise.resolve(disabled('vendor_prerequisites_pending'))
            }

            let clean
            try {
                clean = sanitizePilotPageUrl(page.getUrl())
                const url = new URL(clean)
                if (url.origin !== trusted.pageOrigin || url.pathname !== '/singular-ios-pilot.html') {
                    return Promise.resolve(disabled('wrong_qa_page'))
                }
                page.replaceUrl(clean)
                // Do not load a vendor script if sanitation did not take effect.
                if (page.getUrl() !== clean) return Promise.resolve(disabled('page_not_sanitized'))
            } catch {
                return Promise.resolve(disabled('page_not_sanitized'))
            }

            attempt = new Promise(resolve => {
                let settled = false
                const timer = setTimeout(() => finish(failed('sdk_ready_timeout')), timeoutMs)
                function finish(result) {
                    if (settled) return
                    settled = true
                    clearTimeout(timer)
                    resolve(result)
                }
                finishAttempt = finish
                // The loader receives a fixed official version, never a URL
                // supplied by an incoming link. Activation/wiring remains gated.
                Promise.resolve().then(() => {
                    if (settled || cancelled) return null
                    return loadSdk(PILOT_SDK_URL)
                }).then(bundle => {
                    if (settled || cancelled) return
                    if (page.getUrl() !== clean) {
                        finish(failed('page_changed_during_load'))
                        return
                    }
                    const { sdk, Config } = bundle || {}
                    if (typeof Config !== 'function' || typeof sdk?.init !== 'function' ||
                        typeof sdk?.buildWebToAppLink !== 'function' ||
                        typeof sdk?.enrichUrlWithClipboardDdlFlow !== 'function') {
                        finish(failed('sdk_api_unavailable'))
                        return
                    }
                    let initReturned = false
                    let callbackReceived = false
                    const ready = () => {
                        callbackReceived = true
                        if (initReturned) finish({ status: 'ready', reason: 'sdk_initialized', sdk })
                    }
                    try {
                        const sdkConfig = new Config(keys.sdkKey, keys.sdkSecret, trusted.webProductId)
                        if (typeof sdkConfig.withInitFinishedCallback !== 'function') {
                            finish(failed('sdk_api_unavailable'))
                            return
                        }
                        sdkConfig.withInitFinishedCallback(ready)
                        // The vendor's documented init emits a page visit. Never
                        // initialize twice or claim this is an install/source.
                        sdk.init(sdkConfig)
                        initReturned = true
                        if (callbackReceived) ready()
                    } catch {
                        finish(failed('sdk_init_failed'))
                    }
                }).catch(() => finish(failed('sdk_load_failed')))
            })
            return attempt
        },
        cancel() {
            cancelled = true
            finishAttempt?.(disabled('preparation_cancelled'))
            // Cancellation prevents a pending init/hand-off. It is not a vendor
            // opt-out API and cannot undo a page visit already emitted by init.
        },
    }
}
