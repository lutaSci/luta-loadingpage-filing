import historyImage from '../../assets/marketing/home-reference-6a219cd7-375x812.png'
import practiceImage from '../../assets/marketing/practice-plan-32a205b1-375x812.png'
import readingImage from '../../assets/marketing/reading-ca76b87a-375x812.png'
import tabaoImage from '../../assets/marketing/tabao-edf948ad-375x812.png'

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

export function HeroVisualFan({ visuals, caption }) {
    return (
        <figure className="luta-marketing-hero-product-visual">
            <div className="luta-marketing-hero-device-fan">
                {visuals.map(visual => (
                    <div
                        className={`luta-marketing-hero-device luta-marketing-hero-device--${visual.slot}`}
                        key={visual.image}
                    >
                        <img
                            src={images[visual.image]}
                            alt={visual.alt}
                            width="375"
                            height="812"
                            loading={visual.priority ? 'eager' : 'lazy'}
                            fetchPriority={visual.priority ? 'high' : 'auto'}
                            decoding="async"
                            sizes="(max-width: 767px) 144px, 250px"
                        />
                    </div>
                ))}
            </div>
            <figcaption>{caption}</figcaption>
        </figure>
    )
}
