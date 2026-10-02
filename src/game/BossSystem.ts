export const TOTAL_QUESTIONS = 20 as const
export const MAX_BOSS_HP = 100

/** HP is a projection of completed questions, never an independent damage ledger. */
export function bossHpForProgress(questionIndex: number, totalQuestions = TOTAL_QUESTIONS): number {
  const completed = Math.min(totalQuestions, Math.max(0, questionIndex))
  return Math.round(MAX_BOSS_HP * (1 - completed / totalQuestions))
}
