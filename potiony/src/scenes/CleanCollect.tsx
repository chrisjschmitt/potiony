import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { INGREDIENTS } from '../content/ingredients'
import { BIN_ORDER_LEVEL2, MATERIALS, MATERIAL_ORDER } from '../content/types'
import type { Material } from '../content/types'
import { LITTER_KINDS, ZONES, ZONE_ORDER } from '../content/zones'
import type { LitterInstance } from '../store/save'
import { selectZoneTidyNow, useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'
import { fx } from '../systems/fx/ParticleLayer'
import { useDraggable, useDropTarget } from '../systems/drag/DragProvider'
import type { DragPayload } from '../systems/drag/DragProvider'

function LitterPiece({ item }: { item: LitterInstance }) {
  const kind = LITTER_KINDS[item.kind]
  const zoneId = useGame((s) => s.activeZone)
  const showToast = useGame((s) => s.showToast)
  const payload: DragPayload = {
    kind: 'litter',
    id: item.id,
    emoji: kind.emoji,
    zoneId,
    material: kind.material,
  }

  const { onPointerDown, isDragging } = useDraggable({
    payload,
    onTap: () => {
      audio.tap()
      showToast(kind.emoji, 'Drag it onto the matching bin!')
    },
    onMiss: () => {
      audio.nope()
      showToast(kind.emoji, 'Drop it on a bin!')
    },
  })

  return (
    <motion.div
      onPointerDown={(e) => {
        audio.pick()
        onPointerDown(e)
      }}
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: item.scale, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: `${item.delay}s` }}
      className={[
        'animate-float absolute grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full text-5xl',
        'bg-white/25 shadow-[0_6px_16px_rgba(0,0,0,0.25)] backdrop-blur-[1px] active:scale-90',
        isDragging ? 'opacity-25' : '',
      ].join(' ')}
      aria-label={`${kind.name}, ${MATERIALS[kind.material].name}`}
      role="img"
    >
      <span className="drop-shadow select-none">{kind.emoji}</span>
    </motion.div>
  )
}

function Bin({
  material,
  onSorted,
  onWrong,
}: {
  material: Material
  onSorted: (litterId: string, el: Element | null) => void
  onWrong: (material: Material) => void
}) {
  const info = MATERIALS[material]
  const ref = useRef<HTMLDivElement | null>(null)

  const { setRef, isOver, isCandidate } = useDropTarget({
    accepts: (p) => p.kind === 'litter',
    onDrop: (p) => {
      if (p.kind !== 'litter') return
      if (p.material === material) onSorted(p.id, ref.current)
      else onWrong(p.material)
    },
  })

  return (
    <div
      ref={(el) => {
        ref.current = el
        setRef(el)
      }}
      className={[
        'flex h-28 w-24 flex-col items-center justify-center gap-1 rounded-3xl border-4 border-white/80 bg-gradient-to-b shadow-xl transition sm:h-32 sm:w-32',
        info.swatch,
        isOver ? 'scale-110 ring-8 ring-white' : isCandidate ? 'animate-bob' : '',
      ].join(' ')}
    >
      <span className="text-4xl drop-shadow">{info.emoji}</span>
      <span className="text-base font-black text-white drop-shadow sm:text-lg">{info.name}</span>
      <span className="text-[11px] font-bold text-white/80">
        {material === 'trash' ? 'Dump here!' : 'Drop here!'}
      </span>
    </div>
  )
}

