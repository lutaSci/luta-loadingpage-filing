import {
    Apple,
    ChevronDown,
    Download,
    ExternalLink,
    LoaderCircle,
    ShieldCheck,
    Smartphone,
    X,
} from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

import { MARKETING_ACTION_KEYS } from '../../lib/marketingStoreActions.js'
import SupportEntry from './SupportEntry.jsx'

const icons = Object.freeze({
    [MARKETING_ACTION_KEYS.APPLE_STORE]: Apple,
    [MARKETING_ACTION_KEYS.GOOGLE_PLAY]: ExternalLink,
    [MARKETING_ACTION_KEYS.VERIFIED_APK]: Download,
    [MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT]: ChevronDown,
    [MARKETING_ACTION_KEYS.TESTFLIGHT_APP]: Apple,
    [MARKETING_ACTION_KEYS.TESTFLIGHT_BETA]: Download,
    [MARKETING_ACTION_KEYS.WECHAT_GUIDE]: ExternalLink,
    [MARKETING_ACTION_KEYS.INSTALL_DOCUMENTATION]: ShieldCheck,
})

const channelIcons = Object.freeze({
    apple_app_store: Apple,
    apk: Download,
    google_play: ExternalLink,
    testflight: Apple,
    web: ExternalLink,
    web_recovery: ShieldCheck,
})

function focusableElements(container) {
    return Array.from(container?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) || [])
}

function MarketingDialog({
    visible,
    title,
    description,
    closeLabel,
    onClose,
    children,
}) {
    const titleId = useId()
    const dialogRef = useRef(null)
    const previousFocus = useRef(null)

    useEffect(() => {
        if (!visible) return undefined
        previousFocus.current = document.activeElement
        const previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const dialog = dialogRef.current
        focusableElements(dialog)[0]?.focus()

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }
            if (event.key !== 'Tab') return
            const focusables = focusableElements(dialog)
            if (!focusables.length) return
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousBodyOverflow
            previousFocus.current?.focus?.()
        }
    }, [onClose, visible])

    if (!visible) return null

    return (
        <div
            className="luta-marketing-dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                className="luta-marketing-dialog"
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <button
                    className="luta-marketing-dialog-close"
                    type="button"
                    onClick={onClose}
                    aria-label={closeLabel}
                >
                    <X aria-hidden="true" />
                </button>
                <h2 id={titleId}>{title}</h2>
                <p>{description}</p>
                <div className="luta-marketing-dialog-actions">{children}</div>
            </section>
        </div>
    )
}

function StoreActionButton({ state, copy, expanded, onActivate, onVisible }) {
    const actionRef = useRef(null)
    const pending = state.status === 'loading'
    const Icon = pending
        ? LoaderCircle
        : icons[state.actionKey] || channelIcons[state.iconKey || state.channel] || ExternalLink
    const actionCopy = state.copy || copy.actions[state.actionKey] || {
        label: copy.disabled,
        description: '',
    }
    const disabled = state.status === 'disabled'
    const unavailable = disabled || pending
    const isDisclosure = state.actionKey === MARKETING_ACTION_KEYS.EXPAND_TESTFLIGHT
    const isStep = [
        MARKETING_ACTION_KEYS.TESTFLIGHT_APP,
        MARKETING_ACTION_KEYS.TESTFLIGHT_BETA,
    ].includes(state.actionKey)

    useEffect(() => {
        const action = actionRef.current
        if (!action) return undefined

        if (!('IntersectionObserver' in window)) {
            const updateVisibility = () => {
                const bounds = action.getBoundingClientRect()
                if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return
                onVisible(state)
                window.removeEventListener('scroll', updateVisibility)
                window.removeEventListener('resize', updateVisibility)
            }
            updateVisibility()
            window.addEventListener('scroll', updateVisibility, { passive: true })
            window.addEventListener('resize', updateVisibility)
            return () => {
                window.removeEventListener('scroll', updateVisibility)
                window.removeEventListener('resize', updateVisibility)
            }
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            onVisible(state)
            observer.disconnect()
        }, { threshold: 0.5 })
        observer.observe(action)
        return () => observer.disconnect()
    }, [onVisible, state])

    return (
        <button
            ref={actionRef}
            className="luta-marketing-store-action"
            data-slot="store-action"
            data-state={state.status}
            data-status={state.status}
            data-variant={isDisclosure ? 'disclosure' : isStep ? 'step' : 'primary'}
            type="button"
            disabled={unavailable}
            aria-disabled={unavailable}
            aria-busy={pending || undefined}
            aria-expanded={isDisclosure ? expanded : undefined}
            onClick={() => onActivate(state.actionKey)}
        >
            {Icon && <Icon aria-hidden="true" />}
            <span aria-live="polite">
                <strong>{pending ? copy.loading : disabled ? copy.disabled : actionCopy.label}</strong>
                <small>{actionCopy.description}</small>
            </span>
        </button>
    )
}

