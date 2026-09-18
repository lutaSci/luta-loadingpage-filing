import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
    HERO_AUTOPLAY_INTERVAL_MS,
    HERO_AUTOPLAY_RESUME_MS,
    moveHeroImage,
    resolveHeroDragDirection,
    resolveHeroPosition,
    resolveInitialHeroImage,
    shouldHeroAutoplay,
} from '../src/lib/heroCarousel.js'

const visuals = [
    { image: 'wisdom', slot: 'start' },
    { image: 'reading', slot: 'center' },
    { image: 'tabao', slot: 'end' },
]

test('hero carousel starts from the declared center and assigns a stable fan around it', () => {
    assert.equal(resolveInitialHeroImage(visuals), 'reading')
    assert.equal(resolveHeroPosition(visuals, 'reading', 'wisdom'), 'start')
    assert.equal(resolveHeroPosition(visuals, 'reading', 'reading'), 'center')
    assert.equal(resolveHeroPosition(visuals, 'reading', 'tabao'), 'end')
})

test('hero carousel moves one screen at a time and wraps in both directions', () => {
    assert.equal(moveHeroImage(visuals, 'reading', 1), 'tabao')
    assert.equal(moveHeroImage(visuals, 'tabao', 1), 'wisdom')
    assert.equal(moveHeroImage(visuals, 'wisdom', -1), 'tabao')
})

test('hero carousel combines drag distance and flick velocity without triggering on noise', () => {
    assert.equal(resolveHeroDragDirection({ offsetX: -70, velocityX: 0, width: 400 }), 1)
    assert.equal(resolveHeroDragDirection({ offsetX: 70, velocityX: 0, width: 400 }), -1)
    assert.equal(resolveHeroDragDirection({ offsetX: -12, velocityX: -500, width: 400 }), 1)
    assert.equal(resolveHeroDragDirection({ offsetX: 10, velocityX: 20, width: 400 }), 0)
})

test('hero carousel safely degrades for empty and single-screen inputs', () => {
    assert.equal(resolveInitialHeroImage([]), null)
    assert.equal(moveHeroImage([], null, 1), null)
    assert.equal(moveHeroImage([{ image: 'reading' }], 'reading', 1), 'reading')
    assert.equal(resolveHeroPosition([{ image: 'reading' }], 'reading', 'reading'), 'center')
})

test('hero autoplay uses an attention-friendly dwell and pauses on demand', () => {
    assert.equal(HERO_AUTOPLAY_INTERVAL_MS >= 4500 && HERO_AUTOPLAY_INTERVAL_MS <= 7000, true)
    assert.equal(HERO_AUTOPLAY_RESUME_MS >= HERO_AUTOPLAY_INTERVAL_MS, true)
    assert.equal(shouldHeroAutoplay({ reducedMotion: false, visualCount: 3, paused: false }), true)
    assert.equal(shouldHeroAutoplay({ reducedMotion: true, visualCount: 3, paused: false }), false)
    assert.equal(shouldHeroAutoplay({ reducedMotion: false, visualCount: 3, paused: true }), false)
    assert.equal(shouldHeroAutoplay({ reducedMotion: false, visualCount: 1, paused: false }), false)
})
