import { Link } from 'react-router-dom'

import { config } from '../../config/index.js'
import { formatMarketingCopyright } from '../../content/marketingLanding.js'
import { Wordmark } from './MarketingHeader.jsx'

export default function MarketingFooter({ content, onSupport }) {
    return (
        <footer className="luta-marketing-footer" data-marketing-reveal>
            <div className="luta-marketing-container luta-marketing-footer-layout">
                <div className="luta-marketing-footer-main">
                    <Wordmark content={content} />
                    <nav aria-label={content.navigation.label}>
                        <Link to={config.pages.privacy}>{content.footer.privacy}</Link>
                        <Link to={config.pages.terms}>{content.footer.terms}</Link>
                        <Link to={config.pages.contact}>{content.footer.contact}</Link>
                        <button type="button" onClick={onSupport}>{content.footer.help}</button>
                    </nav>
                    <a
                        className="luta-marketing-icp"
                        href="https://beian.miit.gov.cn/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {content.footer.icp}
                    </a>
                </div>
                <small>
                    {formatMarketingCopyright(
                        content.footer.copyrightOwner,
                        content.footer.copyrightRights,
                    )}
                </small>
            </div>
        </footer>
    )
}
