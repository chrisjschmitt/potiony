import { describe, expect, it } from 'vitest'
import { SAVE_KEY, SAVE_VERSION, createNewSave, makeLitter, migrateSave } from './save'
import { ZONES, ZONE_ORDER } from '../content/zones'
import { useGame } from './gameStore'
import { safeStorage } from './storage'

describe('a new save', () => {
  it('starts every zone full of litter and every counter at zero', () => {
    const save = createNewSave()
    for (const id of ZONE_ORDER) {
      expect(save.zones[id].litter).toHaveLength(ZONES[id].litterCount)
      expect(save.zones[id].bestClean).toBe(0)
    }
    expect(Object.values(save.ingredients).every((n) => n === 0)).toBe(true)
    expect(Object.values(save.potions).every((n) => n === 0)).toBe(true)
    expect(Object.values(save.recycled).every((n) => n === 0)).toBe(true)
    expect(save.discoveredRecipes).toEqual([])
    expect(save.started).toBe(false)
    expect(save.level).toBe(1)
    expect(save.dumped).toBe(0)
  })

  it('gives every piece of litter a unique id and an on-screen position', () => {
    const litter = makeLitter('park')
    expect(new Set(litter.map((l) => l.id)).size).toBe(litter.length)
    for (const item of litter) {
      expect(item.x).toBeGreaterThan(0)
      expect(item.x).toBeLessThan(100)
      expect(item.y).toBeGreaterThan(0)
      expect(item.y).toBeLessThan(100)
      expect(ZONES.park.litterKinds).toContain(item.kind)
    }
  })
})

describe('migrating an older save', () => {
  it('keeps the progress a child already made', () => {
    const old = createNewSave()
    old.ingredients.sunlight_blossom = 4
    old.potions.giggle_fizz = 2
    old.discoveredRecipes = ['giggle_fizz']
    old.friends.freddy_fox.healed = true
    old.zones.park.bestClean = 0.5
    old.zones.park.collected = 5

    const migrated = migrateSave(old)

    expect(migrated.ingredients.sunlight_blossom).toBe(4)
    expect(migrated.potions.giggle_fizz).toBe(2)
    expect(migrated.discoveredRecipes).toEqual(['giggle_fizz'])
    expect(migrated.friends.freddy_fox.healed).toBe(true)
    expect(migrated.zones.park.bestClean).toBe(0.5)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
  })

  it('fills in content that did not exist when the save was written', () => {
    const ancient = {
      saveVersion: 0,
      ingredients: { sunlight_blossom: 3 },
      zones: { park: { collected: 2 } },
    }

    const migrated = migrateSave(ancient)

    expect(migrated.ingredients.sunlight_blossom).toBe(3)
    expect(migrated.ingredients.star_dust).toBe(0)
    expect(migrated.zones.park.collected).toBe(2)
    expect(migrated.zones.beach.litter).toHaveLength(ZONES.beach.litterCount)
    expect(migrated.recycled.paper).toBe(0)
    expect(migrated.friends.pippa_bunny.healed).toBe(false)
    expect(migrated.level).toBe(1)
    expect(migrated.dumped).toBe(0)
    expect(migrated.friends.olive_owl.healed).toBe(false)
  })

  it('drops recipes that no longer exist instead of crashing', () => {
    const migrated = migrateSave({ discoveredRecipes: ['giggle_fizz', 'ancient_brew'] })
    expect(migrated.discoveredRecipes).toEqual(['giggle_fizz'])
  })

  it('opens Level 2 when an old save already helped the first three friends', () => {
    const old = createNewSave()
    old.friends.freddy_fox.healed = true
    old.friends.barnaby_bear.healed = true
    old.friends.pippa_bunny.healed = true
    old.level = 1

    const migrated = migrateSave(old)

    expect(migrated.level).toBe(2)
    expect(
      migrated.zones.park.litter.some((item) => item.kind === 'pizza_box' || item.kind === 'napkin' || item.kind === 'toothbrush'),
    ).toBe(true)
  })

  it('turns leftover teddy-bear trash into an old toothbrush', () => {
    const old = createNewSave()
    old.level = 2
    old.zones.park.litter = [
      {
        id: 'legacy-teddy',
        kind: 'broken_toy',
        x: 40,
        y: 40,
        scale: 1,
        delay: 0,
      },
    ]

    const migrated = migrateSave(old)

    expect(migrated.zones.park.litter.some((item) => item.kind === 'broken_toy')).toBe(false)
    expect(migrated.zones.park.litter.some((item) => item.kind === 'toothbrush')).toBe(true)
  })

  it('falls back to a fresh save when the stored data is nonsense', () => {
    expect(migrateSave(null).started).toBe(false)
    expect(migrateSave('corrupted').zones.park.litter).toHaveLength(ZONES.park.litterCount)
  })
})

describe('closing and reopening the game', () => {
  it('writes progress to storage and reads it back unchanged', () => {
    const game = useGame.getState()
    game.newGame()

    const item = useGame.getState().zones.forest.litter[0]
    game.collectLitter('forest', item.id)
    useGame.setState({ potions: { giggle_fizz: 1, cozy_warmth: 0, super_bouncy: 0, moonbeam_sip: 0, starry_hug: 0 } })
    game.givePotion('freddy_fox', 'giggle_fizz')

    // What a reopened app would find on disk.
    const written = safeStorage.getItem(SAVE_KEY)
    expect(written).toBeTruthy()
    const restored = migrateSave(JSON.parse(written!).state)

    expect(restored.zones.forest.collected).toBe(1)
    expect(restored.zones.forest.litter).toHaveLength(ZONES.forest.litterCount - 1)
    expect(restored.ingredients.whispering_leaf).toBe(1)
    expect(restored.recycled.paper + restored.recycled.plastic + restored.recycled.metal).toBe(1)
    expect(restored.friends.freddy_fox.healed).toBe(true)
    // Not persisted: every launch returns to the title screen.
    expect(restored.started).toBe(false)
  })

  it('does not persist the transient scene or cauldron', () => {
    const game = useGame.getState()
    game.newGame()
    useGame.setState({
      ingredients: { sunlight_blossom: 1, dewdrop_crystal: 1, whispering_leaf: 0, moonpetal: 0, star_dust: 0 },
    })
    game.addToCauldron('sunlight_blossom')
    game.setScene('lab')

    const persisted = JSON.parse(safeStorage.getItem(SAVE_KEY)!).state
    expect(persisted.cauldron).toBeUndefined()
    expect(persisted.activeScene).toBeUndefined()
    expect(persisted.ingredients.sunlight_blossom).toBe(1)
  })
})
