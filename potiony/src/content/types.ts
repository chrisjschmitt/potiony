export type Recyclable = 'paper' | 'plastic' | 'metal'
export type Material = Recyclable | 'trash'

export type IngredientId =
  | 'sunlight_blossom'
  | 'dewdrop_crystal'
  | 'whispering_leaf'
  | 'moonpetal'
  | 'star_dust'

export type PotionId =
  | 'giggle_fizz'
  | 'cozy_warmth'
  | 'super_bouncy'
  | 'moonbeam_sip'
  | 'starry_hug'

export type ZoneId = 'park' | 'beach' | 'forest' | 'meadow'

export type FriendId =
  | 'freddy_fox'
  | 'barnaby_bear'
  | 'pippa_bunny'
  | 'olive_owl'
  | 'nori_newt'

export type Ingredient = {
  id: IngredientId
  name: string
  emoji: string
  /** Tailwind classes for the ingredient chip, so content stays declarative. */
  swatch: string
  hint: string
}

export type Potion = {
  id: PotionId
  name: string
  emoji: string
  /** Cauldron liquid colour once this potion resolves. */
  liquid: string
  swatch: string
  ingredients: IngredientId[]
  minLevel: 1 | 2
}

export type LitterKind = {
  id: string
  name: string
  emoji: string
  material: Material
}

export type Zone = {
  id: ZoneId
  name: string
  emoji: string
  minLevel: 1 | 2
  /** Background gradient, dirty then clean, cross-faded by cleanliness. */
  dirtySky: string
  cleanSky: string
  ground: string
  /** Ingredient harvested from recycling in this zone. Trash does not award this. */
  ingredient: IngredientId
  litterKinds: string[]
  litterCount: number
  trashKinds: string[]
  trashCount: number
  /** Decorative blooms revealed as the zone gets cleaner. */
  bloomEmojis: string[]
}

export type Friend = {
  id: FriendId
  name: string
  emoji: string
  ailment: string
  ailmentEmoji: string
  needs: PotionId
  minLevel: 1 | 2
  /** Shown in the celebration after they are healed. */
  thanks: string
  swatch: string
}

export const MATERIALS: Record<Material, { name: string; emoji: string; swatch: string }> = {
  paper: { name: 'Paper', emoji: '📄', swatch: 'from-sky-400 to-sky-600' },
  plastic: { name: 'Plastic', emoji: '🧴', swatch: 'from-amber-400 to-orange-500' },
  metal: { name: 'Metal', emoji: '🥫', swatch: 'from-slate-300 to-slate-500' },
  trash: { name: 'Trash', emoji: '🗑️', swatch: 'from-stone-500 to-yellow-900' },
}

export const MATERIAL_ORDER: Recyclable[] = ['paper', 'plastic', 'metal']
export const BIN_ORDER_LEVEL2: Material[] = ['paper', 'plastic', 'metal', 'trash']
