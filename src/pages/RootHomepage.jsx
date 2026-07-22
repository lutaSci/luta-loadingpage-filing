import { lazy, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useLanguage } from '../contexts/LanguageContext.jsx'
import { resolveRootHomepage } from '../lib/rootHomepage.js'
import MarketingLanding from './MarketingLanding.jsx'

const LegacyHomepage = lazy(() => import('../App.jsx'))

export default function RootHomepage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { currentLanguage } = useLanguage()
    const transitionLanguage = location.state?.preferredLanguage
    const preferredLanguage = transitionLanguage || currentLanguage
    const homepage = resolveRootHomepage(preferredLanguage)

    useEffect(() => {
        if (!transitionLanguage || transitionLanguage !== currentLanguage) return

        navigate(`${location.pathname}${location.search}${location.hash}`, {
            replace: true,
            state: null,
        })
    }, [currentLanguage, location.hash, location.pathname, location.search, navigate, transitionLanguage])

    if (homepage.experience === 'marketing') {
        return <MarketingLanding locale={homepage.locale} />
    }

    return <LegacyHomepage />
}
