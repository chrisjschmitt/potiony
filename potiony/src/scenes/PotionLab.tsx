import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { INGREDIENTS, INGREDIENT_ORDER } from '../content/ingredients'
import { MAX_CAULDRON_SLOTS, POTIONS, isPartialRecipe } from '../content/recipes'
import type { PotionId } from '../content/types'
import { selectAvailable, useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'
import { fx } from '../systems/fx/ParticleLayer'
import { useDraggable, useDropTarget } from '../systems/drag/DragProvider'
import { CountChip } from '../ui/CountChip'
import type { IngredientId } from '../content/types'

const STIR_TARGET_DEGREES = 540

function ShelfItem({ id }: { id: IngredientId }) {
  const ingredient = INGREDIENTS[id]
  const available = useGame((s) => selectAvailable(s, id))
  const addToCauldron = useGame((s) => s.addToCauldron)
  const ref = useRef<HTMLDivElement | null>(null)

  const { onPointerDown, isDragging } = useDraggable({
    payload: { kind: 'ingredient', id, emoji: ingredient.emoji },
    disabled: available <= 0,
    // Tap works as well as drag: it drops one straight into the cauldron.
    onTap: () => {
      if (addToCauldron(id)) {
        audio.plop()
        fx.burstAt(ref.current, { emojis: [ingredient.emoji], count: 6, power: 200 })
      } else audio.nope()
    },
    onMiss: () => audio.nope(),
  })

  return (
    <CountChip
      emoji={ingredient.emoji}
      label={ingredient.name}
      count={available}
      swatch={ingredient.swatch}
      dimmed={available <= 0}
      dragging={isDragging}
      onPointerDown={available > 0 ? onPointerDown : undefined}
      elementRef={(el) => {
        ref.current = el
      }}
      title={ingredient.hint}
    />
  )
}

function Cauldron() {
  const cauldron = useGame((s) => s.cauldron)
  const addToCauldron = useGame((s) => s.addToCauldron)
  const emptyCauldron = useGame((s) => s.emptyCauldron)
  const ref = useRef<HTMLDivElement | null>(null)

  const { setRef, isOver, isCandidate } = useDropTarget({
    accepts: (p) => p.kind === 'ingredient' && cauldron.length < MAX_CAULDRON_SLOTS,
    onDrop: (p) => {
      if (p.kind !== 'ingredient') return
      if (addToCauldron(p.id)) {
        audio.plop()
        fx.burstAt(ref.current, { emojis: [p.emoji, '🫧'], count: 10, power: 240 })
      } else audio.nope()
    },
  })

  const colors = cauldron.map(liquidColor)
  const liquid = colors.length
    ? `linear-gradient(180deg, ${(colors.length === 1 ? [colors[0], colors[0]] : colors).join(', ')})`
    : 'linear-gradient(180deg,#5b21b6,#312e81)'

  const stillPossible = isPartialRecipe(cauldron)

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={(el) => {
          ref.current = el
          setRef(el)
        }}
        className={[
          'relative grid h-56 w-72 place-items-end rounded-b-[8rem] rounded-t-[3rem] border-8 border-slate-700 bg-slate-800 shadow-2xl transition',
          isOver ? 'scale-105 ring-8 ring-amber-300' : isCandidate ? 'animate-bob' : '',
        ].join(' ')}
      >
        <div className="absolute inset-x-4 top-4 bottom-6 overflow-hidden rounded-b-[6rem] rounded-t-[2rem]">
          <motion.div
            className="absolute inset-0"
            style={{ background: liquid }}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="absolute bottom-2 h-5 w-5 rounded-full bg-white/45"
              style={{
                left: `${12 + i * 18}%`,
                animation: `potiony-bubble ${1.6 + i * 0.35}s ease-in ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="absolute -top-6 flex gap-2">
          {Array.from({ length: MAX_CAULDRON_SLOTS }, (_, i) => (
            <div
              key={i}
              className={[
                'grid h-14 w-14 place-items-center rounded-2xl border-4 text-3xl',
                cauldron[i]
                  ? 'animate-pop border-white bg-white/90'
                  : 'border-dashed border-white/40 bg-slate-900/40',
              ].join(' ')}
            >
              {cauldron[i] ? INGREDIENTS[cauldron[i]].emoji : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm font-bold text-white/80">
          {cauldron.length === 0
            ? 'Drop 2 or 3 ingredients in the pot 🫧'
            : !stillPossible
              ? 'Hmm, this mix looks silly! Empty it and try again.'
              : cauldron.length < 2
                ? 'Add one more ingredient!'
                : 'Now stir the pot! 🥄'}
        </p>
        {cauldron.length > 0 && (
          <button
            onClick={() => {
              audio.tap()
              emptyCauldron()
            }}
            className="min-h-12 rounded-2xl border-4 border-white/40 bg-white/10 px-4 font-black active:scale-95"
          >
            ♻️ Empty
          </button>
        )}
      </div>
    </div>
  )
}

function liquidColor(id: IngredientId) {
  switch (id) {
    case 'sunlight_blossom':
      return '#f472b6'
    case 'dewdrop_crystal':
      return '#38bdf8'
    case 'whispering_leaf':
      return '#4ade80'
    case 'star_dust':
      return '#fbbf24'
  }
}

function StirWheel({ onBrew }: { onBrew: () => void }) {
  const cauldron = useGame((s) => s.cauldron)
  const [progress, setProgress] = useState(0)
  const ready = cauldron.length >= 2
  const dragging = useRef<{ angle: number; total: number } | null>(null)

  const angleFrom = (el: HTMLElement, x: number, y: number) => {
    const r = el.getBoundingClientRect()
    return Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * (180 / Math.PI)
  }

  const bump = useCallback(
    (amount: number) => {
      setProgress((prev) => {
        const next = prev + amount
        if (next >= 1) {
          onBrew()
          dragging.current = null
          return 0
        }
        if (Math.floor(next * 6) !== Math.floor(prev * 6)) audio.bubble()
        return next
      })
    },
    [onBrew],
  )

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!ready) {
      audio.nope()
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = { angle: angleFrom(e.currentTarget, e.clientX, e.clientY), total: 0 }
    // A tap alone also stirs, for children who do not trace circles yet.
    bump(0.14)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragging.current
    if (!state || !ready) return
    const angle = angleFrom(e.currentTarget, e.clientX, e.clientY)
    let delta = angle - state.angle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    state.angle = angle
    state.total += Math.abs(delta)
    if (state.total >= 18) {
      bump(state.total / STIR_TARGET_DEGREES)
      state.total = 0
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          dragging.current = null
        }}
        disabled={!ready}
        aria-label="Stir the cauldron"
        className={[
          'relative grid h-40 w-40 touch-none place-items-center rounded-full border-8 transition',
          ready
            ? 'border-amber-300 bg-gradient-to-b from-amber-400 to-orange-500 shadow-2xl active:scale-95'
            : 'border-white/20 bg-white/5 opacity-50',
        ].join(' ')}
      >
        <motion.span
          className="text-6xl"
          animate={{ rotate: progress * 720 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          🥄
        </motion.span>
        <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${progress * 289} 289`}
          />
        </svg>
      </button>
      <p className="text-lg font-black">{ready ? 'Stir!' : 'Add ingredients'}</p>
    </div>
  )
}

function BrewResult({ potion, onClose }: { potion: PotionId | 'mystery'; onClose: () => void }) {
  const setScene = useGame((s) => s.setScene)
  const mystery = potion === 'mystery'
  const info = mystery ? null : POTIONS[potion]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 grid place-items-center bg-slate-950/70 px-6"
    >
      <motion.div
        initial={{ scale: 0.6, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex flex-col items-center gap-4 rounded-[2.5rem] border-8 border-amber-300 bg-slate-900/95 px-10 py-8 text-center shadow-2xl"
      >
        <span className="animate-bob text-8xl">{mystery ? '🫧' : info!.emoji}</span>
        <h2 className="text-4xl font-black">{mystery ? 'Fizzy Mystery Bubble!' : info!.name}</h2>
        <p className="max-w-sm text-lg font-bold text-white/80">
          {mystery
            ? 'That mix made a silly bubble. Your ingredients came back — try another pair!'
            : 'You brewed a magic potion! Take it to a friend who needs it.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="min-h-16 rounded-full border-4 border-white/50 bg-white/10 px-8 text-xl font-black active:scale-95"
          >
            Brew more
          </button>
          {!mystery && (
            <button
              onClick={() => {
                audio.tap()
                setScene('town')
              }}
              className="min-h-16 rounded-full border-4 border-white bg-gradient-to-b from-emerald-400 to-emerald-600 px-8 text-xl font-black active:scale-95"
            >
              🏡 Go help a friend
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function PotionLab() {
  const brew = useGame((s) => s.brew)
  const [result, setResult] = useState<PotionId | 'mystery' | null>(null)

  const handleBrew = useCallback(() => {
    const potion = brew()
    if (potion) {
      audio.brewed()
      fx.burst({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        count: 30,
        emojis: [POTIONS[potion].emoji, '✨', '🫧'],
        power: 460,
        life: 1.2,
      })
      setResult(potion)
    } else {
      audio.nope()
      setResult('mystery')
    }
  }, [brew])

  return (
    <div className="relative h-full overflow-hidden rounded-[2rem] border-4 border-white/20 bg-[radial-gradient(circle_at_50%_0%,#4c1d95_0%,#2e1065_55%,#170938_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        {['🧫', '📜', '🕯️', '🔮', '🧹'].map((e, i) => (
          <span
            key={i}
            className="absolute text-5xl"
            style={{ left: `${6 + i * 22}%`, top: `${i % 2 ? 14 : 70}%` }}
          >
            {e}
          </span>
        ))}
      </div>

      <div className="relative flex h-full flex-col">
        <div className="px-5 pt-4">
          <h2 className="text-2xl font-black">🧪 Potion Lab</h2>
          <p className="text-sm font-bold text-white/70">
            Drag ingredients into the cauldron, then stir!
          </p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-around gap-4 px-5">
          <section
            aria-label="Ingredient shelf"
            className="flex max-h-full flex-col gap-3 rounded-3xl border-4 border-amber-900/60 bg-amber-950/50 p-4"
          >
            <h3 className="text-xs font-extrabold tracking-wide text-amber-200/90 uppercase">
              Shelf
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {INGREDIENT_ORDER.map((id) => (
                <ShelfItem key={id} id={id} />
              ))}
            </div>
          </section>

          <Cauldron />
          <StirWheel onBrew={handleBrew} />
        </div>
      </div>

      <AnimatePresence>
        {result && <BrewResult potion={result} onClose={() => setResult(null)} />}
      </AnimatePresence>
    </div>
  )
}
