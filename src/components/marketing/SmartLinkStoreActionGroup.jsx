import { Copy, Smartphone } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'

import { config } from '../../config/index.js'
import { trackWebsiteEvent } from '../../lib/analytics.js'
import { getInstallChoicePresentation } from '../../lib/installPresentation.js'
import StoreActionGroup from './StoreActionGroup.jsx'

function openExternal(url) {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
}

function useSmartLinkStoreAdapter({ controller, locale, placement }) {
    const viewedOptions = useRef(new Set())

    const states = useMemo(() => {
        if (controller.loadStatus === 'loading') {
            return [{
                actionKey: `smart_link_loading:${placement}`,
                channel: 'web',
                copy: {
                    label: controller.copy.loading,
                    description: controller.copy.pageDescription,
                },
                device: controller.displayOs,
                locale,
                market: controller.installContext?.campaignTargetMarket || 'unknown',
                placement,
                status: 'loading',
            }]
        }

        if (controller.isTerminalState) {
            return [{
                actionKey: `smart_link_retry:${placement}`,
                channel: 'web_recovery',
                copy: {
                    label: controller.copy.retry,
                    description: controller.copy.terminalDescription,
                },
                device: controller.displayOs,
                locale,
                market: controller.installContext?.campaignTargetMarket || 'unknown',
                placement,
                status: controller.hasEntry ? 'recovery' : 'disabled',
            }]
        }

        return controller.directChoices.map(choice => {
            const presentation = getInstallChoicePresentation(
                controller.copy,
                choice,
                controller.locale,
            )
            return {
                actionKey: `smart_link_option:${choice.option.optionId}`,
                channel: choice.option.channel,
                choice,
                copy: {
                    label: presentation.title,
                    description: choice.option.routeAvailable === false
                        ? controller.copy.channelTemporarilyUnavailable
                        : presentation.subtitle,
                },
                device: controller.displayOs,
                iconKey: presentation.iconKey,
                locale,
                market: choice.region || 'unknown',
                optionId: choice.option.optionId,
                placement,
                status: controller.busyOptionId === choice.option.optionId
                    ? 'loading'
                    : choice.option.routeAvailable === false
                        ? 'recovery'
                        : 'ready',
            }
        })
    }, [controller, locale, placement])

    const recordVisibleOption = useCallback(state => {
        if (!state.optionId) return
        const signature = `${state.locale}:${state.market}:${state.placement}:${state.optionId}`
        if (viewedOptions.current.has(signature)) return
        viewedOptions.current.add(signature)
        trackWebsiteEvent('website_download_option_viewed', {
            click_id: controller.installContext?.clickId,
            cta_target: state.channel,
            entry_type: 'shortlink',
            link_id: controller.installContext?.linkId,
            locale: state.locale,
            option_id: state.optionId,
            placement: state.placement,
            route_market: state.market,
            route_market_source: 'smart_link_context',
            traffic_purpose: controller.installContext?.trafficPurpose || 'unknown',
        })
    }, [controller.installContext])

    const activate = useCallback(actionKey => {
        const state = states.find(candidate => candidate.actionKey === actionKey)
        if (!state || ['disabled', 'loading'].includes(state.status)) return
        if (actionKey.startsWith('smart_link_retry:')) {
            controller.reloadOptions()
            return
        }
        if (!state.choice) return
        trackWebsiteEvent('website_download_cta_clicked', {
            click_id: controller.installContext?.clickId,
            cta_target: state.channel,
            entry_type: 'shortlink',
            link_id: controller.installContext?.linkId,
            locale,
            option_id: state.optionId,
            placement,
            route_market: state.market,
            route_market_source: 'smart_link_context',
            traffic_purpose: controller.installContext?.trafficPurpose || 'unknown',
        })
        controller.selectChoice(state.choice)
    }, [controller, locale, placement, states])

    const openSupport = useCallback(() => {
        trackWebsiteEvent('website_download_cta_clicked', {
            click_id: controller.installContext?.clickId,
            cta_target: 'install_documentation',
            entry_type: 'shortlink',
            link_id: controller.installContext?.linkId,
            locale,
            placement: `${placement}_help`,
            route_market: controller.installContext?.campaignTargetMarket || 'unknown',
            route_market_source: 'smart_link_context',
            traffic_purpose: controller.installContext?.trafficPurpose || 'unknown',
        })
        openExternal(config.downloads.installDoc)
    }, [controller.installContext, locale, placement])

    return {
        activate,
        changeDesktopTab: controller.switchPlatform,
        closeTestflightConfirm: () => {},
        closeWechatGuide: () => {},
        confirmTestflightApp: () => {},
        desktopTab: controller.activePlatform,
        isDesktop: controller.deviceOs === 'desktop',
        market: controller.installContext?.campaignTargetMarket || 'unknown',
        openSupport,
        recordVisibleOption,
        states,
        testflightConfirmVisible: false,
        testflightExpanded: false,
        wechatGuideVisible: false,
    }
}

export default function SmartLinkStoreActionGroup({
    anchorId,
    content,
    controller,
    placement,
    showSupport = true,
    tone = 'dark',
}) {
    const adapter = useSmartLinkStoreAdapter({ controller, locale: content.locale, placement })
    const showReturnedRecovery = controller.recoveryOpen && !controller.isTerminalState

    return (
        <div
            className="luta-marketing-smartlink-actions"
            data-slot="smart-link-install-actions"
            data-state={controller.loadStatus}
        >
            <div className="sr-only" aria-live="polite">{controller.announcement}</div>
            <StoreActionGroup
                content={content.store}
                anchorId={anchorId}
                adapter={adapter}
                showSupport={showSupport}
                tone={tone}
            />

            {controller.openAppUrl && (
                <a
                    className="luta-marketing-smartlink-open-app"
                    href={controller.openAppUrl}
                    onClick={controller.openInstalledApp}
                >
                    <Smartphone aria-hidden="true" />
                    {controller.copy.openInstalledApp}
                </a>
            )}

            {controller.wechatEmphasis && (
                <section
                    className="luta-marketing-smartlink-notice"
                    data-state="external-browser-required"
                    ref={controller.wechatCardRef}
                    tabIndex={-1}
                    role="status"
                >
                    <strong>{controller.copy.wechatTitle}</strong>
                    <p>{controller.copy.wechatDescription}</p>
                    <button type="button" onClick={controller.copyInstallLink}>
                        <Copy aria-hidden="true" />
                        {controller.copy.copyLink}
                    </button>
                </section>
            )}

            {showReturnedRecovery && (
                <section
                    className="luta-marketing-smartlink-notice"
                    data-state="returned-from-handoff"
                    role="status"
                >
                    <strong>{controller.copy.recoveryTitle}</strong>
                    <button type="button" onClick={controller.chooseAnother}>
                        {controller.copy.recoveryChoose}
                    </button>
                </section>
            )}

            {controller.isTerminalState && (
                <button
                    className="luta-marketing-smartlink-exit"
                    type="button"
                    onClick={controller.exitToWebsite}
                >
                    {controller.copy.recoveryWebsite}
                </button>
            )}
        </div>
    )
}
