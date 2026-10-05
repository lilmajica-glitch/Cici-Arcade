import type { GameSession, WrongAnswer } from '../arcade/session'
import { createSessionId } from '../arcade/session'
import { accuracyForGame } from './GameEngine'
import { gameStore } from './gameStore'
import { gameController } from './GameController'

/** Observe existing game transitions without changing rules or scoring. */
export function connectMathToArcade() {
  let startedAt = 0
  let sessionId = ''
  let wrongAnswers: WrongAnswer[] = []
  const send = (message: object) => {
    if (window.parent !== window) window.parent.postMessage(message, window.location.origin)
  }
  const unsubscribe = gameStore.subscribe((state, previous) => {
    if (state.status === 'playing' && state.sessionId !== previous.sessionId) {
      startedAt = performance.now()
      sessionId = createSessionId('math')
      wrongAnswers = []
      send({ type: 'ciciarcade:start', gameId: 'math' })
    }
    if (state.wrongCount > previous.wrongCount && previous.currentQuestion && wrongAnswers.length < 100) {
      const { left, right, operator, answer } = previous.currentQuestion
      wrongAnswers.push({
        question: `${left} ${operator} ${right}`,
        userAnswer: state.digitResult === 'rejected' ? `${previous.input}${state.lastDigit}（错误数字）` : previous.input,
        correctAnswer: String(answer),
        knowledgePoint: operator === '+' ? (left < 10 && right < 10 && answer > 10 ? '凑十法加法' : '20 以内加法')
          : (left >= 10 && left % 10 < right ? '跨十减法' : '20 以内减法'),
      })
    }
    if (state.status === 'victory' && previous.status !== 'victory') {
      const session: GameSession = {
        sessionId, gameId: 'math', gameName: 'Cici 小博士',
        score: state.firstTryCount * 100, accuracy: accuracyForGame(state),
        wrongAnswers: [...wrongAnswers], durationSeconds: Math.round((performance.now() - startedAt) / 1000),
        answeredCount: state.correctCount,
      }
      send({ type: 'ciciarcade:end', session })
    }
  })
  const replay = (event: MessageEvent) => {
    if (event.origin === window.location.origin && event.source === window.parent
      && event.data?.type === 'ciciarcade:replay' && event.data.gameId === 'math') gameController.start()
  }
  window.addEventListener('message', replay)
  return () => { unsubscribe(); window.removeEventListener('message', replay) }
}
