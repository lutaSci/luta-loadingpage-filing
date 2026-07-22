import { useCallback, useMemo, useState } from 'react'
import { ArrowDown, CircleX, Info } from 'lucide-react'

import { useLanguage } from '../contexts/LanguageContext'
import {
    resolveSmartLinkRecovery,
    withoutSmartLinkRecovery,
} from '../lib/smartLinkRecovery'

const GROUP_COPY_KEYS = Object.freeze({
    preparing: 'smartLinkRecoveryPreparingTitle',
    paused: 'smartLinkRecoveryPausedTitle',
    unavailable: 'smartLinkRecoveryUnavailableTitle',
})

const GROUP_COPY_FIELDS = Object.freeze({
    preparing: 'preparingTitle',
    paused: 'pausedTitle',
    unavailable: 'unavailableTitle',
})

export default function SmartLinkRecoveryNotice({ copy }) {
    const { t } = useLanguage()
    const recovery = useMemo(
        () => resolveSmartLinkRecovery(window.location.search),
        [],
    )
    const [visible, setVisible] = useState(Boolean(recovery))

    const dismiss = useCallback(() => {
        setVisible(false)
        window.history.replaceState(
            window.history.state,
            '',
            withoutSmartLinkRecovery(window.location.href),
        )
    }, [])

    const showInstallOptions = useCallback(() => {
        dismiss()
        const target = document.getElementById('download-options')
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target?.focus({ preventScroll: true })
    }, [dismiss])

    if (!recovery || !visible) return null

    const title = copy?.[GROUP_COPY_FIELDS[recovery.group]]
        || t(GROUP_COPY_KEYS[recovery.group])
    const description = copy?.description || t('smartLinkRecoveryDescription')
    const primaryAction = copy?.primaryAction || t('smartLinkRecoveryPrimaryAction')
    const dismissLabel = copy?.dismiss || t('smartLinkRecoveryDismiss')

    return (
        <section
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-emerald-950/10 bg-white p-5 text-slate-900 shadow-2xl sm:bottom-6 sm:p-6"
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
            role="status"
            aria-live="polite"
            aria-labelledby="smart-link-recovery-title"
            data-smart-link-recovery={recovery.group}
        >
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800" aria-hidden="true">
                    <Info className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 id="smart-link-recovery-title" className="text-lg font-bold leading-snug text-slate-950 sm:text-xl">
                        {title}
                    </h2>
                    <p className="mt-2 text-base leading-7 text-slate-700">
                        {description}
                    </p>
                </div>
                <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    onClick={dismiss}
                    aria-label={dismissLabel}
                >
                    <CircleX className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>

            <button
                type="button"
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                onClick={showInstallOptions}
            >
                <ArrowDown className="h-5 w-5" aria-hidden="true" />
                {primaryAction}
            </button>
        </section>
    )
}
