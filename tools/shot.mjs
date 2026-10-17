/**
 * 用 Chrome DevTools Protocol 按指定设备尺寸截图。
 *
 * 为什么不用 `chrome --screenshot --window-size=390,844`：
 * Windows 下 headless Chrome 有最小窗口宽度（约 500px），
 * 指定 390 实际仍按 497 渲染，截出来的是被裁掉右边的图——
 * 看起来像横向溢出，其实是假的。要真按手机宽度渲染，必须走 CDP。
 *
 * 用法：
 *   node tools/shot.mjs <url> <输出.png> [宽] [高] [mobile:0|1]
 *
 * 需要先启动一个带调试端口的 Chrome：
 *   chrome --headless=new --remote-debugging-port=9222 about:blank
 */

const CDP = 'http://127.0.0.1:9222'

async function connect() {
  // 优先用已存在的页面，避免每次都开新标签
  for (let i = 0; i < 20; i++) {
    try {
      const list = await (await fetch(`${CDP}/json`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* 端口还没起来，继续等 */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error('连不上 Chrome 调试端口 9222')
}

function rpc(ws) {
  let id = 0
  const pending = new Map()
  const events = []
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) {
      events.push(msg.method)
    }
  })
  return {
    events,
    send(method, params = {}) {
      const mid = ++id
      return new Promise((resolve, reject) => {
        pending.set(mid, { resolve, reject })
        ws.send(JSON.stringify({ id: mid, method, params }))
      })
    },
  }
}

const [, , url, out, w = '390', h = '844', mobile = '1'] = process.argv
if (!url || !out) {
  console.error('用法: node tools/shot.mjs <url> <out.png> [宽] [高] [mobile:0|1]')
  process.exit(1)
}

const wsUrl = await connect()
const ws = new WebSocket(wsUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

const { send, events } = rpc(ws)
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: 2,
  mobile: mobile === '1',
})

await send('Page.navigate', { url })

// 等 loadEventFired，再多给 2.5s 让 React 拉完接口后渲染
for (let i = 0; i < 60 && !events.includes('Page.loadEventFired'); i++) {
  await new Promise((r) => setTimeout(r, 100))
}
await new Promise((r) => setTimeout(r, 2500))

const { data } = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: false,
})

const { writeFile } = await import('node:fs/promises')
await writeFile(out, Buffer.from(data, 'base64'))
console.log(`已保存 ${out}  (${w}×${h}${mobile === '1' ? ' 移动端' : ''})`)

ws.close()
process.exit(0)
