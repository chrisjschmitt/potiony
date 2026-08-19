import { useEffect, useState } from 'react'

/**
 * iOS ignores the manifest's landscape lock when the PWA is launched from Safari,
 * so we ask nicely instead of failing silently.
 */
export function OrientationGuard() {
  const [portrait, setPortrait] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(orientation: portrait)')
    const update = () => setPortrait(query.matches && window.innerWidth < 900)
    update()
    query.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      query.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  if (!portrait) return null

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-[#0b1d3a] px-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="animate-bob text-8xl">🔄</span>
        <h2 className="text-4xl font-black">Turn me sideways!</h2>
        <p className="text-xl font-bold text-white/75">
          Potiony is happiest when your iPad is wide. 🧪
        </p>
      </div>
    </div>
  )
}
