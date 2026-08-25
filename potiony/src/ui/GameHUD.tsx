import { useRef } from 'react'
import type { ReactNode } from 'react'
import { INGREDIENTS, visibleIngredients } from '../content/ingredients'
import { POTIONS, visiblePotions } from '../content/recipes'
import { MATERIAL_ORDER, MATERIALS } from '../content/types'
import type { IngredientId, PotionId } from '../content/types'
import { selectAvailable, useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'
import { fx } from '../systems/fx/ParticleLayer'
import { useDraggable } from '../systems/drag/DragProvider'
import { CountChip } from './CountChip'

function HudGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex shrink-0 flex-col gap-1">
      <h3 className="px-1 text-[11px] font-extrabold tracking-wide text-white/70 uppercase">
        {title}
      </h3>
      <div className="flex items-end gap-1.5">{children}</div>
    </section>
  )
}

function ScoreStrip() {
  const recycled = useGame((s) => s.recycled)
  const dumped = useGame((s) => s.dumped)
  const level = useGame((s) => s.level)

  return (
    <section className="flex shrink-0 flex-col gap-1">
      <h3 className="px-1 text-[11px] font-extrabold tracking-wide text-white/70 uppercase">
        ♻️ Recycled
      </h3>
      <div className="flex h-16 items-center gap-1 rounded-2xl border-4 border-white/25 bg-white/10 px-2">
        {MATERIAL_ORDER.map((material) => {
          const info = MATERIALS[material]
          return (
            <span
              key={material}
              title={`${info.name} recycled`}
              className="flex items-center gap-1 rounded-xl px-1.5 text-base font-black"
            >
              <span className="text-2xl leading-none">{info.emoji}</span>
              {recycled[material]}
            </span>
          )
        })}
        {level >= 2 && (
          <span
            title="Trash dumped"
            className="flex items-center gap-1 border-l-2 border-white/25 px-1.5 text-base font-black"
          >
            <span className="text-2xl leading-none">🗑️</span>
            {dumped}
          </span>
        )}
      </div>
    </section>
  )
}

function IngredientChip({ id }: { id: IngredientId }) {
  const ingredient = INGREDIENTS[id]
  const available = useGame((s) => selectAvailable(s, id))
  const addToCauldron = useGame((s) => s.addToCauldron)
  const setScene = useGame((s) => s.setScene)
  const showToast = useGame((s) => s.showToast)
  const scene = useGame((s) => s.activeScene)
  const ref = useRef<HTMLDivElement | null>(null)

  const { onPointerDown, isDragging } = useDraggable({
    payload: { kind: 'ingredient', id, emoji: ingredient.emoji },
    disabled: available <= 0,
    onTap: () => {
      if (scene === 'lab') {
        if (addToCauldron(id)) {
          audio.plop()
          fx.burstAt(ref.current, { emojis: [ingredient.emoji], count: 6, power: 200 })
        } else audio.nope()
        return
      }
      audio.tap()
      setScene('lab')
      showToast(ingredient.emoji, 'Drop it in the cauldron!')
    },
    onMiss: () => audio.nope(),
  })

  return (
    <CountChip
      emoji={ingredient.emoji}
      count={available}
      swatch={ingredient.swatch}
      size="sm"
      dimmed={available <= 0}
      dragging={isDragging}
      highlight={available > 0 && scene === 'lab'}
      onPointerDown={available > 0 ? onPointerDown : undefined}
      elementRef={(el) => {
        ref.current = el
      }}
      title={ingredient.hint}
    />
  )
}

function PotionChip({ id }: { id: PotionId }) {
  const potion = POTIONS[id]
  const count = useGame((s) => s.potions[id])
  const setScene = useGame((s) => s.setScene)
  const showToast = useGame((s) => s.showToast)
  const scene = useGame((s) => s.activeScene)

  const { onPointerDown, isDragging } = useDraggable({
    payload: { kind: 'potion', id, emoji: potion.emoji },
    disabled: count <= 0,
    onTap: () => {
      audio.tap()
      if (scene !== 'town') {
        setScene('town')
        showToast(potion.emoji, 'Drag this to a friend!')
        return
      }
      showToast(potion.emoji, 'Drag this to the friend who needs it!')
    },
    onMiss: () => audio.nope(),
  })

  return (
    <CountChip
      emoji={potion.emoji}
      count={count}
      swatch={potion.swatch}
      size="sm"
      dimmed={count <= 0}
      dragging={isDragging}
      highlight={count > 0 && scene === 'town'}
      onPointerDown={count > 0 ? onPointerDown : undefined}
      title={potion.name}
    />
  )
}

/**
 * Always-on hotbar. Ingredients and potions can be dragged into the scene.
 * Recycled and dumped counts are scores, not a carrying pouch.
 */
export function GameHUD() {
  const level = useGame((s) => s.level)
  const ingredients = visibleIngredients(level)
  const potions = visiblePotions(level)

  return (
    <div className="flex items-end gap-3 overflow-x-auto px-3 pt-1 pb-2" aria-label="Your stuff">
      <ScoreStrip />
      <div className="mb-1 h-12 w-px shrink-0 bg-white/20" aria-hidden />
      <HudGroup title="🌿 Ingredients">
        {ingredients.map((id) => (
          <IngredientChip key={id} id={id} />
        ))}
      </HudGroup>
      <div className="mb-1 h-12 w-px shrink-0 bg-white/20" aria-hidden />
      <HudGroup title="🧪 Potions">
        {potions.map((id) => (
          <PotionChip key={id} id={id} />
        ))}
      </HudGroup>
    </div>
  )
}
