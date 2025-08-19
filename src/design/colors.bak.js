// 颜色枚举 - 统一管理所有颜色
export const Colors = {
    // 主色调 - 金色系列
    primary: {
        gold: '#D4AF37',           // 主金色
        goldLight: '#F7DC6F',      // 浅金色
        goldDark: '#B7950B',       // 深金色
        goldRose: '#E5AA17',       // 玫瑰金
        amber: '#FFC107',          // 琥珀色
        amberDark: '#FF8F00',      // 深琥珀
    },

    // 副色调 - 粉色系列
    secondary: {
        rose: '#E91E63',           // 玫瑰红
        roseLight: '#F8BBD9',      // 浅玫瑰
        roseDark: '#AD1457',       // 深玫瑰
        pink: '#EC407A',           // 粉红
        pinkLight: '#F48FB1',      // 浅粉红
    },

    // 背景色系列
    background: {
        silk: [229, 42, 132],      // 丝绸背景色 (RGB)
        gradient: {
            start: '#FDF2F8',        // 渐变起始色
            end: '#FCE7F3',          // 渐变结束色
        },
        overlay: 'rgba(0, 0, 0, 0.1)', // 叠加层
    },

    // 文字色系列
    text: {
        primary: '#1A202C',        // 主要文字
        secondary: '#4A5568',      // 次要文字
        muted: '#718096',          // 静音文字
        inverse: '#FFFFFF',        // 反色文字
        gold: '#B7950B',           // 金色文字
        goldLight: '#D4AF37',      // 浅金色文字
        goldAccent: '#F1C40F',     // 金色强调
    },

    // 状态色
    status: {
        success: '#48BB78',        // 成功
        warning: '#ED8936',        // 警告
        error: '#F56565',          // 错误
        info: '#4299E1',           // 信息
    },

    // 中性色
    neutral: {
        white: '#FFFFFF',
        gray50: '#F7FAFC',
        gray100: '#EDF2F7',
        gray200: '#E2E8F0',
        gray300: '#CBD5E0',
        gray400: '#A0AEC0',
        gray500: '#718096',
        gray600: '#4A5568',
        gray700: '#2D3748',
        gray800: '#1A202C',
        gray900: '#171923',
        black: '#000000',
    },

    // 透明度变体
    opacity: {
        white10: 'rgba(255, 255, 255, 0.1)',
        white20: 'rgba(255, 255, 255, 0.2)',
        white30: 'rgba(255, 255, 255, 0.3)',
        white50: 'rgba(255, 255, 255, 0.5)',
        white70: 'rgba(255, 255, 255, 0.7)',
        white90: 'rgba(255, 255, 255, 0.9)',
        black10: 'rgba(0, 0, 0, 0.1)',
        black20: 'rgba(0, 0, 0, 0.2)',
        black30: 'rgba(0, 0, 0, 0.3)',
        black50: 'rgba(0, 0, 0, 0.5)',
        black70: 'rgba(0, 0, 0, 0.7)',
        black90: 'rgba(0, 0, 0, 0.9)',
    },

    // 阴影色
    shadow: {
        soft: 'rgba(0, 0, 0, 0.1)',
        medium: 'rgba(0, 0, 0, 0.25)',
        strong: 'rgba(0, 0, 0, 0.5)',
        gold: 'rgba(212, 175, 55, 0.3)',
        rose: 'rgba(233, 30, 99, 0.3)',
    },
};

// 预设配色方案
export const ColorSchemes = {
    // 金色主题
    golden: {
        primary: Colors.primary.gold,
        secondary: Colors.primary.goldLight,
        accent: Colors.primary.goldDark,
        background: Colors.background.gradient.start,
        text: Colors.text.gold,
    },

    // 玫瑰主题
    rose: {
        primary: Colors.secondary.rose,
        secondary: Colors.secondary.roseLight,
        accent: Colors.secondary.roseDark,
        background: Colors.background.gradient.end,
        text: Colors.text.primary,
    },

    // 优雅主题（金色+玫瑰）
    elegant: {
        primary: Colors.primary.gold,
        secondary: Colors.secondary.rose,
        accent: Colors.primary.goldRose,
        background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
        text: Colors.text.gold,
    },
}; 