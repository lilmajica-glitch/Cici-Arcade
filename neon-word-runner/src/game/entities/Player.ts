import Phaser from 'phaser';
import type { ParkourAction, PlayerState } from '../systems/PlayerStateMachine';
import { PlayerStateMachine } from '../systems/PlayerStateMachine';
import { GROUND_TOP } from '../world/Background';

export const RUN_SPEED = 390;
const START_X = 190;
const BASE_Y = GROUND_TOP - 68;
const VISUAL_SCALE = 0.55;
const VISUAL_BASELINE_OFFSET = 73.5;
// These offsets keep the scaled Arcade body centered and grounded in 256×384 atlas frames.
const NORMAL_BODY = { width: 190, height: 400, offsetX: 33, offsetY: 72 };
const SLIDE_BODY = { width: 190, height: 200, offsetX: 33, offsetY: 272 };
const AIR_ACTIONS: Partial<Record<ParkourAction, { duration: number; height: number }>> = {
  JUMP: { duration: 1_400, height: 230 },
  LONG_JUMP: { duration: 1_650, height: 250 },
  VAULT: { duration: 1_050, height: 190 },
  WALL_RUN: { duration: 1_250, height: 245 },
};
const STATE_ANIMATIONS: Record<PlayerState, string> = {
  RUN: 'runner-run',
  JUMP: 'runner-jump',
  LONG_JUMP: 'runner-long-jump',
  VAULT: 'runner-vault',
  SLIDE: 'runner-slide',
  WALL_RUN: 'runner-wall-run',
  ROLL: 'runner-roll',
  DASH: 'runner-dash',
  LAND: 'runner-land',
  STUMBLE: 'runner-stumble',
};

