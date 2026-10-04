import Phaser from 'phaser';
import { createNeonTextures } from '../systems/NeonTextures';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_TOP = 600;

export class Background {
  private readonly sky: Phaser.GameObjects.Graphics;
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly mid: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene) {
    createNeonTextures(scene);

    this.sky = scene.add.graphics().setScrollFactor(0).setDepth(-100);
    this.sky.fillGradientStyle(0x070b18, 0x070b18, 0x17142c, 0x17142c, 1);
    this.sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.sky.fillStyle(0x8c267f, 0.12);
    this.sky.fillCircle(925, 315, 220);
    this.sky.fillStyle(0x127f9b, 0.08);
    this.sky.fillCircle(275, 390, 200);

    this.far = scene.add.tileSprite(0, 112, GAME_WIDTH, 360, 'city-far')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-80)
      .setAlpha(0.82);
    this.mid = scene.add.tileSprite(0, 334, GAME_WIDTH, 260, 'city-mid')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-50)
      .setAlpha(0.92);
    scene.add.rectangle(0, GROUND_TOP, GAME_WIDTH, GAME_HEIGHT - GROUND_TOP, 0x080c16)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);
  }

  update(scrollX: number): void {
    this.far.tilePositionX = scrollX * 0.1;
    this.mid.tilePositionX = scrollX * 0.3;
  }
}
