export function resolveInitialHeroImage(visuals = []) {
    return visuals.find(visual => visual.slot === 'center')?.image
        || visuals[0]?.image
        || null
}

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
