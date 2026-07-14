/**
 * ButtonAudio.ts — synthesized cues, bonded to button color.
 *
 * The second teaching channel. Each button gets a fixed timbre + pitch that
 * never changes, so over an hour his ears learn the color mapping a second time,
 * for free: green/A is always the same bright chime, blue/X always the same airy
 * whoosh. Sounds are synthesized with the Web Audio API — zero asset files, and
 * the pitches are chosen from a pentatonic scale so nothing ever clashes.
 *
 * The AudioContext is created lazily and resumed on first input, satisfying
 * browser autoplay policy (a gamepad/keyboard press is a valid user gesture).
 */

type Timbre = "chime" | "whoosh" | "bell" | "blip" | "thunk" | "sweep" | "sparkle";

interface CueSpec {
  timbre: Timbre;
  /** Base frequency in Hz. Pentatonic-ish so cues harmonize. */
  freq: number;
}

/**
 * Cue table. The four face-button cues (btnA/B/X/Y) are the important ones and
 * are intentionally distinct in both pitch and timbre so they're unmistakable.
 */
const CUES: Record<string, CueSpec> = {
  btnA: { timbre: "chime", freq: 523.25 }, // C5 — green, bright & happy
  btnB: { timbre: "thunk", freq: 349.23 }, // F4 — red, lower & blunt
  btnX: { timbre: "whoosh", freq: 440.0 }, // A4 — blue, airy
  btnY: { timbre: "sparkle", freq: 659.25 }, // E5 — yellow, shiny
  trigger: { timbre: "sweep", freq: 300 }, // RT spray
  brace: { timbre: "blip", freq: 220 }, // LT lock
  bump: { timbre: "blip", freq: 392 }, // bumpers
  dash: { timbre: "whoosh", freq: 587.33 }, // L3 sprint
  dpad: { timbre: "blip", freq: 494 }, // d-pad tick
  // Non-button world cues.
  catch: { timbre: "sparkle", freq: 784 },
  powerOn: { timbre: "bell", freq: 660 },
  clean: { timbre: "chime", freq: 698 },
  open: { timbre: "bell", freq: 523 },
};

export class ButtonAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.25;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  /** Call on first user input so the context is running. Safe to call often. */
  resume(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  /** Play a cue by id. Unknown ids are silently ignored. */
  play(cueId: string): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === "suspended") void ctx.resume();
    const spec = CUES[cueId];
    if (!spec) return;
    this.render(ctx, this.master, spec);
  }

  private render(ctx: AudioContext, out: GainNode, spec: CueSpec): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(out);

    const f = spec.freq;
    switch (spec.timbre) {
      case "chime":
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        this.envelope(gain, t, 0.01, 0.35, 0.5);
        this.overtone(ctx, out, f * 2, t, 0.25, "sine");
        break;
      case "bell":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, t);
        this.envelope(gain, t, 0.005, 0.6, 0.5);
        this.overtone(ctx, out, f * 2.76, t, 0.3, "sine");
        break;
      case "whoosh":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f * 0.6, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.25);
        this.envelope(gain, t, 0.02, 0.28, 0.35);
        break;
      case "sparkle":
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.12);
        this.envelope(gain, t, 0.005, 0.22, 0.5);
        this.overtone(ctx, out, f * 3, t, 0.18, "sine");
        break;
      case "thunk":
        osc.type = "square";
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.15);
        this.envelope(gain, t, 0.005, 0.2, 0.4);
        break;
      case "sweep":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.linearRampToValueAtTime(f * 2, t + 0.3);
        this.envelope(gain, t, 0.02, 0.3, 0.25);
        break;
      case "blip":
        osc.type = "square";
        osc.frequency.setValueAtTime(f, t);
        this.envelope(gain, t, 0.005, 0.09, 0.4);
        break;
    }

    osc.start(t);
    osc.stop(t + 0.8);
  }

  private envelope(
    gain: GainNode,
    t: number,
    attack: number,
    decay: number,
    peak: number
  ): void {
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private overtone(
    ctx: AudioContext,
    out: GainNode,
    freq: number,
    t: number,
    peak: number,
    type: OscillatorType
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain);
    gain.connect(out);
    this.envelope(gain, t, 0.005, 0.3, peak);
    osc.start(t);
    osc.stop(t + 0.5);
  }
}
