import { useGame } from '../store/gameStore'
import type { SceneId } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'

const TABS: { id: SceneId; emoji: string; label: string }[] = [
  { id: 'clean', emoji: '🏞️', label: 'Clean & Collect' },
  { id: 'lab', emoji: '🧪', label: 'Potion Lab' },
  { id: 'town', emoji: '🏡', label: 'Town & Friends' },
  { id: 'book', emoji: '📖', label: 'Recipe Book' },
]

export function TabBar() {
  const activeScene = useGame((s) => s.activeScene)
  const setScene = useGame((s) => s.setScene)
  const potions = useGame((s) => s.potions)
  const totalPotions = Object.values(potions).reduce((a, b) => a + b, 0)

  return (
    <nav className="pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-stretch justify-center gap-2 px-2 pb-2 sm:gap-4">
        {TABS.map((tab) => {
          const active = activeScene === tab.id
          return (
            <li key={tab.id} className="min-w-0 flex-1">
              <button
                onClick={() => {
                  audio.tap()
                  setScene(tab.id)
                }}
                aria-current={active ? 'page' : undefined}
                className={[
                  'relative flex h-20 w-full flex-col items-center justify-center gap-0.5 rounded-3xl border-4 transition',
                  active
                    ? 'scale-105 border-white bg-white/95 text-slate-900 shadow-xl'
                    : 'border-white/25 bg-white/10 text-white active:scale-95',
                ].join(' ')}
              >
                <span className="text-3xl leading-none">{tab.emoji}</span>
                <span className="truncate px-1 text-[11px] font-extrabold tracking-wide sm:text-sm">
                  {tab.label}
                </span>
                {tab.id === 'town' && totalPotions > 0 && (
                  <span className="absolute top-1 right-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-emerald-500 px-1 text-xs font-bold text-white">
                    {totalPotions}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
