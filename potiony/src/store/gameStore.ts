import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { FriendId, IngredientId, PotionId, ZoneId } from '../content/types'
import { LITTER_KINDS, STAR_DUST_PER_PERFECT_ZONE, ZONES } from '../content/zones'
import { FRIENDS } from '../content/friends'
import { MAX_CAULDRON_SLOTS, matchRecipe } from '../content/recipes'
import { INGREDIENTS } from '../content/ingredients'
import { SAVE_KEY, SAVE_VERSION, createNewSave, makeLitter, migrateSave } from './save'
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
}

type Actions = {
  startGame: () => void
  newGame: () => void
  setScene: (scene: SceneId) => void
  setZone: (zone: ZoneId) => void
  toggleDrawer: (open?: boolean) => void
  showToast: (emoji: string, text: string) => void
  dismissToast: (id: number) => void

  collectLitter: (zoneId: ZoneId, litterId: string) => void
  refillZone: (zoneId: ZoneId) => void

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

      collectLitter: (zoneId, litterId) => {
        const zone = get().zones[zoneId]
        if (!zone.litter.some((l) => l.id === litterId)) return

        const litter = zone.litter.filter((l) => l.id !== litterId)
        const cleanNow = 1 - litter.length / ZONES[zoneId].litterCount
        const perfect = litter.length === 0
        const reward = ZONES[zoneId].ingredient

        set((s) => {
          const starDust = perfect
            ? zone.perfectCount === 0
              ? STAR_DUST_PER_PERFECT_ZONE
              : 1
            : 0
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
            ingredients: {
              ...s.ingredients,
              [reward]: s.ingredients[reward] + 1,
              star_dust: s.ingredients.star_dust + starDust,
            },
          }
        })

        if (perfect) {
          get().showToast('✨', `${ZONES[zoneId].name} is sparkling clean! You found Star Dust!`)
        }
      },

      refillZone: (zoneId) =>
        set((s) => ({
          zones: {
            ...s.zones,
            [zoneId]: { ...s.zones[zoneId], litter: makeLitter(zoneId) },
          },
        })),

      addToCauldron: (ingredient) => {
        const { cauldron, ingredients } = get()
        if (cauldron.length >= MAX_CAULDRON_SLOTS) return false
        const alreadyInPot = cauldron.filter((i) => i === ingredient).length
        if (ingredients[ingredient] - alreadyInPot <= 0) return false
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
            potions: { ...s.potions, [potion]: s.potions[potion] + 1 },
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
        if (state.friends[friendId].healed) return false
        if (FRIENDS[friendId].needs !== potion) return false
        if (state.potions[potion] <= 0) return false

        set((s) => ({
          potions: { ...s.potions, [potion]: s.potions[potion] - 1 },
          friends: { ...s.friends, [friendId]: { healed: true } },
        }))
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
        zones: s.zones,
        ingredients: s.ingredients,
        potions: s.potions,
        discoveredRecipes: s.discoveredRecipes,
        friends: s.friends,
      }) as unknown as GameStore,
    },
  ),
)

/** Average of every zone's best cleanliness: the Planet Cleanliness Meter. */
export const selectPlanetClean = (s: GameStore) => {
  const zones = Object.values(s.zones)
  return zones.reduce((sum, z) => sum + z.bestClean, 0) / zones.length
}

export const selectTrashCollected = (s: GameStore) =>
  Object.values(s.zones).reduce((sum, z) => sum + z.collected, 0)

export const selectTotalIngredients = (s: GameStore) =>
  Object.values(s.ingredients).reduce((a, b) => a + b, 0)

export const selectTotalPotions = (s: GameStore) =>
  Object.values(s.potions).reduce((a, b) => a + b, 0)

export const selectHealedCount = (s: GameStore) =>
  Object.values(s.friends).filter((f) => f.healed).length

export const selectZoneClean = (s: GameStore, zoneId: ZoneId) => s.zones[zoneId].bestClean

/** Ingredient count minus whatever is already sitting in the cauldron. */
export const selectAvailable = (s: GameStore, ingredient: IngredientId) =>
  s.ingredients[ingredient] - s.cauldron.filter((i) => i === ingredient).length

export const litterKindOf = (kindId: string) => LITTER_KINDS[kindId]
export const ingredientOf = (id: IngredientId) => INGREDIENTS[id]
