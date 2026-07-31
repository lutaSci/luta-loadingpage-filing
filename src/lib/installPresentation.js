import { formatBytes } from './installFlow.js'

export function getInstallChoicePresentation(copy, choice, locale) {
    if (choice.key === 'cn') {
        return {
            iconKey: 'apple_app_store',
            title: copy.cnEdition,
            subtitle: copy.cnStore,
        }
    }
    if (choice.key === 'global') {
        const isWaitlist = choice.option.channel === 'waitlist'
        return {
            iconKey: isWaitlist ? 'waitlist' : 'apple_app_store',
            title: copy.globalEdition,
            subtitle: isWaitlist ? copy.globalWaitlist : copy.globalStore,
        }
    }
    if (choice.key === 'apk') {
        const metadata = [
            choice.option.apk?.version,
            formatBytes(choice.option.apk?.sizeBytes, locale),
        ].filter(Boolean).join(' · ')
        return {
            iconKey: 'apk',
            title: copy.officialApk,
            subtitle: metadata || copy.officialApkFallback,
        }
    }
    if (choice.key === 'google_play') {
        return {
            iconKey: 'google_play',
            title: copy.googlePlay,
            subtitle: copy.googlePlayDescription,
        }
    }
    return {
        iconKey: choice.option.channel || 'web',
        title: choice.option.label || copy.otherChannel,
        subtitle: choice.option.description || choice.option.label || copy.otherChannel,
    }
}
