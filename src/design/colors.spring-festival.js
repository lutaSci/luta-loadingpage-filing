// ============================================
// 春节主题 - 中国红 + 金色
// 传统春节氛围：红色为主基调，金色为点缀
// ============================================

// 颜色枚举 - 统一管理所有颜色
export const Colors = {
    // 主色调 - 金色系列（春节金，略微加暖）
    primary: {
        gold: '#D4AF37',           // 主金色
        goldLight: '#F7DC6F',      // 浅金色
        goldDark: '#B7950B',       // 深金色
        goldRose: '#E5AA17',       // 暖金
        amber: '#FFC107',          // 琥珀色
        amberDark: '#FF8F00',      // 深琥珀
    },

    // 副色调 - 中国红系列
    secondary: {
        rose: '#C41E3A',           // 中国红（主红）
        roseLight: '#E74C3C',      // 浅红（喜庆红）
        roseDark: '#8B0000',       // 深红（暗红）
        pink: '#DC143C',           // 朱红
        pinkLight: '#FF6B6B',      // 浅朱红（桃红）
    },

    // 背景色系列
    background: {
        silk: [235, 75, 55],       // 丝绸背景色 - 明亮中国红 (RGB)，如红包/红灯笼
        silkParams: {              // 丝绸着色器参数（春节主题专属调参）
            speed: 8,              // 略缓的流动，更优雅
            scale: 1,
            noiseIntensity: 0.8,   // 低噪声，减少黑暗区域
            rotation: 0.3,
        },
        // 暖光叠层 - 叠在丝绸上方，用径向渐变提亮暗部，模拟红灯笼光晕
        warmOverlay: 'radial-gradient(ellipse at 50% 42%, rgba(255, 170, 50, 0.13) 0%, rgba(230, 70, 45, 0.10) 35%, rgba(180, 40, 30, 0.18) 65%, rgba(100, 15, 10, 0.12) 100%)',
        gradient: {
            start: '#FDF2F2',        // 渐变起始色（暖白偏红）
            end: '#FCE7E7',          // 渐变结束色（浅红）
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
        rose: 'rgba(196, 30, 58, 0.3)',   // 中国红阴影
    },

    // Logo 阴影（用于 MainContent 中的 Logo 图片）
    logoShadow: {
        filter: 'drop-shadow(0 4px 16px rgba(120, 15, 15, 0.6))',
        boxShadow: '0 8px 32px rgba(180, 30, 30, 0.35), 0 4px 16px rgba(0,0,0,0.2), 0 2px 8px rgba(120, 15, 15, 0.3)',
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

    // 中国红主题
    rose: {
        primary: Colors.secondary.rose,
        secondary: Colors.secondary.roseLight,
        accent: Colors.secondary.roseDark,
        background: Colors.background.gradient.end,
        text: Colors.text.primary,
    },

    // 春节主题（红色+金色）
    elegant: {
        primary: Colors.secondary.rose,
        secondary: Colors.primary.gold,
        accent: Colors.primary.goldRose,
        background: 'linear-gradient(135deg, #FDF2F2 0%, #FCE7E7 100%)',
        text: Colors.text.gold,
    },
};
