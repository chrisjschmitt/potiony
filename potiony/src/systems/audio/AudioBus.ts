type ToneOptions = {
  freq: number
  dur: number
  type?: OscillatorType
  gain?: number
  slideTo?: number
  delay?: number
}

type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext }

/**
 * Sounds are synthesised rather than loaded from files: no binary assets to ship,
 * instant playback, and nothing to fail on a slow connection.
 * iOS keeps audio suspended until a real touch, hence unlock().
 */
class AudioBus {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  muted = false

  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
      if (!Ctor) return
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02)
    }
  }

  private tone({ freq, dur, type = 'sine', gain = 0.25, slideTo, delay = 0 }: ToneOptions) {
    if (!this.ctx || !this.master || this.muted) return
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const env = this.ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)

    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.02, dur * 0.3))
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

    osc.connect(env).connect(this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  private noise({ dur, gain = 0.12, delay = 0 }: { dur: number; gain?: number; delay?: number }) {
    if (!this.ctx || !this.master || this.muted) return
    const frames = Math.floor(this.ctx.sampleRate * dur)
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
    }
    const src = this.ctx.createBufferSource()
    const env = this.ctx.createGain()
    env.gain.value = gain
    src.buffer = buffer
    src.connect(env).connect(this.master)
    src.start(this.ctx.currentTime + delay)
  }

  /** Soft chime when litter is sorted correctly. */
  sparkle() {
    this.tone({ freq: 1180, dur: 0.12, type: 'triangle', gain: 0.16 })
    this.tone({ freq: 1760, dur: 0.16, type: 'triangle', gain: 0.12, delay: 0.06 })
  }

  /** Picking something up. */
  pick() {
    this.tone({ freq: 520, dur: 0.08, type: 'sine', gain: 0.12, slideTo: 780 })
  }

  /** Item lands in the cauldron. */
  plop() {
    this.tone({ freq: 320, dur: 0.16, type: 'sine', gain: 0.22, slideTo: 120 })
    this.noise({ dur: 0.08, gain: 0.05 })
  }

  /** Cauldron ambience while stirring. */
  bubble() {
    const base = 180 + Math.random() * 120
    this.tone({ freq: base, dur: 0.18, type: 'sine', gain: 0.1, slideTo: base * 2.2 })
  }

  /** Potion successfully brewed. */
  brewed() {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) =>
      this.tone({ freq, dur: 0.26, type: 'triangle', gain: 0.18, delay: i * 0.07 }),
    )
  }

  /** A friend is healed. */
  cheer() {
    const notes = [392, 523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) =>
      this.tone({ freq, dur: 0.3, type: 'sine', gain: 0.2, delay: i * 0.09 }),
    )
    this.noise({ dur: 0.4, gain: 0.04, delay: 0.1 })
  }

  /** Gentle "try again" — deliberately friendly, never a buzzer. */
  nope() {
    this.tone({ freq: 400, dur: 0.14, type: 'sine', gain: 0.14, slideTo: 300 })
  }

  tap() {
    this.tone({ freq: 660, dur: 0.06, type: 'square', gain: 0.06 })
  }
}

export const audio = new AudioBus()
