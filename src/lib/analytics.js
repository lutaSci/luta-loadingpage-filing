const GA_ID = 'G-5QE6T3L0LD'

export const trackEvent = (eventName, params = {}) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
            send_to: GA_ID,
            ...params,
        })
    }
}
