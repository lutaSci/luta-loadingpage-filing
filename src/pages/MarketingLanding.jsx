import { useEffect, useState } from 'react'

import MarketingHero from '../components/marketing/MarketingHero.jsx'
import PageShell from '../components/marketing/PageShell.jsx'
import PrincipleBand from '../components/marketing/PrincipleBand.jsx'
import ProductStory from '../components/marketing/ProductStory.jsx'
import SmartLinkStoreActionGroup from '../components/marketing/SmartLinkStoreActionGroup.jsx'
import StoreActionGroup from '../components/marketing/StoreActionGroup.jsx'
import { useStoreActionAdapter } from '../components/marketing/useStoreActionAdapter.js'
import { useSmartLinkStoreActionAdapter } from '../components/marketing/useSmartLinkStoreActionAdapter.js'
import { getMarketingContent } from '../content/marketingLanding.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import { useSmartLinkJourney } from '../contexts/SmartLinkJourneyContext.jsx'
import { buildInstallEntryUrl } from '../lib/attributionState.js'
import {
    hasExplicitTestflightParam,
    persistTestflightExpansion,
    readTestflightExpansion,
} from '../lib/marketingStoreActions.js'
import { applyMarketingMetadata } from '../lib/marketingSeo.js'
import '../components/marketing/marketing.css'

function LineTitle({ lines }) {
    return lines.map(line => <span key={line}>{line}</span>)
}

function WhyLuta({ content }) {
    const journeyTargets = ['#product-capabilities', '#product-practice', '#product-history']

    return (
        <section className="luta-marketing-why" id="why-luta" data-marketing-reveal>
            <div className="luta-marketing-container luta-marketing-why-layout">
                <h2><LineTitle lines={content.title} /></h2>
                <div className="luta-marketing-why-detail">
                    <p>
                        <span className="luta-marketing-desktop-copy">{content.description}</span>
                        <span className="luta-marketing-mobile-copy">{content.mobileDescription}</span>
                    </p>
                    <ol className="luta-marketing-journey" aria-label={content.journeyLabel}>
                        {content.journey.map((item, index) => (
                            <li key={item}>
                                <a href={journeyTargets[index]}>
                                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                                    <strong>{item}</strong>
                                </a>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    )
}

function FinalCallToAction({ content, adapter, storeActions }) {
    return (
        <section className="luta-marketing-final-cta" data-marketing-reveal>
            <div className="luta-marketing-container luta-marketing-final-layout">
                <div>
                    <h2 className="luta-marketing-desktop-copy">{content.finalCta.title}</h2>
                    <h2 className="luta-marketing-mobile-copy">
                        <LineTitle lines={content.finalCta.mobileTitle} />
                    </h2>
                    <p>{content.finalCta.description}</p>
                </div>
                {storeActions || (
                    <StoreActionGroup
                        content={content.store}
                        adapter={adapter}
                    />
                )}
            </div>
        </section>
    )
}

export default function MarketingLanding({ locale }) {
    const content = getMarketingContent(locale)
    const { controller, usesHomepageSurface } = useSmartLinkJourney()
    const headerInstallHref = usesHomepageSurface
        ? '#download-options'
        : buildInstallEntryUrl('marketing_header')
    const { changeLanguage } = useLanguage()
    const [desktopTab, setDesktopTab] = useState('ios')
    const [testflightExpanded, setTestflightExpanded] = useState(
        () => typeof window !== 'undefined'
            && (
                hasExplicitTestflightParam(window.location.search)
                || readTestflightExpansion(window.location.pathname)
            ),
    )
    const headerDirectStore = useStoreActionAdapter({
        locale: content.locale,
        placement: 'marketing_header',
        desktopTab,
        onDesktopTabChange: setDesktopTab,
        testflightExpanded,
        onTestflightExpandedChange: setTestflightExpanded,
    })
    const heroStore = useStoreActionAdapter({
        locale: content.locale,
        placement: 'marketing_hero',
        desktopTab,
        onDesktopTabChange: setDesktopTab,
        testflightExpanded,
        onTestflightExpandedChange: setTestflightExpanded,
    })
    const finalStore = useStoreActionAdapter({
        locale: content.locale,
        placement: 'marketing_final',
        desktopTab,
        onDesktopTabChange: setDesktopTab,
        testflightExpanded,
        onTestflightExpandedChange: setTestflightExpanded,
    })
    const headerSmartLinkStore = useSmartLinkStoreActionAdapter({
        controller,
        locale: content.locale,
        placement: 'marketing_header',
    })
    const heroSmartLinkStore = useSmartLinkStoreActionAdapter({
        controller,
        locale: content.locale,
        placement: 'marketing_hero',
    })
    const finalSmartLinkStore = useSmartLinkStoreActionAdapter({
        controller,
        locale: content.locale,
        placement: 'marketing_final',
    })
    const headerStore = usesHomepageSurface ? headerSmartLinkStore : headerDirectStore

    const handleHeaderInstall = (event) => {
        if (!headerStore.primaryAction) return
        event.preventDefault()
        headerStore.activatePrimary()
    }

    useEffect(() => {
        persistTestflightExpansion(window.location.pathname, testflightExpanded)
    }, [testflightExpanded])

    useEffect(() => {
        changeLanguage(content.languageKey)
    }, [changeLanguage, content.languageKey])

    useEffect(() => {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior

        applyMarketingMetadata(content)
        document.documentElement.style.scrollBehavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth'
        return () => {
            document.documentElement.style.scrollBehavior = previousScrollBehavior
        }
    }, [content])

    const heroSmartLinkActions = usesHomepageSurface ? (
        <SmartLinkStoreActionGroup
            adapter={heroSmartLinkStore}
            anchorId="download-options"
            content={content}
            controller={controller}
            showSupport={false}
            valueCtaCopy={content.hero.primaryCta}
        />
    ) : null
    const finalSmartLinkActions = usesHomepageSurface ? (
        <SmartLinkStoreActionGroup
            adapter={finalSmartLinkStore}
            content={content}
            controller={controller}
        />
    ) : null

    return (
        <PageShell
            content={content}
            headerInstallHref={headerInstallHref}
            onHeaderInstall={handleHeaderInstall}
            onSupport={finalStore.openSupport}
        >
            <MarketingHero
                content={content}
                storeAdapter={heroStore}
                storeActions={heroSmartLinkActions}
            />
            <WhyLuta content={content.why} />
            {content.stories.map(story => <ProductStory key={story.id} story={story} />)}
            <PrincipleBand content={content.principles} />
            <FinalCallToAction
                content={content}
                adapter={finalStore}
                storeActions={finalSmartLinkActions}
            />
        </PageShell>
    )
}