export default function StoreActionGroup({
    content,
    anchorId,
    adapter,
    tone = 'dark',
    showSupport = true,
}) {
    const panelId = useId()
    const tabsRef = useRef(null)
    const { recordVisibleOption } = adapter
    const hasTestflightSteps = adapter.states.some(
        state => state.actionKey === MARKETING_ACTION_KEYS.TESTFLIGHT_APP,
    )
    const hasRecovery = adapter.states.some(state => state.status === 'recovery')

    const handleTabKeyDown = (event) => {
        const tabs = ['ios', 'android']
        const currentIndex = tabs.indexOf(adapter.desktopTab)
        let nextIndex = currentIndex

        if (event.key === 'ArrowLeft') nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
        else if (event.key === 'ArrowRight') nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1
        else if (event.key === 'Home') nextIndex = 0
        else if (event.key === 'End') nextIndex = tabs.length - 1
        else return

        event.preventDefault()
        const nextTab = tabs[nextIndex]
        adapter.changeDesktopTab(nextTab)
        requestAnimationFrame(() => {
            tabsRef.current?.querySelector(`[data-platform="${nextTab}"]`)?.focus()
        })
    }

    return (
        <section
            className="luta-marketing-store-group"
            data-tone={tone}
            id={anchorId}
            tabIndex={anchorId ? -1 : undefined}
            aria-label={content.sectionLabel}
        >
            {content.appLanguageNotice && (
                <p className="luta-marketing-store-note" role="note">
                    {content.appLanguageNotice}
                </p>
            )}

            {adapter.isDesktop && (
                <div
                    className="luta-marketing-store-tabs"
                    ref={tabsRef}
                    role="tablist"
                    aria-label={content.sectionLabel}
                    onKeyDown={handleTabKeyDown}
                >
                    <button
                        id={`${panelId}-tab-ios`}
                        data-platform="ios"
                        type="button"
                        role="tab"
                        aria-selected={adapter.desktopTab === 'ios'}
                        aria-controls={panelId}
                        tabIndex={adapter.desktopTab === 'ios' ? 0 : -1}
                        onClick={() => adapter.changeDesktopTab('ios')}
                    >
                        <Apple aria-hidden="true" />
                        {content.iosTab}
                    </button>
                    <button
                        id={`${panelId}-tab-android`}
                        data-platform="android"
                        type="button"
                        role="tab"
                        aria-selected={adapter.desktopTab === 'android'}
                        aria-controls={panelId}
                        tabIndex={adapter.desktopTab === 'android' ? 0 : -1}
                        onClick={() => adapter.changeDesktopTab('android')}
                    >
                        <Smartphone aria-hidden="true" />
                        {content.androidTab}
                    </button>
                </div>
            )}

            <div
                className="luta-marketing-store-panel"
                id={panelId}
                role={adapter.isDesktop ? 'tabpanel' : undefined}
                aria-labelledby={adapter.isDesktop ? `${panelId}-tab-${adapter.desktopTab}` : undefined}
            >
                {adapter.states.map(state => (
                    <StoreActionButton
                        key={state.actionKey}
                        state={state}
                        copy={content}
                        expanded={adapter.testflightExpanded}
                        onActivate={adapter.activate}
                        onVisible={recordVisibleOption}
                    />
                ))}
            </div>

            {hasTestflightSteps && <p className="luta-marketing-store-note">{content.testflightNote}</p>}
            {(showSupport || hasRecovery) && <SupportEntry label={content.help} onActivate={adapter.openSupport} />}

            <MarketingDialog
                visible={adapter.testflightConfirmVisible}
                title={content.testflightConfirm.title}
                description={content.testflightConfirm.description}
                closeLabel={content.testflightConfirm.cancel}
                onClose={adapter.closeTestflightConfirm}
            >
                <button type="button" onClick={adapter.closeTestflightConfirm}>
                    {content.testflightConfirm.cancel}
                </button>
                <button type="button" data-primary="true" onClick={adapter.confirmTestflightApp}>
                    {content.testflightConfirm.confirm}
                </button>
            </MarketingDialog>

            <MarketingDialog
                visible={adapter.wechatGuideVisible}
                title={content.wechatGuide.title}
                description={content.wechatGuide.description}
                closeLabel={content.wechatGuide.close}
                onClose={adapter.closeWechatGuide}
            >
                <button type="button" data-primary="true" onClick={adapter.closeWechatGuide}>
                    {content.wechatGuide.close}
                </button>
            </MarketingDialog>
        </section>
    )
}
