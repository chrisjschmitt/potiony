import { AnimatePresence, motion } from 'framer-motion'
import { INGREDIENTS, INGREDIENT_ORDER } from '../content/ingredients'
import { POTIONS, POTION_ORDER } from '../content/recipes'
import { selectTrashCollected, useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'
import { CountChip } from './CountChip'

export function InventoryDrawer() {
  const open = useGame((s) => s.drawerOpen)
  const toggleDrawer = useGame((s) => s.toggleDrawer)
  const ingredients = useGame((s) => s.ingredients)
  const potions = useGame((s) => s.potions)
  const trash = useGame(selectTrashCollected)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleDrawer(false)}
            aria-label="Close my bag"
            className="fixed inset-0 z-40 bg-slate-950/50"
          />
          <motion.section
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2.5rem] border-t-8 border-amber-300 bg-slate-900/95 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur"
            aria-label="My bag"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-black">
                🎒 My Bag
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
                  🗑️ {trash} pieces of litter sorted
                </span>
              </h2>
              <button
                onClick={() => {
                  audio.tap()
                  toggleDrawer(false)
                }}
                className="grid h-14 w-14 place-items-center rounded-2xl border-4 border-white/40 bg-white/10 text-2xl active:scale-95"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-extrabold tracking-wide text-white/70 uppercase">
                  Ingredients
                </h3>
                <div className="flex flex-wrap gap-3">
                  {INGREDIENT_ORDER.map((id) => (
                    <CountChip
                      key={id}
                      emoji={INGREDIENTS[id].emoji}
                      label={INGREDIENTS[id].name}
                      count={ingredients[id]}
                      swatch={INGREDIENTS[id].swatch}
                      size="sm"
                      dimmed={ingredients[id] === 0}
                      title={INGREDIENTS[id].hint}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-extrabold tracking-wide text-white/70 uppercase">
                  Potions
                </h3>
                <div className="flex flex-wrap gap-3">
                  {POTION_ORDER.map((id) => (
                    <CountChip
                      key={id}
                      emoji={POTIONS[id].emoji}
                      label={POTIONS[id].name}
                      count={potions[id]}
                      swatch={POTIONS[id].swatch}
                      size="sm"
                      dimmed={potions[id] === 0}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}