export function CleanCollect() {
  const zoneId = useGame((s) => s.activeZone)
  const setZone = useGame((s) => s.setZone)
  const zoneState = useGame((s) => s.zones[zoneId])
  const collectLitter = useGame((s) => s.collectLitter)
  const refillZone = useGame((s) => s.refillZone)
  const showToast = useGame((s) => s.showToast)
  const level = useGame((s) => s.level)
  const tidyNow = useGame((s) => selectZoneTidyNow(s, zoneId))
  const zone = ZONES[zoneId]
  const ingredient = INGREDIENTS[zone.ingredient]
  const bins = level >= 2 ? BIN_ORDER_LEVEL2 : MATERIAL_ORDER

  const clean = Math.max(zoneState.bestClean, tidyNow)
  const remaining = zoneState.litter.length

  // When a zone is spotless the wind brings a little more litter, so the
  // collecting loop never dead-ends and ingredients never run out.
  useEffect(() => {
    if (remaining > 0) return
    const id = window.setTimeout(() => {
      refillZone(zoneId)
      showToast('🍃', 'Whoosh! The wind blew in a little more litter to tidy.')
    }, 2600)
    return () => window.clearTimeout(id)
  }, [remaining, zoneId, refillZone, showToast])

  const reward = (litterId: string, el: Element | null) => {
    const item = zoneState.litter.find((l) => l.id === litterId)
    const kind = item ? LITTER_KINDS[item.kind] : null
    audio.sparkle()
    fx.burstAt(el, {
      emojis: kind?.material === 'trash' ? ['🗑️', '✨'] : [ingredient.emoji, '✨'],
      count: 12,
      power: 300,
    })
  }

  const sortLitter = (litterId: string, el: Element | null) => {
    reward(litterId, el)
    collectLitter(zoneId, litterId)
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[2rem] border-4 border-white/20">
      {/* Dirty sky underneath, clean sky fading in as the zone recovers. */}
      <div className="absolute inset-0" style={{ background: zone.dirtySky }} />
      <motion.div
        className="absolute inset-0"
        style={{ background: zone.cleanSky }}
        animate={{ opacity: clean }}
        transition={{ duration: 0.8 }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/4" style={{ background: zone.ground }} />

      {/* Nature blooms back as cleanliness rises. */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: Math.round(clean * 10) }, (_, i) => (
          <span
            key={i}
            className="animate-float absolute text-4xl sm:text-5xl"
            style={{
              left: `${5 + ((i * 37) % 90)}%`,
              top: `${58 + ((i * 23) % 34)}%`,
              animationDelay: `${(i % 5) * 0.4}s`,
            }}
          >
            {zone.bloomEmojis[i % zone.bloomEmojis.length]}
          </span>
        ))}
      </div>

      {/* Zone picker */}
      <div className="absolute top-3 left-3 z-20 flex max-w-[70%] gap-2 overflow-x-auto">
        {ZONE_ORDER.map((id) => {
          const active = id === zoneId
          const locked = ZONES[id].minLevel > level
          return (
            <button
              key={id}
              onClick={() => {
                audio.tap()
                if (locked) {
                  showToast('🔒', 'Help your three friends first to open Moonlit Meadow!')
                  return
                }
                setZone(id)
              }}
              className={[
                'flex min-h-16 shrink-0 items-center gap-2 rounded-2xl border-4 px-3 py-2 font-black transition',
                locked
                  ? 'border-white/20 bg-slate-900/60 text-white/50'
                  : active
                    ? 'scale-105 border-white bg-white text-slate-900 shadow-xl'
                    : 'border-white/50 bg-slate-900/45 text-white active:scale-95',
              ].join(' ')}
            >
              <span className="text-3xl">{locked ? '🔒' : ZONES[id].emoji}</span>
              <span className="hidden text-sm sm:block">{ZONES[id].name}</span>
            </button>
          )
        })}
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-2xl border-4 border-white/50 bg-slate-900/45 px-4 py-2">
        <span className="text-3xl">{ingredient.emoji}</span>
        <div className="text-left">
          <p className="text-sm font-black">{Math.round(tidyNow * 100)}% tidy</p>
          <p className="text-[11px] font-bold text-white/75">
            Drag each piece to its bin
          </p>
        </div>
      </div>

      {/* Play area */}
      <div className="absolute inset-x-0 top-24 bottom-44">
        {zoneState.litter.map((item) => (
          <LitterPiece key={item.id} item={item} />
        ))}

        {remaining === 0 && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-x-0 top-1/3 flex flex-col items-center gap-2 text-center"
          >
            <span className="text-7xl">🎉</span>
            <p className="rounded-full border-4 border-white bg-emerald-500/90 px-6 py-2 text-2xl font-black drop-shadow">
              {zone.name} is sparkling!
            </p>
          </motion.div>
        )}
      </div>

      {/* Bins */}
      <div className="absolute inset-x-0 bottom-4 z-20 flex items-end justify-center gap-2 sm:gap-4">
        {bins.map((material) => (
          <Bin
            key={material}
            material={material}
            onSorted={sortLitter}
            onWrong={(actual) => {
              audio.nope()
              if (actual === 'trash') {
                showToast('🗑️', "That's trash, not recycling! Pop it in the dumpster.")
              } else if (material === 'trash') {
                showToast(
                  MATERIALS[actual].emoji,
                  `That can be recycled in the ${MATERIALS[actual].name} bin!`,
                )
              } else {
                showToast(
                  MATERIALS[actual].emoji,
                  `Oops! That one goes in the ${MATERIALS[actual].name} bin.`,
                )
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
