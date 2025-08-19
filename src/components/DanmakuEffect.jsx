import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Crown, Heart, Star, Gift, Flame, Zap, MessageCircle, ThumbsUp, Sparkles } from 'lucide-react'

// 预定义弹幕数据，使用更长的多国语言真实直播评论
const DANMAKU_DATA = [
    { text: "这个主播真的太有才了！我每天都在等你的直播，从来不会失望的！", icon: Crown, gradient: "from-rose-400 to-pink-500", glow: "shadow-rose-400/30" },
    { text: "Wow! This is absolutely amazing! I can't believe how talented you are! 🔥🔥🔥", icon: Flame, gradient: "from-pink-400 to-rose-500", glow: "shadow-pink-400/30" },
    { text: "すごい！本当に素晴らしいです！毎日見ています！最高のストリーマーです！", icon: Star, gradient: "from-rose-300 to-pink-400", glow: "shadow-rose-300/30" },
    { text: "¡Increíble! ¡Eres el mejor streamer que he visto! Me encanta tu contenido siempre", icon: Heart, gradient: "from-pink-300 to-rose-400", glow: "shadow-pink-300/30" },
    { text: "老铁666！这技术真是绝了！我要给所有朋友推荐你的直播间！", icon: ThumbsUp, gradient: "from-rose-500 to-pink-600", glow: "shadow-rose-500/30" },
    { text: "C'est fantastique! Je regarde depuis la France et c'est vraiment incroyable!", icon: Sparkles, gradient: "from-pink-500 to-rose-600", glow: "shadow-pink-500/30" },
    { text: "Это просто невероятно! Лучший стример! Смотрю каждый день из России!", icon: Crown, gradient: "from-rose-200 to-pink-300", glow: "shadow-rose-200/30" },
    { text: "哇塞！这个操作真的是神仙级别的！我要录屏保存下来反复学习！", icon: MessageCircle, gradient: "from-pink-200 to-rose-300", glow: "shadow-pink-200/30" },
    { text: "Das ist unglaublich! Der beste Streamer überhaupt! Grüße aus Deutschland! 🇩🇪", icon: Heart, gradient: "from-rose-400 to-pink-500", glow: "shadow-rose-400/30" },
    { text: "이거 진짜 대박이다! 한국에서 보고 있는데 정말 최고의 방송이에요!", icon: Star, gradient: "from-pink-400 to-rose-500", glow: "shadow-pink-400/30" },
    { text: "Mamma mia! Questo è fantastico! Il miglior streamer che abbia mai visto! Ciao dall'Italia!", icon: Gift, gradient: "from-rose-300 to-pink-400", glow: "shadow-rose-300/30" },
    { text: "主播的技术真的是太厉害了！每次看直播都能学到新东西！感谢分享！", icon: Zap, gradient: "from-pink-300 to-rose-400", glow: "shadow-pink-300/30" },
    { text: "OMG! This is the best stream ever! I've been watching for hours and can't stop!", icon: Flame, gradient: "from-rose-500 to-pink-600", glow: "shadow-rose-500/30" },
    { text: "บ้าไปแล้ว! เก่งมากๆ เลย! ดูจากประเทศไทยนะครับ! สุดยอดจริงๆ!", icon: ThumbsUp, gradient: "from-pink-500 to-rose-600", glow: "shadow-pink-500/30" },
    { text: "这就是传说中的神仙操作吗？我的天哪！太震撼了！必须关注一波！", icon: Crown, gradient: "from-rose-400 to-pink-500", glow: "shadow-rose-400/30" },
    { text: "Absolutely mind-blowing content! You're setting the bar so high for everyone else!", icon: Sparkles, gradient: "from-pink-400 to-rose-500", glow: "shadow-pink-400/30" },
    { text: "天啊！这个直播间的氛围真的太好了！大家都好友善！主播也超棒！", icon: Heart, gradient: "from-rose-300 to-pink-400", glow: "shadow-rose-300/30" },
    { text: "Que incrível! Assistindo do Brasil e não consigo parar de ver! Conteúdo top!", icon: MessageCircle, gradient: "from-pink-300 to-rose-400", glow: "shadow-pink-300/30" },
    { text: "真的是太精彩了！从开播到现在一直在看！完全停不下来！点赞收藏！", icon: Star, gradient: "from-rose-200 to-pink-300", glow: "shadow-rose-200/30" },
    { text: "Niesamowite! Najlepszy streamer jakiego widziałem! Pozdrowienia z Polski! 🇵🇱", icon: Gift, gradient: "from-pink-200 to-rose-300", glow: "shadow-pink-200/30" },
    { text: "这个技巧我学了好久都没学会，没想到主播演示得这么清楚！太感谢了！", icon: Zap, gradient: "from-rose-500 to-pink-600", glow: "shadow-rose-500/30" },
    { text: "Unbelievable skills! This is why I love watching live streams! Pure entertainment!", icon: Flame, gradient: "from-pink-500 to-rose-600", glow: "shadow-pink-500/30" },
    { text: "अविश्वसनीय! यह वास्तव में अद्भुत है! भारत से देख रहा हूँ!", icon: Crown, gradient: "from-rose-400 to-pink-500", glow: "shadow-rose-400/30" },
    { text: "我的妈呀！这是什么神仙操作！我要把这个视频分享给所有朋友看！", icon: ThumbsUp, gradient: "from-pink-400 to-rose-500", glow: "shadow-pink-400/30" },
    { text: "صدقا هذا مذهل! أفضل بث مباشر شاهدته على الإطلاق! تحيات من الشرق الأوسط!", icon: Sparkles, gradient: "from-rose-300 to-pink-400", glow: "shadow-rose-300/30" }
]

