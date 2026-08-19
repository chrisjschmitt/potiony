import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FRIENDS, FRIEND_ORDER } from '../content/friends'
import { POTIONS, POTION_ORDER } from '../content/recipes'
import type { FriendId, PotionId } from '../content/types'
import { selectHealedCount, useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'
import { fx } from '../systems/fx/ParticleLayer'
import { useDraggable, useDropTarget } from '../systems/drag/DragProvider'
import { CountChip } from '../ui/CountChip'

function FriendCard({ id }: { id: FriendId }) {
  const friend = FRIENDS[id]
  const healed = useGame((s) => s.friends[id].healed)
  const givePotion = useGame((s) => s.givePotion)
  const showToast = useGame((s) => s.showToast)
  const potions = useGame((s) => s.potions)
  const ref = useRef<HTMLDivElement | null>(null)
  const needed = POTIONS[friend.needs]

  const { setRef, isOver, isCandidate } = useDropTarget({
    accepts: (p) => p.kind === 'potion' && !healed,
    onDrop: (p) => {
      if (p.kind !== 'potion') return
      if (givePotion(id, p.id)) {
        audio.cheer()
        fx.burstAt(ref.current, {
          emojis: ['💛', '💖', '✨', '🌟'],
          count: 26,
          power: 420,
          life: 1.3,
        })
        showToast(friend.emoji, friend.thanks)
      } else {
        audio.nope()
        showToast(needed.emoji, `${friend.name} needs the ${needed.name}. Try that one!`)
      }
    },
  })

  const hasNeeded = potions[friend.needs] > 0

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Icon-only speech bubble: readable by a child who cannot read yet. */}
      <AnimatePresence>
        {!healed && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="relative flex items-center gap-2 rounded-3xl border-4 border-slate-900 bg-white px-4 py-3 text-slate-900 shadow-xl"
          >
            <span className="text-4xl">{friend.ailmentEmoji}</span>
            <span className="text-2xl font-black">➜</span>
            <span className={hasNeeded ? 'animate-bob text-4xl' : 'text-4xl opacity-60'}>
              {needed.emoji}
            </span>
            <span className="absolute -bottom-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[12px] border-x-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={(el) => {
          ref.current = el
          setRef(el)
        }}
        onPointerDown={() => {
          audio.tap()
          if (!healed) showToast(friend.ailmentEmoji, `${friend.name} has the ${friend.ailment}!`)
        }}
        className={[
          'flex w-40 flex-col items-center gap-1 rounded-[2rem] border-4 border-white/70 bg-gradient-to-b p-4 shadow-2xl transition sm:w-48',
          friend.swatch,
          healed ? 'animate-bob' : '',
          isOver ? 'scale-110 ring-8 ring-white' : isCandidate ? 'animate-shimmer' : '',
        ].join(' ')}
      >
        <span className="text-7xl drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]">{friend.emoji}</span>
        <span className="text-lg font-black drop-shadow">{friend.name}</span>
        <span className="rounded-full bg-slate-900/40 px-3 py-1 text-center text-xs font-bold">
          {healed ? '💛 All better!' : friend.ailment}
        </span>
      </div>
    </div>
  )
}

function PotionTrayItem({ id }: { id: PotionId }) {
  const count = useGame((s) => s.potions[id])
  const potion = POTIONS[id]
  const { onPointerDown, isDragging } = useDraggable({
    payload: { kind: 'potion', id, emoji: potion.emoji },
    disabled: count <= 0,
    onTap: () => audio.tap(),
    onMiss: () => audio.nope(),
  })

  return (
    <CountChip
      emoji={potion.emoji}
      label={potion.name}
      count={count}
      swatch={potion.swatch}
      dimmed={count <= 0}
      dragging={isDragging}
      highlight={count > 0}
      onPointerDown={count > 0 ? onPointerDown : undefined}
    />
  )
}

export function Town() {
  const healed = useGame(selectHealedCount)
  const setScene = useGame((s) => s.setScene)
  const total = FRIEND_ORDER.length
  const brightness = healed / total
  const anyPotions = useGame((s) => Object.values(s.potions).some((n) => n > 0))

  return (
    <div className="relative h-full overflow-hidden rounded-[2rem] border-4 border-white/20">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#475569_0%,#64748b_60%,#94a3b8_100%)]" />
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(180deg,#38bdf8_0%,#bae6fd_55%,#fde68a_100%)]"
        animate={{ opacity: 0.35 + brightness * 0.65 }}
        transition={{ duration: 0.9 }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,#a3e635_0%,#65a30d_100%)]" />

      <div className="pointer-events-none absolute inset-0">
        {['🏠', '🏡', '🏘️', '⛲', '🌳'].map((e, i) => (
          <span
            key={i}
            className="absolute text-5xl opacity-80 sm:text-6xl"
            style={{ left: `${4 + i * 21}%`, top: `${18 + (i % 2) * 8}%` }}
          >
            {e}
          </span>
        ))}
        {Array.from({ length: Math.round(brightness * 6) }, (_, i) => (
          <span
            key={`sparkle-${i}`}
            className="animate-float absolute text-3xl"
            style={{ left: `${12 + i * 15}%`, top: `${8 + (i % 3) * 6}%` }}
          >
            ✨
          </span>
        ))}
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex items-baseline justify-between px-5 pt-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 drop-shadow">🏡 Town & Friends</h2>
            <p className="text-sm font-bold text-slate-800/80">
              Drag the right potion to the friend who needs it.
            </p>
          </div>
          <p className="rounded-full border-4 border-white bg-slate-900/70 px-4 py-1 font-black">
            💛 {healed}/{total} helped
          </p>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center gap-4 px-4 sm:gap-8">
          {FRIEND_ORDER.map((id) => (
            <FriendCard key={id} id={id} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 border-t-4 border-white/40 bg-slate-900/45 px-5 py-3">
          {anyPotions ? (
            POTION_ORDER.map((id) => <PotionTrayItem key={id} id={id} />)
          ) : (
            <button
              onClick={() => {
                audio.tap()
                setScene('lab')
              }}
              className="flex min-h-16 items-center gap-3 rounded-full border-4 border-white bg-gradient-to-b from-fuchsia-500 to-purple-600 px-8 text-xl font-black active:scale-95"
            >
              🧪 No potions yet — go brew one!
            </button>
          )}
        </div>
      </div>

      {healed === total && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="pointer-events-none absolute inset-x-0 top-1/3 flex flex-col items-center gap-2 text-center"
        >
          <span className="text-8xl">🎉</span>
          <p className="rounded-full border-4 border-white bg-emerald-500/90 px-8 py-3 text-3xl font-black drop-shadow">
            Everyone feels better. You are a potion hero!
          </p>
        </motion.div>
      )}
    </div>
  )
}
