import type { IngredientId, Potion, PotionId } from './types'

export const POTIONS: Record<PotionId, Potion> = {
  giggle_fizz: {
    id: 'giggle_fizz',
    name: 'Giggle Fizz Potion',
    emoji: '🫧',
    liquid: '#f472b6',
    swatch: 'from-pink-400 to-fuchsia-500',
    ingredients: ['sunlight_blossom', 'dewdrop_crystal'],
    minLevel: 1,
  },
  cozy_warmth: {
    id: 'cozy_warmth',
    name: 'Cozy Warmth Potion',
    emoji: '🍯',
    liquid: '#f59e0b',
    swatch: 'from-amber-300 to-orange-500',
    ingredients: ['whispering_leaf', 'sunlight_blossom'],
    minLevel: 1,
  },
  super_bouncy: {
    id: 'super_bouncy',
    name: 'Super Bouncy Potion',
    emoji: '🏀',
    liquid: '#22d3ee',
    swatch: 'from-cyan-300 to-teal-500',
    ingredients: ['dewdrop_crystal', 'star_dust'],
    minLevel: 1,
  },
  moonbeam_sip: {
    id: 'moonbeam_sip',
    name: 'Moonbeam Sip',
    emoji: '🌛',
    liquid: '#a78bfa',
    swatch: 'from-indigo-300 to-violet-600',
    ingredients: ['moonpetal', 'dewdrop_crystal'],
    minLevel: 2,
  },
  starry_hug: {
    id: 'starry_hug',
    name: 'Starry Hug Potion',
    emoji: '🌟',
    liquid: '#818cf8',
    swatch: 'from-violet-400 to-blue-500',
    ingredients: ['moonpetal', 'whispering_leaf'],
    minLevel: 2,
  },
}

export const POTION_ORDER: PotionId[] = [
  'giggle_fizz',
  'cozy_warmth',
  'super_bouncy',
  'moonbeam_sip',
  'starry_hug',
]

export function visiblePotions(level: number): PotionId[] {
  return POTION_ORDER.filter((id) => POTIONS[id].minLevel <= level)
}

export const MAX_CAULDRON_SLOTS = 2

const asKey = (ids: IngredientId[]) => [...ids].sort().join('+')

const RECIPE_LOOKUP: Record<string, PotionId> = Object.fromEntries(
  POTION_ORDER.map((id) => [asKey(POTIONS[id].ingredients), id]),
)

/**
 * Order-independent match, so a child can drop ingredients in any sequence.
 * Works for recipes of any length, not just pairs.
 */
export function matchRecipe(cauldron: IngredientId[]): PotionId | null {
  if (cauldron.length < 2) return null
  return RECIPE_LOOKUP[asKey(cauldron)] ?? null
}

/** True while the current cauldron contents could still become a real potion. */
export function isPartialRecipe(cauldron: IngredientId[]): boolean {
  if (cauldron.length === 0) return true
  return POTION_ORDER.some((id) => {
    const remaining = [...POTIONS[id].ingredients]
    return cauldron.every((ing) => {
      const at = remaining.indexOf(ing)
      if (at === -1) return false
      remaining.splice(at, 1)
      return true
    })
  })
}
