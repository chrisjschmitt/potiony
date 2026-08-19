import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../store/gameStore'

export function Toast() {
  const toast = useGame((s) => s.toast)
  const dismiss = useGame((s) => s.dismissToast)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => dismiss(toast.id), 3200)
    return () => window.clearTimeout(id)
  }, [toast, dismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[65] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex max-w-lg items-center gap-3 rounded-3xl border-4 border-white bg-gradient-to-r from-amber-300 to-yellow-400 px-5 py-3 text-slate-900 shadow-2xl"
            role="status"
          >
            <span className="text-4xl">{toast.emoji}</span>
            <span className="text-lg font-black">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
