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
  pizza_box: { id: 'pizza_box', name: 'Greasy Pizza Box', emoji: '🍕', material: 'trash' },
  toothbrush: { id: 'toothbrush', name: 'Old Toothbrush', emoji: '🪥', material: 'trash' },
  // Old saves used a teddy as "broken toy". Keep the id so a piece already
  // on the grass still looks up, but it now draws as a toothbrush.
  broken_toy: { id: 'toothbrush', name: 'Old Toothbrush', emoji: '🪥', material: 'trash' },
  juice_carton: { id: 'juice_carton', name: 'Sticky Juice Carton', emoji: '🧃', material: 'trash' },
  napkin: { id: 'napkin', name: 'Used Napkin', emoji: '🧻', material: 'trash' },
  balloon: { id: 'balloon', name: 'Popped Balloon', emoji: '🎈', material: 'trash' },
  sneaker: { id: 'sneaker', name: 'Worn-out Sneaker', emoji: '👟', material: 'trash' },
}

export const ZONES: Record<ZoneId, Zone> = {
  park: {
    id: 'park',
    name: 'Sunflower Park',
    emoji: '🏞️',
    minLevel: 1,
    dirtySky: 'linear-gradient(180deg,#7c8b6f 0%,#9aa77f 55%,#7f8a5c 100%)',
    cleanSky: 'linear-gradient(180deg,#7dd3fc 0%,#bbf7d0 60%,#86efac 100%)',
    ground: 'linear-gradient(180deg,#4ade80 0%,#16a34a 100%)',
    ingredient: 'sunlight_blossom',
    litterKinds: ['bottle', 'cup', 'bag', 'newspaper', 'can', 'crumpled_paper'],
    litterCount: 10,
    trashKinds: ['pizza_box', 'napkin', 'toothbrush'],
    trashCount: 4,
    bloomEmojis: ['🌻', '🌸', '🌷', '🦋', '🌼'],
  },
  beach: {
    id: 'beach',
    name: 'Sparkle Beach',
    emoji: '🏖️',
    minLevel: 1,
    dirtySky: 'linear-gradient(180deg,#8b9aa3 0%,#b6b39a 55%,#c2b280 100%)',
    cleanSky: 'linear-gradient(180deg,#38bdf8 0%,#a5f3fc 60%,#fde68a 100%)',
    ground: 'linear-gradient(180deg,#fde68a 0%,#f59e0b 100%)',
    ingredient: 'dewdrop_crystal',
    litterKinds: ['bottle', 'straw', 'can', 'tin', 'box', 'cup'],
    litterCount: 11,
    trashKinds: ['juice_carton', 'balloon', 'sneaker'],
    trashCount: 4,
    bloomEmojis: ['🐚', '⭐', '🐠', '🦀', '🏝️'],
  },
  forest: {
    id: 'forest',
    name: 'Enchanted Forest',
    emoji: '🌳',
    minLevel: 1,
    dirtySky: 'linear-gradient(180deg,#4b5a4a 0%,#5d6b52 55%,#46543c 100%)',
    cleanSky: 'linear-gradient(180deg,#6ee7b7 0%,#a7f3d0 55%,#34d399 100%)',
    ground: 'linear-gradient(180deg,#22c55e 0%,#15803d 100%)',
    ingredient: 'whispering_leaf',
    litterKinds: ['newspaper', 'crumpled_paper', 'box', 'tire', 'key', 'bag'],
    litterCount: 12,
    trashKinds: ['toothbrush', 'sneaker', 'napkin'],
    trashCount: 4,
    bloomEmojis: ['🍄', '🌲', '🦉', '🍃', '🐿️'],
  },
  meadow: {
    id: 'meadow',
    name: 'Moonlit Meadow',
    emoji: '🌙',
    minLevel: 2,
    dirtySky: 'linear-gradient(180deg,#312e81 0%,#1e1b4b 55%,#312e81 100%)',
    cleanSky: 'linear-gradient(180deg,#6366f1 0%,#c4b5fd 55%,#1e1b4b 100%)',
    ground: 'linear-gradient(180deg,#4338ca 0%,#1e3a8a 100%)',
    ingredient: 'moonpetal',
    litterKinds: ['newspaper', 'bottle', 'can', 'bag', 'cup'],
    litterCount: 8,
    trashKinds: ['pizza_box', 'balloon', 'juice_carton', 'toothbrush'],
    trashCount: 5,
    bloomEmojis: ['🌙', '⭐', '🌌', '💜', '✨'],
  },
}

export const ZONE_ORDER: ZoneId[] = ['park', 'beach', 'forest', 'meadow']
export const LEVEL1_ZONES: ZoneId[] = ['park', 'beach', 'forest']

export function visibleZones(level: number): ZoneId[] {
  return ZONE_ORDER.filter((id) => ZONES[id].minLevel <= level)
}

export function zoneCapacity(zoneId: ZoneId, level: number): number {
  const zone = ZONES[zoneId]
  return zone.litterCount + (level >= 2 ? zone.trashCount : 0)
}

/** Star Dust is the reward for a perfectly cleaned zone. */
export const STAR_DUST_PER_PERFECT_ZONE = 2
