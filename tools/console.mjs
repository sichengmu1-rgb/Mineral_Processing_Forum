/**
 * 抓取页面在浏览器里产生的 console 输出与未捕获异常。
 * 排查白屏用。
 *
 * 用法： node tools/console.mjs <url>
 * 需要先启动 chrome --headless=new --remote-debugging-port=9222
 */

const CDP = 'http://127.0.0.1:9222'

async function wsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const list = await (await fetch(`${CDP}/json`)).json()
      const p = list.find((t) => t.type === 'page')
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl
    } catch {
      /* 等端口 */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error('连不上 9222')
}

const url = process.argv[2]
if (!url) {
  console.error('用法: node tools/console.mjs <url>')
  process.exit(1)
}

const ws = new WebSocket(await wsUrl())
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

let id = 0
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const mid = ++id
    const onMsg = (e) => {
      const m = JSON.parse(e.data)
      if (m.id === mid) {
        ws.removeEventListener('message', onMsg)
        resolve(m.result)
      }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })

ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.method === 'Runtime.consoleAPICalled') {
    const text = m.params.args
      .map((a) => a.value ?? a.description ?? a.type)
      .join(' ')
    console.log(`[${m.params.type}] ${text}`)
  }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails
    console.log(`[异常] ${d.text} ${d.exception?.description ?? ''}`)
  }
  if (m.method === 'Log.entryAdded') {
    const en = m.params.entry
    if (en.level === 'error') console.log(`[网络/日志] ${en.text} ${en.url ?? ''}`)
  }
})

await send('Runtime.enable')
await send('Log.enable')
await send('Page.enable')
await send('Page.navigate', { url })
await new Promise((r) => setTimeout(r, 4000))

ws.close()
process.exit(0)
