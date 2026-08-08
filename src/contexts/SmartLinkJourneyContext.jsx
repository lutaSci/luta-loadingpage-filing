import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { config } from '../config/index.js'
import { useInstallJourneyController } from '../hooks/useInstallJourneyController.js'
import { trackWebsitePageView } from '../lib/analytics.js'
import { isMarketingPath } from '../lib/marketingLocales.js'
import {
    captureSmartLinkEntry,
    clearSmartLinkEntrySession,
    hasSmartLinkBearer,
    parseSmartLinkEntry,
    persistSmartLinkEntry,
    resolveSmartLinkCleanupLocation,
    updateSmartLinkEntryChoice,
} from '../lib/smartLinkEntry.js'

const SmartLinkJourneyContext = createContext(null)

function safelyCaptureEntry(search, allowStoredEntry) {
    try {
        // A malformed inbound bearer must fail closed instead of silently
        // resuming a different journey from session storage.
        if (hasSmartLinkBearer(search)) {
            const inbound = parseSmartLinkEntry(search)
            if (!inbound) clearSmartLinkEntrySession()
            return inbound ? persistSmartLinkEntry(inbound) : null
        }
        if (allowStoredEntry) return captureSmartLinkEntry({ search })
        return parseSmartLinkEntry(search)
    } catch {
        return null
    }
}

function WebsiteAnalyticsObserver({ controller, entry, usesHomepageSurface }) {
    const location = useLocation()

    useEffect(() => {
        if (hasSmartLinkBearer(location.search)) return undefined

        const isInstallJourney = Boolean(
            entry && (location.pathname === '/install' || usesHomepageSurface),
        )
        if (
            isInstallJourney
            && (controller.loadStatus === 'idle' || controller.loadStatus === 'loading')
        ) return undefined

        // Allow route metadata effects to settle before reading document.title.
        // The analytics module deduplicates consecutive views of the same path.
        const timeoutId = window.setTimeout(() => {
            trackWebsitePageView({
                page_path: location.pathname,
                ...(isInstallJourney ? {
                    click_id: controller.installContext?.clickId,
                    entry_type: 'shortlink',
                    link_id: controller.installContext?.linkId,
                    route_market: controller.installContext?.campaignTargetMarket || 'unknown',
                    route_market_source: 'smart_link_context',
                    traffic_purpose: controller.installContext?.trafficPurpose || 'unknown',
                } : {}),
            })
        }, 0)
        return () => window.clearTimeout(timeoutId)
    }, [
        controller.installContext,
        controller.loadStatus,
        entry,
        location.pathname,
        location.search,
        usesHomepageSurface,
    ])

    return null
}

export function SmartLinkJourneyProvider({ children }) {
    const location = useLocation()
    const navigate = useNavigate()
    const homepageSurfaceEnabled = config.smartLink.homepageSurfaceEnabled
    const entryEligiblePath = location.pathname === '/install'
        || (homepageSurfaceEnabled && isMarketingPath(location.pathname))
    const [entry, setEntry] = useState(() => (
        entryEligiblePath
            ? safelyCaptureEntry(window.location.search, true)
            : null
    ))

    useEffect(() => {
        if (!entryEligiblePath) return
        const nextEntry = safelyCaptureEntry(location.search, true)
        setEntry(nextEntry)
    }, [entryEligiblePath, location.search])

    const usesHomepageSurface = Boolean(
        homepageSurfaceEnabled
        && entry
        && (location.pathname === '/install' || isMarketingPath(location.pathname)),
    )

    useEffect(() => {
        const safeLocation = resolveSmartLinkCleanupLocation({
            pathname: location.pathname,
            search: location.search,
            hash: location.hash || '',
            homepageSurfaceEnabled,
        })
        if (safeLocation) navigate(safeLocation, { replace: true })
    }, [
        homepageSurfaceEnabled,
        location.hash,
        location.pathname,
        location.search,
        navigate,
    ])

    const handleChoiceChange = useCallback(choice => {
        if (!entry) return
        updateSmartLinkEntryChoice(entry, choice)
    }, [entry])

    const exitJourney = useCallback(() => {
        clearSmartLinkEntrySession()
        setEntry(null)
        if (location.pathname === '/install') navigate('/', { replace: true })
    }, [location.pathname, navigate])

    const controller = useInstallJourneyController({
        entry,
        missingStateIsTerminal: location.pathname === '/install' && !usesHomepageSurface,
        surface: usesHomepageSurface ? 'official_homepage' : 'install_gate',
        pagePath: usesHomepageSurface ? '/' : '/install',
        onChoiceChange: handleChoiceChange,
        onExitJourney: exitJourney,
    })

    const value = useMemo(() => ({
        controller,
        entry,
        exitJourney,
        homepageSurfaceEnabled,
        isSmartLinkEntry: Boolean(entry),
        usesHomepageSurface,
    }), [
        controller,
        entry,
        exitJourney,
        homepageSurfaceEnabled,
        usesHomepageSurface,
    ])

    return (
        <SmartLinkJourneyContext.Provider value={value}>
            <WebsiteAnalyticsObserver
                controller={controller}
                entry={entry}
                usesHomepageSurface={usesHomepageSurface}
            />
            {children}
        </SmartLinkJourneyContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSmartLinkJourney() {
    const value = useContext(SmartLinkJourneyContext)
    if (!value) {
        throw new Error('useSmartLinkJourney must be used within SmartLinkJourneyProvider')
    }
    return value
}
