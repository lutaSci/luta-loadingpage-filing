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
import { isMarketingPath } from '../lib/marketingLocales.js'
import {
    captureSmartLinkEntry,
    clearSmartLinkEntrySession,
    hasSmartLinkBearer,
    parseSmartLinkEntry,
    persistSmartLinkEntry,
    updateSmartLinkEntryChoice,
} from '../lib/smartLinkEntry.js'

const SmartLinkJourneyContext = createContext(null)

function safelyCaptureEntry(search, allowStoredEntry) {
    try {
        if (allowStoredEntry) return captureSmartLinkEntry({ search })
        return parseSmartLinkEntry(search)
    } catch {
        return null
    }
}

export function SmartLinkJourneyProvider({ children }) {
    const location = useLocation()
    const navigate = useNavigate()
    const homepageSurfaceEnabled = config.smartLink.homepageSurfaceEnabled
    const entryEligiblePath = location.pathname === '/install'
        || (homepageSurfaceEnabled && isMarketingPath(location.pathname))
    const [entry, setEntry] = useState(() => (
        entryEligiblePath
            ? safelyCaptureEntry(window.location.search, homepageSurfaceEnabled)
            : null
    ))

    useEffect(() => {
        if (!entryEligiblePath) return
        const inbound = parseSmartLinkEntry(location.search)
        if (!inbound) return
        setEntry(persistSmartLinkEntry(inbound))
    }, [entryEligiblePath, location.search])

    const usesHomepageSurface = Boolean(
        homepageSurfaceEnabled
        && entry
        && (location.pathname === '/install' || isMarketingPath(location.pathname)),
    )

    useEffect(() => {
        if (!usesHomepageSurface) return
        if (location.pathname === '/install') {
            navigate(`/${location.hash || ''}`, { replace: true })
            return
        }
        if (isMarketingPath(location.pathname) && hasSmartLinkBearer(location.search)) {
            navigate(`${location.pathname}${location.hash || ''}`, { replace: true })
        }
    }, [
        location.hash,
        location.pathname,
        location.search,
        navigate,
        usesHomepageSurface,
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
