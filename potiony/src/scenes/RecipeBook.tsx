import { INGREDIENTS } from '../content/ingredients'
import { POTIONS, POTION_ORDER } from '../content/recipes'
import { FRIENDS, FRIEND_ORDER } from '../content/friends'
import { useGame } from '../store/gameStore'
import { audio } from '../systems/audio/AudioBus'

const STEPS = [
  { emoji: '🏞️', title: 'Tidy up', text: 'Drag each piece onto the matching bin.' },
  { emoji: '🧪', title: 'Brew', text: 'Mix 2 ingredients in the cauldron and stir.' },
  { emoji: '🏡', title: 'Help', text: 'Give the potion to the friend who needs it.' },
]

export function RecipeBook() {
  const discovered = useGame((s) => s.discoveredRecipes)
  const ingredients = useGame((s) => s.ingredients)
  const setScene = useGame((s) => s.setScene)
  const level = useGame((s) => s.level)

  return (
    <div className="h-full overflow-y-auto rounded-[2rem] border-4 border-white/20 bg-[radial-gradient(circle_at_50%_0%,#7c2d12_0%,#451a03_60%,#1c0701_100%)] px-5 py-4">
      <h2 className="text-2xl font-black">📖 Potion Recipe Book</h2>
      <p className="mb-4 text-sm font-bold text-white/70">
        Every magic brew you have discovered.
      </p>

      <ol className="mb-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex items-center gap-3 rounded-3xl border-4 border-amber-200/40 bg-amber-100/10 p-3"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-300 text-xl font-black text-slate-900">
              {i + 1}
            </span>
            <span className="text-4xl">{step.emoji}</span>
            <span className="min-w-0">
              <span className="block font-black">{step.title}</span>
              <span className="block text-xs font-bold text-white/70">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-3">
        {POTION_ORDER.map((id) => {
          const potion = POTIONS[id]
          const locked = potion.minLevel > level
          const known = discovered.includes(id)
          const friend = FRIEND_ORDER.map((f) => FRIENDS[f]).find((f) => f.needs === id)
          const canMake =
            !locked &&
            potion.ingredients.every(
              (ing) =>
                ingredients[ing] >=
                potion.ingredients.filter((other) => other === ing).length,
            )

          return (
            <article
              key={id}
              className={[
                'flex flex-col gap-3 rounded-[2rem] border-4 bg-amber-50/95 p-4 text-slate-900 shadow-xl',
                canMake ? 'border-emerald-400' : 'border-amber-200/70',
              ].join(' ')}
            >
              <div className="flex items-center justify-center gap-2">
                {potion.ingredients.map((ing, i) => (
                  <span key={`${ing}-${i}`} className="flex items-center gap-2">
                    {i > 0 && <span className="text-2xl font-black">+</span>}
                    <span
                      className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-white bg-gradient-to-br text-3xl shadow"
                      title={INGREDIENTS[ing].name}
                    >
                      {locked ? '🔒' : INGREDIENTS[ing].emoji}
                    </span>
                  </span>
                ))}
                <span className="text-2xl font-black">=</span>
                <span
                  className={[
                    'grid h-20 w-20 place-items-center rounded-3xl border-4 border-white bg-gradient-to-br text-4xl shadow',
                    potion.swatch,
                    known ? '' : 'grayscale',
                  ].join(' ')}
                >
                  {known ? potion.emoji : '❓'}
                </span>
              </div>

              <h3 className="text-center text-lg font-black">
                {locked ? 'Level 2 secret' : known ? potion.name : 'Not brewed yet'}
              </h3>

              {friend && !locked && (
                <p className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900/10 px-3 py-2 text-center text-sm font-bold">
                  <span className="text-2xl">{friend.emoji}</span>
                  {friend.name} needs this for the {friend.ailment}
                </p>
              )}

              {!locked && (
              <div className="mt-auto grid gap-1 text-xs font-bold text-slate-700">
                {potion.ingredients.map((ing) => (
                  <span key={ing} className="flex items-center justify-between gap-2">
                    <span>
                      {INGREDIENTS[ing].emoji} {INGREDIENTS[ing].name}
                    </span>
                    <span className={ingredients[ing] > 0 ? 'text-emerald-700' : 'text-slate-500'}>
                      you have {ingredients[ing]}
                    </span>
                  </span>
                ))}
                <span className="text-slate-500">
                  {INGREDIENTS[potion.ingredients[0]].hint}
                </span>
              </div>
              )}

              <button
                onClick={() => {
                  audio.tap()
                  if (locked) setScene('town')
                  else setScene(canMake ? 'lab' : 'clean')
                }}
                className={[
                  'min-h-14 rounded-2xl border-4 border-white px-4 font-black text-white active:scale-95',
                  locked
                    ? 'bg-gradient-to-b from-slate-500 to-slate-700'
                    : canMake
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-b from-sky-400 to-sky-600',
                ].join(' ')}
              >
                {locked ? '🔒 Help friends first' : canMake ? '🧪 Brew it now' : '🏞️ Find ingredients'}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
