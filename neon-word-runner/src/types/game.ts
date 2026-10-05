export type QuestionDirection = 'zh-en' | 'en-zh';

export interface RunOptions {
  questionDirection: QuestionDirection;
  soundVolume: number;
  reducedMotion: boolean;
}

export interface RunResult {
  score: number;
  accuracy: number;
  correct: number;
  wrong: number;
  maxCombo: number;
  wordsReviewed: number;
  durationMs: number;
  wrongAnswers: import('../../../src/arcade/session').WrongAnswer[];
}

export const DEFAULT_RUN_OPTIONS: RunOptions = {
  questionDirection: 'zh-en',
  soundVolume: 0.7,
  reducedMotion: false,
};
