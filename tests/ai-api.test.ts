import { afterEach, describe, expect, it, vi } from 'vitest'
import { createServer } from 'node:http'
import { createAiApi } from '../server/api'
import type { AiEnvironment } from '../server/provider'
import type { GameSession } from '../src/arcade/session'

const httpFetch = globalThis.fetch
const session: GameSession = {
  sessionId: 'math-test-1', gameId: 'math', gameName: 'Cici 小博士', score: 1900,
  accuracy: 95, durationSeconds: 75, answeredCount: 20,
  wrongAnswers: [{ question: '7 + 8', userAnswer: '14', correctAnswer: '15', knowledgePoint: '凑十法加法' }],
}
const report = { summary: '这一局首次答对率为 95%。', weakPoints: ['凑十法加法'], suggestions: ['把 8 拆成 3 和 5，再算 7 + 3 + 5。'] }
const env = { OPENAI_API_KEY: 'test-server-secret', OPENAI_MODEL: 'test-model' }

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

async function withApi(run: (url: string) => Promise<void>, environment: AiEnvironment = {}) {
  const api = createAiApi(environment)
  const server = createServer((req, res) => { void api(req, res, () => { res.writeHead(404); res.end() }) })
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const address = server.address() as { port: number }
  try { await run(`http://127.0.0.1:${address.port}`) }
  finally { await new Promise<void>((done) => server.close(() => done())) }
}

const post = (url: string, body: unknown, path = '/api/ai/summary', headers = {}) => httpFetch(url + path, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
})

function mockOpenai(value: unknown = report) {
  const provider = vi.fn(async () => new Response(JSON.stringify({ status: 'completed', output: [
    { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] },
  ] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  vi.stubGlobal('fetch', provider)
  return provider
}

describe('CiciArcade AI HTTP API', () => {
  it('returns clearly labelled local summary and tutor without a key', async () => {
    const provider = vi.fn(); vi.stubGlobal('fetch', provider)
    await withApi(async (url) => {
      const response = await post(url, session)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ source: 'local', weakPoints: ['凑十法加法'], notice: expect.stringContaining('尚未连接') })
      const reply = await post(url, { session, question: '这道题怎么想？' }, '/api/ai/tutor')
      expect(await reply.json()).toMatchObject({ source: 'local', answer: expect.stringContaining('7 + 8') })
      expect(provider).not.toHaveBeenCalled()
    })
  })

  it('does not invent weaknesses with no wrong answers or no completed questions', async () => {
    await withApi(async (url) => {
      const perfect = await post(url, { ...session, score: 2000, accuracy: 100, wrongAnswers: [] })
      expect((await perfect.json()).weakPoints).toEqual([])
      const empty = await post(url, { ...session, score: 0, accuracy: 0, answeredCount: 0, wrongAnswers: [] })
      expect((await empty.json()).summary).toContain('还没有完成答题')
    })
  })

  it('sends all session fields only to the server provider and parses structured output', async () => {
    const provider = mockOpenai()
    await withApi(async (url) => {
      const response = await post(url, session)
      expect(await response.json()).toEqual({ ...report, source: 'openai' })
      const [endpoint, options] = provider.mock.calls[0] as unknown as [string, RequestInit]
      expect(endpoint).toBe('https://api.openai.com/v1/responses')
      expect(options.headers).toMatchObject({ Authorization: 'Bearer test-server-secret' })
      const input = JSON.parse(options.body as string)
      expect(JSON.parse(input.input)).toEqual(session)
      expect(input).toMatchObject({ model: 'test-model', store: false, text: { format: { type: 'json_schema', strict: true } } })
      expect(JSON.stringify(await (await post(url, session)).json())).not.toContain(env.OPENAI_API_KEY)
    }, env)
  })

  it('uses the same provider for tutor questions with session context', async () => {
    const provider = mockOpenai({ answer: '先把 8 拆成 3 和 5，再凑十。' })
    await withApi(async (url) => {
      const response = await post(url, { session, question: '怎样凑十？' }, '/api/ai/tutor')
      expect(await response.json()).toMatchObject({ source: 'openai', answer: expect.stringContaining('拆成') })
      const options = (provider.mock.calls[0] as unknown as [string, RequestInit])[1]
      expect(JSON.parse(JSON.parse(options.body as string).input)).toMatchObject({ session, question: '怎样凑十？' })
    }, env)
  })

  it('validates fields, JSON, content type, HTTP method, origin, and body size', async () => {
    const provider = vi.fn(); vi.stubGlobal('fetch', provider)
    await withApi(async (url) => {
      for (const invalid of [null, {}, { ...session, accuracy: 101 }, { ...session, durationSeconds: -1 }, { ...session, wrongAnswers: [{}] }, { ...session, gameId: 'unknown' }]) {
        expect((await post(url, invalid)).status).toBe(400)
      }
      expect((await post(url, { session, question: '' }, '/api/ai/tutor')).status).toBe(400)
      expect((await httpFetch(url + '/api/ai/summary')).status).toBe(405)
      expect((await post(url, session, '/api/ai/summary', { Origin: 'https://other.example' })).status).toBe(403)
      expect((await httpFetch(url + '/api/ai/summary', { method: 'POST', body: '{', headers: { 'Content-Type': 'application/json' } })).status).toBe(400)
      expect((await post(url, session, '/api/ai/summary', { 'Content-Type': 'text/plain' })).status).toBe(415)
      expect((await post(url, { ...session, extra: 'x'.repeat(30_000) })).status).toBe(413)
      expect(provider).not.toHaveBeenCalled()
    }, env)
  })

  it.each(['provider', 'format', 'timeout'])('returns safe, retryable errors for %s failures', async (failure) => {
    if (failure === 'provider') vi.stubGlobal('fetch', vi.fn(async () => new Response('test-server-secret', { status: 401 })))
    if (failure === 'format') mockOpenai({ summary: '缺少建议' })
    if (failure === 'timeout') vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('test-server-secret', 'TimeoutError') }))
    await withApi(async (url) => {
      const response = await post(url, session)
      expect(response.status).toBe(failure === 'timeout' ? 504 : 502)
      const body = await response.text()
      expect(body).not.toContain('test-server-secret')
      expect(body).toContain('error')
    }, env)
  })

  it('limits repeated requests to avoid unlimited provider calls', async () => {
    await withApi(async (url) => {
      for (let index = 0; index < 20; index++) expect((await post(url, session)).status).toBe(200)
      const limited = await post(url, session)
      expect(limited.status).toBe(429)
      expect(limited.headers.get('retry-after')).toBe('60')
    })
  })
})
