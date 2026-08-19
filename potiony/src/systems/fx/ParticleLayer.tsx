import { useEffect, useRef } from 'react'

export type BurstOptions = {
  x: number
  y: number
  count?: number
  emojis?: string[]
  colors?: string[]
  power?: number
  gravity?: number
  life?: number
  size?: number
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  rot: number
  vr: number
  emoji?: string
  color?: string
}

type Listener = (options: BurstOptions) => void

const listeners = new Set<Listener>()

/** Any component can fire particles without prop drilling. */
export const fx = {
  burst(options: BurstOptions) {
    listeners.forEach((fn) => fn(options))
  },
  /** Convenience: burst centred on an element. */
  burstAt(el: Element | null, options: Omit<BurstOptions, 'x' | 'y'>) {
    if (!el) return
    const r = el.getBoundingClientRect()
    fx.burst({ ...options, x: r.left + r.width / 2, y: r.top + r.height / 2 })
  },
  subscribe(fn: Listener) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

const DEFAULT_COLORS = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fbcfe8', '#fff']

export function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particles = useRef<Particle[]>([])
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const alive: Particle[] = []
      for (const p of particles.current) {
        p.life -= dt
        if (p.life > 0) alive.push(p)
      }
      particles.current = alive

      for (const p of particles.current) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 900 * dt * 0.35
        p.vx *= 0.99
        p.rot += p.vr * dt
        const fade = Math.min(1, p.life / (p.maxLife * 0.5))

        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        if (p.emoji) {
          ctx.font = `${p.size}px serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(p.emoji, 0, 0)
        } else {
          ctx.fillStyle = p.color ?? '#fff'
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      frame.current = particles.current.length > 0 ? requestAnimationFrame(step) : null
    }

    const unsubscribe = fx.subscribe((o) => {
      const count = o.count ?? 16
      const power = o.power ?? 320
      const life = o.life ?? 0.9
      const size = o.size ?? 26
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4
        const speed = power * (0.4 + Math.random() * 0.8)
        particles.current.push({
          x: o.x,
          y: o.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: life * (0.7 + Math.random() * 0.6),
          maxLife: life,
          size: o.emojis ? size * (0.7 + Math.random() * 0.6) : 6 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 6,
          emoji: o.emojis ? o.emojis[Math.floor(Math.random() * o.emojis.length)] : undefined,
          color: o.emojis
            ? undefined
            : (o.colors ?? DEFAULT_COLORS)[
                Math.floor(Math.random() * (o.colors ?? DEFAULT_COLORS).length)
              ],
        })
      }
      // Restart the loop only when it has gone idle.
      if (frame.current === null) {
        last = performance.now()
        frame.current = requestAnimationFrame(step)
      }
    })

    return () => {
      unsubscribe()
      window.removeEventListener('resize', resize)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[80]"
      aria-hidden
    />
  )
}
