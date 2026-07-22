import { useEffect, useState } from 'react'

import MarketingHero from '../components/marketing/MarketingHero.jsx'
import PageShell from '../components/marketing/PageShell.jsx'
import PrincipleBand from '../components/marketing/PrincipleBand.jsx'
import ProductStory from '../components/marketing/ProductStory.jsx'
import StoreActionGroup from '../components/marketing/StoreActionGroup.jsx'
import { useStoreActionAdapter } from '../components/marketing/useStoreActionAdapter.js'
import { getMarketingContent } from '../content/marketingLanding.js'
import { useLanguage } from '../contexts/LanguageContext.jsx'
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

function FinalCallToAction({ content, adapter }) {
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
                <StoreActionGroup
                    content={content.store}
                    adapter={adapter}
                />
            </div>
        </section>
    )
}

export default function MarketingLanding({ locale }) {
    const content = getMarketingContent(locale)
    const headerInstallHref = buildInstallEntryUrl('marketing_header')
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
        const language = content.localeKey === 'zh-tw' ? 'zhTW' : 'zh'
        changeLanguage(language)
    }, [changeLanguage, content.localeKey])

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
        trackWebsitePageView({ locale: content.locale })

        return () => {
            document.documentElement.style.scrollBehavior = previousScrollBehavior
        }
    }, [content])

    return (
        <PageShell
            content={content}
            headerInstallHref={headerInstallHref}
            onSupport={finalStore.openSupport}
        >
            <MarketingHero content={content} storeAdapter={heroStore} />
            <WhyLuta content={content.why} />
            {content.stories.map(story => <ProductStory key={story.id} story={story} />)}
            <PrincipleBand content={content.principles} />
            <FinalCallToAction content={content} adapter={finalStore} />
        </PageShell>
    )
}
