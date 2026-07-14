const RECOVERY_STATUS_GROUPS = Object.freeze({
    preparing: new Set(['link_draft', 'link_not_effective']),
    paused: new Set(['link_paused']),
    unavailable: new Set([
        'invalid_request',
        'journey_root_unavailable',
        'link_archived',
        'link_expired',
        'link_not_found',
    ]),
})

export function resolveSmartLinkRecovery(search = '') {
    const rawStatus = new URLSearchParams(search).get('smart_link_status')?.trim()
    if (!rawStatus) return null

    for (const [group, statuses] of Object.entries(RECOVERY_STATUS_GROUPS)) {
        if (statuses.has(rawStatus)) return { group }
    }

    return null
}

export function withoutSmartLinkRecovery(url) {
    const nextUrl = new URL(url)
    nextUrl.searchParams.delete('smart_link_status')
    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
}
