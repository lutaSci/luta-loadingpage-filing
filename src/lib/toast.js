let showToast = null

export function toast(message, duration = 3500) {
    showToast?.(message, duration)
}

export function registerToastHandler(handler) {
    showToast = handler

    return () => {
        if (showToast === handler) showToast = null
    }
}
