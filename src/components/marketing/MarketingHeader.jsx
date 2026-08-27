import logoMark from '../../assets/logo_1.png'
import LocaleSwitcher from './LocaleSwitcher.jsx'

function Wordmark({ content }) {
    return (
        <a className="luta-marketing-wordmark" href="#marketing-top" aria-label={`${content.brand.name} ${content.brand.latin}`}>
            <img
                className="luta-marketing-wordmark-mark"
                src={logoMark}
                alt=""
                aria-hidden="true"
                width="32"
                height="32"
                decoding="async"
            />
            <span className="luta-marketing-wordmark-copy">
                <strong>{content.brand.name}</strong>
                <span>{content.brand.latin}</span>
            </span>
        </a>
    )
}

export default function MarketingHeader({ content, installHref, onInstall }) {
    return (
        <header className="luta-marketing-header">
            <Wordmark content={content} />
            <nav className="luta-marketing-header-nav" aria-label={content.navigation.label}>
                <a href="#why-luta">{content.navigation.why}</a>
                <a href="#product-capabilities">{content.navigation.capabilities}</a>
                <a href="#principles">{content.navigation.principles}</a>
            </nav>
            <div className="luta-marketing-header-actions">
                <LocaleSwitcher content={content} />
                <a className="luta-marketing-header-cta" href={installHref} onClick={onInstall}>
                    {content.navigation.getApp}
                </a>
            </div>
        </header>
    )
}

export { Wordmark }
