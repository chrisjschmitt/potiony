/**
 * Safari throws on localStorage in Private Browsing, and it can also throw when
 * the quota is full. A child should never see a crash because of that, so the
 * game falls back to an in-memory store and simply forgets progress instead.
 */
const memory = new Map<string, string>()

function probe(): Storage | null {
  try {
    const store = globalThis.localStorage
    if (!store) return null
    const key = '__potiony_probe__'
    store.setItem(key, '1')
    store.removeItem(key)
    return store
  } catch {
    return null
  }
}

let resolved: Storage | null | undefined

function backing(): Storage | null {
  if (resolved === undefined) resolved = probe()
  return resolved
}

export const safeStorage: Storage = {
  get length() {
    return backing()?.length ?? memory.size
  },
  key(index) {
    return backing()?.key(index) ?? [...memory.keys()][index] ?? null
  },
  getItem(key) {
    const store = backing()
    if (!store) return memory.get(key) ?? null
    try {
      return store.getItem(key)
    } catch {
      return memory.get(key) ?? null
    }
  },
  setItem(key, value) {
    memory.set(key, value)
    try {
      backing()?.setItem(key, value)
    } catch {
      // Out of quota or blocked: the in-memory copy is enough for this session.
    }
  },
  removeItem(key) {
    memory.delete(key)
    try {
      backing()?.removeItem(key)
    } catch {
      // Nothing to do.
    }
  },
  clear() {
    memory.clear()
    try {
      backing()?.clear()
    } catch {
      // Nothing to do.
    }
  },
}
