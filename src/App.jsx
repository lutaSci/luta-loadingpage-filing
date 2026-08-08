import { motion } from 'framer-motion'
import { ParticleSystem } from './components/ParticleSystem'
import Silk from './components/Silk'
import LanguageSwitch from './components/LanguageSwitch'
import MainContent from './components/MainContent'
import Footer from './components/Footer'
import Toast, { toast } from './components/Toast'
import { memo, useCallback } from 'react'
import { Colors } from './design/colors'
import { useLanguage } from './contexts/LanguageContext'
import { config } from './config'
import { CircleHelp } from 'lucide-react'
import SmartLinkRecoveryNotice from './components/SmartLinkRecoveryNotice'

function App() {
  const { t } = useLanguage()

  const handleHelpClick = useCallback(async () => {
    const wechatId = config.support.wechatId
    try {
      await navigator.clipboard.writeText(wechatId)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = wechatId
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    toast(t('helpToastMessage').replace('{wechatId}', wechatId))
  }, [t])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Toast />
      <SmartLinkRecoveryNotice />

      <div className="absolute inset-0 z-0">
        <Silk
          speed={Colors.background.silkParams.speed}
          scale={Colors.background.silkParams.scale}
          color={Colors.background.silk}
          noiseIntensity={Colors.background.silkParams.noiseIntensity}
          rotation={Colors.background.silkParams.rotation}
        />
      </div>

      {Colors.background.warmOverlay !== 'none' && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: Colors.background.warmOverlay }}
        />
      )}

      {/* 左上角：帮助 */}
      <motion.div
        className="absolute top-4 left-4 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <motion.button
          className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleHelpClick}
        >
          <CircleHelp className="w-4 h-4 text-white/80" />
          <span className="text-sm text-white/90 font-medium">{t('helpButton')}</span>
        </motion.button>
      </motion.div>

      {/* 右上角：语言切换 */}
      <motion.div
        className="absolute top-4 right-4 z-30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <LanguageSwitch />
      </motion.div>

      <MainContent />
      <Footer />
      <ParticleSystem />
    </div>
  );
}

export default memo(App);
