export const MEASUREMENT_CONSENT_STORAGE_KEY = 'luta-ad-measurement-consent-v1'
export const MEASUREMENT_CONSENT_EVENT = 'luta:ad-measurement-consent-changed'
export const MEASUREMENT_CONSENT_VALUES = Object.freeze({
    unknown: 'unknown',
    granted: 'granted',
    denied: 'denied',
})

function defaultStorage() {
    try {
        return globalThis.localStorage || null
    } catch {
        return null
    }
}

export function readMeasurementConsent(storage) {
    const resolvedStorage = storage === undefined ? defaultStorage() : storage
    try {
        const value = resolvedStorage?.getItem(MEASUREMENT_CONSENT_STORAGE_KEY)
        return value === MEASUREMENT_CONSENT_VALUES.granted
            || value === MEASUREMENT_CONSENT_VALUES.denied
            ? value
            : MEASUREMENT_CONSENT_VALUES.unknown
    } catch {
        return MEASUREMENT_CONSENT_VALUES.unknown
    }
}

export function writeMeasurementConsent(value, storage) {
    if (
        value !== MEASUREMENT_CONSENT_VALUES.granted
        && value !== MEASUREMENT_CONSENT_VALUES.denied
    ) return MEASUREMENT_CONSENT_VALUES.unknown

    const resolvedStorage = storage === undefined ? defaultStorage() : storage
    try {
        resolvedStorage?.setItem(MEASUREMENT_CONSENT_STORAGE_KEY, value)
    } catch {
        // Private browsing can deny persistence. Apply the choice for this page.
    }
    try {
        globalThis.window?.dispatchEvent(new CustomEvent(
            MEASUREMENT_CONSENT_EVENT,
            { detail: { value } },
        ))
    } catch {
        // The storage write remains authoritative when CustomEvent is unavailable.
    }
    return value
}

export function subscribeMeasurementConsent(listener, runtimeWindow = globalThis.window) {
    if (!runtimeWindow?.addEventListener || typeof listener !== 'function') return () => {}
    const handler = event => listener(event?.detail?.value || MEASUREMENT_CONSENT_VALUES.unknown)
    runtimeWindow.addEventListener(MEASUREMENT_CONSENT_EVENT, handler)
    return () => runtimeWindow.removeEventListener(MEASUREMENT_CONSENT_EVENT, handler)
}
