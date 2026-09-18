export function resolveInitialHeroImage(visuals = []) {
    return visuals.find(visual => visual.slot === 'center')?.image
        || visuals[0]?.image
        || null
}

/** Dwell time before advancing; long enough to register a phone UI, short enough to keep rhythm. */
export const HERO_AUTOPLAY_INTERVAL_MS = 5500

/** After user interaction, wait before autoplay resumes so control feels intentional. */
export const HERO_AUTOPLAY_RESUME_MS = 8000

export function resolveHeroPosition(visuals = [], activeImage, image) {
    if (visuals.length <= 1) return 'center'

    const activeIndex = visuals.findIndex(visual => visual.image === activeImage)
    const imageIndex = visuals.findIndex(visual => visual.image === image)
    if (imageIndex < 0) return 'end'

    const safeActiveIndex = activeIndex < 0 ? 0 : activeIndex
    const distance = (imageIndex - safeActiveIndex + visuals.length) % visuals.length

    if (distance === 0) return 'center'
    if (distance === 1) return 'end'
    return 'start'
}

export function moveHeroImage(visuals = [], activeImage, direction) {
    if (visuals.length <= 1) return visuals[0]?.image || null

    const activeIndex = visuals.findIndex(visual => visual.image === activeImage)
    const safeActiveIndex = activeIndex < 0 ? 0 : activeIndex
    const step = direction > 0 ? 1 : -1
    const nextIndex = (safeActiveIndex + step + visuals.length) % visuals.length

    return visuals[nextIndex].image
}

export function resolveHeroDragDirection({
    offsetX = 0,
    velocityX = 0,
    width = 0,
} = {}) {
    const threshold = Math.min(72, Math.max(40, width * 0.12))
    const projectedOffset = offsetX + velocityX * 0.12

    if (Math.abs(projectedOffset) < threshold) return 0
    return projectedOffset < 0 ? 1 : -1
}

export function shouldHeroAutoplay({
    reducedMotion = false,
    visualCount = 0,
    paused = false,
} = {}) {
    if (reducedMotion) return false
    if (paused) return false
    return visualCount > 1
}
