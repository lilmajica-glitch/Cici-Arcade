import { defineConfig } from 'vitest/config'
import { build, createServer, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import { cp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { createAiApi } from './server/api.ts'

const neonRoot = fileURLToPath(new URL('./neon-word-runner/', import.meta.url))

function aiApi(): Plugin {
  return {
    name: 'ciciarcade-ai',
    configureServer(server) {
      server.middlewares.use(createAiApi({ ...loadEnv(server.config.mode, server.config.envDir, ''), ...process.env }))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createAiApi({ ...loadEnv(server.config.mode, server.config.envDir, ''), ...process.env }))
    },
  }
}

// Keep the existing runner independent; mount its dev server and bundle under one origin.
function neonGame(): Plugin {
  return {
    name: 'ciciarcade-neon',
    async configureServer(server) {
      if (server.config.mode === 'test') return
      const neon = await createServer({
        root: neonRoot,
        configFile: `${neonRoot}/vite.config.ts`,
        base: '/play/neon/',
        server: {
          middlewareMode: true,
          fs: { allow: [fileURLToPath(new URL('./', import.meta.url))] },
          ws: { server: server.httpServer!, path: '__neon_hmr' },
        },
      })
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0]
        if (pathname === '/play/neon') {
          response.writeHead(302, { Location: '/play/neon/' })
          response.end()
          return
        }
        if (pathname?.startsWith('/play/neon/')) neon.middlewares(request, response, next)
        else next()
      })
      server.httpServer?.once('close', () => { void neon.close() })
    },
    async writeBundle() {
      await build({ root: neonRoot, configFile: `${neonRoot}/vite.config.ts`, base: '/play/neon/' })
      await cp(`${neonRoot}/dist`, fileURLToPath(new URL('./dist/play/neon/', import.meta.url)), { recursive: true })
    },
  }
}

export default defineConfig({
  plugins: [react(), aiApi(), neonGame()],
  server: { port: 5173, strictPort: true },
  build: { target: 'es2022', rolldownOptions: { input: { arcade: 'index.html', math: 'play/math/index.html', audition: 'music-preview.html' } } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
