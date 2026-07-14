/**
 * Palette.ts — THE color source of truth.
 *
 * Golden rule 2 lives here. XBOX_BUTTON holds the ONLY button colors in the
 * codebase. They match the physical Xbox controller so that an on-screen 'A'
 * prompt is green *because it is an A prompt*. Nothing else in the game may
 * define a button color; everything reads from here.
 *
 * These hexes are the standard Xbox face-button colors.
 */

export const XBOX_BUTTON = {
  A: 0x16c60c, // green
  B: 0xe81123, // red
  X: 0x0078d7, // blue
  Y: 0xffb900, // yellow
} as const;

export type XboxButtonColorKey = keyof typeof XBOX_BUTTON;

/**
 * Inputs with no color on the physical pad (bumpers, triggers, sticks, d-pad).
 * They must NOT be given a face-button color — that would teach a false
 * mapping. They render in this neutral controller-plastic gray and are always
 * prompted via ControllerDiagram (a picture of the pad), never a letter.
 */
export const NEUTRAL_INPUT = 0xb8c0cc;
export const NEUTRAL_INPUT_LIT = 0xffffff; // the pulsing "this part" highlight

/** World / UI palette. Bright, high-contrast, friendly. No button meaning here. */
export const COLOR = {
  bgTop: 0x2a2d52,
  bgBottom: 0x14162e,
  floor: 0x3b3f6b,
  sparkBody: 0xf4d35e,
  sparkBodyDark: 0xd9a72e,
  sparkEye: 0x1a1a2e,
  sparkGlow: 0xfff2b8,
  gear: 0xffc94d,
  gearDark: 0xd99a2b,
  sheep: 0xf7f7ff,
  sheepFace: 0x2a2d52,
  water: 0x4fc3f7,
  waterDark: 0x1e88c9,
  mud: 0x8d6e4f,
  mudClean: 0x9ad16b,
  wireOff: 0x555a7a,
  wireOn: 0x6fe3ff,
  metal: 0x9aa4c8,
  metalDark: 0x5a6394,
  ghost: 0xffffff,
} as const;

/** A pulsing "look here" highlight used by hints, shared everywhere. */
export const HINT_GLOW = 0xfff2b8;
