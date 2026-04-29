import { app, BrowserWindow, dialog, shell } from 'electron'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const HOST = '127.0.0.1'
const DEFAULT_PORT = Number(process.env.ELECTRON_NUXT_PORT ?? 38451)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null
let nuxtProcess = null
let shuttingDown = false
let serverPort = DEFAULT_PORT

const singleInstanceLock = app.requestSingleInstanceLock()
if (!singleInstanceLock) {
  app.quit()
}
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.focus()
  }
})

function resolvePerfTaskDataDir() {
  const appDataRoot = app.getPath('appData')
  return path.join(appDataRoot, 'debugbear-automation', '.data')
}

function parseDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {}
  }
  const text = readFileSync(filePath, 'utf8')
  const result = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }
    const idx = line.indexOf('=')
    if (idx <= 0) {
      continue
    }
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1')
    if (key) {
      result[key] = value
    }
  }
  return result
}

function resolveUserEnvPath() {
  const appDataRoot = app.getPath('appData')
  return path.join(appDataRoot, 'debugbear-automation', '.env')
}

function resolveServerEntry() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, '.output', 'server', 'index.mjs')
  }
  return path.join(__dirname, '..', '.output', 'server', 'index.mjs')
}

function startNuxtServer() {
  const serverEntry = resolveServerEntry()
  const perfTaskDataDir = resolvePerfTaskDataDir()
  const userEnv = parseDotEnvFile(resolveUserEnvPath())
  nuxtProcess = spawn(process.execPath, [serverEntry], {
    env: {
      ...process.env,
      ...userEnv,
      ELECTRON_RUN_AS_NODE: '1',
      HOST,
      PORT: String(serverPort),
      NITRO_HOST: HOST,
      NITRO_PORT: String(serverPort),
      NODE_ENV: 'production',
      PERF_TASK_DATA_DIR: perfTaskDataDir
    },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  nuxtProcess.stdout?.on('data', (chunk) => {
    process.stdout.write(chunk)
  })

  nuxtProcess.stderr?.on('data', (chunk) => {
    process.stderr.write(chunk)
  })

  nuxtProcess.once('exit', (code) => {
    if (shuttingDown) {
      return
    }
    dialog.showErrorBox(
      '服务启动失败',
      `本地服务进程已退出，退出码: ${code ?? 'unknown'}。`
    )
    app.quit()
  })
}

function waitForServer(timeoutMs = 20000) {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect({ host: HOST, port: serverPort })
      socket.once('connect', () => {
        socket.end()
        resolve()
      })
      socket.once('error', async () => {
        socket.destroy()
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Nuxt server did not become ready in ${timeoutMs}ms`))
          return
        }
        await delay(250)
        tryConnect()
      })
    }
    tryConnect()
  })
}

function resolveAvailablePort(preferredPort) {
  return new Promise((resolvePort) => {
    const tester = net.createServer()
    tester.unref()
    tester.once('error', () => {
      tester.close(() => {})
      const fallback = net.createServer()
      fallback.unref()
      fallback.listen(0, HOST, () => {
        const address = fallback.address()
        const available =
          typeof address === 'object' && address && typeof address.port === 'number'
            ? address.port
            : preferredPort
        fallback.close(() => resolvePort(available))
      })
    })
    tester.listen(preferredPort, HOST, () => {
      tester.close(() => resolvePort(preferredPort))
    })
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.mjs')
    }
  })

  const isInternalUrl = (targetUrl) => {
    try {
      const parsed = new URL(targetUrl)
      return parsed.hostname === HOST && parsed.port === String(serverPort)
    } catch {
      return false
    }
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isInternalUrl(url)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternalUrl(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.loadURL(`http://${HOST}:${serverPort}`)
}

async function bootstrap() {
  serverPort = await resolveAvailablePort(DEFAULT_PORT)
  startNuxtServer()
  await waitForServer()
  createWindow()
}

app.whenReady().then(async () => {
  try {
    await bootstrap()
  } catch (error) {
    dialog.showErrorBox('应用启动失败', error instanceof Error ? error.message : String(error))
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  shuttingDown = true
  if (nuxtProcess && !nuxtProcess.killed) {
    nuxtProcess.kill()
  }
})
