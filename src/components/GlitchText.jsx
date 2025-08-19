import { useEffect, useRef } from 'react';

const GlitchText = ({
    children,
    speed = 0.8,
    enableShadows = true,
    enableOnHover = false,
    className = "",
}) => {
    const textRef = useRef(null);

    useEffect(() => {
        if (!textRef.current) return;

        // 动态创建和注入CSS动画
        const styleId = 'glitch-animation-styles';
        let existingStyle = document.getElementById(styleId);

        if (!existingStyle) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes glitch-anim {
                    0% { clip-path: inset(20% 0 50% 0); }
                    5% { clip-path: inset(10% 0 60% 0); }
                    10% { clip-path: inset(15% 0 55% 0); }
                    15% { clip-path: inset(25% 0 35% 0); }
                    20% { clip-path: inset(30% 0 40% 0); }
                    25% { clip-path: inset(40% 0 20% 0); }
                    30% { clip-path: inset(10% 0 60% 0); }
                    35% { clip-path: inset(15% 0 55% 0); }
                    40% { clip-path: inset(25% 0 35% 0); }
                    45% { clip-path: inset(30% 0 40% 0); }
                    50% { clip-path: inset(20% 0 50% 0); }
                    55% { clip-path: inset(10% 0 60% 0); }
                    60% { clip-path: inset(15% 0 55% 0); }
                    65% { clip-path: inset(25% 0 35% 0); }
                    70% { clip-path: inset(30% 0 40% 0); }
                    75% { clip-path: inset(40% 0 20% 0); }
                    80% { clip-path: inset(20% 0 50% 0); }
                    85% { clip-path: inset(10% 0 60% 0); }
                    90% { clip-path: inset(15% 0 55% 0); }
                    95% { clip-path: inset(25% 0 35% 0); }
                    100% { clip-path: inset(30% 0 40% 0); }
                }
                
                .glitch-container {
                    position: relative;
                    display: inline-block;
                    background: linear-gradient(135deg, rgb(253, 230, 238), rgb(254, 205, 211), rgb(251, 182, 206));
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 8px rgba(244, 63, 94, 0.15));
                }
                
                .glitch-container::before,
                .glitch-container::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    clip-path: inset(0 0 0 0);
                    background: linear-gradient(135deg, rgb(253, 230, 238), rgb(254, 205, 211), rgb(251, 182, 206));
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    opacity: 0.6;
                }
                
                .glitch-container::before {
                    left: -1px;
                    text-shadow: 1px 0 rgba(236, 72, 153, 0.3);
                    animation: glitch-anim ${speed * 3}s infinite linear alternate-reverse;
                    z-index: -2;
                    filter: drop-shadow(0.5px 0 0 rgba(236, 72, 153, 0.2));
                }
                
                .glitch-container::after {
                    left: 1px;
                    text-shadow: -1px 0 rgba(244, 63, 94, 0.3);
                    animation: glitch-anim ${speed * 4}s infinite linear alternate-reverse;
                    z-index: -1;
                    filter: drop-shadow(-0.5px 0 0 rgba(244, 63, 94, 0.2));
                }
                
                ${enableOnHover ? `
                    .glitch-container::before,
                    .glitch-container::after {
                        opacity: 0;
                    }
                    
                    .glitch-container:hover::before,
                    .glitch-container:hover::after {
                        opacity: 0.6;
                    }
                ` : ''}
            `;
            document.head.appendChild(style);
        }

        return () => {
            // 清理函数可以选择性地移除样式
        };
    }, [speed, enableOnHover]);

    const containerStyle = {
        fontSize: 'clamp(1rem, 4vw, 2rem)',
        fontWeight: '900',
        position: 'relative',
        display: 'inline-block',
        margin: '0 auto',
        userSelect: 'none',
        cursor: 'pointer',
        zIndex: 10,
    };

    return (
        <div
            ref={textRef}
            data-text={children}
            className={`glitch-container ${className}`}
            style={containerStyle}
        >
            {children}
        </div>
    );
};

export default GlitchText; 