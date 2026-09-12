const RETURN_STATE_KEY = 'lutaFooterReturnY'

// Keep this marker on the originating history entry, without storing a URL or
// forwarding attribution state to the external platform.
export function rememberFooterPosition(event, browser = window) {
    if (event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    browser.history.replaceState({
        ...browser.history.state,
        [RETURN_STATE_KEY]: browser.scrollY,
    }, '')
}

export function restoreFooterPosition(browser = window) {
    const state = browser.history.state
    if (!state || !(RETURN_STATE_KEY in state)) return undefined
    const { [RETURN_STATE_KEY]: position, ...rest } = state

    // Reloads and ordinary visits must not jump. A bfcache restore keeps the
    // original document and uses native scroll restoration without remounting.
    if (browser.performance.getEntriesByType('navigation')[0]?.type !== 'back_forward'
        || !Number.isFinite(position) || position < 0) {
        browser.history.replaceState(rest, '')
        return undefined
    }

    const frame = browser.requestAnimationFrame(() => {
        const { [RETURN_STATE_KEY]: consumed, ...currentState } = browser.history.state || {}
        if (consumed !== position) return
        browser.history.replaceState(currentState, '')
        browser.scrollTo({ top: position, behavior: 'instant' })
    })
    return () => browser.cancelAnimationFrame(frame)
}
