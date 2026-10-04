import type { TestObstacle } from '../world/TestCourse';
import type { ParkourAction } from './PlayerStateMachine';

export const QUESTION_START_TIMES_MS = [
  5_000, 15_000, 25_000, 35_000,
  45_000, 50_000, 55_000, 60_000, 65_000,
  70_000, 75_000, 80_000,
] as const;
export const QUESTION_ACTIONS: readonly ParkourAction[] = [
  'VAULT', 'SLIDE', 'LONG_JUMP', 'WALL_RUN', 'DASH',
  'ROLL', 'JUMP', 'VAULT', 'SLIDE', 'LONG_JUMP', 'WALL_RUN', 'DASH',
];
export const START_X = 190;

const CLEARANCE_DISTANCE: Readonly<Record<ParkourAction, number>> = {
  JUMP: 820,
  LONG_JUMP: 900,
  VAULT: 560,
  SLIDE: 560,
  WALL_RUN: 800,
  ROLL: 560,
  DASH: 560,
};

export function questionWindowMs(index: number): number {
  if (index < 4) return 7_000;
  return index === QUESTION_START_TIMES_MS.length - 1 ? 3_000 : 3_500;
}

export function buildVocabularyRoute(): TestObstacle[] {
  return QUESTION_ACTIONS.map((action, index) => {
    const questionEnd = QUESTION_START_TIMES_MS[index] + questionWindowMs(index);
    const triggerAt = questionEnd + (index < 4 ? 2_000 : 1_000);
    return {
      action,
      triggerX: START_X + runnerDistanceAt(triggerAt),
      exitX: START_X + runnerDistanceAt(triggerAt) + CLEARANCE_DISTANCE[action],
    };
  });
}

function runnerDistanceAt(timeMs: number): number {
  const seconds = timeMs / 1_000;
  const rampSeconds = 80 / 1.2;
  if (seconds <= rampSeconds) return 390 * seconds + 0.6 * seconds * seconds;
  const rampDistance = 390 * rampSeconds + 0.6 * rampSeconds * rampSeconds;
  return rampDistance + 470 * (seconds - rampSeconds);
}
