export type GameId = 'math' | 'neon'

export function createSessionId(gameId: GameId): string {
  return `${gameId}-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-')}`
}

export type WrongAnswer = {
  question: string
  userAnswer: string
  correctAnswer: string
  knowledgePoint: string
}

export type GameSession = {
  sessionId: string
  gameId: GameId
  gameName: string
  score: number
  accuracy: number
  wrongAnswers: WrongAnswer[]
  durationSeconds: number
  answeredCount: number
}

export type LearningReport = {
  summary: string
  weakPoints: string[]
  suggestions: string[]
}

export type AiSummary = LearningReport & {
  source: 'openai' | 'local'
  notice?: string
}

export type TutorReply = {
  answer: string
  source: 'openai' | 'local'
  notice?: string
}

const shortText = (value: unknown, max = 300): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max

/** The same small contract validates iframe messages and API input. */
export function isGameSession(value: unknown): value is GameSession {
  if (!value || typeof value !== 'object') return false
  const session = value as GameSession
  return shortText(session.sessionId, 120)
    && (session.gameId === 'math' || session.gameId === 'neon')
    && shortText(session.gameName, 80)
    && Number.isFinite(session.score) && session.score >= 0 && session.score <= 10_000_000
    && Number.isFinite(session.accuracy) && session.accuracy >= 0 && session.accuracy <= 100
    && Number.isFinite(session.durationSeconds) && session.durationSeconds >= 0 && session.durationSeconds <= 604_800
    && Number.isInteger(session.answeredCount) && session.answeredCount >= 0 && session.answeredCount <= 1000
    && Array.isArray(session.wrongAnswers) && session.wrongAnswers.length <= 100
    && session.wrongAnswers.every((answer) => answer && typeof answer === 'object'
      && shortText(answer.question) && shortText(answer.userAnswer)
      && shortText(answer.correctAnswer) && shortText(answer.knowledgePoint, 100))
}

export function isLearningReport(value: unknown): value is LearningReport {
  if (!value || typeof value !== 'object') return false
  const report = value as LearningReport
  return shortText(report.summary, 2000)
    && Array.isArray(report.weakPoints) && report.weakPoints.length <= 10
    && report.weakPoints.every((point) => shortText(point, 500))
    && Array.isArray(report.suggestions) && report.suggestions.length > 0 && report.suggestions.length <= 10
    && report.suggestions.every((suggestion) => shortText(suggestion, 500))
}
