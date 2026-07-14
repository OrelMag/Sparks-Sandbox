/**
 * Portal.ts — a wordless door into a phase.
 *
 * The hub has no menu; you drive Spark into a door. Each portal shows a picture
 * of what's inside (four colored buttons, a gear, a water drop, meshed gears) —
 * never a label. Walk in and it whisks you to that scene.
 */

import Phaser from "phaser";
import { COLOR, XBOX_BUTTON } from "@/config/Palette";
import { drawGear } from "./Gear";

export type PortalIcon = "home" | "buttons" | "gear" | "dualstick" | "gears";

export class Portal {
  readonly container: Phaser.GameObjects.Container;
  readonly zone: Phaser.Geom.Rectangle;
  private entered = false;

  constructor(
    scene: Phaser.Scene,
    public x: number,
    public y: number,
    icon: PortalIcon,
    readonly sceneKey: string
  ) {
    // Arch.
    const frame = scene.add.graphics();
    frame.fillStyle(COLOR.metalDark, 1);
    frame.fillRoundedRect(-56, -80, 112, 160, 16);
    frame.fillStyle(COLOR.bgBottom, 1);
    frame.fillRoundedRect(-42, -64, 84, 128, 12);

    const iconObj = this.buildIcon(scene, icon);
    this.container = scene.add.container(x, y, [frame, iconObj]).setDepth(10);
    this.zone = new Phaser.Geom.Rectangle(x - 42, y - 64, 84, 128);

    // A gentle glow to say "come here".
    scene.tweens.add({
      targets: this.container,
      scale: { from: 1, to: 1.04 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private buildIcon(scene: Phaser.Scene, icon: PortalIcon): Phaser.GameObjects.Container {
    const c = scene.add.container(0, 0);
    switch (icon) {
      case "home": {
        const g = scene.add.graphics();
        g.fillStyle(COLOR.metal, 1);
        g.fillTriangle(-30, 0, 0, -28, 30, 0);
        g.fillRoundedRect(-22, -2, 44, 34, 4);
        g.fillStyle(COLOR.bgBottom, 1);
        g.fillRect(-6, 13, 12, 19);
        c.add(g);
        break;
      }
      case "buttons": {
        // Four face buttons in their real colors.
        c.add(scene.add.circle(0, -18, 11, XBOX_BUTTON.Y));
        c.add(scene.add.circle(0, 18, 11, XBOX_BUTTON.A));
        c.add(scene.add.circle(-18, 0, 11, XBOX_BUTTON.X));
        c.add(scene.add.circle(18, 0, 11, XBOX_BUTTON.B));
        break;
      }
      case "gear": {
        const g = scene.add.graphics();
        drawGear(g, 30, COLOR.gear, COLOR.gearDark);
        c.add(g);
        break;
      }
      case "dualstick": {
        c.add(scene.add.circle(-16, 6, 12, COLOR.metal).setStrokeStyle(3, COLOR.metalDark));
        c.add(scene.add.circle(16, 6, 12, COLOR.water).setStrokeStyle(3, COLOR.waterDark));
        c.add(scene.add.circle(16, 6, 4, COLOR.waterDark));
        break;
      }
      case "gears": {
        const g1 = scene.add.graphics();
        drawGear(g1, 22, COLOR.gear, COLOR.gearDark);
        g1.setPosition(-14, -8);
        const g2 = scene.add.graphics();
        drawGear(g2, 18, COLOR.metal, COLOR.metalDark);
        g2.setPosition(16, 12);
        c.add(g1);
        c.add(g2);
        break;
      }
    }
    return c;
  }

  /** Returns true once, the first time Spark steps inside. */
  check(sx: number, sy: number): boolean {
    if (this.entered) return false;
    if (this.contains(sx, sy)) {
      this.entered = true;
      return true;
    }
    return false;
  }

  contains(sx: number, sy: number): boolean {
    return this.zone.contains(sx, sy);
  }

  destroy(): void {
    this.container.scene.tweens.killTweensOf(this.container);
    this.container.destroy(true);
  }
}
