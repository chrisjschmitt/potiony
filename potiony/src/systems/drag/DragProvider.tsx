import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { IngredientId, Material, PotionId, ZoneId } from '../../content/types'

export type DragPayload =
  | { kind: 'litter'; id: string; emoji: string; zoneId: ZoneId; material: Material }
  | { kind: 'ingredient'; id: IngredientId; emoji: string }
  | { kind: 'potion'; id: PotionId; emoji: string }

type Target = {
  id: string
  el: HTMLElement
  accepts: (payload: DragPayload) => boolean
  onDrop: (payload: DragPayload, point: { x: number; y: number }) => void
}

type DragContext = {
  payload: DragPayload | null
  hoveredId: string | null
  registerTarget: (target: Target) => () => void
  startDrag: (
    payload: DragPayload,
    event: ReactPointerEvent,
    handlers?: { onTap?: () => void; onMiss?: () => void },
  ) => void
}

const DragCtx = createContext<DragContext | null>(null)

const TAP_SLOP = 10

export function DragProvider({ children }: { children: ReactNode }) {
  const targets = useRef(new Map<string, Target>())
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const [payload, setPayload] = useState<DragPayload | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const session = useRef<{
    payload: DragPayload
    pointerId: number
    startX: number
    startY: number
    moved: boolean
    hovered: string | null
    onTap?: () => void
    onMiss?: () => void
  } | null>(null)

  const registerTarget = useCallback((target: Target) => {
    targets.current.set(target.id, target)
    return () => {
      targets.current.delete(target.id)
    }
  }, [])

  /** Smallest matching target under the point wins, so nested zones behave sensibly. */
  const hitTest = useCallback((x: number, y: number, p: DragPayload): Target | null => {
    let best: Target | null = null
    let bestArea = Infinity
    for (const target of targets.current.values()) {
      if (!target.el.isConnected || !target.accepts(p)) continue
      const r = target.el.getBoundingClientRect()
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue
      const area = r.width * r.height
      if (area < bestArea) {
        best = target
        bestArea = area
      }
    }
    return best
  }, [])

  const moveGhost = (x: number, y: number) => {
    const el = ghostRef.current
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
  }

  const startDrag = useCallback<DragContext['startDrag']>((p, event, handlers) => {
    if (session.current) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    session.current = {
      payload: p,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      hovered: null,
      onTap: handlers?.onTap,
      onMiss: handlers?.onMiss,
    }
    moveGhost(event.clientX, event.clientY)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = session.current
      if (!s || e.pointerId !== s.pointerId) return

      if (!s.moved) {
        const far = Math.hypot(e.clientX - s.startX, e.clientY - s.startY) > TAP_SLOP
        if (!far) return
        s.moved = true
        setPayload(s.payload)
      }
      moveGhost(e.clientX, e.clientY)

      const hit = hitTest(e.clientX, e.clientY, s.payload)
      const nextId = hit?.id ?? null
      if (nextId !== s.hovered) {
        s.hovered = nextId
        setHoveredId(nextId)
      }
    }

    const finish = (e: PointerEvent, cancelled: boolean) => {
      const s = session.current
      if (!s || e.pointerId !== s.pointerId) return
      session.current = null
      setPayload(null)
      setHoveredId(null)

      if (cancelled) return
      if (!s.moved) {
        s.onTap?.()
        return
      }
      const hit = hitTest(e.clientX, e.clientY, s.payload)
      if (hit) hit.onDrop(s.payload, { x: e.clientX, y: e.clientY })
      else s.onMiss?.()
    }

    const onUp = (e: PointerEvent) => finish(e, false)
    const onCancel = (e: PointerEvent) => finish(e, true)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [hitTest])

  const value = useMemo<DragContext>(
    () => ({ payload, hoveredId, registerTarget, startDrag }),
    [payload, hoveredId, registerTarget, startDrag],
  )

  return (
    <DragCtx.Provider value={value}>
      {children}
      <div
        ref={ghostRef}
        className="pointer-events-none fixed top-0 left-0 z-[70] will-change-transform"
        aria-hidden
      >
        {payload && (
          <span className="block scale-125 text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]">
            {payload.emoji}
          </span>
        )}
      </div>
    </DragCtx.Provider>
  )
}

export function useDrag() {
  const ctx = useContext(DragCtx)
  if (!ctx) throw new Error('useDrag must be used inside <DragProvider>')
  return ctx
}

/** Attach to any element a child can pick up. Tap and drag both work. */
export function useDraggable(options: {
  payload: DragPayload
  onTap?: () => void
  onMiss?: () => void
  disabled?: boolean
}) {
  const { startDrag, payload: active } = useDrag()
  const latest = useRef(options)
  latest.current = options

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      const { payload, onTap, onMiss, disabled } = latest.current
      if (disabled || event.button !== 0) return
      event.preventDefault()
      startDrag(payload, event, { onTap, onMiss })
    },
    [startDrag],
  )

  const isDragging = active?.kind === options.payload.kind && active.id === options.payload.id
  return { onPointerDown, isDragging }
}

/** Attach to bins, the cauldron, and friends. */
export function useDropTarget(options: {
  accepts: (payload: DragPayload) => boolean
  onDrop: (payload: DragPayload, point: { x: number; y: number }) => void
}) {
  const { registerTarget, payload, hoveredId } = useDrag()
  const id = useId()
  const ref = useRef<HTMLElement | null>(null)
  const latest = useRef(options)
  latest.current = options

  const setRef = useCallback((el: HTMLElement | null) => {
    ref.current = el
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return registerTarget({
      id,
      el,
      accepts: (p) => latest.current.accepts(p),
      onDrop: (p, point) => latest.current.onDrop(p, point),
    })
  }, [id, registerTarget])

  const canAccept = payload ? options.accepts(payload) : false
  return {
    setRef,
    /** True when a compatible item is being dragged anywhere on screen. */
    isCandidate: canAccept,
    /** True when the dragged item is directly over this target. */
    isOver: canAccept && hoveredId === id,
  }
}
