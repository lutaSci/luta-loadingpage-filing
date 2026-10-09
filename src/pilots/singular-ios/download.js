// Independent QA preparation. No SDK loading, initialization, telemetry, storage,
// or clipboard reading occurs here. A vendor-approved bootstrap is still needed.
export const IOS_STORE_URL = 'https://apps.apple.com/us/app/id6778084383'

const QA_ACCOUNT = 'facebook__luta_official'
const ENTRIES = new Set(['profile', 'post', 'story', 'description', 'pinned_comment'])

export function sanitizePilotPageUrl(value) {
    const url = new URL(value)
    const supplied = url.searchParams
    // Re-sanitizing after refresh preserves the cleaned URL's valid QA tags.
    // Ambiguous duplicate/alias values fall back rather than choosing a source.
    const entries = [...supplied.getAll('entry'), ...supplied.getAll('pcrn')]
    const entry = entries.length === 1 && ENTRIES.has(entries[0]) ? entries[0] : 'profile'
    const content = [...supplied.getAll('content'), ...supplied.getAll('pcrid')]
    const contentId = content.length === 1 && /^QA_[A-Za-z0-9_-]{1,96}$/.test(content[0])
        ? content[0] : null
    url.username = ''
    url.password = ''
    url.hash = ''
    url.search = ''
    // Fixed QA campaign; callers cannot turn this entry into a formal campaign.
    url.searchParams.set('pcn', 'qa_owned_media')
    url.searchParams.set('pcid', 'qa_ios_connecting_pilot_20261009')
    url.searchParams.set('pscn', QA_ACCOUNT)
    url.searchParams.set('pscid', QA_ACCOUNT)
    url.searchParams.set('pcrn', entry)
    if (contentId) url.searchParams.set('pcrid', contentId)
    return url.toString()
}

function approvedBase(config) {
    if (config?.entitlementConfirmed !== true || config?.nativeReadConfirmed !== true ||
        !config?.webProductId || !config?.supportEvidence || !config?.pageOrigin) return null
    try {
        const base = new URL(config.baseLink)
        const page = new URL(config.pageOrigin)
        if (base.protocol !== 'https:' || base.hostname !== 'lutaai.sng.link' ||
            base.port || base.username || base.password || base.search || base.hash ||
            !/^\/[A-Za-z0-9]+\/[A-Za-z0-9]+\/?$/.test(base.pathname) ||
            page.protocol !== 'https:' || page.origin !== config.pageOrigin) return null
        return base
    } catch {
        return null
    }
}

function compatibleLink(value, base) {
    try {
        const link = new URL(value)
        return link.origin === base.origin && link.pathname === base.pathname &&
            !link.username && !link.password && !link.hash ? link : null
    } catch {
        return null
    }
}

const direct = reason => ({ url: IOS_STORE_URL, route: 'direct_store', copyStatus: 'not_attempted', reason })

export function createPilotDownload({ config, sdk, pageUrl }) {
    const base = approvedBase(config)
    let page
    try { page = new URL(pageUrl) } catch { /* Disabled on malformed inputs. */ }
    const ready = !!(base && page && page.origin === config.pageOrigin &&
        typeof sdk?.buildWebToAppLink === 'function' &&
        typeof sdk?.enrichUrlWithClipboardDdlFlow === 'function')
    let prepared = null
    return {
        ready,
        prepare({ consent = false } = {}) {
            // Consent is checked on every call, including after a previous attempt.
            if (!consent) return direct('copy_not_requested')
            if (!ready) return direct('vendor_prerequisites_pending')
            if (prepared) return prepared
            let built
            try {
                built = compatibleLink(sdk.buildWebToAppLink(base.toString()), base)
            } catch { /* Downloads remain available if the SDK fails. */ }
            if (!built) {
                prepared = direct('link_build_failed')
                return prepared
            }
            // A stale connecting code must not be reused after a failed attempt.
            built.searchParams.delete('ecid')
            const ordinary = built.toString()
            try {
                // SDK 1.4.8's convenience wrapper throws in the offline preflight.
                // These supported instance methods are invoked synchronously from
                // the click handler to retain browser user activation.
                const enriched = compatibleLink(sdk.enrichUrlWithClipboardDdlFlow(ordinary), base)
                if (enriched?.searchParams.getAll('ecid').length === 1) {
                    const code = new URL(enriched.searchParams.get('ecid'))
                    if (code.origin === page.origin && !code.username && !code.password &&
                        !code.search && !code.hash && code.pathname !== '/') {
                        prepared = { url: enriched.toString(), route: 'singular',
                            copyStatus: 'unknown', reason: 'sdk_has_no_copy_receipt' }
                        return prepared
                    }
                }
            } catch { /* Copy/URL failure falls back to the ordinary download. */ }
            prepared = { url: ordinary, route: 'singular', copyStatus: 'unknown', reason: 'clipboard_flow_unconfirmed' }
            return prepared
        },
    }
}
