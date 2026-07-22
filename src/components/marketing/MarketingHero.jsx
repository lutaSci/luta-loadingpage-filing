import { HeroVisualFan } from './ProductVisual.jsx'
import StoreActionGroup from './StoreActionGroup.jsx'

function LineTitle({ lines }) {
    return lines.map(line => <span key={line}>{line}</span>)
}

export default function MarketingHero({ content, storeAdapter }) {
    return (
        <section className="luta-marketing-hero" aria-labelledby="marketing-hero-title">
            <div className="luta-marketing-container luta-marketing-hero-layout">
                <div className="luta-marketing-hero-copy">
                    <p className="luta-marketing-eyebrow">{content.hero.eyebrow}</p>
                    <h1 id="marketing-hero-title" aria-label={content.hero.accessibleTitle}>
                        <span className="luta-marketing-desktop-title" aria-hidden="true">
                            <LineTitle lines={content.hero.desktopTitle} />
                        </span>
                        <span className="luta-marketing-mobile-title" aria-hidden="true">
                            <LineTitle lines={content.hero.mobileTitle} />
                        </span>
                    </h1>
                    <p className="luta-marketing-hero-lead">
                        <span className="luta-marketing-desktop-copy">{content.hero.lead}</span>
                        <span className="luta-marketing-mobile-copy">{content.hero.mobileLead}</span>
                    </p>
                </div>

                <div className="luta-marketing-hero-visual">
                    <HeroVisualFan visuals={content.hero.visuals} caption={content.hero.caption} />
                </div>

                <div className="luta-marketing-hero-actions">
                    <StoreActionGroup
                        content={content.store}
                        anchorId="download-options"
                        adapter={storeAdapter}
                        showSupport={false}
                    />
                </div>
            </div>
        </section>
    )
}
