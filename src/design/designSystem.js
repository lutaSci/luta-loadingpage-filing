import { Colors, ColorSchemes } from './colors.js';

// 基础间距系统
const spacing = {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
};

// 基础圆角系统
const radius = {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
};

// 基础字体系统
const typography = {
    fonts: {
        primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        heading: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"Fira Code", "Monaco", "Consolas", monospace',
    },

    sizes: {
        xs: '0.75rem',     // 12px
        sm: '0.875rem',    // 14px
        base: '1rem',      // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem',  // 36px
        '5xl': '3rem',     // 48px
        '6xl': '3.75rem',  // 60px
        '7xl': '4.5rem',   // 72px
        '8xl': '6rem',     // 96px
        '9xl': '8rem',     // 128px
    },

    weights: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },

    lineHeights: {
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
    },
};

// 基础阴影系统
const shadows = {
    sm: `0 1px 2px 0 ${Colors.shadow.soft}`,
    base: `0 1px 3px 0 ${Colors.shadow.soft}, 0 1px 2px 0 ${Colors.shadow.soft}`,
    md: `0 4px 6px -1px ${Colors.shadow.soft}, 0 2px 4px -1px ${Colors.shadow.soft}`,
    lg: `0 10px 15px -3px ${Colors.shadow.soft}, 0 4px 6px -2px ${Colors.shadow.soft}`,
    xl: `0 20px 25px -5px ${Colors.shadow.medium}, 0 10px 10px -5px ${Colors.shadow.soft}`,
    '2xl': `0 25px 50px -12px ${Colors.shadow.medium}`,
    golden: `0 8px 32px ${Colors.shadow.gold}, 0 4px 16px ${Colors.shadow.gold}`,
    rose: `0 8px 32px ${Colors.shadow.rose}, 0 4px 16px ${Colors.shadow.rose}`,
    elegant: `0 15px 40px ${Colors.shadow.gold}, 0 10px 25px ${Colors.shadow.rose}`,
};

// 过渡动画
const transitions = {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
    bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// 设计系统 - 统一管理设计规范
export const DesignSystem = {
    // 字体系统
    typography,

    // 间距系统
    spacing,

    // 圆角系统
    radius,

    // 阴影系统
    shadows,

    // 过渡动画
    transitions,

    // 组件样式预设
    components: {
        // 页面容器
        pageContainer: {
            base: {
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
            },
            withBackground: {
                background: ColorSchemes.elegant.background,
            },
        },

        // 内容卡片
        contentCard: {
            base: {
                backgroundColor: Colors.opacity.white90,
                backdropFilter: 'blur(20px)',
                borderRadius: radius['3xl'],
                border: `1px solid ${Colors.opacity.white30}`,
                boxShadow: shadows.elegant,
                padding: spacing[8],
            },
            elegant: {
                background: `linear-gradient(135deg, ${Colors.opacity.white90} 0%, ${Colors.opacity.white70} 100%)`,
                border: `1px solid ${Colors.primary.goldLight}20`,
                boxShadow: `0 25px 50px -12px ${Colors.shadow.gold}, 0 10px 20px -5px ${Colors.shadow.rose}`,
            },
        },

        // 标题样式
        heading: {
            primary: {
                fontSize: typography.sizes['4xl'],
                fontWeight: typography.weights.black,
                background: `linear-gradient(135deg, ${Colors.primary.gold} 0%, ${Colors.primary.goldRose} 50%, ${Colors.secondary.rose} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 4px 12px ${Colors.shadow.gold}`,
            },
            secondary: {
                fontSize: typography.sizes['xl'],
                fontWeight: typography.weights.bold,
                color: Colors.text.gold,
                textShadow: `0 2px 8px ${Colors.shadow.gold}`,
            },
        },

        // 文本样式
        text: {
            body: {
                fontSize: typography.sizes.base,
                lineHeight: typography.lineHeights.relaxed,
                color: Colors.text.primary,
            },
            muted: {
                fontSize: typography.sizes.sm,
                color: Colors.text.muted,
            },
            accent: {
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.semibold,
                color: Colors.text.gold,
            },
        },

        // 按钮样式
        button: {
            primary: {
                background: `linear-gradient(135deg, ${Colors.primary.gold} 0%, ${Colors.primary.goldRose} 100%)`,
                color: Colors.neutral.white,
                padding: `${spacing[3]} ${spacing[6]}`,
                borderRadius: radius.xl,
                boxShadow: shadows.golden,
                transition: transitions.normal,
                border: 'none',
                cursor: 'pointer',
            },
            secondary: {
                background: 'transparent',
                color: Colors.text.gold,
                border: `2px solid ${Colors.primary.gold}`,
                padding: `${spacing[3]} ${spacing[6]}`,
                borderRadius: radius.xl,
                transition: transitions.normal,
                cursor: 'pointer',
            },
        },

        // 链接样式
        link: {
            primary: {
                color: Colors.text.goldLight,
                textDecoration: 'underline',
                textDecorationColor: Colors.opacity.white30,
                textUnderlineOffset: '4px',
                transition: transitions.normal,
            },
            elegant: {
                color: Colors.text.gold,
                textDecoration: 'underline',
                textDecorationColor: Colors.primary.goldLight,
                textUnderlineOffset: '4px',
                fontWeight: typography.weights.medium,
                transition: transitions.normal,
            },
        },

        // 返回按钮
        backButton: {
            base: {
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                color: Colors.primary.gold,
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.medium,
                textDecoration: 'none',
                transition: transitions.normal,
                padding: spacing[2],
                borderRadius: radius.lg,
                background: Colors.opacity.white20,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${Colors.opacity.white30}`,
            },
        },
    },

    // 断点系统
    breakpoints: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    // 响应式网格
    grid: {
        columns: 12,
        gap: spacing[6],
        maxWidth: '1280px',
    },
};

// 工具函数
export const DesignUtils = {
    // 获取响应式值
    responsive: (values) => {
        const { sm, md, lg, xl } = values;
        return {
            '@media (min-width: 640px)': sm && { ...sm },
            '@media (min-width: 768px)': md && { ...md },
            '@media (min-width: 1024px)': lg && { ...lg },
            '@media (min-width: 1280px)': xl && { ...xl },
        };
    },

    // 生成渐变
    gradient: (colors, direction = '135deg') => {
        const colorStops = colors.map((color, index) =>
            `${color} ${(index / (colors.length - 1)) * 100}%`
        ).join(', ');
        return `linear-gradient(${direction}, ${colorStops})`;
    },

    // 生成阴影
    shadow: (color, intensity = 'medium') => {
        const intensities = {
            light: '0.1',
            medium: '0.25',
            strong: '0.5',
        };
        const alpha = intensities[intensity] || intensities.medium;
        return `0 8px 32px rgba(${color}, ${alpha})`;
    },
}; 