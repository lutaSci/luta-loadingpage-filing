import { useLayoutEffect, useRef } from 'react'

import SmartLinkRecoveryNotice from '../SmartLinkRecoveryNotice.jsx'
import MarketingFooter from './MarketingFooter.jsx'
import MarketingHeader from './MarketingHeader.jsx'

export default function PageShell({ content, headerInstallHref, onHeaderInstall, onSupport, children }) {
    const pageRef = useRef(null)

    useLayoutEffect(() => {
        const page = pageRef.current
        if (!page) return undefined

        const targets = Array.from(page.querySelectorAll('[data-marketing-reveal]'))
        if (!targets.length) return undefined

        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        const showAll = () => targets.forEach((target) => {
            target.dataset.revealState = 'visible'
        })

        if (reducedMotion || !('IntersectionObserver' in window)) {
            page.dataset.motionReady = 'true'
            showAll()
            return undefined
        }

        targets.forEach((target) => {
            target.dataset.revealState = 'hidden'
        })
        page.dataset.motionReady = 'true'

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return
                entry.target.dataset.revealState = 'visible'
                observer.unobserve(entry.target)
            })
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -4% 0px',
        })

        targets.forEach(target => observer.observe(target))
        return () => observer.disconnect()
    }, [])

    return (
        <div className="luta-marketing" id="marketing-top" ref={pageRef}>
            <a className="luta-marketing-skip-link" href="#marketing-main">
                {content.navigation.skipToMain}
            </a>
            <SmartLinkRecoveryNotice copy={content.recovery} />
            <MarketingHeader
                content={content}
                installHref={headerInstallHref}
                onInstall={onHeaderInstall}
            />
            <main id="marketing-main" tabIndex="-1">{children}</main>
            <MarketingFooter content={content} onSupport={onSupport} />
        </div>
    )
}
