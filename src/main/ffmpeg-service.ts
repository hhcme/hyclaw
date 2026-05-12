import { exec, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'

const execAsync = promisify(exec)

function parseFps(rate: string): number {
  const parts = rate.split('/')
  if (parts.length === 2) {
    return parseFloat(parts[0]) / parseFloat(parts[1])
  }
  return parseFloat(rate) || 0
}

export interface VideoInfo {
  file: string
  duration: string
  resolution: string
  fps: number
  codec: string
  bitrate: string
}

export interface VideoOpResult {
  success: boolean
  outputFile: string
  duration: string
  size: string
  error?: string
}

class FFmpegService {
  private ffmpegPath = '/opt/homebrew/bin/ffmpeg'
  private ffprobePath = '/opt/homebrew/bin/ffprobe'
  private outputDir: string

  constructor() {
    this.outputDir = path.join(process.env.HOME || '/tmp', 'hyclaw-output')
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async detect(): Promise<{ found: boolean; path: string; version: string }> {
    try {
      const { stdout } = await execAsync(`${this.ffmpegPath} -version`)
      const version = stdout.split('\n')[0]
      return { found: true, path: this.ffmpegPath, version }
    } catch {
      // Try system ffmpeg
      try {
        const { stdout } = await execAsync('ffmpeg -version')
        this.ffmpegPath = 'ffmpeg'
        this.ffprobePath = 'ffprobe'
        return { found: true, path: 'ffmpeg', version: stdout.split('\n')[0] }
      } catch {
        return { found: false, path: '', version: '' }
      }
    }
  }

  async getInfo(filePath: string): Promise<VideoInfo> {
    const cmd = `${this.ffprobePath} -v quiet -print_format json -show_format -show_streams "${filePath}"`
    const { stdout } = await execAsync(cmd)
    const data = JSON.parse(stdout)

    const videoStream = data.streams?.find((s: any) => s.codec_type === 'video')
    const format = data.format || {}

    return {
      file: path.basename(filePath),
      duration: format.duration
        ? `${Math.floor(format.duration / 60)}:${Math.floor(format.duration % 60).toString().padStart(2, '0')}`
        : '未知',
      resolution: videoStream
        ? `${videoStream.width}x${videoStream.height}`
        : '未知',
      fps: videoStream
        ? parseFps(videoStream.r_frame_rate || '0/1')
        : 0,
      codec: videoStream?.codec_name || '未知',
      bitrate: format.bit_rate
        ? `${Math.round(format.bit_rate / 1000)}kbps`
        : '未知'
    }
  }

  async concat(inputFiles: string[], outputName?: string): Promise<VideoOpResult> {
    const outputFile = path.join(this.outputDir, outputName || `concat-${Date.now()}.mp4`)

    // Create concat file list
    const listFile = path.join(this.outputDir, `list-${Date.now()}.txt`)
    const listContent = inputFiles.map((f) => `file '${f}'`).join('\n')
    fs.writeFileSync(listFile, listContent)

    try {
      await execAsync(
        `${this.ffmpegPath} -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}" -y`
      )
      fs.unlinkSync(listFile)
      return this.getResult(outputFile)
    } catch (e: any) {
      try { fs.unlinkSync(listFile) } catch {}
      return { success: false, outputFile: '', duration: '', size: '', error: e.message }
    }
  }

  async trim(inputFile: string, start: string, duration: string, outputName?: string): Promise<VideoOpResult> {
    const outputFile = path.join(this.outputDir, outputName || `trim-${Date.now()}.mp4`)
    const cmd = `${this.ffmpegPath} -i "${inputFile}" -ss ${start} -t ${duration} -c copy "${outputFile}" -y`

    try {
      await execAsync(cmd)
      return this.getResult(outputFile)
    } catch (e: any) {
      return { success: false, outputFile: '', duration: '', size: '', error: e.message }
    }
  }

  async transcode(
    inputFile: string,
    options: { resolution?: string; fps?: number; format?: string },
    outputName?: string
  ): Promise<VideoOpResult> {
    const ext = options.format || 'mp4'
    const outputFile = path.join(this.outputDir, outputName || `transcode-${Date.now()}.${ext}`)

    const filters: string[] = []
    if (options.resolution) filters.push(`scale=${options.resolution}`)
    if (options.fps) filters.push(`fps=${options.fps}`)

    const vf = filters.length > 0 ? `-vf "${filters.join(',')}"` : ''
    const cmd = `${this.ffmpegPath} -i "${inputFile}" ${vf} -c:v libx264 -crf 23 -preset medium "${outputFile}" -y`

    try {
      await execAsync(cmd)
      return this.getResult(outputFile)
    } catch (e: any) {
      return { success: false, outputFile: '', duration: '', size: '', error: e.message }
    }
  }

  async addSubtitle(inputFile: string, subtitleText: string, outputName?: string): Promise<VideoOpResult> {
    const outputFile = path.join(this.outputDir, outputName || `sub-${Date.now()}.mp4`)
    const escaped = subtitleText.replace(/:/g, '\\:').replace(/'/g, "\\'")
    const cmd = `${this.ffmpegPath} -i "${inputFile}" -vf "drawtext=text='${escaped}':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=h-th-20" -c:a copy "${outputFile}" -y`

    try {
      await execAsync(cmd)
      return this.getResult(outputFile)
    } catch (e: any) {
      return { success: false, outputFile: '', duration: '', size: '', error: e.message }
    }
  }

  async extractAudio(inputFile: string, outputName?: string): Promise<VideoOpResult> {
    const outputFile = path.join(this.outputDir, outputName || `audio-${Date.now()}.mp3`)
    const cmd = `${this.ffmpegPath} -i "${inputFile}" -vn -acodec libmp3lame -q:a 2 "${outputFile}" -y`

    try {
      await execAsync(cmd)
      return this.getResult(outputFile)
    } catch (e: any) {
      return { success: false, outputFile: '', duration: '', size: '', error: e.message }
    }
  }

  async takeScreenshot(inputFile: string, atTime: string, outputName?: string): Promise<VideoOpResult> {
    const outputFile = path.join(this.outputDir, outputName || `thumb-${Date.now()}.jpg`)
    const cmd = `${this.ffmpegPath} -ss ${atTime} -i "${inputFile}" -vframes 1 -q:v 2 "${outputFile}" -y`

    try {
      await execAsync(cmd)
      return this.getResult(outputFile)
    } catch (e: any) {
      return { success: false, outputFile: '', duration: '', size: '', error: e.message }
    }
  }

  getOutputDir(): string {
    return this.outputDir
  }

  private async getResult(outputFile: string): Promise<VideoOpResult> {
    try {
      const info = await this.getInfo(outputFile)
      const stat = fs.statSync(outputFile)
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(1)
      return {
        success: true,
        outputFile,
        duration: info.duration,
        size: `${sizeMB} MB`
      }
    } catch {
      return { success: true, outputFile, duration: '', size: '未知' }
    }
  }
}

export const ffmpegService = new FFmpegService()
