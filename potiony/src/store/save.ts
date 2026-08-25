import { INGREDIENT_ORDER } from '../content/ingredients'
import { POTION_ORDER } from '../content/recipes'
import { FRIEND_ORDER, LEVEL1_FRIENDS } from '../content/friends'
import { ZONE_ORDER, ZONES } from '../content/zones'
import { MATERIAL_ORDER } from '../content/types'
import type { FriendId, IngredientId, PotionId, Recyclable, ZoneId } from '../content/types'
import { LITTER_KINDS } from '../content/zones'

export const SAVE_VERSION = 4
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
  /** 1 = recycle only. 2 = recycle plus non-recyclable trash. */
  level: 1 | 2
  zones: Record<ZoneId, ZoneState>
  ingredients: Record<IngredientId, number>
  potions: Record<PotionId, number>
  /** Lifetime recyclables sorted. */
  recycled: Record<Recyclable, number>
  /** Lifetime non-recyclable trash dumped. */
  dumped: number
  discoveredRecipes: PotionId[]
  friends: Record<FriendId, { healed: boolean }>
}

let idCounter = 0
const nextId = () => `l${Date.now().toString(36)}${(idCounter++).toString(36)}`

const LITTER_KIND_ALIASES: Record<string, string> = {
  broken_toy: 'toothbrush',
}

function remapLitterKind(kind: string): string {
  return LITTER_KIND_ALIASES[kind] ?? kind
}

function scatter(kind: string): LitterInstance {
  return {
    id: nextId(),
    kind: remapLitterKind(kind),
    x: 8 + Math.random() * 84,
    y: 18 + Math.random() * 58,
    scale: 0.9 + Math.random() * 0.35,
    delay: Math.random() * 3,
  }
}

export function makeRecyclables(zoneId: ZoneId): LitterInstance[] {
  const zone = ZONES[zoneId]
  return Array.from({ length: zone.litterCount }, (_, i) =>
    scatter(zone.litterKinds[i % zone.litterKinds.length]),
  )
}

export function makeTrash(zoneId: ZoneId): LitterInstance[] {
  const zone = ZONES[zoneId]
  return Array.from({ length: zone.trashCount }, (_, i) =>
    scatter(zone.trashKinds[i % zone.trashKinds.length]),
  )
}

export function makeLitter(zoneId: ZoneId, includeTrash = false): LitterInstance[] {
  return includeTrash ? [...makeRecyclables(zoneId), ...makeTrash(zoneId)] : makeRecyclables(zoneId)
}

export function zoneHasTrash(litter: LitterInstance[]): boolean {
  return litter.some((item) => LITTER_KINDS[remapLitterKind(item.kind)]?.material === 'trash')
}

function emptyCounts<T extends string>(keys: T[]): Record<T, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>
}

export function createNewSave(): SaveData {
  return {
    saveVersion: SAVE_VERSION,
    startedAt: Date.now(),
    started: false,
    level: 1,
    zones: Object.fromEntries(
      ZONE_ORDER.map((id) => [
        id,
        { litter: makeLitter(id, false), collected: 0, bestClean: 0, perfectCount: 0 } satisfies ZoneState,
      ]),
    ) as Record<ZoneId, ZoneState>,
    ingredients: emptyCounts(INGREDIENT_ORDER),
    potions: emptyCounts(POTION_ORDER),
    recycled: emptyCounts(MATERIAL_ORDER),
    dumped: 0,
    discoveredRecipes: [],
    friends: Object.fromEntries(FRIEND_ORDER.map((id) => [id, { healed: false }])) as Record<
      FriendId,
      { healed: boolean }
    >,
  }
}

export function withTrashScattered(zones: Record<ZoneId, ZoneState>): Record<ZoneId, ZoneState> {
  return Object.fromEntries(
    ZONE_ORDER.map((id) => {
      const zone = zones[id] ?? {
        litter: makeLitter(id, false),
        collected: 0,
        bestClean: 0,
        perfectCount: 0,
      }
      return [
        id,
        zoneHasTrash(zone.litter) ? zone : { ...zone, litter: [...zone.litter, ...makeTrash(id)] },
      ]
    }),
  ) as Record<ZoneId, ZoneState>
}

/**
 * Fills in anything a newer content release added, so an old save from a child's
 * iPad never crashes the app after an update.
 */
export function migrateSave(persisted: unknown): SaveData {
  const fresh = createNewSave()
  if (!persisted || typeof persisted !== 'object') return fresh
  const old = persisted as Partial<SaveData>

  const friends = Object.fromEntries(
    FRIEND_ORDER.map((id) => [id, { ...fresh.friends[id], ...old.friends?.[id] }]),
  ) as Record<FriendId, { healed: boolean }>

  const l1Complete = LEVEL1_FRIENDS.every((id) => friends[id].healed)
  const level: 1 | 2 = old.level === 2 || l1Complete ? 2 : 1

  let zones = Object.fromEntries(
    ZONE_ORDER.map((id) => {
      const zone = { ...fresh.zones[id], ...old.zones?.[id] }
      return [
        id,
        {
          ...zone,
          litter: (zone.litter ?? []).map((item) => ({
            ...item,
            kind: remapLitterKind(item.kind),
          })),
        },
      ]
    }),
  ) as Record<ZoneId, ZoneState>
  if (level >= 2) zones = withTrashScattered(zones)

  return {
    ...fresh,
    ...old,
    saveVersion: SAVE_VERSION,
    level,
    zones,
    ingredients: { ...fresh.ingredients, ...old.ingredients },
    potions: { ...fresh.potions, ...old.potions },
    recycled: { ...fresh.recycled, ...old.recycled },
    dumped: old.dumped ?? 0,
    discoveredRecipes: (old.discoveredRecipes ?? []).filter((id) => POTION_ORDER.includes(id)),
    friends,
  }
}
