import Phaser from 'phaser';
import { GAME_WIDTH, GROUND_TOP } from './Background';

export interface CourseGap {
  startX: number;
  endX: number;
}

interface GroundSegment {
  colliders: Array<Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.StaticBody }>;
  surfaces: Phaser.GameObjects.TileSprite[];
  edges: Phaser.GameObjects.Rectangle[];
  voids: Phaser.GameObjects.Rectangle[];
  right: number;
}

const SEGMENT_WIDTH = 900;

export class Ground {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private readonly scene: Phaser.Scene;
  private readonly gaps: readonly CourseGap[];
  private readonly segments: GroundSegment[] = [];
  private cursor = 0;

  constructor(scene: Phaser.Scene, gaps: readonly CourseGap[] = []) {
    this.scene = scene;
    this.gaps = gaps;
    this.group = scene.physics.add.staticGroup();
    for (let index = 0; index < 4; index += 1) {
      this.addSegment(-900 + index * SEGMENT_WIDTH);
    }
    this.cursor = -900 + this.segments.length * SEGMENT_WIDTH;
  }

  update(cameraScrollX: number): void {
    const aheadTo = cameraScrollX + GAME_WIDTH + SEGMENT_WIDTH;
    while (this.cursor < aheadTo) {
      const recycled = this.segments.find((segment) => segment.right < cameraScrollX - 300);
      if (recycled) this.moveSegment(recycled, this.cursor);
      else this.addSegment(this.cursor);
      this.cursor += SEGMENT_WIDTH;
    }
  }

  reset(): void {
    this.segments.forEach((segment, index) => {
      this.moveSegment(segment, -900 + index * SEGMENT_WIDTH);
    });
    this.cursor = -900 + this.segments.length * SEGMENT_WIDTH;
  }

  private addSegment(left: number): void {
    const segment: GroundSegment = { colliders: [], surfaces: [], edges: [], voids: [], right: left };
    this.segments.push(segment);
    this.positionSegment(segment, left);
  }

  private moveSegment(segment: GroundSegment, left: number): void {
    segment.colliders.forEach((collider) => this.group.remove(collider, true, true));
    segment.surfaces.forEach((surface) => surface.destroy());
    segment.edges.forEach((edge) => edge.destroy());
    segment.voids.forEach((voidShape) => voidShape.destroy());
    segment.colliders = [];
    segment.surfaces = [];
    segment.edges = [];
    segment.voids = [];
    this.positionSegment(segment, left);
  }

  private positionSegment(segment: GroundSegment, left: number): void {
    const right = left + SEGMENT_WIDTH;
    const holes = this.gaps
      .filter((gap) => gap.startX < right && gap.endX > left)
      .map((gap) => ({ startX: Math.max(left, gap.startX), endX: Math.min(right, gap.endX) }))
      .sort((first, second) => first.startX - second.startX);
    const floorRanges: Array<{ startX: number; endX: number }> = [];
    let floorStart = left;
    for (const hole of holes) {
      if (hole.startX > floorStart) floorRanges.push({ startX: floorStart, endX: hole.startX });
      floorStart = Math.max(floorStart, hole.endX);
    }
    if (floorStart < right) floorRanges.push({ startX: floorStart, endX: right });

    for (const range of floorRanges) {
      const width = range.endX - range.startX;
      if (width < 2) continue;
      const collider = this.group.create(range.startX, GROUND_TOP, 'neon-ground')
        .setOrigin(0, 0)
        .setVisible(false)
        .setDisplaySize(width, 220) as Phaser.Physics.Arcade.Sprite & { body: Phaser.Physics.Arcade.StaticBody };
      collider.refreshBody();
      segment.colliders.push(collider);
      segment.surfaces.push(this.scene.add.tileSprite(range.startX, GROUND_TOP, width, 124, 'neon-ground')
        .setOrigin(0, 0)
        .setDepth(-8));
      segment.edges.push(this.scene.add.rectangle(range.startX + width / 2, GROUND_TOP, width, 3, 0x21d8eb, 0.94)
        .setDepth(-7));
    }

    for (const hole of holes) {
      const width = hole.endX - hole.startX;
      segment.voids.push(this.scene.add.rectangle(hole.startX + width / 2, GROUND_TOP + 110, width, 220, 0x030610, 1)
        .setDepth(-7));
      if (hole.startX >= left) {
        segment.edges.push(this.scene.add.rectangle(hole.startX, GROUND_TOP + 8, 3, 18, 0xf04fba, 1)
          .setDepth(-6));
      }
      if (hole.endX <= right) {
        segment.edges.push(this.scene.add.rectangle(hole.endX, GROUND_TOP + 8, 3, 18, 0x42e8f0, 1)
          .setDepth(-6));
      }
    }
    segment.right = right;
  }
}
