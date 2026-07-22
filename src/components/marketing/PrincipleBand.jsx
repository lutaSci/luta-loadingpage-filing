function LineTitle({ lines }) {
    return lines.map(line => <span key={line}>{line}</span>)
}

export default function PrincipleBand({ content }) {
    return (
        <section className="luta-marketing-principles" id="principles" data-marketing-reveal>
            <div className="luta-marketing-container luta-marketing-principles-layout">
                <h2><LineTitle lines={content.title} /></h2>
                <div className="luta-marketing-principle-field">
                    {content.items.map(([title, description], index) => (
                        <article key={title} data-order={index + 1}>
                            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                            <div>
                                <h3>{title}</h3>
                                <p>{description}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
