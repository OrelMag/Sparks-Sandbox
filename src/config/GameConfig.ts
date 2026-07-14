/**
 * GameConfig.ts — canvas + physics + scene registration.
 */
import Phaser from "phaser";
import { COLOR } from "./Palette";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Base Phaser config. Scenes are added in main.ts so this stays import-light. */
export function baseGameConfig(
  parent: string,
  scenes: Phaser.Types.Scenes.SceneType[]
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLOR.bgBottom,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    render: {
      antialias: true,
      roundPixels: false,
    },
    scene: scenes,
  };
}
