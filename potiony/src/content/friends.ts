import type { Friend, FriendId } from './types'

export const FRIENDS: Record<FriendId, Friend> = {
  freddy_fox: {
    id: 'freddy_fox',
    name: 'Freddy Fox',
    emoji: '🦊',
    ailment: 'Giggle-Coughs',
    ailmentEmoji: '😹',
    needs: 'giggle_fizz',
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
    thanks: 'Pippa bounces higher than the clouds!',
    swatch: 'from-fuchsia-400 to-purple-500',
  },
}

export const FRIEND_ORDER: FriendId[] = ['freddy_fox', 'barnaby_bear', 'pippa_bunny']
