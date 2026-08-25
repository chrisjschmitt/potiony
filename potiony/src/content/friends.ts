import type { Friend, FriendId } from './types'

export const FRIENDS: Record<FriendId, Friend> = {
  freddy_fox: {
    id: 'freddy_fox',
    name: 'Freddy Fox',
    emoji: '🦊',
    ailment: 'Giggle-Coughs',
    ailmentEmoji: '😹',
    needs: 'giggle_fizz',
    minLevel: 1,
    thanks: 'Freddy giggles all the way to the treetops!',
    swatch: 'from-orange-400 to-red-500',
  },
  barnaby_bear: {
    id: 'barnaby_bear',
    name: 'Barnaby Bear',
    emoji: '🐻',
    ailment: 'Topsy-Turvy Tummy',
    ailmentEmoji: '🌀',
    needs: 'cozy_warmth',
    minLevel: 1,
    thanks: 'Barnaby does a happy tummy wiggle!',
    swatch: 'from-amber-500 to-yellow-700',
  },
  pippa_bunny: {
    id: 'pippa_bunny',
    name: 'Pippa Bunny',
    emoji: '🐰',
    ailment: 'Sleepy Knees',
    ailmentEmoji: '😴',
    needs: 'super_bouncy',
    minLevel: 1,
    thanks: 'Pippa bounces higher than the clouds!',
    swatch: 'from-fuchsia-400 to-purple-500',
  },
  olive_owl: {
    id: 'olive_owl',
    name: 'Olive Owl',
    emoji: '🦉',
    ailment: 'Hooty Hiccups',
    ailmentEmoji: '😮',
    needs: 'moonbeam_sip',
    minLevel: 2,
    thanks: 'Olive hoots a happy little song!',
    swatch: 'from-amber-700 to-stone-800',
  },
  nori_newt: {
    id: 'nori_newt',
    name: 'Nori Newt',
    emoji: '🦎',
    ailment: 'Wobbly Whiskers',
    ailmentEmoji: '😵‍💫',
    needs: 'starry_hug',
    minLevel: 2,
    thanks: 'Nori does a sparkly tail-wiggle!',
    swatch: 'from-emerald-400 to-teal-600',
  },
}

export const FRIEND_ORDER: FriendId[] = [
  'freddy_fox',
  'barnaby_bear',
  'pippa_bunny',
  'olive_owl',
  'nori_newt',
]

export const LEVEL1_FRIENDS: FriendId[] = ['freddy_fox', 'barnaby_bear', 'pippa_bunny']

export function visibleFriends(level: number): FriendId[] {
  return FRIEND_ORDER.filter((id) => FRIENDS[id].minLevel <= level)
}
