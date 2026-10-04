import Phaser from 'phaser';
import type { ParkourAction } from '../systems/PlayerStateMachine';
import { GROUND_TOP } from './Background';

export interface TestObstacle {
  action: ParkourAction;
  triggerX: number;
  exitX: number;
}

export const TEST_ROUTE: readonly TestObstacle[] = [
  { action: 'VAULT', triggerX: 610, exitX: 1100 },
  { action: 'SLIDE', triggerX: 1410, exitX: 1880 },
  { action: 'JUMP', triggerX: 2210, exitX: 2730 },
];

export class TestCourse {
  readonly obstacles: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Phaser.Scene, route: readonly TestObstacle[] = TEST_ROUTE) {
    this.obstacles = scene.physics.add.staticGroup();
    for (const obstacle of route) this.addRouteObstacle(scene, obstacle);
  }

  private addRouteObstacle(scene: Phaser.Scene, obstacle: TestObstacle): void {
    const x = obstacle.triggerX + this.obstacleLead(obstacle.action);
    switch (obstacle.action) {
      case 'VAULT':
        this.addObstacle(scene, x, GROUND_TOP - 44, 'obstacle-vault', 88, 88);
        break;
      case 'SLIDE':
        this.addObstacle(scene, x, GROUND_TOP - 79, 'obstacle-slide', 160, 26);
        break;
      case 'JUMP':
        this.addObstacle(scene, x, GROUND_TOP - 62, 'obstacle-jump', 88, 124);
        break;
      case 'LONG_JUMP':
        // The gap is cut from the scrolling ground at the action trigger.
        break;
      case 'WALL_RUN':
        this.addObstacle(scene, x, GROUND_TOP - 78, 'obstacle-wall', 128, 156);
        break;
      case 'ROLL':
        this.addObstacle(scene, x, GROUND_TOP - 82, 'obstacle-roll', 160, 36);
        break;
      case 'DASH':
        this.addObstacle(scene, x, GROUND_TOP - 72, 'obstacle-dash', 180, 84, { width: 180, height: 20 });
        break;
    }
  }

  private obstacleLead(action: ParkourAction): number {
    if (action === 'SLIDE' || action === 'ROLL' || action === 'DASH') return 230;
    if (action === 'WALL_RUN') return 280;
    return action === 'VAULT' ? 240 : 250;
  }

  private addObstacle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    width: number,
    height: number,
    hitbox?: { width: number; height: number },
  ): void {
    const obstacle = scene.physics.add.staticImage(x, y, texture)
      .setDisplaySize(width, height)
      .setDepth(1);
    obstacle.refreshBody();
    if (hitbox) {
      (obstacle.body as Phaser.Physics.Arcade.StaticBody).setSize(hitbox.width, hitbox.height, true);
    }
    this.obstacles.add(obstacle);
  }
}
