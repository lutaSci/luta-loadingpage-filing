import { motion } from 'framer-motion'
import { memo, useMemo, useRef, useEffect, useState } from 'react'

// 使用单例模式管理粒子池，避免重复创建对象
class ParticlePool {
    constructor() {
        this.goldParticles = []
        this.sparkleParticles = []
        this.isInitialized = false
    }

    initialize() {
        if (this.isInitialized) return

        // 预生成金粉粒子配置
        for (let i = 0; i < 15; i++) {
            this.goldParticles.push({
                id: `gold-${i}`,
                style: {
                    width: Math.random() * 3 + 1 + 'px',
                    height: Math.random() * 3 + 1 + 'px',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                },
                animation: {
                    y: [0, -20, 0],
                    x: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15],
                    opacity: [0.2, 0.6, 0.2],
                    scale: [0.5, 1, 0.5],
                    transition: {
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeInOut"
                    }
                }
            })
        }

        // 预生成闪烁粒子配置
        for (let i = 0; i < 8; i++) {
            this.sparkleParticles.push({
                id: `sparkle-${i}`,
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                },
                animation: {
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        delay: Math.random() * 1.5,
                        ease: "easeInOut"
                    }
                }
            })
        }

        this.isInitialized = true
    }

    getGoldParticles() {
        this.initialize()
        return this.goldParticles
    }

    getSparkleParticles() {
        this.initialize()
        return this.sparkleParticles
    }
}

// 全局粒子池实例
const particlePool = new ParticlePool()

// 金粉粒子组件 - 最大化性能优化
const GoldParticle = memo(({ particle }) => (
    <motion.div
        className="absolute bg-yellow-300 rounded-full pointer-events-none"
        style={{
            ...particle.style,
            willChange: 'transform, opacity'
        }}
        animate={particle.animation}
        transition={particle.animation.transition}
    />
))

GoldParticle.displayName = 'GoldParticle'

// 闪烁粒子组件 - 最大化性能优化
const SparkleParticle = memo(({ particle }) => (
    <motion.div
        className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
        style={{
            ...particle.style,
            willChange: 'transform, opacity'
        }}
        animate={particle.animation}
        transition={particle.animation.transition}
    />
))

SparkleParticle.displayName = 'SparkleParticle'

// 主粒子系统组件
export const ParticleSystem = memo(() => {
    const [isVisible, setIsVisible] = useState(true)
    const containerRef = useRef(null)

    // 使用 Intersection Observer 优化性能
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current)
            }
        }
    }, [])

    // 获取预生成的粒子配置
    const goldParticles = useMemo(() => particlePool.getGoldParticles(), [])
    const sparkleParticles = useMemo(() => particlePool.getSparkleParticles(), [])

    // 如果不在视窗中，不渲染粒子
    if (!isVisible) {
        return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />
    }

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none">
            {/* 金粉粒子 */}
            {goldParticles.map((particle) => (
                <GoldParticle key={particle.id} particle={particle} />
            ))}

            {/* 闪烁粒子 */}
            {sparkleParticles.map((particle) => (
                <SparkleParticle key={particle.id} particle={particle} />
            ))}
        </div>
    )
})

ParticleSystem.displayName = 'ParticleSystem' 