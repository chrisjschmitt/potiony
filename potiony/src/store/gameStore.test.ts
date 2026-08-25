import { beforeEach, describe, expect, it } from 'vitest'
import { LITTER_KINDS, STAR_DUST_PER_PERFECT_ZONE, ZONES } from '../content/zones'
import { selectFriendTotal, selectHealedCount, selectPlanetClean, selectTrashCollected, useGame } from './gameStore'

const game = () => useGame.getState()

/** Sorts every remaining piece of litter in a zone. */
const clearZone = (zoneId: 'park' | 'beach' | 'forest' | 'meadow') => {
  for (const item of [...game().zones[zoneId].litter]) {
    game().collectLitter(zoneId, item.id)
  }
}

beforeEach(() => {
  game().newGame()
})

describe('collecting litter', () => {
  it('removes the piece, counts it, and awards the zone ingredient', () => {
    const first = game().zones.park.litter[0]
    const before = game().zones.park.litter.length

    game().collectLitter('park', first.id)

    expect(game().zones.park.litter).toHaveLength(before - 1)
    expect(game().zones.park.collected).toBe(1)
    expect(game().ingredients.sunlight_blossom).toBe(1)
    expect(selectTrashCollected(game())).toBe(1)
    expect(
      game().recycled.paper + game().recycled.plastic + game().recycled.metal,
    ).toBe(1)
  })

  it('awards the ingredient that belongs to each zone', () => {
    game().collectLitter('beach', game().zones.beach.litter[0].id)
    game().collectLitter('forest', game().zones.forest.litter[0].id)

    expect(game().ingredients.dewdrop_crystal).toBe(1)
    expect(game().ingredients.whispering_leaf).toBe(1)
  })

  it('ignores a piece that has already been collected', () => {
    const first = game().zones.park.litter[0]
    game().collectLitter('park', first.id)
    game().collectLitter('park', first.id)

    expect(game().zones.park.collected).toBe(1)
    expect(game().ingredients.sunlight_blossom).toBe(1)
  })
})

describe('cleanliness', () => {
  it('never goes backwards when fresh litter blows in', () => {
    clearZone('park')
    expect(game().zones.park.bestClean).toBe(1)

    game().refillZone('park')

    expect(game().zones.park.litter.length).toBe(ZONES.park.litterCount)
    expect(game().zones.park.bestClean).toBe(1)
  })

  it('averages every zone for the planet meter', () => {
    expect(selectPlanetClean(game())).toBe(0)
    clearZone('park')
    expect(selectPlanetClean(game())).toBeCloseTo(1 / 3)
    clearZone('beach')
    clearZone('forest')
    expect(selectPlanetClean(game())).toBe(1)
  })
})

describe('star dust', () => {
  it('is only awarded for a perfectly clean zone', () => {
    const items = [...game().zones.park.litter]
    for (const item of items.slice(0, -1)) game().collectLitter('park', item.id)
    expect(game().ingredients.star_dust).toBe(0)

    game().collectLitter('park', items[items.length - 1].id)
    expect(game().ingredients.star_dust).toBe(STAR_DUST_PER_PERFECT_ZONE)
  })

  it('keeps trickling in on repeat clears, so Super Bouncy is never unreachable', () => {
    clearZone('park')
    game().refillZone('park')
    clearZone('park')

    expect(game().ingredients.star_dust).toBe(STAR_DUST_PER_PERFECT_ZONE + 1)
    expect(game().zones.park.perfectCount).toBe(2)
  })
})

describe('the cauldron', () => {
  beforeEach(() => {
    useGame.setState({
      ingredients: {
        sunlight_blossom: 1,
        dewdrop_crystal: 1,
        whispering_leaf: 0,
        moonpetal: 0,
        star_dust: 0,
      },
    })
  })

  it('refuses an ingredient the child does not have', () => {
    expect(game().addToCauldron('whispering_leaf')).toBe(false)
    expect(game().cauldron).toEqual([])
  })

  it('refuses to add the same ingredient twice when only one is owned', () => {
    expect(game().addToCauldron('sunlight_blossom')).toBe(true)
    expect(game().addToCauldron('sunlight_blossom')).toBe(false)
    expect(game().cauldron).toEqual(['sunlight_blossom'])
  })

  it('holds at most two ingredients', () => {
    useGame.setState({
      ingredients: {
        sunlight_blossom: 9,
        dewdrop_crystal: 9,
        whispering_leaf: 9,
        moonpetal: 9,
        star_dust: 9,
      },
    })
    expect(game().addToCauldron('sunlight_blossom')).toBe(true)
    expect(game().addToCauldron('dewdrop_crystal')).toBe(true)
    expect(game().addToCauldron('whispering_leaf')).toBe(false)
    expect(game().cauldron).toHaveLength(2)
  })
})

