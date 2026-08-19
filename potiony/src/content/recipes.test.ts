import { describe, expect, it } from 'vitest'
import { POTIONS, isPartialRecipe, matchRecipe } from './recipes'

describe('matchRecipe', () => {
  it('matches a recipe regardless of the order ingredients were dropped', () => {
    expect(matchRecipe(['sunlight_blossom', 'dewdrop_crystal'])).toBe('giggle_fizz')
    expect(matchRecipe(['dewdrop_crystal', 'sunlight_blossom'])).toBe('giggle_fizz')
  })

  it('matches every recipe in the book', () => {
    for (const potion of Object.values(POTIONS)) {
      expect(matchRecipe(potion.ingredients)).toBe(potion.id)
    }
  })

  it('needs at least two ingredients', () => {
    expect(matchRecipe([])).toBeNull()
    expect(matchRecipe(['sunlight_blossom'])).toBeNull()
  })

  it('returns null for a mix that is not a recipe', () => {
    expect(matchRecipe(['sunlight_blossom', 'sunlight_blossom'])).toBeNull()
    expect(matchRecipe(['whispering_leaf', 'star_dust'])).toBeNull()
    expect(matchRecipe(['sunlight_blossom', 'dewdrop_crystal', 'star_dust'])).toBeNull()
  })
})

describe('isPartialRecipe', () => {
  it('treats an empty pot and a valid first ingredient as still promising', () => {
    expect(isPartialRecipe([])).toBe(true)
    expect(isPartialRecipe(['star_dust'])).toBe(true)
  })

  it('recognises a complete recipe as still valid', () => {
    expect(isPartialRecipe(['sunlight_blossom', 'dewdrop_crystal'])).toBe(true)
  })

  it('flags a mix that can no longer become anything', () => {
    expect(isPartialRecipe(['whispering_leaf', 'star_dust'])).toBe(false)
    expect(isPartialRecipe(['star_dust', 'star_dust'])).toBe(false)
  })
})
