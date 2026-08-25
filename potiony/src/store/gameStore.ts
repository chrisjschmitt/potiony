import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { FriendId, IngredientId, PotionId, Recyclable, ZoneId } from '../content/types'
import {
  LEVEL1_ZONES,
  LITTER_KINDS,
  STAR_DUST_PER_PERFECT_ZONE,
  ZONES,
  zoneCapacity,
} from '../content/zones'
import { FRIENDS, LEVEL1_FRIENDS, visibleFriends } from '../content/friends'
import { MAX_CAULDRON_SLOTS, matchRecipe } from '../content/recipes'
import { INGREDIENTS } from '../content/ingredients'
import {
  SAVE_KEY,
  SAVE_VERSION,
  createNewSave,
  makeLitter,
  migrateSave,
  withTrashScattered,
} from './save'
import type { SaveData } from './save'
import { safeStorage } from './storage'

export type SceneId = 'clean' | 'lab' | 'town' | 'book'

export type Toast = { id: number; emoji: string; text: string }

type Ephemeral = {
  activeScene: SceneId
  activeZone: ZoneId
  cauldron: IngredientId[]
  drawerOpen: boolean
  toast: Toast | null
  levelUpOpen: boolean
}

type Actions = {
  startGame: () => void
  newGame: () => void
  setScene: (scene: SceneId) => void
  setZone: (zone: ZoneId) => void
  toggleDrawer: (open?: boolean) => void
  showToast: (emoji: string, text: string) => void
  dismissToast: (id: number) => void
  dismissLevelUp: () => void

  collectLitter: (zoneId: ZoneId, litterId: string) => void
  refillZone: (zoneId: ZoneId) => void
  unlockLevel2: () => void

  addToCauldron: (ingredient: IngredientId) => boolean
  emptyCauldron: () => void
  brew: () => PotionId | null

  givePotion: (friendId: FriendId, potion: PotionId) => boolean
}

export type GameStore = SaveData & Ephemeral & Actions

const ephemeral = (): Ephemeral => ({
  activeScene: 'clean',
  activeZone: 'park',
  cauldron: [],
  drawerOpen: false,
  toast: null,
  levelUpOpen: false,
})

