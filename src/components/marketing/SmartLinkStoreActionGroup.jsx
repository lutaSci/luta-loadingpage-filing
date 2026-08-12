import { Copy, Smartphone } from 'lucide-react'
import StoreActionGroup from './StoreActionGroup.jsx'

export default function SmartLinkStoreActionGroup({
    adapter,
    anchorId,
    content,
    controller,
    showSupport = true,
    tone = 'dark',
    valueCtaCopy,
}) {
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
                valueCtaCopy={valueCtaCopy}
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
