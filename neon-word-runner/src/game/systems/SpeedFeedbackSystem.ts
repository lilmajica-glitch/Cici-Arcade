import Phaser from 'phaser';

interface SpeedLine {
  x: number;
  y: number;
  length: number;
}

export class SpeedFeedbackSystem {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly camera: Phaser.Cameras.Scene2D.Camera;
  private readonly lines: SpeedLine[];
  private offset = 0;
  private reducedMotion = false;
  private fever = false;

  constructor(scene: Phaser.Scene, camera: Phaser.Cameras.Scene2D.Camera) {
    this.camera = camera;
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(2)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.lines = Array.from({ length: 48 }, (_, index) => ({
      x: (index * 197 + 31) % 1_280,
      y: 220 + ((index * 83 + 17) % 350),
      length: 24 + ((index * 29) % 86),
    }));
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) this.graphics.clear();
  }

  setFever(active: boolean): void {
    this.fever = active;
  }

  pulse(kind: 'action' | 'land' | 'combo' | 'fever' | 'failure'): void {
    if (this.reducedMotion) return;
    const duration = kind === 'failure' ? 110 : kind === 'fever' ? 100 : 78;
    const intensity = kind === 'failure' ? 0.003 : kind === 'fever' ? 0.0025 : 0.0012;
    this.camera.shake(duration, intensity);
    if (kind === 'combo' || kind === 'fever') {
      const color = kind === 'fever' ? 0xed54e8 : 0x43e7f2;
      this.camera.flash(95, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, true);
    }
  }

  update(deltaMs: number, speed: number): void {
    if (this.reducedMotion) return;
    this.offset = (this.offset + speed * deltaMs * 0.018) % 1_280;
    const intensity = this.fever ? 0.16 : Phaser.Math.Clamp((speed - 400) / 1_400, 0, 0.07);
    if (intensity <= 0) {
      this.graphics.clear();
      return;
    }
    this.graphics.clear();
    this.graphics.lineStyle(1, this.fever ? 0xd74fef : 0x42e8f0, intensity);
    const lineCount = this.fever ? 48 : speed > 435 ? 28 : 16;
    for (let index = 0; index < lineCount; index += 1) {
      const line = this.lines[index];
      const x = (line.x - this.offset + 1_280) % 1_280;
      this.graphics.lineBetween(x, line.y, x + line.length, line.y - 2);
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
