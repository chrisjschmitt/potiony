import type { LitterKind, Zone, ZoneId } from './types'

export const LITTER_KINDS: Record<string, LitterKind> = {
  newspaper: { id: 'newspaper', name: 'Newspaper', emoji: '📰', material: 'paper' },
  crumpled_paper: { id: 'crumpled_paper', name: 'Crumpled Paper', emoji: '📄', material: 'paper' },
  box: { id: 'box', name: 'Cardboard Box', emoji: '📦', material: 'paper' },
  bottle: { id: 'bottle', name: 'Plastic Bottle', emoji: '🧴', material: 'plastic' },
  cup: { id: 'cup', name: 'Fizzy Cup', emoji: '🥤', material: 'plastic' },
  bag: { id: 'bag', name: 'Shopping Bag', emoji: '🛍️', material: 'plastic' },
  straw: { id: 'straw', name: 'Bendy Straw', emoji: '🧵', material: 'plastic' },
  can: { id: 'can', name: 'Soda Can', emoji: '🥫', material: 'metal' },
  tin: { id: 'tin', name: 'Old Tin', emoji: '🪣', material: 'metal' },
  tire: { id: 'tire', name: 'Tire Debris', emoji: '🛞', material: 'metal' },
  key: { id: 'key', name: 'Rusty Key', emoji: '🗝️', material: 'metal' },
}

export const ZONES: Record<ZoneId, Zone> = {
  park: {
    id: 'park',
    name: 'Sunflower Park',
    emoji: '🏞️',
    dirtySky: 'linear-gradient(180deg,#7c8b6f 0%,#9aa77f 55%,#7f8a5c 100%)',
    cleanSky: 'linear-gradient(180deg,#7dd3fc 0%,#bbf7d0 60%,#86efac 100%)',
    ground: 'linear-gradient(180deg,#4ade80 0%,#16a34a 100%)',
    ingredient: 'sunlight_blossom',
    litterKinds: ['bottle', 'cup', 'bag', 'newspaper', 'can', 'crumpled_paper'],
    litterCount: 10,
    bloomEmojis: ['🌻', '🌸', '🌷', '🦋', '🌼'],
  },
  beach: {
    id: 'beach',
    name: 'Sparkle Beach',
    emoji: '🏖️',
    dirtySky: 'linear-gradient(180deg,#8b9aa3 0%,#b6b39a 55%,#c2b280 100%)',
    cleanSky: 'linear-gradient(180deg,#38bdf8 0%,#a5f3fc 60%,#fde68a 100%)',
    ground: 'linear-gradient(180deg,#fde68a 0%,#f59e0b 100%)',
    ingredient: 'dewdrop_crystal',
    litterKinds: ['bottle', 'straw', 'can', 'tin', 'box', 'cup'],
    litterCount: 11,
    bloomEmojis: ['🐚', '⭐', '🐠', '🦀', '🏝️'],
  },
  forest: {
    id: 'forest',
    name: 'Enchanted Forest',
    emoji: '🌳',
    dirtySky: 'linear-gradient(180deg,#4b5a4a 0%,#5d6b52 55%,#46543c 100%)',
    cleanSky: 'linear-gradient(180deg,#6ee7b7 0%,#a7f3d0 55%,#34d399 100%)',
    ground: 'linear-gradient(180deg,#22c55e 0%,#15803d 100%)',
    ingredient: 'whispering_leaf',
    litterKinds: ['newspaper', 'crumpled_paper', 'box', 'tire', 'key', 'bag'],
    litterCount: 12,
    bloomEmojis: ['🍄', '🌲', '🦉', '🍃', '🐿️'],
  },
}

export const ZONE_ORDER: ZoneId[] = ['park', 'beach', 'forest']

/** Star Dust is the reward for a perfectly cleaned zone. */
export const STAR_DUST_PER_PERFECT_ZONE = 2
