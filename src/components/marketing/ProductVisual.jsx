import { useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import historyImage from '../../assets/marketing/home-reference-6a219cd7-375x812.png'
import practiceImage from '../../assets/marketing/practice-plan-ce82267a-375x812.png'
import readingImage from '../../assets/marketing/reading-ca76b87a-375x812.png'
import tabaoImage from '../../assets/marketing/tabao-edf948ad-375x812.png'
import {
    moveHeroImage,
    resolveHeroDragDirection,
    resolveHeroPosition,
    resolveInitialHeroImage,
} from '../../lib/heroCarousel.js'

const images = Object.freeze({
    history: historyImage,
    practice: practiceImage,
    reading: readingImage,
    tabao: tabaoImage,
    wisdom: historyImage,
})

export default function ProductVisual({
    image,
    alt,
    caption,
    priority = false,
}) {
    return (
        <figure className="luta-marketing-product-visual">
            <div className="luta-marketing-phone">
                <img
                    src={images[image]}
                    alt={alt}
                    width="375"
                    height="812"
                    loading={priority ? 'eager' : 'lazy'}
                    fetchPriority={priority ? 'high' : 'auto'}
                    decoding="async"
                    sizes="(max-width: 767px) 214px, 288px"
                />
            </div>
            <figcaption>{caption}</figcaption>
        </figure>
    )
}

const fanPositions = Object.freeze({
    start: { x: '-103%', y: 24, scale: 0.9, rotate: -6, opacity: 0.76 },
    center: { x: '-50%', y: 0, scale: 1, rotate: 0, opacity: 1 },
    end: { x: '3%', y: 24, scale: 0.9, rotate: 6, opacity: 0.76 },
})

export function HeroVisualFan({
    visuals,
    caption,
    carouselLabel,
    carouselInstructions,
    carouselRoleDescription,
    slideRoleDescription,
}) {
    const reducedMotion = useReducedMotion()
    const instructionsId = useId()
    const fanRef = useRef(null)
    const [activeImage, setActiveImage] = useState(() => resolveInitialHeroImage(visuals))
    const activeVisual = visuals.find(visual => visual.image === activeImage) || visuals[0]
    const activeIndex = Math.max(0, visuals.findIndex(visual => visual.image === activeVisual?.image))

    const move = (direction) => {
        setActiveImage(current => moveHeroImage(visuals, current, direction))
    }

    const handleDragEnd = (event, info) => {
        const width = fanRef.current?.getBoundingClientRect().width || 0
        const direction = resolveHeroDragDirection({
            offsetX: info.offset.x,
            velocityX: info.velocity.x,
            width,
        })
        if (direction) move(direction)
    }

    const handleKeyDown = (event) => {
        if (event.target !== event.currentTarget) return

        if (event.key === 'ArrowLeft') move(-1)
        else if (event.key === 'ArrowRight') move(1)
        else if (event.key === 'Home') setActiveImage(visuals[0]?.image || null)
        else if (event.key === 'End') setActiveImage(visuals.at(-1)?.image || null)
        else return

        event.preventDefault()
    }

    return (
        <figure
            className="luta-marketing-hero-product-visual"
            role="region"
            aria-roledescription={carouselRoleDescription}
            aria-label={carouselLabel}
            aria-describedby={instructionsId}
            tabIndex="0"
            onKeyDown={handleKeyDown}
        >
            <span id={instructionsId} className="luta-marketing-visually-hidden">
                {carouselInstructions}
            </span>
            <motion.div
                ref={fanRef}
                className="luta-marketing-hero-device-fan"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={reducedMotion ? 0 : 0.14}
                dragMomentum={false}
                dragSnapToOrigin="x"
                onDragEnd={handleDragEnd}
                whileDrag={{ cursor: 'grabbing' }}
            >
                {visuals.map(visual => {
                    const position = resolveHeroPosition(visuals, activeVisual?.image, visual.image)
                    const isActive = position === 'center'

                    return (
                        <motion.div
                            className="luta-marketing-hero-device"
                            data-position={position}
                            key={visual.image}
                            role={isActive ? 'group' : undefined}
                            aria-roledescription={isActive ? slideRoleDescription : undefined}
                            aria-label={isActive ? `${activeIndex + 1} / ${visuals.length} · ${visual.label}` : undefined}
                            aria-hidden={isActive ? undefined : 'true'}
                            initial={false}
                            animate={fanPositions[position]}
                            transition={reducedMotion
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 260, damping: 30, mass: 0.8 }}
                        >
                            <img
                                src={images[visual.image]}
                                alt={visual.alt}
                                width="375"
                                height="812"
                                loading="eager"
                                fetchPriority={isActive ? 'high' : 'low'}
                                decoding="async"
                                sizes="(max-width: 767px) 144px, 250px"
                                draggable="false"
                            />
                        </motion.div>
                    )
                })}
            </motion.div>
            <div className="luta-marketing-hero-visual-controls">
                <div
                    className="luta-marketing-hero-pagination"
                    role="group"
                    aria-label={carouselLabel}
                >
                    {visuals.map((visual, index) => (
                        <button
                            key={visual.image}
                            type="button"
                            aria-label={`${index + 1} / ${visuals.length} · ${visual.label}`}
                            aria-current={visual.image === activeVisual?.image ? 'true' : undefined}
                            onClick={() => setActiveImage(visual.image)}
                        >
                            <span aria-hidden="true" />
                        </button>
                    ))}
                </div>
            </div>
            <span className="luta-marketing-visually-hidden" aria-live="polite" aria-atomic="true">
                {activeVisual ? `${activeIndex + 1} / ${visuals.length} · ${activeVisual.label}` : ''}
            </span>
            <figcaption>{caption}</figcaption>
        </figure>
    )
}
