// Deployment inputs are trusted build configuration, never URL/query inputs.
// Keep the QA profile web-only until its App Link contract is separately released.
export function resolveDeployment(env = {}) {
    const environment = env.VITE_DEPLOYMENT_ENV || 'production'
    if (!['production', 'qa'].includes(environment)) {
        throw new Error('Unknown deployment environment')
    }
    const isQa = environment === 'qa'
    if (isQa) {
        const required = {
            VITE_LUTA_API_BASE: 'https://qa-api.lutaai.com',
            VITE_ATTRIBUTION_CONTINUE_BASE: 'https://qa-go.lutaai.com',
            VITE_POSTHOG_ENABLED: 'false',
        }
        for (const [key, value] of Object.entries(required)) {
            if (env[key] !== value) throw new Error(`QA deployment requires ${key}=${value}`)
        }
        for (const key of ['VITE_GLOBAL_MOBILE_HANDOFF', 'VITE_SMART_LINK_HOMEPAGE_SURFACE',
            'VITE_META_PIXEL_ENABLED']) {
            if (env[key] && env[key] !== 'false') {
                throw new Error(`QA deployment has not released ${key}`)
            }
        }
    }
    const continueBase = env.VITE_ATTRIBUTION_CONTINUE_BASE || 'https://go.lutaai.com'
    return {
        environment,
        apiBase: isQa ? env.VITE_LUTA_API_BASE : null,
        continueBase,
        appLinkBase: isQa ? '' : 'https://link.lutaai.com/l',
        outBase: isQa ? '' : 'https://go.lutaai.com/out',
        legacyOutBase: isQa ? `${continueBase}/r` : 'https://go.lutaai.com/r',
        posthogEnabled: env.VITE_POSTHOG_ENABLED !== 'false',
    }
}
