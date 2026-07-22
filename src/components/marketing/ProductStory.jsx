import ProductVisual from './ProductVisual.jsx'

function LineTitle({ lines }) {
    return lines.map(line => <span key={line}>{line}</span>)
}

export default function ProductStory({ story }) {
    return (
        <section
            className="luta-marketing-story"
            data-tone={story.tone}
            data-visual-first={story.visualFirst ? 'true' : 'false'}
            data-story={story.id}
            data-marketing-reveal
            id={story.id === 'reading' ? 'product-capabilities' : `product-${story.id}`}
        >
            <div className="luta-marketing-container luta-marketing-story-layout">
                <div className="luta-marketing-story-copy">
                    <p className="luta-marketing-chapter">{story.chapter}</p>
                    <h2><LineTitle lines={story.title} /></h2>
                    <p className="luta-marketing-story-lead">
                        <span className="luta-marketing-desktop-copy">{story.description}</span>
                        <span className="luta-marketing-mobile-copy">{story.mobileDescription}</span>
                    </p>
                    <dl className="luta-marketing-feature-map" data-variant={story.id}>
                        {story.features.map(([title, description], index) => (
                            <div key={title} data-order={index + 1}>
                                <dt>
                                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                                    {title}
                                </dt>
                                <dd>{description}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <ProductVisual
                    image={story.image}
                    alt={story.imageAlt}
                    caption={story.caption}
                />
            </div>
        </section>
    )
}
