import {
    Apple,
    Bell,
    ChevronRight,
    Copy,
    Download,
    ExternalLink,
    Globe2,
    RefreshCw,
    Smartphone,
    Store,
} from 'lucide-react'
import { useEffect } from 'react'

import logo from '../assets/logo_1.png'
import LanguageSwitch from '../components/LanguageSwitch.jsx'
import Silk from '../components/Silk.jsx'
import { useSmartLinkJourney } from '../contexts/SmartLinkJourneyContext.jsx'
import { Colors } from '../design/colors.js'
import { getInstallChoicePresentation } from '../lib/installPresentation.js'
import { formatBytes } from '../lib/installFlow.js'

const choiceIcons = {
    apple_app_store: Apple,
    waitlist: Bell,
    apk: Download,
    google_play: Store,
    web: Globe2,
}

function InstallChoice({ choice, copy, locale, primary, busy, onSelect }) {
    const { iconKey, title, subtitle } = getInstallChoicePresentation(copy, choice, locale)
    const Icon = choiceIcons[iconKey] || ExternalLink
    const isApk = choice.option.channel === 'apk'
    const degraded = choice.option.routeAvailable === false
    const visibleSubtitle = degraded ? copy.channelTemporarilyUnavailable : subtitle

    return (
        <div data-slot="install-choice" data-state={degraded ? 'degraded' : 'ready'}>
            <button
                type="button"
                className={`group flex min-h-20 w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 disabled:cursor-wait disabled:opacity-70 ${primary
                    ? 'border-white bg-white text-emerald-950 shadow-xl shadow-black/20 hover:bg-emerald-50'
                    : 'border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20'} ${degraded ? 'border-dashed opacity-85' : ''}`}
                disabled={busy}
                onClick={() => onSelect(choice)}
            >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${primary ? 'bg-emerald-100 text-emerald-800' : 'bg-white/12 text-white'}`} aria-hidden="true">
                    {busy ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black tracking-tight">{title}</span>
                        {primary && !degraded && (
                            <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white">
                                {copy.recommended}
                            </span>
                        )}
                    </span>
                    <span className={`mt-1 block text-sm leading-5 ${primary ? 'text-emerald-900/70' : 'text-white/70'}`}>
                        {busy ? copy.opening : visibleSubtitle}
                    </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>

            {isApk && choice.option.apk?.sha256 && (
                <details className="mt-2 rounded-xl border border-white/15 bg-black/10 px-4 text-sm text-white/70">
                    <summary className="flex min-h-11 cursor-pointer items-center font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">
                        {copy.apkDetails}
                    </summary>
                    <dl className="space-y-2 pb-4 text-xs leading-5">
                        <div className="flex justify-between gap-3">
                            <dt>{copy.apkVersion}</dt>
                            <dd className="font-semibold text-white">{choice.option.apk.version}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt>{copy.apkSize}</dt>
                            <dd className="font-semibold text-white">{formatBytes(choice.option.apk.sizeBytes, locale)}</dd>
                        </div>
                        <div>
                            <dt>{copy.apkSha256}</dt>
                            <dd className="mt-1 break-all font-mono text-[11px] text-white/85">{choice.option.apk.sha256}</dd>
                        </div>
                    </dl>
                </details>
            )}
        </div>
    )
}

function CompactRecovery({ copy, terminal, canRetry, onChoose, onRetry, onWebsite }) {
    return (
        <section
            className="mt-4 rounded-2xl border border-white/20 bg-black/20 p-4 text-left backdrop-blur-md"
            data-slot="install-recovery"
            data-state={terminal ? 'terminal' : 'returned'}
            role="status"
        >
            <h2 className="text-base font-black text-white">
                {terminal ? copy.terminalTitle : copy.recoveryTitle}
            </h2>
            {terminal && <p className="mt-1 text-sm leading-5 text-white/65">{copy.terminalDescription}</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {terminal && canRetry ? (
                    <button
                        type="button"
                        className="min-h-12 rounded-xl bg-white px-4 py-3 font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                        onClick={onRetry}
                    >
                        {copy.retry}
                    </button>
                ) : !terminal ? (
                    <button
                        type="button"
                        className="min-h-12 rounded-xl bg-white px-4 py-3 font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                        onClick={onChoose}
                    >
                        {copy.recoveryChoose}
                    </button>
                ) : null}
                <a
                    className={`flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-center font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 ${terminal && !canRetry ? 'bg-white text-emerald-950' : 'border border-white/30 text-white hover:bg-white/10'}`}
                    href="/"
                    onClick={onWebsite}
                >
                    {copy.recoveryWebsite}
                </a>
            </div>
        </section>
    )
}

export default function Install() {
    const { controller } = useSmartLinkJourney()
    const {
        activePlatform,
        announcement,
        busyOptionId,
        choicesRef,
        chooseAnother,
        copy,
        copyInstallLink,
        deviceOs,
        directChoices,
        displayOs,
        exitToWebsite,
        hasEntry,
        isTerminalState,
        loadStatus,
        locale,
        openAppUrl,
        openInstalledApp,
        recoveryOpen,
        reloadOptions,
        selectChoice,
        switchPlatform,
        wechatCardRef,
        wechatEmphasis,
    } = controller

    useEffect(() => {
        document.title = copy.metaTitle
    }, [copy.metaTitle])

    return (
        <div className="relative flex min-h-[100svh] flex-col overflow-x-hidden bg-emerald-950 text-white">
            <div className="absolute inset-0 z-0">
                <Silk
                    speed={Colors.background.silkParams.speed}
                    scale={Colors.background.silkParams.scale}
                    color={Colors.background.silk}
                    noiseIntensity={Colors.background.silkParams.noiseIntensity}
                    rotation={Colors.background.silkParams.rotation}
                />
            </div>
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-emerald-950/15 to-black/45" aria-hidden="true" />
            <div aria-live="polite" className="sr-only">{announcement}</div>

            <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-4 sm:pt-6">
                <a href="/" className="flex min-h-11 items-center gap-2 rounded-xl pr-2 font-black tracking-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">
                    <img src={logo} alt="" className="h-10 w-10 rounded-xl" />
                    <span>{copy.brand}</span>
                </a>
                <LanguageSwitch />
            </header>

            <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-4 pt-[clamp(2.25rem,6svh,3.75rem)] sm:px-6 sm:pb-8 sm:pt-10">
                <section className="w-full rounded-[28px] border border-white/20 bg-black/20 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{copy.pageTitle}</h1>
                        <p className="mt-2 text-base text-white/70 sm:text-lg">{copy.pageDescription}</p>
                    </div>

                    {deviceOs === 'desktop' && (
                        <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 rounded-2xl border border-white/15 bg-black/15 p-1" role="tablist" aria-label={copy.pageDescription}>
                            {[
                                { value: 'ios', label: copy.iphone, icon: <Apple className="h-4 w-4" aria-hidden="true" /> },
                                { value: 'android', label: copy.android, icon: <Smartphone className="h-4 w-4" aria-hidden="true" /> },
                            ].map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={activePlatform === value}
                                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 ${activePlatform === value ? 'bg-white text-emerald-950' : 'text-white/65 hover:text-white'}`}
                                    onClick={() => switchPlatform(value)}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {loadStatus === 'loading' && (
                        <div className="flex min-h-44 flex-col items-center justify-center" aria-live="polite" aria-busy="true">
                            <RefreshCw className="h-7 w-7 animate-spin text-white/80" aria-hidden="true" />
                            <p className="mt-3 text-sm font-semibold text-white/70">{copy.loading}</p>
                        </div>
                    )}

                    {loadStatus === 'ready' && (
                        <div ref={choicesRef} tabIndex={-1} className="mt-5 space-y-3 focus-visible:outline-none sm:mt-6">
                            {directChoices.map((choice, index) => (
                                <InstallChoice
                                    key={`${displayOs}-${choice.option.optionId}`}
                                    choice={choice}
                                    copy={copy}
                                    locale={locale}
                                    primary={index === 0}
                                    busy={busyOptionId === choice.option.optionId}
                                    onSelect={selectChoice}
                                />
                            ))}

                            {directChoices.length === 0 && (
                                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center">
                                    <h2 className="font-black">{copy.noOptionsTitle}</h2>
                                    <p className="mt-1 text-sm text-white/65">{copy.noOptionsDescription}</p>
                                </div>
                            )}

                            {openAppUrl && (
                                <a
                                    className="mx-auto flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white/85 underline decoration-white/35 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                                    href={openAppUrl}
                                    onClick={openInstalledApp}
                                >
                                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                                    {copy.openInstalledApp}
                                </a>
                            )}
                        </div>
                    )}

                    {wechatEmphasis && (
                        <section ref={wechatCardRef} tabIndex={-1} className="mt-4 rounded-2xl border border-white/25 bg-white/10 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50">
                            <h2 className="flex items-center gap-2 font-black">
                                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                                {copy.wechatTitle}
                            </h2>
                            <p className="mt-1 text-sm leading-5 text-white/70">{copy.wechatDescription}</p>
                            <button type="button" className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-emerald-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50" onClick={copyInstallLink}>
                                <Copy className="h-4 w-4" aria-hidden="true" />
                                {copy.copyLink}
                            </button>
                        </section>
                    )}

                    {(recoveryOpen || isTerminalState) && (
                        <CompactRecovery
                            copy={copy}
                            terminal={isTerminalState}
                            canRetry={hasEntry}
                            onChoose={chooseAnother}
                            onRetry={reloadOptions}
                            onWebsite={exitToWebsite}
                        />
                    )}
                </section>
            </main>

            <footer className="relative z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 text-center text-sm text-white/55 sm:pb-6">
                <nav className="flex min-h-11 items-center justify-center gap-5" aria-label="Footer">
                    <a className="rounded-lg px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50" href="/">{copy.officialWebsite}</a>
                    <span aria-hidden="true">·</span>
                    <a className="rounded-lg px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50" href="/privacy">{copy.privacy}</a>
                </nav>
            </footer>
        </div>
    )
}
