import { motion } from 'framer-motion'
import { useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'

export function LevelUpModal() {
  const open = useGame((s) => s.levelUpOpen)
  const dismiss = useGame((s) => s.dismissLevelUp)
  const setScene = useGame((s) => s.setScene)

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/75 px-6"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex max-w-lg flex-col items-center gap-4 rounded-[2.5rem] border-8 border-amber-300 bg-slate-900 px-8 py-8 text-center shadow-2xl"
      >
        <span className="text-7xl">🗑️</span>
        <p className="rounded-full bg-amber-300 px-4 py-1 text-sm font-black text-slate-900">
          Level 2
        </p>
        <h2 className="text-4xl font-black">Some of this cannot be recycled!</h2>
        <p className="text-lg font-bold text-white/80">
          Greasy pizza boxes, popped balloons, and sticky cartons go in the brown dumpster.
          Recycling still makes potion ingredients. Trash just keeps the park tidy.
        </p>
        <p className="text-lg font-bold text-white/80">
          Moonlit Meadow is open, and two new friends need a hug.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              audio.tap()
              dismiss()
              setScene('clean')
            }}
            className="min-h-16 rounded-full border-4 border-white bg-gradient-to-b from-amber-400 to-orange-600 px-8 text-xl font-black text-white active:scale-95"
          >
            🗑️ Find the dumpster
          </button>
          <button
            onClick={() => {
              audio.tap()
              dismiss()
            }}
            className="min-h-16 rounded-full border-4 border-white/40 bg-white/10 px-8 text-xl font-black active:scale-95"
          >
            Okay!
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
