import { ipcMain, dialog } from 'electron'
import { ffmpegService } from './ffmpeg-service'

export function registerFFmpegIPC(): void {
  ipcMain.handle('ffmpeg:detect', async () => {
    return ffmpegService.detect()
  })

  ipcMain.handle('ffmpeg:getInfo', async (_event, filePath: string) => {
    return ffmpegService.getInfo(filePath)
  })

  ipcMain.handle('ffmpeg:concat', async (_event, files: string[], output?: string) => {
    return ffmpegService.concat(files, output)
  })

  ipcMain.handle('ffmpeg:trim', async (_event, file: string, start: string, duration: string, output?: string) => {
    return ffmpegService.trim(file, start, duration, output)
  })

  ipcMain.handle('ffmpeg:transcode', async (_event, file: string, options: any, output?: string) => {
    return ffmpegService.transcode(file, options, output)
  })

  ipcMain.handle('ffmpeg:addSubtitle', async (_event, file: string, text: string, output?: string) => {
    return ffmpegService.addSubtitle(file, text, output)
  })

  ipcMain.handle('ffmpeg:extractAudio', async (_event, file: string, output?: string) => {
    return ffmpegService.extractAudio(file, output)
  })

  ipcMain.handle('ffmpeg:screenshot', async (_event, file: string, atTime: string, output?: string) => {
    return ffmpegService.takeScreenshot(file, atTime, output)
  })

  ipcMain.handle('ffmpeg:outputDir', () => {
    return ffmpegService.getOutputDir()
  })

  ipcMain.handle('ffmpeg:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })
}
