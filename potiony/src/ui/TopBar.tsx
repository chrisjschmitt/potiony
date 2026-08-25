import { useState } from 'react'
import { selectHealedCount, selectFriendTotal, selectPlanetClean, useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'

function PlanetMeter() {
  const clean = useGame(selectPlanetClean)
  const pct = Math.round(clean * 100)
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="text-3xl">{pct >= 100 ? '🌍' : pct > 50 ? '🌎' : '🌏'}</span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-xs font-extrabold tracking-wide text-white/80 uppercase">
            Planet Cleanliness
          </span>
          <span className="text-sm font-black text-white">{pct}%</span>
        </div>
        <div
          className="h-5 w-full overflow-hidden rounded-full border-2 border-white/40 bg-slate-900/50"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Planet cleanliness"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-lime-300 via-emerald-400 to-sky-400 transition-[width] duration-700"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function TopBar() {
  const setScene = useGame((s) => s.setScene)
  const level = useGame((s) => s.level)
  const healed = useGame(selectHealedCount)
  const friendTotal = useGame(selectFriendTotal)
  const [muted, setMuted] = useState(false)

  return (
    <header className="flex items-center gap-3 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
      <button
        onClick={() => {
          audio.tap()
          setScene('clean')
          useGame.setState({ started: false })
        }}
        aria-label="Home"
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-white/30 bg-white/10 text-2xl active:scale-95"
      >
        🏠
      </button>

      <PlanetMeter />

      <span className="flex h-14 shrink-0 items-center rounded-2xl border-4 border-white/30 bg-white/10 px-3 text-lg font-black">
        💛 {healed}/{friendTotal}
      </span>

      {level >= 2 && (
        <span className="hidden shrink-0 rounded-full border-4 border-amber-300 bg-amber-400 px-3 py-1 text-sm font-black text-slate-900 sm:inline">
          Level 2
        </span>
      )}

      <button
        onClick={() => {
          const next = !muted
          setMuted(next)
          audio.setMuted(next)
        }}
        aria-label={muted ? 'Turn sounds on' : 'Turn sounds off'}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 border-white/30 bg-white/10 text-2xl active:scale-95"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </header>
  )
}
