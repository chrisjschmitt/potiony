import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LEVEL1_FRIENDS } from './content/friends'
import { useGame } from './store/gameStore'
import { audio } from './systems/audio/AudioBus'
import { DragProvider } from './systems/drag/DragProvider'
import { ParticleLayer } from './systems/fx/ParticleLayer'
import { CleanCollect } from './scenes/CleanCollect'
import { PotionLab } from './scenes/PotionLab'
import { Town } from './scenes/Town'
import { RecipeBook } from './scenes/RecipeBook'
import { GameHUD } from './ui/GameHUD'
import { LevelUpModal } from './ui/LevelUpModal'
import { OrientationGuard } from './ui/OrientationGuard'
import { TabBar } from './ui/TabBar'
import { TitleScreen } from './ui/TitleScreen'
import { Toast } from './ui/Toast'
import { TopBar } from './ui/TopBar'

const SCENES = {
  clean: CleanCollect,
  lab: PotionLab,
  town: Town,
  book: RecipeBook,
}

function useIpadHardening() {
  useEffect(() => {
    // iOS needs a real gesture before it will make any sound.
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })

    // Safari's pinch and double-tap zoom ignore touch-action in some contexts.
    const blockGesture = (e: Event) => e.preventDefault()
    document.addEventListener('gesturestart', blockGesture)
    document.addEventListener('gesturechange', blockGesture)
    document.addEventListener('dblclick', blockGesture)

    return () => {
      window.removeEventListener('pointerdown', unlock)
      document.removeEventListener('gesturestart', blockGesture)
      document.removeEventListener('gesturechange', blockGesture)
      document.removeEventListener('dblclick', blockGesture)
    }
  }, [])
}

export default function App() {
  const started = useGame((s) => s.started)
  const activeScene = useGame((s) => s.activeScene)
  const Scene = SCENES[activeScene]
  const level = useGame((s) => s.level)
  const l1Done = useGame((s) => LEVEL1_FRIENDS.every((id) => s.friends[id]?.healed))
  const unlockLevel2 = useGame((s) => s.unlockLevel2)
  useIpadHardening()

  useEffect(() => {
    if (!started) return
    const s = useGame.getState()
    if (s.level < 2 && l1Done) {
      s.unlockLevel2()
      return
    }
    // Old saves that already helped the first three friends migrate to Level 2
    // without opening the dumpster intro. Show it once they Keep Playing.
    const l2Started =
      s.dumped > 0 || Boolean(s.friends.olive_owl?.healed) || Boolean(s.friends.nori_newt?.healed)
    if (s.level >= 2 && l1Done && !l2Started) {
      useGame.setState({ levelUpOpen: true })
    }
  }, [started, l1Done, level, unlockLevel2])

  return (
    <DragProvider>
      <div className="flex h-full flex-col bg-[linear-gradient(180deg,#0b1d3a_0%,#122a52_100%)]">
        {!started ? (
          <TitleScreen />
        ) : (
          <>
            <TopBar />
            <main className="min-h-0 flex-1 px-2 pb-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScene}
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={{ duration: 0.18 }}
                  className="h-full"
                >
                  <Scene />
                </motion.div>
              </AnimatePresence>
            </main>
            <GameHUD />
            <TabBar />
            <LevelUpModal />
          </>
        )}
      </div>
      <Toast />
      <ParticleLayer />
      <OrientationGuard />
    </DragProvider>
  )
}
