import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Heart } from 'lucide-react'

// 预定义样式，避免重复创建
const HEART_STYLES = [
    'text-red-400',
    'text-pink-400',
    'text-rose-400',
    'text-red-300',
    'text-pink-300',
    'text-yellow-400'
]

// 预计算常用值
const WINDOW_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 800
const MAX_LIKES_COUNT = 20 // 减少同时显示的爱心数量
const GENERATION_INTERVAL = 150 // 生成间隔

// 单个爱心组件，使用memo优化
const LikeItem = memo(({ like, onComplete }) => {
    // 使用 useMemo 缓存样式对象
    const containerStyle = useMemo(() => ({
        bottom: '10%',
        right: `${like.right}%`,
        willChange: 'transform, opacity'
    }), [like.right])

    // 使用 useMemo 缓存动画配置
    const animationConfig = useMemo(() => ({
        initial: {
            y: 0,
            opacity: 0.8,
            scale: 0.5,
            rotate: like.initialRotate
        },
        animate: {
            y: -WINDOW_HEIGHT * 0.9,
            opacity: [0.8, 1, 0],
            scale: [0.5, 1, 0.8],
            x: like.drift,
            rotate: like.finalRotate
        },
        exit: {
            opacity: 0,
            scale: 0.3
        },
        transition: {
            duration: like.duration,
            ease: 'easeOut',
            opacity: {
                times: [0, 0.2, 1],
                duration: like.duration
            }
        }
    }), [like.duration, like.initialRotate, like.drift, like.finalRotate])

    return (
        <motion.div
            className={`absolute ${like.color} ${like.size} pointer-events-none`}
            style={containerStyle}
            {...animationConfig}
            onAnimationComplete={() => onComplete(like.id)}
        >
            <Heart className="fill-current drop-shadow-md" />
        </motion.div>
    )
})

LikeItem.displayName = 'LikeItem'

export const LikeEffect = memo(() => {
    const [likes, setLikes] = useState([])

    // 使用 useCallback 优化回调函数
    const removeLike = useCallback((id) => {
        setLikes(prev => prev.filter(l => l.id !== id))
    }, [])

    const generateLike = useCallback(() => {
        return {
            id: `${Date.now()}-${Math.random()}`,
            color: HEART_STYLES[Math.floor(Math.random() * HEART_STYLES.length)],
            size: Math.random() > 0.5 ? 'w-6 h-6' : 'w-5 h-5',
            right: Math.random() * 15 + 5, // 5-20% 从右边距
            duration: 3 + Math.random() * 2, // 3-5秒
            initialRotate: -15 + Math.random() * 30,
            finalRotate: -30 + Math.random() * 60,
            drift: (Math.random() - 0.5) * 80 // 水平漂移
        }
    }, [])

    useEffect(() => {
        let animationId
        let lastTime = 0

        const animate = (currentTime) => {
            if (currentTime - lastTime >= GENERATION_INTERVAL) {
                // 每次生成1-2个红心
                const count = Math.floor(Math.random() * 2) + 1

                setLikes(prev => {
                    if (prev.length < MAX_LIKES_COUNT) {
                        const newLikes = Array.from({ length: count }, () => generateLike())
                        return [...prev, ...newLikes]
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
    }, [generateLike])

    return (
        <div className="fixed inset-0 pointer-events-none z-20">
            <AnimatePresence mode="popLayout">
                {likes.map((like) => (
                    <LikeItem
                        key={like.id}
                        like={like}
                        onComplete={removeLike}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
})

LikeEffect.displayName = 'LikeEffect' 