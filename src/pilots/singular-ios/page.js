import { createPilotDownload, sanitizePilotPageUrl } from './download.js'
import { pilotConfig } from './config.js'
import './page.css'

// Remove unrelated identifiers before a future, reviewed SDK bootstrap sees the
// page URL. No bootstrap or external script is included in this preparation.
const pageUrl = sanitizePilotPageUrl(window.location.href)
window.history.replaceState(null, '', pageUrl)
const download = createPilotDownload({ config: pilotConfig, sdk: window.singularSdk, pageUrl })
const consent = document.getElementById('copy-consent')
const button = document.getElementById('measured-download')
const status = document.getElementById('status')
button.disabled = !download.ready
consent.disabled = !download.ready
status.textContent = download.ready
    ? '你也可以直接前往 App Store，不複製連接碼。'
    : '測試入口尚未開放。你仍可直接從 App Store 下載。'

button.addEventListener('click', () => {
    if (!consent.checked) {
        status.textContent = '請先選擇是否複製連接碼，或直接前往 App Store。'
        return
    }
    const result = download.prepare({ consent: true })
    // A URL containing ecid is not proof that the system clipboard was written,
    // nor that an installation or attribution succeeded. No such metric is sent.
    status.textContent = '正在前往下載頁。來源連接結果將在 App 首開後核對。'
    window.location.assign(result.url)
})
