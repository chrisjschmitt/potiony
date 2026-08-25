import { useState } from 'react'
import { motion } from 'framer-motion'
import { selectPlanetClean, selectTrashCollected, useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'
import { fx } from '../systems/fx/ParticleLayer'

export function TitleScreen() {
  const startGame = useGame((s) => s.startGame)
  const newGame = useGame((s) => s.newGame)
  const trash = useGame(selectTrashCollected)
  const clean = useGame(selectPlanetClean)
  const level = useGame((s) => s.level)
  const [confirming, setConfirming] = useState(false)
  const hasSave = trash > 0 || clean > 0

  const celebrate = () => {
    audio.unlock()
    audio.brewed()
    fx.burst({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      count: 34,
      emojis: ['✨', '🫧', '🌸', '💧', '🍃'],
      power: 460,
      life: 1.3,
    })
  }

  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1e3a8a_0%,#0b1d3a_60%,#050d1c_100%)] px-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        {['✨', '🫧', '⭐', '🌟', '✨', '🫧'].map((e, i) => (
          <span
            key={i}
            className="animate-float absolute text-4xl"
            style={{
              left: `${8 + i * 15}%`,
              top: `${12 + (i % 3) * 26}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {e}
          </span>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <span className="text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] sm:text-8xl">🧪</span>
        <h1 className="bg-gradient-to-b from-white via-amber-100 to-amber-300 bg-clip-text text-6xl font-black text-transparent drop-shadow-sm sm:text-8xl">
          Potiony
        </h1>
        <p className="mt-2 max-w-xl text-lg font-bold text-white/85 sm:text-2xl">
          Tidy up the world 🌍, brew magic potions 🫧, and help your friends feel happy again 💛
        </p>
        {level >= 2 && (
          <p className="mt-2 rounded-full border-4 border-amber-300 bg-amber-400/90 px-4 py-1 text-lg font-black text-slate-900">
            Level 2 is open — look for the dumpster! 🗑️
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-4">
          {hasSave && (
            <button
              onClick={() => {
                celebrate()
                startGame()
              }}
              className="min-h-20 rounded-full border-4 border-white bg-gradient-to-b from-emerald-400 to-emerald-600 px-12 text-3xl font-black text-white shadow-2xl active:scale-95 sm:text-4xl"
            >
              ▶️ Keep Playing
            </button>
          )}

          {!confirming ? (
            <button
              onClick={() => {
                audio.unlock()
                audio.tap()
                if (hasSave) setConfirming(true)
                else {
                  celebrate()
                  newGame()
                }
              }}
              className={
                hasSave
                  ? 'min-h-16 rounded-full border-4 border-white/50 bg-white/10 px-8 text-xl font-black text-white active:scale-95'
                  : 'min-h-20 rounded-full border-4 border-white bg-gradient-to-b from-fuchsia-500 to-purple-600 px-12 text-3xl font-black text-white shadow-2xl active:scale-95 sm:text-4xl'
              }
            >
              {hasSave ? '🔄 Start a New Game' : '✨ Start a New Game'}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-3xl border-4 border-amber-300 bg-slate-900/80 p-5">
              <p className="text-xl font-black">Start over from the beginning?</p>
              <p className="text-sm font-bold text-white/70">
                Your {trash} sorted pieces of litter will be forgotten.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    celebrate()
                    newGame()
                  }}
                  className="min-h-16 rounded-full border-4 border-white bg-gradient-to-b from-fuchsia-500 to-purple-600 px-8 text-xl font-black active:scale-95"
                >
                  Yes, start fresh
                </button>
                <button
                  onClick={() => {
                    audio.tap()
                    setConfirming(false)
                  }}
                  className="min-h-16 rounded-full border-4 border-white/40 bg-white/10 px-8 text-xl font-black active:scale-95"
                >
                  No, go back
                </button>
              </div>
            </div>
          )}
        </div>

        {hasSave && (
          <p className="mt-6 text-sm font-bold text-white/60">
            Your game saves all by itself. You can close it any time. 💾
          </p>
        )}
      </motion.div>
    </div>
  )
}
