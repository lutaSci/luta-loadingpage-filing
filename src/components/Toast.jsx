import { motion, AnimatePresence } from 'framer-motion'
import { memo, useEffect, useState, useCallback } from 'react'
import { CheckCircle } from 'lucide-react'

let showToastFn = null

export const toast = (message, duration = 3500) => {
    showToastFn?.(message, duration)
}

const Toast = memo(() => {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, duration) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
    }, [])

    useEffect(() => {
        showToastFn = addToast
        return () => { showToastFn = null }
    }, [addToast])

    return (
        <div className="fixed top-6 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
            <AnimatePresence>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: -30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-white/95 backdrop-blur-md text-gray-800 px-5 py-3 rounded-2xl shadow-xl border border-gray-100 max-w-sm text-center pointer-events-auto"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm font-medium leading-relaxed">{t.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
})

Toast.displayName = 'Toast'

export default Toast
