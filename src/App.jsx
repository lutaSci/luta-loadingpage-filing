import { motion } from 'framer-motion'
import { DanmakuEffect } from './components/DanmakuEffect'
import { LikeEffect } from './components/LikeEffect'
import { ParticleSystem } from './components/ParticleSystem'
import Silk from './components/Silk'
import LanguageSwitch from './components/LanguageSwitch'
import MainContent from './components/MainContent'
import Footer from './components/Footer'
import { memo } from 'react'
import { Colors } from './design/colors'



function App() {



  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D 丝绸着色器背景 - 增强流动效果 */}
      <div className="absolute inset-0 z-0">
        <Silk
          speed={10}
          scale={1}
          color={Colors.background.silk}
          noiseIntensity={2.8}
          rotation={0.3}
        />
      </div>

      {/* 右上角语言切换按钮 */}
      <motion.div
        className="absolute top-4 right-4 z-30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <LanguageSwitch />
      </motion.div>

      {/* 主要内容 */}
      <MainContent />

      {/* 底部导航 */}
      <Footer />

      {/* 优化的粒子系统 */}
      <ParticleSystem />

      {/* 弹幕效果 - 仅在桌面端显示 */}
      {/* <div className="hidden md:block">
        <DanmakuEffect />
      </div> */}

      {/* 点赞效果 */}
      {/* <LikeEffect /> */}
    </div>
  );
}

export default memo(App);
