import { useLayoutEffect, useSyncExternalStore } from 'react'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { config } from '../../config/index.js'
import { formatMarketingCopyright } from '../../content/marketingLanding.js'
import { FOOTER_SOCIAL_CHANNELS } from '../../content/footerSocialChannels.js'
import { rememberFooterPosition, restoreFooterPosition } from '../../lib/footerNavigation.js'
import { requestMeasurementConsentSettings } from '../../lib/measurementConsent.js'
import { Wordmark } from './MarketingHeader.jsx'
import whatsappIcon from '../../assets/social/whatsapp.svg'
import lineIcon from '../../assets/social/line.svg'
import telegramIcon from '../../assets/social/telegram.svg'
import facebookIcon from '../../assets/social/facebook.svg'

const icons = { whatsapp: whatsappIcon, line: lineIcon, telegram: telegramIcon, facebook: facebookIcon }
const desktopQuery = '(min-width: 64rem)'
const getDesktopSnapshot = () => window.matchMedia(desktopQuery).matches
const getServerSnapshot = () => false
function subscribeDesktop(callback) {
    const media = window.matchMedia(desktopQuery)
    media.addEventListener('change', callback)
    return () => media.removeEventListener('change', callback)
}

function SocialLink({ channel, href, label, accessibleLabel, opensNewTab, newTabLabel }) {
    return (
        <a
            className="luta-marketing-social-link"
            href={href}
            target={opensNewTab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            onClick={opensNewTab ? undefined : rememberFooterPosition}
            aria-label={`${accessibleLabel}${opensNewTab ? ` · ${newTabLabel}` : ''}`}
        >
            <img src={icons[channel.id]} width="36" height="36" alt="" aria-hidden="true" />
            <span>{label}</span>
            <ArrowUpRight className="luta-marketing-social-arrow-desktop" size={18} aria-hidden="true" />
            <ChevronRight className="luta-marketing-social-arrow-mobile" size={18} aria-hidden="true" />
        </a>
    )
}

export default function MarketingFooter({ content, onSupport }) {
    useLayoutEffect(() => restoreFooterPosition(), [])
    const social = content.footer.social
    const opensNewTab = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getServerSnapshot)
    const renderLink = (channel, purpose, label, accessibleLabel) => (
        <SocialLink
            key={channel.id}
            channel={channel}
            href={channel[purpose]}
            label={label}
            accessibleLabel={accessibleLabel}
            opensNewTab={opensNewTab}
            newTabLabel={social.newTab}
        />
    )

    return (
        <footer className="luta-marketing-footer" data-marketing-reveal>
            <div className="luta-marketing-container luta-marketing-footer-layout">
                <div className="luta-marketing-footer-heading">
                    <Wordmark content={content} />
                    <div>
                        <h2>{social.title}</h2>
                        <p>{social.description}</p>
                    </div>
                </div>
                <section className="luta-marketing-footer-groups" aria-labelledby="footer-groups-title">
                    <h3 id="footer-groups-title">{social.groups}</h3>
                    <div className="luta-marketing-footer-group-links">
                        {FOOTER_SOCIAL_CHANNELS.map(channel => renderLink(
                            channel,
                            'group',
                            `${channel.name} ${channel.id === 'facebook' ? social.community : social.group}`,
                            `${social.join} ${channel.name} ${channel.id === 'facebook' ? social.community : social.group}`,
                        ))}
                    </div>
                </section>
                <div className="luta-marketing-footer-secondary">
                    <section className="luta-marketing-footer-follow" aria-labelledby="footer-follow-title">
                        <h3 id="footer-follow-title">{social.follow}</h3>
                        {FOOTER_SOCIAL_CHANNELS.filter(channel => channel.page).map(channel => renderLink(
                            channel, 'page', `${channel.name} ${social.page}`, `${social.follow} · ${channel.name} ${social.page}`,
                        ))}
                    </section>
                    <section className="luta-marketing-footer-contact" aria-labelledby="footer-team-title">
                        <h3 id="footer-team-title">{social.team}</h3>
                        <div className="luta-marketing-footer-contact-links">
                            {FOOTER_SOCIAL_CHANNELS.filter(channel => channel.contact).map(channel => renderLink(
                                channel, 'contact', channel.name, `${social.team} · ${channel.name}`,
                            ))}
                        </div>
                        <p>{social.teamDescription}</p>
                    </section>
                </div>
                <div className="luta-marketing-footer-legal">
                    <nav aria-label={social.legalNavigation}>
                        <Link to={config.pages.privacy}>{content.footer.privacy}</Link>
                        <Link to={config.pages.terms}>{content.footer.terms}</Link>
                        <Link to={config.pages.contact}>{content.footer.contact}</Link>
                        <button type="button" onClick={() => requestMeasurementConsentSettings()}>
                            {content.footer.measurementSettings}
                        </button>
                        <button type="button" onClick={onSupport}>{content.footer.help}</button>
                    </nav>
                    <div className="luta-marketing-footer-fine-print">
                        <a
                            className="luta-marketing-icp"
                            href="https://beian.miit.gov.cn/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {content.footer.icp}
                        </a>
                        <small>
                            {formatMarketingCopyright(
                                content.footer.copyrightOwner,
                                content.footer.copyrightRights,
                            )}
                        </small>
                    </div>
                </div>
            </div>
        </footer>
    )
}
