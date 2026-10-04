import type { ParkourAction } from './PlayerStateMachine';
import type { Player } from '../entities/Player';
import type { SpeedSystem } from './SpeedSystem';
import { TEST_ROUTE, type TestObstacle } from '../world/TestCourse';

const START_X = 190;

export interface ParkourCallbacks {
  onActionStart?: (action: ParkourAction) => void;
  onActionSuccess?: (action: ParkourAction) => void;
  onFailure?: (reason: string) => void;
}

export class ParkourController {
  private readonly player: Player;
  private readonly speed: SpeedSystem;
  private readonly route: readonly TestObstacle[];
  private routeIndex = 0;
  private previousX = START_X;
  private queuedAction: ParkourAction | null = null;
  private activeAction: ParkourAction | null = null;
  private failureAlreadyApplied = false;
  private readonly callbacks: ParkourCallbacks;

  constructor(
    player: Player,
    speed: SpeedSystem,
    route: readonly TestObstacle[] = TEST_ROUTE,
    callbacks: ParkourCallbacks = {},
  ) {
    this.player = player;
    this.speed = speed;
    this.route = route;
    this.callbacks = callbacks;
  }

  get status(): string {
    if (this.activeAction) return `CLEAR THE ${this.activeAction.replace('_', ' ')} · ACTION LOCKED`;
    const next = this.route[this.routeIndex];
    if (!next) return 'TEST ROUTE COMPLETE · RECOVERY REMAINS ACTIVE';
    const key = this.keyFor(next.action);
    const queued = this.queuedAction ? ` · LOCKED ${this.queuedAction}` : '';
    return `NEXT ${next.action.replace('_', ' ')} · PRESS ${key}${queued}`;
  }

  queueAction(action: ParkourAction): void {
    if (this.routeIndex >= this.route.length) return;
    this.queuedAction = action;
  }

  resolveQuestion(action: ParkourAction, correct: boolean): void {
    if (correct) this.queueAction(action);
    else {
      this.queuedAction = null;
      this.failureAlreadyApplied = true;
      this.stumble('incorrect or timed-out answer');
    }
  }

  update(currentX: number): void {
    const next = this.route[this.routeIndex];
    if (next && this.previousX < next.triggerX && currentX >= next.triggerX) {
      const selected = this.queuedAction;
      this.queuedAction = null;
      this.routeIndex += 1;
      if (selected === next.action && this.player.startAction(next.action)) {
        this.activeAction = next.action;
        if (next.action === 'DASH') this.speed.beginDash(650);
        this.callbacks.onActionStart?.(next.action);
      } else {
        if (!this.failureAlreadyApplied) this.stumble(`missed ${next.action} trigger`);
      }
      this.failureAlreadyApplied = false;
    }

    if (this.activeAction) {
      const previous = this.route[this.routeIndex - 1];
      if (previous && currentX >= previous.exitX) {
        const completed = this.activeAction;
        this.activeAction = null;
        if (this.player.state === 'RUN' || this.player.state === 'LAND') {
          this.callbacks.onActionSuccess?.(completed);
        } else {
          this.stumble(`${completed} had not cleared at its exit`);
        }
      }
    }
    this.previousX = currentX;
  }

  forceStumble(reason = 'obstacle contact'): void {
    this.stumble(reason);
  }

  reset(): void {
    this.routeIndex = 0;
    this.previousX = START_X;
    this.queuedAction = null;
    this.activeAction = null;
    this.failureAlreadyApplied = false;
  }

  private stumble(reason: string): void {
    if (this.player.state === 'STUMBLE') return;
    this.activeAction = null;
    this.queuedAction = null;
    this.speed.beginStumble(900);
    this.player.stumble(900);
    this.callbacks.onFailure?.(reason);
  }

  private keyFor(action: ParkourAction): string {
    switch (action) {
      case 'JUMP': return 'J';
      case 'VAULT': return 'V';
      case 'SLIDE': return 'S';
      case 'LONG_JUMP': return 'L';
      case 'WALL_RUN': return 'W';
      case 'ROLL': return 'R';
      case 'DASH': return 'D';
    }
  }
}