// 预计算一些常用值 - 调整为更慢更柔顺的效果
const WINDOW_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 800
const MAX_DANMAKU_COUNT = 12 // 减少同时显示的弹幕数量
const GENERATION_INTERVAL = 800 // 增加生成间隔，让弹幕更稀疏

// 弹幕项组件，使用memo优化
const DanmakuItem = memo(({ danmaku, onComplete }) => {
    const IconComponent = danmaku.icon

    // 使用 useMemo 缓存样式对象
    const containerStyle = useMemo(() => ({
        bottom: '8%',
        left: '2%', // 固定从左下角开始
        transform: `scale(${danmaku.scale})`,
        willChange: 'transform, opacity' // 优化动画性能
    }), [danmaku.scale])

    // 使用 useMemo 缓存动画配置 - 添加左右晃动和更柔顺的效果
    const animationConfig = useMemo(() => ({
        initial: {
            y: 0,
            x: 0,
            opacity: 0,
            scale: 0.7,
            rotate: -5
        },
        animate: {
            y: -WINDOW_HEIGHT * 1.3, // 向上飘动距离增加
            x: [0, danmaku.swayAmount, -danmaku.swayAmount * 0.7, danmaku.swayAmount * 0.5, 0], // 左右晃动
            opacity: [0, 0.9, 1, 1, 0.8, 0], // 更柔和的透明度变化
            scale: [0.7, 1, 1, 0.95],
            rotate: [0, 2, -1, 1, 0] // 轻微旋转晃动
        },
        exit: {
            opacity: 0,
            scale: 0.3,
            y: -50
        },
        transition: {
            duration: danmaku.duration,
            ease: [0.25, 0.46, 0.45, 0.94], // 更柔顺的贝塞尔曲线
            opacity: {
                times: [0, 0.15, 0.3, 0.7, 0.85, 1],
                duration: danmaku.duration
            },
            x: {
                times: [0, 0.2, 0.5, 0.7, 1],
                duration: danmaku.duration,
                ease: "easeInOut"
            },
            rotate: {
                duration: danmaku.duration,
                ease: "easeInOut"
            }
        }
    }), [danmaku.duration, danmaku.swayAmount])

    return (
        <motion.div
            className={`absolute ${danmaku.fontSize} pointer-events-none`}
            style={containerStyle}
            {...animationConfig}
            onAnimationComplete={() => onComplete(danmaku.id)}
        >
            <div className="relative">
                {/* 优化的弹幕设计 - 玫瑰金粉色配色 */}
                <div className={`
                    bg-gradient-to-r ${danmaku.gradient} 
                    rounded-2xl px-4 py-3
                    border-2 border-white/30 
                    shadow-xl ${danmaku.glow}
                    backdrop-blur-sm
                    flex items-center space-x-3
                    relative overflow-hidden
                    max-w-sm md:max-w-md lg:max-w-lg
                `}>
                    {/* 玻璃光泽效果 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent rounded-2xl" />

                    {/* 图标 */}
                    <div className="relative z-10 flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-white drop-shadow-md" />
                    </div>

                    {/* 文字 */}
                    <span className="relative z-10 text-white font-medium drop-shadow-md text-sm leading-relaxed">
                        {danmaku.text}
                    </span>

                    {/* 底部高光线 */}
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/40 rounded-full" />

                    {/* 顶部装饰点 */}
                    <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" />
                </div>
            </div>
        </motion.div>
    )
})

DanmakuItem.displayName = 'DanmakuItem'

export const DanmakuEffect = memo(() => {
    const [danmakus, setDanmakus] = useState([])

    // 使用 useCallback 优化回调函数
    const removeDanmaku = useCallback((id) => {
        setDanmakus(prev => prev.filter(d => d.id !== id))
    }, [])

    const generateDanmaku = useCallback(() => {
        const danmakuInfo = DANMAKU_DATA[Math.floor(Math.random() * DANMAKU_DATA.length)]
        return {
            id: `${Date.now()}-${Math.random()}`,
            ...danmakuInfo,
            duration: 8 + Math.random() * 4, // 8-12秒，更慢的速度
            fontSize: Math.random() > 0.6 ? 'text-sm' : 'text-xs',
            scale: 0.85 + Math.random() * 0.3, // 0.85-1.15倍大小
            swayAmount: 30 + Math.random() * 40 // 30-70px的左右晃动幅度
        }
    }, [])

    useEffect(() => {
        let animationId
        let lastTime = 0

        const animate = (currentTime) => {
            if (currentTime - lastTime >= GENERATION_INTERVAL) {
                setDanmakus(prev => {
                    if (prev.length < MAX_DANMAKU_COUNT) {
                        return [...prev, generateDanmaku()]
                    }
                    return prev
                })
                lastTime = currentTime
            }
            animationId = requestAnimationFrame(animate)
        }

        animationId = requestAnimationFrame(animate)

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
        }
    }, [generateDanmaku])

    return (
        <div className="fixed inset-0 pointer-events-none z-20">
            <AnimatePresence mode="popLayout">
                {danmakus.map((danmaku) => (
                    <DanmakuItem
                        key={danmaku.id}
                        danmaku={danmaku}
                        onComplete={removeDanmaku}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
})

DanmakuEffect.displayName = 'DanmakuEffect' 