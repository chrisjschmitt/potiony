import type { PointerEvent as ReactPointerEvent } from 'react'

const SIZES = {
  sm: { box: 'h-16 w-16 text-3xl', badge: 'text-sm h-6 min-w-6', col: 'w-[4.5rem]' },
  md: { box: 'h-20 w-20 text-4xl', badge: 'text-base h-7 min-w-7', col: 'w-24' },
  lg: { box: 'h-24 w-24 text-5xl', badge: 'text-lg h-8 min-w-8', col: 'w-28' },
}

export type CountChipProps = {
  emoji: string
  label?: string
  count?: number
  swatch: string
  size?: keyof typeof SIZES
  dimmed?: boolean
  dragging?: boolean
  highlight?: boolean
  onPointerDown?: (event: ReactPointerEvent) => void
  elementRef?: (el: HTMLDivElement | null) => void
  title?: string
}

/**
 * The one visual language for every collectable thing: ingredients, potions,
 * and litter tallies. Generous padding keeps the tap target well over 60px.
 */
export function CountChip({
  emoji,
  label,
  count,
  swatch,
  size = 'md',
  dimmed,
  dragging,
  highlight,
  onPointerDown,
  elementRef,
  title,
}: CountChipProps) {
  const s = SIZES[size]
  return (
    <div className={`flex ${s.col} shrink-0 flex-col items-center pt-2 pr-1`} title={title}>
      <div
        ref={elementRef}
        onPointerDown={onPointerDown}
        className={[
          'relative grid place-items-center rounded-3xl border-4 border-white/70 bg-gradient-to-br shadow-lg transition',
          s.box,
          swatch,
          dimmed ? 'opacity-35 saturate-50' : '',
          dragging ? 'scale-90 opacity-30' : 'active:scale-95',
          highlight ? 'animate-shimmer ring-4 ring-white' : '',
          onPointerDown ? 'touch-none' : '',
        ].join(' ')}
      >
        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] select-none">{emoji}</span>
        {count !== undefined && (
          <span
            className={[
              'absolute -top-1.5 -right-1.5 grid place-items-center rounded-full border-2 border-white bg-slate-900 px-1 font-bold text-white',
              s.badge,
            ].join(' ')}
          >
            {count}
          </span>
        )}
      </div>
      {label && (
        <span className="mt-1 w-full truncate text-center text-[10px] leading-tight font-bold text-white/90 drop-shadow">
          {label}
        </span>
      )}
    </div>
  )
}
