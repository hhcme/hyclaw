import { app, BrowserWindow, shell, ipcMain, Tray, Menu, globalShortcut, dialog, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { startApiServer, stopApiServer, getApiPort } from './api-server'
import { registerGitIPC } from './ipc-git'
import { registerBrowserIPC } from './ipc-browser'
import { registerFFmpegIPC } from './ipc-ffmpeg'
import { registerSchedulerIPC } from './ipc-scheduler'
import { getSettings, addProvider, updateProviderKey, updateProviderModel, removeProvider, setActiveProvider, PROVIDER_PRESETS } from './settings'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Worker Solo',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (tray && !(app as any).isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  // Create a simple 16x16 tray icon using nativeImage
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示 Worker Solo', click: () => mainWindow?.show() },
    { type: 'separator' },
    {
      label: '关于',
      click: () => {
        dialog.showMessageBox(mainWindow!, {
          type: 'info',
          title: '关于 Worker Solo',
          message: 'Worker Solo v' + app.getVersion(),
          detail: '多 Agent 协作的编程工作台\n\n以群聊模式驱动多 Agent 协作开发。',
          buttons: ['确定']
        })
      }
    },
    {
      label: '检查更新',
      click: () => {
        autoUpdater.checkForUpdatesAndNotify()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        (app as any).isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Worker Solo')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.focus() : mainWindow?.show()
  })
}

function registerShortcuts(): void {
  // Toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
    }
  })

  // DevTools (dev only)
  if (is.dev) {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      mainWindow?.webContents.toggleDevTools()
    })
  }
}

function initAutoUpdater(): void {
  if (is.dev) return

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '发现新版本',
      message: `Worker Solo v${info.version} 可用`,
      detail: '是否立即下载更新？',
      buttons: ['下载', '稍后']
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '更新已下载',
      message: '更新将在应用重启后安装。',
      buttons: ['立即重启', '稍后']
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err)
  })

  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 4 * 60 * 60 * 1000)
}

app.whenReady().then(() => {
  // Start local API server
  const port = startApiServer()
  console.log(`[WorkerSolo] API port: ${port}`)

  // Register IPC handlers
  registerGitIPC()
  registerBrowserIPC()
  registerFFmpegIPC()
  registerSchedulerIPC()

  createWindow()
  createTray()
  registerShortcuts()
  initAutoUpdater()

  // Check for updates on startup (production only)
  if (!is.dev) {
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  (app as any).isQuitting = true
  stopApiServer()
  globalShortcut.unregisterAll()
})

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// IPC handlers
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:getPath', (_event, name: string) => app.getPath(name as any))
ipcMain.handle('api:getPort', () => getApiPort())
ipcMain.handle('api:hasKey', () => !!process.env.ANTHROPIC_API_KEY)

// Settings IPC
ipcMain.handle('settings:get', () => getSettings())
ipcMain.handle('settings:getPresets', () => PROVIDER_PRESETS)
ipcMain.handle('settings:add', (_event, provider: string, apiKey: string, model: string) =>
  addProvider(provider, apiKey, model))
ipcMain.handle('settings:updateKey', (_event, id: string, apiKey: string) =>
  updateProviderKey(id, apiKey))
ipcMain.handle('settings:updateModel', (_event, id: string, model: string) =>
  updateProviderModel(id, model))
ipcMain.handle('settings:remove', (_event, id: string) => removeProvider(id))
ipcMain.handle('settings:setActive', (_event, id: string) => setActiveProvider(id))

// Dialog IPC
ipcMain.handle('dialog:selectDir', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: '选择项目目录'
  })
  return result.canceled ? null : result.filePaths[0]
})
