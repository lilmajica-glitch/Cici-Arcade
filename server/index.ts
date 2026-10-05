import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAiApi } from './api.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
const api = createAiApi(process.env)
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
}

const server = createServer((request, response) => {
  void api(request, response, () => { void serve() })
  async function serve() {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return
      }
      const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
      const route = pathname.replace(/\/+$/, '') || '/'
      let file = ['/', '/games', '/games/math', '/games/neon'].includes(route)
        ? resolve(root, 'index.html') : resolve(root, `.${pathname}`)
      if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return }
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
      const info = await stat(file)
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Length': info.size })
      if (request.method === 'HEAD') response.end()
      else createReadStream(file).on('error', () => response.destroy()).pipe(response)
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('页面或文件不存在。请先运行 npm run build。')
    }
  }
})

const port = Number(process.env.PORT || 3000)
server.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`CiciArcade: http://localhost:${port}`))