describe('brewing', () => {
  beforeEach(() => {
    useGame.setState({
      ingredients: {
        sunlight_blossom: 2,
        dewdrop_crystal: 1,
        whispering_leaf: 0,
        moonpetal: 0,
        star_dust: 1,
      },
    })
  })

  it('spends the ingredients, adds the potion, and discovers the recipe', () => {
    game().addToCauldron('sunlight_blossom')
    game().addToCauldron('dewdrop_crystal')

    expect(game().brew()).toBe('giggle_fizz')
    expect(game().potions.giggle_fizz).toBe(1)
    expect(game().ingredients.sunlight_blossom).toBe(1)
    expect(game().ingredients.dewdrop_crystal).toBe(0)
    expect(game().discoveredRecipes).toEqual(['giggle_fizz'])
    expect(game().cauldron).toEqual([])
  })

  it('gives the ingredients back when the mix is not a recipe', () => {
    game().addToCauldron('sunlight_blossom')
    game().addToCauldron('star_dust')

    expect(game().brew()).toBeNull()
    expect(game().ingredients.sunlight_blossom).toBe(2)
    expect(game().ingredients.star_dust).toBe(1)
    expect(game().cauldron).toEqual([])
  })

  it('does not list the same recipe twice', () => {
    useGame.setState({
      ingredients: { sunlight_blossom: 2, dewdrop_crystal: 2, whispering_leaf: 0, moonpetal: 0, star_dust: 0 },
    })
    game().addToCauldron('sunlight_blossom')
    game().addToCauldron('dewdrop_crystal')
    game().brew()
    game().addToCauldron('sunlight_blossom')
    game().addToCauldron('dewdrop_crystal')
    game().brew()

    expect(game().potions.giggle_fizz).toBe(2)
    expect(game().discoveredRecipes).toEqual(['giggle_fizz'])
  })
})

describe('helping friends', () => {
  beforeEach(() => {
    useGame.setState({
      potions: { giggle_fizz: 1, cozy_warmth: 1, super_bouncy: 0, moonbeam_sip: 0, starry_hug: 0 },
    })
  })

  it('heals the friend and spends the potion', () => {
    expect(game().givePotion('freddy_fox', 'giggle_fizz')).toBe(true)
    expect(game().friends.freddy_fox.healed).toBe(true)
    expect(game().potions.giggle_fizz).toBe(0)
  })

  it('refuses the wrong potion without spending it', () => {
    expect(game().givePotion('freddy_fox', 'cozy_warmth')).toBe(false)
    expect(game().friends.freddy_fox.healed).toBe(false)
    expect(game().potions.cozy_warmth).toBe(1)
  })

  it('refuses a potion the child does not have', () => {
    expect(game().givePotion('pippa_bunny', 'super_bouncy')).toBe(false)
    expect(game().friends.pippa_bunny.healed).toBe(false)
  })

  it('will not heal the same friend twice', () => {
    game().givePotion('freddy_fox', 'giggle_fizz')
    useGame.setState({ potions: { ...game().potions, giggle_fizz: 1 } })

    expect(game().givePotion('freddy_fox', 'giggle_fizz')).toBe(false)
    expect(game().potions.giggle_fizz).toBe(1)
  })
})

describe('starting over', () => {
  it('wipes progress but keeps the child in the game', () => {
    clearZone('park')
    game().givePotion('freddy_fox', 'giggle_fizz')

    game().newGame()

    expect(selectTrashCollected(game())).toBe(0)
    expect(selectPlanetClean(game())).toBe(0)
    expect(game().ingredients.star_dust).toBe(0)
    expect(game().recycled.paper + game().recycled.plastic + game().recycled.metal).toBe(0)
    expect(game().friends.freddy_fox.healed).toBe(false)
    expect(game().started).toBe(true)
    expect(game().level).toBe(1)
    expect(game().dumped).toBe(0)
  })
})

describe('level 2 trash', () => {
  it('does not scatter trash until Level 2', () => {
    expect(game().level).toBe(1)
    expect(
      game().zones.park.litter.every((item) => LITTER_KINDS[item.kind].material !== 'trash'),
    ).toBe(true)
  })

  it('dumps trash without awarding a potion ingredient', () => {
    game().unlockLevel2()
    const trashItem = game().zones.park.litter.find(
      (item) => LITTER_KINDS[item.kind].material === 'trash',
    )
    expect(trashItem).toBeTruthy()
    const blossom = game().ingredients.sunlight_blossom

    game().collectLitter('park', trashItem!.id)

    expect(game().dumped).toBe(1)
    expect(game().ingredients.sunlight_blossom).toBe(blossom)
    expect(game().recycled.paper + game().recycled.plastic + game().recycled.metal).toBe(0)
  })

  it('unlocks after the first three friends are helped', () => {
    useGame.setState({
      potions: {
        giggle_fizz: 1,
        cozy_warmth: 1,
        super_bouncy: 1,
        moonbeam_sip: 0,
        starry_hug: 0,
      },
    })
    game().givePotion('freddy_fox', 'giggle_fizz')
    game().givePotion('barnaby_bear', 'cozy_warmth')
    game().givePotion('pippa_bunny', 'super_bouncy')

    expect(game().level).toBe(2)
    expect(game().levelUpOpen).toBe(true)
    expect(selectHealedCount(game())).toBe(3)
    expect(selectFriendTotal(game())).toBe(5)
    expect(
      game().zones.park.litter.some((item) => LITTER_KINDS[item.kind].material === 'trash'),
    ).toBe(true)
  })

  it('refills a Level 2 zone with trash as well as recyclables', () => {
    game().unlockLevel2()
    game().refillZone('park')
    const litter = game().zones.park.litter
    expect(litter).toHaveLength(ZONES.park.litterCount + ZONES.park.trashCount)
    expect(litter.some((item) => LITTER_KINDS[item.kind].material === 'trash')).toBe(true)
  })
})