interface RunnerGhost {
  sprite: Phaser.GameObjects.Sprite;
  remainingMs: number;
}

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly stateMachine = new PlayerStateMachine();
  private readonly visual: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Ellipse;
  private readonly trail: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly ghosts: RunnerGhost[];
  private ghostCursor = 0;
  private ghostEmitRemaining = 0;
  private actionElapsed = 0;
  private actionDuration = 0;
  private actionHeight = 0;
  private slideRemaining = 0;
  private stumbleRemaining = 0;
  private landingRemaining = 0;
  private reducedMotion = false;
  private fever = false;
  private runActive = false;
  private activeAnimation?: string;

  constructor(scene: Phaser.Scene, x: number) {
    this.sprite = scene.physics.add.sprite(x, BASE_Y, 'runner-atlas', 'run/000')
      .setOrigin(0.5, 0.5)
      .setScale(0.24)
      .setVisible(false);
    this.sprite.setCollideWorldBounds(false);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    this.applyBody(NORMAL_BODY);

    this.glow = scene.add.ellipse(x, GROUND_TOP - 48, 94, 154, 0x258cbb, 0.2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(4);
    this.visual = scene.add.sprite(x, BASE_Y, 'runner-atlas', 'run/000')
      .setOrigin(0.5, 1)
      .setScale(VISUAL_SCALE)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(6);
    this.ghosts = Array.from({ length: 6 }, () => ({
      sprite: scene.add.sprite(x, BASE_Y, 'runner-atlas', 'run/000')
        .setOrigin(0.5, 1)
        .setScale(VISUAL_SCALE)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(5.5)
        .setVisible(false),
      remainingMs: 0,
    }));
    this.trail = scene.add.particles(0, 0, 'neon-particle', {
      follow: this.visual,
      followOffset: { x: -30, y: 24 },
      speed: { min: 20, max: 72 },
      angle: { min: 160, max: 200 },
      lifespan: { min: 160, max: 360 },
      scale: { start: 0.42, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: [0x1bd8ef, 0x8d57f6, 0xf43caa],
      blendMode: 'ADD',
      frequency: 52,
      quantity: 1,
      maxParticles: 120,
    }).setDepth(5);
    this.trail.stop();
  }

  get state(): PlayerState {
    return this.stateMachine.state;
  }

  get animationKey(): string | undefined {
    return this.visual.anims.currentAnim?.key;
  }

  setRunSpeed(speed: number): void {
    this.sprite.setVelocityX(speed);
  }

  start(): void {
    this.runActive = true;
    this.stateMachine.reset();
    this.sprite.setPosition(START_X, BASE_Y);
    this.sprite.setVelocity(0, 0);
    this.applyBody(NORMAL_BODY);
    this.visual.setPosition(this.sprite.x, this.sprite.y + VISUAL_BASELINE_OFFSET);
    this.visual.setScale(VISUAL_SCALE);
    this.visual.setAngle(0);
    this.activeAnimation = 'runner-run';
    this.visual.anims.play(this.activeAnimation, true);
    this.ghostEmitRemaining = 0;
    if (!this.reducedMotion) this.trail.start();
  }

  startAction(action: ParkourAction): boolean {
    if (!this.stateMachine.transition(action)) return false;
    this.actionElapsed = 0;
    const airAction = AIR_ACTIONS[action];
    if (airAction) {
      this.actionDuration = airAction.duration;
      this.actionHeight = airAction.height;
    } else if (action === 'SLIDE' || action === 'ROLL') {
      this.applyBody(SLIDE_BODY);
      this.slideRemaining = 900;
    } else if (action === 'DASH') {
      this.applyBody(SLIDE_BODY);
      this.actionDuration = 650;
    }
    return true;
  }

  stumble(durationMs = 900): void {
    if (this.state === 'STUMBLE') return;
    if (!this.stateMachine.transition('STUMBLE')) return;
    this.stumbleRemaining = durationMs;
    this.sprite.setY(BASE_Y);
    this.sprite.setVelocityY(0);
    this.applyBody(NORMAL_BODY);
  }

  update(deltaMs: number): void {
    let state = this.state;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(0);

    if (AIR_ACTIONS[state as ParkourAction]) {
      this.actionElapsed += deltaMs;
      const progress = Phaser.Math.Clamp(this.actionElapsed / this.actionDuration, 0, 1);
      const lift = Math.sin(progress * Math.PI) * this.actionHeight;
      this.sprite.setY(BASE_Y - lift);
      if (progress >= 1) {
        this.sprite.setY(BASE_Y);
        this.stateMachine.transition('LAND');
        this.landingRemaining = 120;
      }
    } else if (state === 'SLIDE' || state === 'ROLL') {
      this.slideRemaining -= deltaMs;
      this.sprite.setY(BASE_Y);
      if (this.slideRemaining <= 0) {
        this.applyBody(NORMAL_BODY);
        this.stateMachine.transition('RUN');
      }
    } else if (state === 'DASH') {
      this.actionElapsed += deltaMs;
      this.sprite.setY(BASE_Y);
      if (this.actionElapsed >= this.actionDuration) {
        this.applyBody(NORMAL_BODY);
        this.stateMachine.transition('RUN');
      }
    } else if (state === 'STUMBLE') {
      this.stumbleRemaining -= deltaMs;
      this.sprite.setY(BASE_Y);
      if (this.stumbleRemaining <= 0) {
        this.applyBody(NORMAL_BODY);
        this.stateMachine.transition('RUN');
      }
    }

    state = this.state;
    if (state === 'LAND') {
      this.landingRemaining -= deltaMs;
      if (this.landingRemaining <= 0) this.stateMachine.transition('RUN');
    }
    state = this.state;
    this.visual.setPosition(this.sprite.x, this.sprite.y + VISUAL_BASELINE_OFFSET);
    this.visual.setScale(VISUAL_SCALE);
    this.visual.setAngle(0);
    this.playStateAnimation(state);
    this.glow.setPosition(this.sprite.x, this.sprite.y + 8);
    this.updateGhosts(deltaMs, state === 'DASH' || this.fever);
  }

  setFever(active: boolean): void {
    this.fever = active;
    this.trail.setFrequency(active ? 28 : 52);
    this.trail.maxParticles = active ? 240 : 120;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced || !this.runActive) {
      this.trail.stop();
      this.ghosts.forEach((ghost) => {
        ghost.remainingMs = 0;
        ghost.sprite.setVisible(false);
      });
    }
    else this.trail.start();
  }

  reset(): void {
    this.runActive = false;
    this.trail.stop();
    this.stateMachine.reset();
    this.actionElapsed = 0;
    this.actionDuration = 0;
    this.actionHeight = 0;
    this.slideRemaining = 0;
    this.stumbleRemaining = 0;
    this.landingRemaining = 0;
    this.ghostEmitRemaining = 0;
    this.setFever(false);
    this.ghosts.forEach((ghost) => {
      ghost.remainingMs = 0;
      ghost.sprite.setVisible(false);
    });
    this.sprite.setPosition(START_X, BASE_Y);
    this.sprite.setVelocity(0, 0);
    this.applyBody(NORMAL_BODY);
    this.visual.setPosition(START_X, BASE_Y + VISUAL_BASELINE_OFFSET);
    this.visual.setScale(VISUAL_SCALE);
    this.visual.setAngle(0);
    this.visual.anims.stop();
    this.visual.setFrame('run/000');
    this.activeAnimation = undefined;
    this.glow.setPosition(START_X, GROUND_TOP - 60);
  }

  finish(): void {
    this.runActive = false;
    this.sprite.setVelocityX(0);
    this.trail.stop();
    this.ghosts.forEach((ghost) => ghost.sprite.setVisible(false));
    this.visual.anims.pause();
  }

  private updateGhosts(deltaMs: number, enabled: boolean): void {
    for (const ghost of this.ghosts) {
      if (ghost.remainingMs <= 0) continue;
      ghost.remainingMs -= deltaMs;
      ghost.sprite.setAlpha(0.3 * Phaser.Math.Clamp(ghost.remainingMs / 220, 0, 1));
      if (ghost.remainingMs <= 0) ghost.sprite.setVisible(false);
    }

    if (!enabled || this.reducedMotion) {
      this.ghostEmitRemaining = 0;
      return;
    }
    this.ghostEmitRemaining -= deltaMs;
    if (this.ghostEmitRemaining > 0) return;
    this.ghostEmitRemaining = this.fever ? 78 : 105;
    const ghost = this.ghosts[this.ghostCursor];
    this.ghostCursor = (this.ghostCursor + 1) % this.ghosts.length;
    ghost.remainingMs = 220;
    ghost.sprite
      .setPosition(this.visual.x - 20, this.visual.y)
      .setScale(this.visual.scaleX, this.visual.scaleY)
      .setAngle(this.visual.angle)
      .setFrame(this.visual.frame.name)
      .setTint(this.fever ? 0xf24ff0 : 0x42e8f0)
      .setAlpha(0.3)
      .setVisible(true);
  }

  private applyBody(shape: { width: number; height: number; offsetX: number; offsetY: number }): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(shape.width, shape.height);
    body.setOffset(shape.offsetX, shape.offsetY);
    body.updateFromGameObject();
  }

  private playStateAnimation(state: PlayerState): void {
    const animation = STATE_ANIMATIONS[state];
    if (animation === this.activeAnimation) return;
    this.activeAnimation = animation;
    this.visual.anims.play(animation, true);
  }
}
