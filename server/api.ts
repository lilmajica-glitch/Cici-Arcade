import type { IncomingMessage, ServerResponse } from 'node:http'
import { isGameSession } from '../src/arcade/session.ts'
import { AiError, summarize, tutor } from './provider.ts'
import type { AiEnvironment } from './provider.ts'

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  response.end(JSON.stringify(body))
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new AiError(415, '请使用 application/json 发送答题数据。')
  }
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.from(chunk)
    size += buffer.length
    if (size > 24_576) throw new AiError(413, '本局数据过大，请减少错题内容。')
    chunks.push(buffer)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw new AiError(400, '答题数据不是有效 JSON。') }
}

/** One middleware serves development, preview, and the production Node server. */
export function createAiApi(env: AiEnvironment) {
  const requests = new Map<string, { count: number; until: number }>()
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const path = request.url?.split('?')[0]
    if (!path?.startsWith('/api/')) { next(); return }
    try {
      if (path !== '/api/ai/summary' && path !== '/api/ai/tutor') throw new AiError(404, '没有这个 API。')
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST')
        throw new AiError(405, '请使用 POST 请求。')
      }
      if (request.headers.origin) {
        let originHost = ''
        try { originHost = new URL(request.headers.origin).host } catch { /* rejected below */ }
        if (originHost !== request.headers.host) throw new AiError(403, '请从 CiciArcade 网站内请求导师。')
      }
      const body = await readBody(request)
      const session = path.endsWith('/summary') ? body : (body as { session?: unknown } | null)?.session
      if (!isGameSession(session)) throw new AiError(400, '请提供有效的游戏名称、得分、正确率、错题和时长。')
      const question = (body as { question?: unknown }).question
      if (path.endsWith('/tutor') && (typeof question !== 'string' || !question.trim() || question.length > 500)) {
        throw new AiError(400, '请输入 1 到 500 字的学习问题。')
      }
      const now = Date.now()
      for (const [key, value] of requests) if (value.until <= now) requests.delete(key)
      const ip = request.socket.remoteAddress || 'local'
      const bucket = requests.get(ip) || { count: 0, until: now + 60_000 }
      if (bucket.count >= 20 || requests.size >= 1000 && !requests.has(ip)) {
        response.setHeader('Retry-After', '60')
        throw new AiError(429, '导师请求有点多，请一分钟后再试。')
      }
      bucket.count += 1
      requests.set(ip, bucket)
      const result = path.endsWith('/summary') ? await summarize(session, env) : await tutor(session, question as string, env)
      json(response, 200, result)
    } catch (error) {
      const known = error instanceof AiError
      if (known && error.status === 413) response.setHeader('Connection', 'close')
      json(response, known ? error.status : 500, { error: known ? error.message : '学习服务暂时出错，请再试一次。' })
    }
  }
}
