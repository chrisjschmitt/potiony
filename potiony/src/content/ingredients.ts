import type { Ingredient, IngredientId } from './types'

export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  sunlight_blossom: {
    id: 'sunlight_blossom',
    name: 'Sunlight Blossom',
    emoji: '🌸',
    swatch: 'from-pink-400 to-rose-500',
    hint: 'Blooms in Sunflower Park',
  },
  dewdrop_crystal: {
    id: 'dewdrop_crystal',
    name: 'Dewdrop Crystal',
    emoji: '💧',
    swatch: 'from-cyan-300 to-sky-500',
    hint: 'Sparkles on Sparkle Beach',
  },
  whispering_leaf: {
    id: 'whispering_leaf',
    name: 'Whispering Leaf',
    emoji: '🍃',
    swatch: 'from-lime-400 to-emerald-500',
    hint: 'Grows in the Enchanted Forest',
  },
  moonpetal: {
    id: 'moonpetal',
    name: 'Moonpetal',
    emoji: '🌙',
    swatch: 'from-indigo-300 to-violet-600',
    hint: 'Glows in Moonlit Meadow',
  },
  star_dust: {
    id: 'star_dust',
    name: 'Star Dust',
    emoji: '✨',
    swatch: 'from-yellow-300 to-amber-500',
    hint: 'A bonus for making a place 100% clean!',
  },
}

export const INGREDIENT_ORDER: IngredientId[] = [
  'sunlight_blossom',
  'dewdrop_crystal',
  'whispering_leaf',
  'moonpetal',
  'star_dust',
]

export function visibleIngredients(level: number): IngredientId[] {
  return INGREDIENT_ORDER.filter((id) => id !== 'moonpetal' || level >= 2)
}
