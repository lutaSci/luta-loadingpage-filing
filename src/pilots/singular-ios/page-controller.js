import { approvedPilotBase, createPilotDownload, sanitizePilotPageUrl } from './download.js'
import { createPilotBootstrap, createPilotSdkLoader } from './bootstrap.js'

// Entry wiring is inert until a deliberate choice. Credentials are supplied by
// the approved deployment, never by URL fields or browser storage.
export function mountPilotPage({ config, credentials, window, document, loadSdk, timeoutMs }) {
    config = Object.freeze({ ...config })
    credentials = Object.freeze({ ...credentials })
    const consent = document.getElementById('copy-consent')
    const button = document.getElementById('measured-download')
    const status = document.getElementById('status')
    const direct = document.getElementById('direct-download')
    const page = { getUrl: () => window.location.href,
        replaceUrl: value => window.history.replaceState(null, '', value) }
    let cleanUrl
    try {
        cleanUrl = sanitizePilotPageUrl(page.getUrl())
        page.replaceUrl(cleanUrl)
    } catch { /* The unmeasured App Store link remains available. */ }
    const bootstrap = createPilotBootstrap({ config, credentials, page,
        loadSdk: loadSdk || createPilotSdkLoader({ document, sdkGlobal: window }), timeoutMs })
    let download = null
    let generation = 0
    let cancelled = false
    let disposed = false
    let navigated = false
    let waiting = Promise.resolve()
    const eligible = !!(cleanUrl && page.getUrl() === cleanUrl && approvedPilotBase(config) &&
        new URL(cleanUrl).origin === config.pageOrigin &&
        new URL(cleanUrl).pathname === '/singular-ios-pilot.html' &&
        typeof credentials?.sdkKey === 'string' && credentials.sdkKey.trim() &&
        typeof credentials?.sdkSecret === 'string' && credentials.sdkSecret.trim())
    button.disabled = true
    consent.disabled = !eligible
    status.textContent = eligible
        ? '你可以選擇連接本次下載來源，也可以直接前往 App Store。'
        : '測試入口尚未開放。你仍可直接從 App Store 下載。'

    function cancel() {
        generation += 1
        cancelled = true
        download = null
        button.disabled = true
        bootstrap.cancel()
    }
    function onChoice() {
        if (disposed || navigated || !eligible) return
        if (!consent.checked) {
            cancel()
            status.textContent = '已取消來源連接。你可以直接下載；若要重試，請重新整理此頁。'
            return
        }
        if (cancelled) {
            consent.checked = false
            status.textContent = '你可以直接下載；若要重試來源連接，請重新整理此頁。'
            return
        }
        const current = ++generation
        button.disabled = true
        status.textContent = '正在準備下載。你仍可直接前往 App Store。'
        waiting = bootstrap.start({ consent: true }).then(result => {
            if (disposed || cancelled || navigated || !consent.checked || current !== generation) return
            if (result.status !== 'ready' || page.getUrl() !== cleanUrl) {
                cancel()
                status.textContent = '來源連接暫時不可用。請直接前往 App Store 下載。'
                return
            }
            download = createPilotDownload({ config, sdk: result.sdk, pageUrl: cleanUrl })
            button.disabled = !download.ready
            status.textContent = download.ready
                ? '已可下載。點擊下方按鈕後，才會嘗試複製安裝連接碼。'
                : '來源連接暫時不可用。請直接前往 App Store 下載。'
        })
    }
    function onDownload() {
        if (disposed || cancelled || navigated || !consent.checked || button.disabled || !download) return
        if (page.getUrl() !== cleanUrl) {
            cancel()
            status.textContent = '下載入口已變更。請直接前往 App Store，或重新整理後再試。'
            return
        }
        // Deliberately synchronous: awaiting readiness here would lose browser
        // user activation required by the vendor clipboard flow.
        const result = download.prepare({ consent: true })
        navigated = true
        button.disabled = true
        status.textContent = '正在前往下載頁。你也可以拒絕貼上，正常使用 App。'
        // ecid is not a copy acknowledgement or an installation/source receipt.
        window.location.assign(result.url)
    }
    function onDirect() {
        cancel()
        consent.checked = false
        status.textContent = '正在前往 App Store。'
    }
    consent.addEventListener('change', onChoice)
    button.addEventListener('click', onDownload)
    direct.addEventListener('click', onDirect)
    window.addEventListener('pagehide', cancel)
    return {
        whenSettled: () => waiting,
        dispose() {
            disposed = true
            cancel()
            consent.removeEventListener('change', onChoice)
            button.removeEventListener('click', onDownload)
            direct.removeEventListener('click', onDirect)
            window.removeEventListener('pagehide', cancel)
        },
    }
}
