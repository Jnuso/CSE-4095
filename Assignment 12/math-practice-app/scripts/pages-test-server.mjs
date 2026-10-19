import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Strict static hosting under a repository path: no SPA fallback or source files.
const root = fileURLToPath(new URL('../dist-pages/', import.meta.url))
const prefix = '/CSE-4095/'
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
    if (!pathname.startsWith(prefix)) {
      response.writeHead(404).end('Not found')
      return
    }
    const relative = pathname.slice(prefix.length) || 'index.html'
    const path = resolve(root, relative)
    if (!path.startsWith(resolve(root) + sep) || !(await stat(path)).isFile()) {
      response.writeHead(404).end('Not found')
      return
    }
    const body = await readFile(path)
    response.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' })
    response.end(body)
  } catch {
    response.writeHead(404).end('Not found')
  }
})
server.listen(4373, '127.0.0.1')
