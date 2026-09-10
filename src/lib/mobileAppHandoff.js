import { detectDeviceFromUserAgent } from './deviceDetection.js'
import { isMarketingPath } from './marketingLocales.js'
import { isInstallOptionActionable, isOptionAvailable } from './installFlow.js'

export const MOBILE_HANDOFF_KEY = 'luta-mobile-app-handoff-v1'
export const MOBILE_HANDOFF_POLICY = 'global_mobile_v1'
export const WEBSITE_APP_OPEN_URL = 'https://link.lutaai.com/l/open/app'
const PHASES = new Set(['attempted', 'continue_pending', 'store', 'browse'])

export function readHandoff(storage) {
    try {
        const value = JSON.parse(storage.getItem(MOBILE_HANDOFF_KEY))
        return PHASES.has(value?.phase) && Number.isFinite(value.at) ? value : null
    } catch {
        return null
    }
}

export function writeHandoff(storage, phase, journey = 'direct', now = Date.now()) {
    try {
        storage.setItem(MOBILE_HANDOFF_KEY, JSON.stringify({ phase, journey, at: now }))
        return readHandoff(storage)?.phase === phase
    } catch {
        return false
    }
}

export function resolveMobileHandoff({ enabled, pathname, market, userAgent, hasEntry, loadStatus }) {
    const device = detectDeviceFromUserAgent(userAgent)
    const platform = device.isHarmonyOSNext ? null : device.isIOS ? 'ios' : device.isAndroid ? 'android' : null
    const eligible = Boolean(enabled && market === 'global' && platform
        && (isMarketingPath(pathname) || (pathname === '/install' && hasEntry))
        && (!hasEntry || loadStatus === 'ready'))
    const requiresBrowser = /MicroMessenger|FBAN|FBAV|Instagram|Line\/|; wv\)/i.test(userAgent || '')
    return { eligible, platform, requiresBrowser }
}

export function selectGlobalHandoffOption(options = [], platform) {
    const channel = platform === 'ios' ? 'apple_app_store' : platform === 'android' ? 'google_play' : null
    return options.find(option => option.region === 'global'
        && option.channel === channel && isOptionAvailable(option)
        && isInstallOptionActionable(option, platform)) || null
}

export function buildHandoffAppUrl(appUrl = WEBSITE_APP_OPEN_URL, trigger = 'automatic') {
    try {
        const url = new URL(appUrl)
        if (url.origin !== 'https://link.lutaai.com' || url.username || url.password
            || !(url.pathname === '/l/open/app' || /^\/l\/[A-Za-z0-9._:-]+$/.test(url.pathname))
            || !['automatic', 'continue'].includes(trigger)) return null
        // The app receives only the existing opaque identity plus a bounded web
        // fallback marker. Signed state and arbitrary destinations stay on web.
        const clicks = url.searchParams.getAll('click_id')
        url.search = ''
        if (url.pathname !== '/l/open/app') {
            if (clicks.length !== 1 || !/^clk_[0-9a-f]{32}$/.test(clicks[0])) return null
            url.searchParams.set('click_id', clicks[0])
        }
        url.searchParams.set('web_handoff', trigger)
        url.hash = ''
        return url.toString()
    } catch {
        return null
    }
}

export function canContinueToStore({ record, returnedByResolver, journey, now = Date.now() }) {
    // A timer, reload or browser visibility change is never installation proof.
    // Only an explicit Continue followed by our HTTP fallback permits this exit.
    return Boolean(returnedByResolver && record?.phase === 'continue_pending'
        && record.journey === journey && now >= record.at && now - record.at < 60_000)
}
