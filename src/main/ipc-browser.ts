import { ipcMain, BrowserWindow } from 'electron'
import { browserService } from './browser-service'

export function registerBrowserIPC(): void {
  ipcMain.handle('browser:navigate', async (_event, url: string) => {
    return browserService.navigate(url)
  })

  ipcMain.handle('browser:screenshot', async () => {
    return browserService.getScreenshot()
  })

  ipcMain.handle('browser:getHTML', async () => {
    return browserService.getHTML()
  })

  ipcMain.handle('browser:getText', async () => {
    return browserService.getText()
  })

  ipcMain.handle('browser:executeJS', async (_event, code: string) => {
    return browserService.executeJS(code)
  })

  ipcMain.handle('browser:getState', () => {
    return browserService.getState()
  })

  ipcMain.handle('browser:showView', (_event, url: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      browserService.showBrowserView(win, url)
    }
    return true
  })

  ipcMain.handle('browser:hideView', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      browserService.hideBrowserView(win)
    }
    return true
  })
}
