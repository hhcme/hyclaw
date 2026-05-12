import { BrowserWindow, BrowserView, ipcMain, app } from 'electron'
import { join } from 'path'

interface BrowserState {
  url: string
  title: string
  screenshot?: string
  isLoading: boolean
}

class BrowserService {
  private headlessWin: BrowserWindow | null = null
  private browserView: BrowserView | null = null
  private state: BrowserState = { url: '', title: '', isLoading: false }

  async navigate(url: string): Promise<BrowserState> {
    if (!this.headlessWin) {
      this.headlessWin = new BrowserWindow({
        width: 1280,
        height: 800,
        show: false,
        webPreferences: {
          offscreen: true,
          sandbox: true
        }
      })
    }

    this.state = { url, title: '', isLoading: true }

    return new Promise((resolve) => {
      this.headlessWin!.webContents.loadURL(url)

      this.headlessWin!.webContents.on('page-title-updated', (_event, title) => {
        this.state.title = title
      })

      this.headlessWin!.webContents.on('did-finish-load', async () => {
        this.state.isLoading = false

        // Take screenshot for the renderer
        try {
          const image = await this.headlessWin!.webContents.capturePage()
          this.state.screenshot = image.toDataURL()
        } catch {}

        resolve({ ...this.state })
      })

      this.headlessWin!.webContents.on('did-fail-load', () => {
        this.state.isLoading = false
        resolve({ ...this.state })
      })
    })
  }

  async getScreenshot(): Promise<string | null> {
    if (!this.headlessWin) return null
    try {
      const image = await this.headlessWin.webContents.capturePage()
      return image.toDataURL()
    } catch {
      return null
    }
  }

  async getHTML(): Promise<string> {
    if (!this.headlessWin) return ''
    return this.headlessWin.webContents.executeJavaScript('document.documentElement.outerHTML')
  }

  async getText(): Promise<string> {
    if (!this.headlessWin) return ''
    return this.headlessWin.webContents.executeJavaScript('document.body.innerText')
  }

  async executeJS(code: string): Promise<string> {
    if (!this.headlessWin) return ''
    try {
      const result = await this.headlessWin.webContents.executeJavaScript(code)
      return typeof result === 'string' ? result : JSON.stringify(result)
    } catch (e: any) {
      return `Error: ${e.message}`
    }
  }

  getState(): BrowserState {
    return { ...this.state }
  }

  createBrowserView(mainWindow: BrowserWindow): number {
    if (this.browserView) {
      this.browserView.webContents.loadURL('about:blank')
      return 0
    }

    this.browserView = new BrowserView({
      webPreferences: {
        sandbox: true
      }
    })

    mainWindow.setBrowserView(this.browserView)

    const bounds = mainWindow.getContentBounds()
    this.browserView.setBounds({
      x: Math.floor(bounds.width * 0.65),
      y: 40,
      width: Math.floor(bounds.width * 0.35),
      height: bounds.height - 40
    })

    // Handle resize
    mainWindow.on('resize', () => {
      if (this.browserView && mainWindow) {
        const b = mainWindow.getContentBounds()
        this.browserView.setBounds({
          x: Math.floor(b.width * 0.65),
          y: 40,
          width: Math.floor(b.width * 0.35),
          height: b.height - 40
        })
      }
    })

    return 1
  }

  showBrowserView(mainWindow: BrowserWindow, url: string): void {
    if (!this.browserView) {
      this.createBrowserView(mainWindow)
    }
    this.browserView!.webContents.loadURL(url)
  }

  hideBrowserView(mainWindow: BrowserWindow): void {
    if (this.browserView) {
      mainWindow.removeBrowserView(this.browserView)
      this.browserView = null
    }
  }

  destroy(): void {
    if (this.headlessWin) {
      this.headlessWin.close()
      this.headlessWin = null
    }
    this.browserView = null
  }
}

export const browserService = new BrowserService()
