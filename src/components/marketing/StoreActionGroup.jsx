import {
    Apple,
    Check,
    ChevronDown,
    ChevronRight,
    Download,
    ExternalLink,
    LoaderCircle,
    ShieldCheck,
    Smartphone,
    X,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

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

const PLATFORM_OPTIONS = Object.freeze(['ios', 'android'])

function PlatformSelector({ adapter, content }) {
    const menuId = useId()
    const containerRef = useRef(null)
    const menuRef = useRef(null)
    const triggerRef = useRef(null)
    const [open, setOpen] = useState(false)
    const selectedPlatform = adapter.selectedPlatform === 'android' ? 'android' : 'ios'
    const selectedLabel = selectedPlatform === 'ios' ? content.iosTab : content.androidTab
    const SelectedIcon = selectedPlatform === 'ios' ? Apple : Smartphone

    const focusOption = (platform) => {
        requestAnimationFrame(() => {
            menuRef.current?.querySelector(`[data-platform="${platform}"]`)?.focus()
        })
    }

    const openMenu = (platform = selectedPlatform) => {
        if (adapter.platformSelectable === false) return
        setOpen(true)
        focusOption(platform)
    }

    const closeMenu = ({ restoreFocus = false } = {}) => {
        setOpen(false)
        if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
    }

    const choosePlatform = (platform) => {
        adapter.changeDesktopTab(platform)
        closeMenu({ restoreFocus: true })
    }

    const handleTriggerKeyDown = (event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const platform = ['ArrowUp', 'End'].includes(event.key) ? 'android' : 'ios'
        openMenu(platform)
    }

    const handleMenuKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault()
            closeMenu({ restoreFocus: true })
            return
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return

        event.preventDefault()
        const buttons = Array.from(menuRef.current?.querySelectorAll('[data-platform]') || [])
        if (!buttons.length) return
        const currentIndex = Math.max(0, buttons.indexOf(document.activeElement))
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? buttons.length - 1
                : event.key === 'ArrowDown'
                    ? (currentIndex + 1) % buttons.length
                    : (currentIndex - 1 + buttons.length) % buttons.length
        buttons[nextIndex]?.focus()
    }

    useEffect(() => {
        if (!open) return undefined

        const handlePointerDown = (event) => {
            if (!containerRef.current?.contains(event.target)) setOpen(false)
        }
        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [open])

    return (
        <div
            className="luta-marketing-platform-selector"
            data-slot="platform-selector"
            data-state={open ? 'open' : 'closed'}
            ref={containerRef}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
            }}
        >
            <button
                className="luta-marketing-platform-selector-trigger"
                data-platform={selectedPlatform}
                type="button"
                ref={triggerRef}
                disabled={adapter.platformSelectable === false}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={menuId}
                aria-label={`${content.sectionLabel}: ${selectedLabel}`}
                onClick={() => (open ? closeMenu() : openMenu())}
                onKeyDown={handleTriggerKeyDown}
            >
                <SelectedIcon aria-hidden="true" />
                <span>{selectedPlatform === 'ios' ? 'iOS' : 'Android'}</span>
                <ChevronDown aria-hidden="true" />
            </button>

            {open && (
                <div
                    className="luta-marketing-platform-selector-menu"
                    id={menuId}
                    role="menu"
                    aria-label={content.sectionLabel}
                    ref={menuRef}
                    onKeyDown={handleMenuKeyDown}
                >
                    {PLATFORM_OPTIONS.map((platform) => {
                        const Icon = platform === 'ios' ? Apple : Smartphone
                        const label = platform === 'ios' ? content.iosTab : content.androidTab
                        const selected = platform === selectedPlatform

                        return (
                            <button
                                key={platform}
                                type="button"
                                role="menuitemradio"
                                data-platform={platform}
                                aria-checked={selected}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => choosePlatform(platform)}
                            >
                                <Icon aria-hidden="true" />
                                <span>{label}</span>
                                {selected && <Check aria-hidden="true" />}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function StoreActionButton({
    state,
    copy,
    expanded,
    isPrimary,
    onActivate,
    onVisible,
    presentation,
    valueCtaCopy,
}) {
    const actionRef = useRef(null)
    const pending = state.status === 'loading'
    const Icon = pending
        ? LoaderCircle
        : icons[state.actionKey] || channelIcons[state.iconKey || state.channel] || ExternalLink
    const actionCopy = valueCtaCopy || state.copy || copy.actions[state.actionKey] || {
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
            data-presented={isPrimary || undefined}
            type="button"
            disabled={unavailable}
            aria-disabled={unavailable}
            aria-busy={pending || undefined}
            aria-expanded={isDisclosure ? expanded : undefined}
            onClick={() => onActivate(state.actionKey)}
        >
            {presentation === 'persistent-mobile' && state.status === 'ready' && (
                <Download className="luta-marketing-store-action-persistent-icon" aria-hidden="true" />
            )}
            {Icon && <Icon className="luta-marketing-store-action-context-icon" aria-hidden="true" />}
            <span aria-live="polite">
                <strong>{pending ? copy.loading : disabled ? copy.disabled : actionCopy.label}</strong>
                <small>{actionCopy.description}</small>
            </span>
            {presentation === 'persistent-mobile' && state.status === 'ready' && (
                <ChevronRight className="luta-marketing-store-action-persistent-arrow" aria-hidden="true" />
            )}
        </button>
    )
}

export default function StoreActionGroup({
    content,
    anchorId,
    adapter,
    tone = 'dark',
    showSupport = true,
    presentation,
    valueCtaCopy,
}) {
    const panelId = useId()
    const tabsRef = useRef(null)
    const { recordVisibleOption } = adapter
    const hasTestflightSteps = adapter.states.some(
        state => state.actionKey === MARKETING_ACTION_KEYS.TESTFLIGHT_APP,
    )
    const hasRecovery = adapter.states.some(state => state.status === 'recovery')
    const persistentAction = presentation === 'persistent-mobile'
        ? adapter.primaryAction || adapter.states[0]
        : null

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
            data-presentation={presentation}
            id={anchorId}
            tabIndex={anchorId ? -1 : undefined}
            aria-label={content.sectionLabel}
        >
            {content.appLanguageNotice && (
                <p className="luta-marketing-store-note" role="note">
                    {content.appLanguageNotice}
                </p>
            )}

            {presentation === 'persistent-mobile' && (
                <PlatformSelector adapter={adapter} content={content} />
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
                {adapter.states.map((state) => {
                    const isPrimary = state.actionKey === adapter.primaryAction?.actionKey
                    const isPresented = persistentAction
                        ? state.actionKey === persistentAction.actionKey
                        : isPrimary

                    return (
                        <StoreActionButton
                            key={state.actionKey}
                            state={state}
                            copy={content}
                            expanded={adapter.testflightExpanded}
                            isPrimary={isPresented}
                            onActivate={adapter.activate}
                            onVisible={recordVisibleOption}
                            presentation={presentation}
                            valueCtaCopy={state.status === 'ready' && isPrimary ? valueCtaCopy : undefined}
                        />
                    )
                })}
            </div>

            {hasTestflightSteps && (
                <p
                    className="luta-marketing-store-note luta-marketing-testflight-recovery"
                    role="note"
                >
                    {content.testflightNote}
                </p>
            )}
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
