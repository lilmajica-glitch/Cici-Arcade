import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.atlas(
      'runner-atlas',
      `${import.meta.env.BASE_URL}assets/characters/runner-atlas.png`,
      `${import.meta.env.BASE_URL}assets/characters/runner-atlas.json`,
    );
  }

  create(): void {
    this.scene.start('Game');
  }
}