let toastId = 0

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createNewSave(),
      ...ephemeral(),

      startGame: () => set({ started: true }),

      newGame: () =>
        set({ ...createNewSave(), ...ephemeral(), started: true, startedAt: Date.now() }),

      setScene: (activeScene) => set({ activeScene, drawerOpen: false }),
      setZone: (activeZone) => set({ activeZone }),
      toggleDrawer: (open) => set((s) => ({ drawerOpen: open ?? !s.drawerOpen })),

      showToast: (emoji, text) => set({ toast: { id: ++toastId, emoji, text } }),
      dismissToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : {})),
      dismissLevelUp: () => set({ levelUpOpen: false }),

      collectLitter: (zoneId, litterId) => {
        const state = get()
        const zone = state.zones[zoneId]
        const item = zone.litter.find((l) => l.id === litterId)
        if (!item) return

        const kind = LITTER_KINDS[item.kind]
        const litter = zone.litter.filter((l) => l.id !== litterId)
        const total = zoneCapacity(zoneId, state.level)
        const cleanNow = 1 - litter.length / total
        const perfect = litter.length === 0
        const isTrash = kind.material === 'trash'
        const reward = ZONES[zoneId].ingredient

        set((s) => {
          const starDust = perfect
            ? zone.perfectCount === 0
              ? STAR_DUST_PER_PERFECT_ZONE
              : 1
            : 0
          const ingredients = { ...s.ingredients }
          if (!isTrash) ingredients[reward] += 1
          if (starDust) ingredients.star_dust += starDust
          return {
            zones: {
              ...s.zones,
              [zoneId]: {
                litter,
                collected: zone.collected + 1,
                bestClean: Math.max(zone.bestClean, cleanNow),
                perfectCount: zone.perfectCount + (perfect ? 1 : 0),
              },
            },
            recycled: isTrash
              ? s.recycled
              : {
                  ...s.recycled,
                  [kind.material as Recyclable]: s.recycled[kind.material as Recyclable] + 1,
                },
            dumped: s.dumped + (isTrash ? 1 : 0),
            ingredients,
          }
        })

        if (perfect) {
          get().showToast(
            '✨',
            state.level >= 2
              ? `${ZONES[zoneId].name} is sparkling — recyclables and trash all gone! You found Star Dust!`
              : `${ZONES[zoneId].name} is sparkling clean! You found Star Dust!`,
          )
        }
      },

      refillZone: (zoneId) =>
        set((s) => ({
          zones: {
            ...s.zones,
            [zoneId]: { ...s.zones[zoneId], litter: makeLitter(zoneId, s.level >= 2) },
          },
        })),

      unlockLevel2: () => {
        if (get().level >= 2) return
        set((s) => ({
          level: 2,
          levelUpOpen: true,
          zones: withTrashScattered(s.zones),
        }))
        get().showToast('🗑️', 'Oh no — some of this cannot be recycled!')
      },

      addToCauldron: (ingredient) => {
        const { cauldron, ingredients } = get()
        if (cauldron.length >= MAX_CAULDRON_SLOTS) return false
        const alreadyInPot = cauldron.filter((i) => i === ingredient).length
        if ((ingredients[ingredient] ?? 0) - alreadyInPot <= 0) return false
        set({ cauldron: [...cauldron, ingredient] })
        return true
      },

      emptyCauldron: () => set({ cauldron: [] }),

      brew: () => {
        const { cauldron } = get()
        const potion = matchRecipe(cauldron)
        if (!potion) {
          set({ cauldron: [] })
          return null
        }

        set((s) => {
          const ingredients = { ...s.ingredients }
          for (const ing of cauldron) ingredients[ing] = Math.max(0, ingredients[ing] - 1)
          return {
            ingredients,
            potions: { ...s.potions, [potion]: (s.potions[potion] ?? 0) + 1 },
            discoveredRecipes: s.discoveredRecipes.includes(potion)
              ? s.discoveredRecipes
              : [...s.discoveredRecipes, potion],
            cauldron: [],
          }
        })
        return potion
      },

      givePotion: (friendId, potion) => {
        const state = get()
        if (state.friends[friendId]?.healed) return false
        if (FRIENDS[friendId].needs !== potion) return false
        if ((state.potions[potion] ?? 0) <= 0) return false

        let unlocked = false
        set((s) => {
          const friends = { ...s.friends, [friendId]: { healed: true } }
          const l1Done = LEVEL1_FRIENDS.every((id) => friends[id]?.healed)
          const shouldUnlock = l1Done && s.level < 2
          if (shouldUnlock) unlocked = true
          return {
            potions: { ...s.potions, [potion]: s.potions[potion] - 1 },
            friends,
            ...(shouldUnlock
              ? { level: 2 as const, levelUpOpen: true, zones: withTrashScattered(s.zones) }
              : {}),
          }
        })
        if (unlocked) get().showToast('🗑️', 'Oh no — some of this cannot be recycled!')
        return true
      },
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persisted) => migrateSave(persisted) as GameStore,
      // Only the save data is written to disk; scene and cauldron reset each launch.
      // `started` is deliberately left out so every launch shows the title screen,
      // where the child can choose "Keep Playing" or start a new game herself.
      partialize: (s) => ({
        saveVersion: s.saveVersion,
        startedAt: s.startedAt,
        level: s.level,
        zones: s.zones,
        ingredients: s.ingredients,
        potions: s.potions,
        recycled: s.recycled,
        dumped: s.dumped,
        discoveredRecipes: s.discoveredRecipes,
        friends: s.friends,
      }) as unknown as GameStore,
    },
  ),
)

/** Average of Level 1 zones only, so unlocking Level 2 never shrinks the meter. */
export const selectPlanetClean = (s: GameStore) => {
  const zones = LEVEL1_ZONES.map((id) => s.zones[id])
  return zones.reduce((sum, z) => sum + z.bestClean, 0) / zones.length
}

export const selectTrashCollected = (s: GameStore) =>
  Object.values(s.zones).reduce((sum, z) => sum + z.collected, 0)

export const selectTotalIngredients = (s: GameStore) =>
  Object.values(s.ingredients).reduce((a, b) => a + b, 0)

export const selectTotalPotions = (s: GameStore) =>
  Object.values(s.potions).reduce((a, b) => a + b, 0)

export const selectHealedCount = (s: GameStore) =>
  visibleFriends(s.level).filter((id) => s.friends[id].healed).length

export const selectFriendTotal = (s: GameStore) => visibleFriends(s.level).length

export const selectZoneClean = (s: GameStore, zoneId: ZoneId) => s.zones[zoneId].bestClean

export const selectZoneTidyNow = (s: GameStore, zoneId: ZoneId) => {
  const total = zoneCapacity(zoneId, s.level)
  return 1 - s.zones[zoneId].litter.length / total
}

/** Ingredient count minus whatever is already sitting in the cauldron. */
export const selectAvailable = (s: GameStore, ingredient: IngredientId) =>
  (s.ingredients[ingredient] ?? 0) - s.cauldron.filter((i) => i === ingredient).length

export const litterKindOf = (kindId: string) => LITTER_KINDS[kindId]
export const ingredientOf = (id: IngredientId) => INGREDIENTS[id]
