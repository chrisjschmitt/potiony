import { INGREDIENT_ORDER } from '../content/ingredients'
import { POTION_ORDER } from '../content/recipes'
import { FRIEND_ORDER } from '../content/friends'
import { ZONE_ORDER, ZONES } from '../content/zones'
import type { FriendId, IngredientId, PotionId, ZoneId } from '../content/types'

export const SAVE_VERSION = 1
export const SAVE_KEY = 'potiony.save.v1'

export type LitterInstance = {
  id: string
  kind: string
  /** Percentage of the play area, so the layout survives any iPad size. */
  x: number
  y: number
  scale: number
  /** Staggers the float animation so items do not bob in unison. */
  delay: number
}

export type ZoneState = {
  litter: LitterInstance[]
  /** Lifetime pieces of litter sorted in this zone. */
  collected: number
  /** High-water mark of cleanliness, 0..1. Never decreases, so nature stays bloomed. */
  bestClean: number
  perfectCount: number
}

export type SaveData = {
  saveVersion: number
  startedAt: number
  started: boolean
  zones: Record<ZoneId, ZoneState>
  ingredients: Record<IngredientId, number>
  potions: Record<PotionId, number>
  discoveredRecipes: PotionId[]
  friends: Record<FriendId, { healed: boolean }>
}

let idCounter = 0
const nextId = () => `l${Date.now().toString(36)}${(idCounter++).toString(36)}`

export function makeLitter(zoneId: ZoneId, count?: number): LitterInstance[] {
  const zone = ZONES[zoneId]
  const total = count ?? zone.litterCount
  return Array.from({ length: total }, (_, i) => ({
    id: nextId(),
    kind: zone.litterKinds[i % zone.litterKinds.length],
    x: 8 + Math.random() * 84,
    y: 18 + Math.random() * 58,
    scale: 0.9 + Math.random() * 0.35,
    delay: Math.random() * 3,
  }))
}

function emptyCounts<T extends string>(keys: T[]): Record<T, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>
}

export function createNewSave(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    startedAt: Date.now(),
    started: false,
    zones: Object.fromEntries(
      ZONE_ORDER.map((id) => [
        id,
        { litter: makeLitter(id), collected: 0, bestClean: 0, perfectCount: 0 } satisfies ZoneState,
      ]),
    ) as Record<ZoneId, ZoneState>,
    ingredients: emptyCounts(INGREDIENT_ORDER),
    potions: emptyCounts(POTION_ORDER),
    discoveredRecipes: [],
    friends: Object.fromEntries(FRIEND_ORDER.map((id) => [id, { healed: false }])) as Record<
      FriendId,
      { healed: boolean }
    >,
  }
}

/**
 * Fills in anything a newer content release added, so an old save from a child's
 * iPad never crashes the app after an update.
 */
export function migrateSave(persisted: unknown): SaveData {
  const fresh = createNewSave()
  if (!persisted || typeof persisted !== 'object') return fresh
  const old = persisted as Partial<SaveData>

  return {
    ...fresh,
    ...old,
    saveVersion: SAVE_VERSION,
    zones: Object.fromEntries(
      ZONE_ORDER.map((id) => [id, { ...fresh.zones[id], ...old.zones?.[id] }]),
    ) as Record<ZoneId, ZoneState>,
    ingredients: { ...fresh.ingredients, ...old.ingredients },
    potions: { ...fresh.potions, ...old.potions },
    discoveredRecipes: (old.discoveredRecipes ?? []).filter((id) => POTION_ORDER.includes(id)),
    friends: Object.fromEntries(
      FRIEND_ORDER.map((id) => [id, { ...fresh.friends[id], ...old.friends?.[id] }]),
    ) as Record<FriendId, { healed: boolean }>,
  }
}
