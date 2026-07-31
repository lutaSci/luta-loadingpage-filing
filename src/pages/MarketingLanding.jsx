import { useEffect, useState } from 'react'

import MarketingHero from '../components/marketing/MarketingHero.jsx'
import PageShell from '../components/marketing/PageShell.jsx'
import PrincipleBand from '../components/marketing/PrincipleBand.jsx'
import ProductStory from '../components/marketing/ProductStory.jsx'
import SmartLinkStoreActionGroup from '../components/marketing/SmartLinkStoreActionGroup.jsx'
import StoreActionGroup from '../components/marketing/StoreActionGroup.jsx'
import { useStoreActionAdapter } from '../components/marketing/useStoreActionAdapter.js'
import { getMarketingContent } from '../content/marketingLanding.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import { useSmartLinkJourney } from '../contexts/SmartLinkJourneyContext.jsx'
import { trackWebsitePageView } from '../lib/analytics.js'
import { buildInstallEntryUrl } from '../lib/attributionState.js'
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
    const heroStore = useStoreActionAdapter({
        locale: content.locale,
        placement: 'marketing_hero',
        desktopTab,
        onDesktopTabChange: setDesktopTab,
    })
    const finalStore = useStoreActionAdapter({
        locale: content.locale,
        placement: 'marketing_final',
        desktopTab,
        onDesktopTabChange: setDesktopTab,
    })

    useEffect(() => {
        changeLanguage(content.languageKey)
    }, [changeLanguage, content.languageKey])

    useEffect(() => {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior
        const description = document.querySelector('meta[name="description"]')
        const keywords = document.querySelector('meta[name="keywords"]')

        document.documentElement.lang = content.locale
        document.documentElement.style.scrollBehavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth'
        document.title = content.metadata.title
        description?.setAttribute('content', content.metadata.description)
        keywords?.setAttribute('content', content.metadata.keywords)
        return () => {
            document.documentElement.style.scrollBehavior = previousScrollBehavior
        }
    }, [content])

    useEffect(() => {
        if (usesHomepageSurface && controller.loadStatus === 'loading') return
        trackWebsitePageView({
            locale: content.locale,
            ...(usesHomepageSurface ? {
                click_id: controller.installContext?.clickId,
                entry_type: 'shortlink',
                link_id: controller.installContext?.linkId,
                route_market: controller.installContext?.campaignTargetMarket || 'unknown',
                route_market_source: 'smart_link_context',
                traffic_purpose: controller.installContext?.trafficPurpose || 'unknown',
            } : {}),
        })
    }, [
        content.locale,
        controller.installContext,
        controller.loadStatus,
        usesHomepageSurface,
    ])

    const heroSmartLinkActions = usesHomepageSurface ? (
        <SmartLinkStoreActionGroup
            anchorId="download-options"
            content={content}
            controller={controller}
            placement="marketing_hero"
            showSupport={false}
        />
    ) : null
    const finalSmartLinkActions = usesHomepageSurface ? (
        <SmartLinkStoreActionGroup
            content={content}
            controller={controller}
            placement="marketing_final"
        />
    ) : null

    return (
        <PageShell
            content={content}
            headerInstallHref={headerInstallHref}
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
