export const PLAYER_STATES = [
  'RUN',
  'JUMP',
  'LONG_JUMP',
  'VAULT',
  'SLIDE',
  'WALL_RUN',
  'ROLL',
  'DASH',
  'LAND',
  'STUMBLE',
] as const;

export type PlayerState = (typeof PLAYER_STATES)[number];
export type ParkourAction = Exclude<PlayerState, 'RUN' | 'LAND' | 'STUMBLE'>;

const TRANSITIONS: Record<PlayerState, readonly PlayerState[]> = {
  RUN: ['JUMP', 'LONG_JUMP', 'VAULT', 'SLIDE', 'WALL_RUN', 'ROLL', 'DASH', 'STUMBLE'],
  JUMP: ['LAND', 'RUN', 'STUMBLE'],
  LONG_JUMP: ['LAND', 'RUN', 'STUMBLE'],
  VAULT: ['LAND', 'RUN', 'STUMBLE'],
  SLIDE: ['LAND', 'RUN', 'STUMBLE'],
  WALL_RUN: ['LAND', 'RUN', 'STUMBLE'],
  ROLL: ['RUN', 'LAND', 'STUMBLE'],
  DASH: ['RUN', 'LAND', 'STUMBLE'],
  LAND: ['RUN', 'JUMP', 'LONG_JUMP', 'VAULT', 'SLIDE', 'STUMBLE'],
  STUMBLE: ['RUN', 'LAND'],
};

export class PlayerStateMachine {
  private current: PlayerState = 'RUN';

  get state(): PlayerState {
    return this.current;
  }

  transition(next: PlayerState): boolean {
    if (next === this.current) return true;
    if (!TRANSITIONS[this.current].includes(next)) return false;
    this.current = next;
    return true;
  }

  reset(): void {
    this.current = 'RUN';
  }
}
