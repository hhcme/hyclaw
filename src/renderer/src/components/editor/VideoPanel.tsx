import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Video, Scissors, Combine, FileAudio, Subtitles, ImagePlus,
  RefreshCw, Play, Loader2, AlertCircle, Check, FolderOpen
} from 'lucide-react'
import type { VideoInfo, VideoOpResult } from '@/types'

export function VideoPanel() {
  const [ffmpegFound, setFfmpegFound] = useState<boolean | null>(null)
  const [ffmpegVersion, setFfmpegVersion] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VideoOpResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Operation state
  const [opMode, setOpMode] = useState<'none' | 'trim' | 'transcode' | 'subtitle' | 'concat'>('none')
  const [trimStart, setTrimStart] = useState('00:00')
  const [trimDuration, setTrimDuration] = useState('10')
  const [targetRes, setTargetRes] = useState('1920:1080')
  const [targetFps, setTargetFps] = useState('30')
  const [subtitleText, setSubtitleText] = useState('Worker Solo')

  useEffect(() => {
    window.electronAPI?.ffmpeg?.detect().then((r: any) => {
      setFfmpegFound(r.found)
      setFfmpegVersion(r.version)
    }).catch(() => setFfmpegFound(false))
  }, [])

  const handleSelectFile = async () => {
    setError(null)
    setResult(null)
    try {
      const file = await window.electronAPI?.ffmpeg?.selectFile()
      if (file && typeof file === 'string') {
        setSelectedFile(file)
        setLoading(true)
        const info = await window.electronAPI!.ffmpeg!.getInfo(file)
        setVideoInfo(info)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const runOperation = async (op: () => Promise<VideoOpResult>) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await op()
      setResult(res)
      if (!res.success) setError(res.error || '操作失败')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTrim = () => runOperation(async () => {
    return window.electronAPI!.ffmpeg!.trim(selectedFile!, trimStart, trimDuration)
  })

  const handleTranscode = () => runOperation(async () => {
    const fps = parseInt(targetFps) || 30
    return window.electronAPI!.ffmpeg!.transcode(selectedFile!, { resolution: targetRes, fps })
  })

  const handleSubtitle = () => runOperation(async () => {
    return window.electronAPI!.ffmpeg!.addSubtitle(selectedFile!, subtitleText)
  })

  const handleExtractAudio = () => runOperation(async () => {
    return window.electronAPI!.ffmpeg!.extractAudio(selectedFile!)
  })

  const handleScreenshot = () => runOperation(async () => {
    return window.electronAPI!.ffmpeg!.screenshot(selectedFile!, '00:05')
  })

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">视频处理</span>
          {ffmpegFound !== null && (
            <span className={cn(
              'text-[10px] rounded px-1.5 py-0.5',
              ffmpegFound ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
            )}>
              {ffmpegFound ? 'FFmpeg ✓' : 'FFmpeg ✗'}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* FFmpeg status */}
        {ffmpegFound === false && (
          <div className="rounded-md border border-yellow-500/50 bg-yellow-500/5 p-3">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">FFmpeg 未安装</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              请安装 FFmpeg：<code className="rounded bg-muted px-1">brew install ffmpeg</code>
            </p>
          </div>
        )}

        {/* File selector */}
        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleSelectFile}
            disabled={loading}
          >
            {selectedFile ? (
              <><Video className="mr-2 h-4 w-4" />{selectedFile.split('/').pop()}</>
            ) : (
              <><FolderOpen className="mr-2 h-4 w-4" />选择视频文件</>
            )}
            <RefreshCw className={cn('ml-auto h-3 w-3', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Video info */}
        {videoInfo && (
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
            <div className="text-xs font-medium">{videoInfo.file}</div>
            <InfoRow label="时长" value={videoInfo.duration} />
            <InfoRow label="分辨率" value={videoInfo.resolution} />
            <InfoRow label="帧率" value={`${Math.round(videoInfo.fps)} fps`} />
            <InfoRow label="编码" value={videoInfo.codec} />
            <InfoRow label="码率" value={videoInfo.bitrate} />
          </div>
        )}

        {/* Quick actions */}
        {selectedFile && (
          <div className="grid grid-cols-2 gap-1.5">
            <OpButton icon={Scissors} label="裁剪" active={opMode === 'trim'} onClick={() => setOpMode(opMode === 'trim' ? 'none' : 'trim')} />
            <OpButton icon={RefreshCw} label="转码" active={opMode === 'transcode'} onClick={() => setOpMode(opMode === 'transcode' ? 'none' : 'transcode')} />
            <OpButton icon={Subtitles} label="字幕" active={opMode === 'subtitle'} onClick={() => setOpMode(opMode === 'subtitle' ? 'none' : 'subtitle')} />
            <OpButton icon={FileAudio} label="提音频" active={false} onClick={handleExtractAudio} />
            <OpButton icon={ImagePlus} label="截图" active={false} onClick={handleScreenshot} className="col-span-2" />
          </div>
        )}

        {/* Trim form */}
        {opMode === 'trim' && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="text-xs font-medium">裁剪视频</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">开始时间</label>
                <input value={trimStart} onChange={(e) => setTrimStart(e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1 text-xs" placeholder="00:05" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">时长 (秒)</label>
                <input value={trimDuration} onChange={(e) => setTrimDuration(e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1 text-xs" placeholder="30" />
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={handleTrim} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Scissors className="mr-1.5 h-3 w-3" />}
              裁剪
            </Button>
          </div>
        )}

        {/* Transcode form */}
        {opMode === 'transcode' && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="text-xs font-medium">转码设置</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">分辨率 (W:H)</label>
                <input value={targetRes} onChange={(e) => setTargetRes(e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1 text-xs" placeholder="1920:1080" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground">帧率</label>
                <input value={targetFps} onChange={(e) => setTargetFps(e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1 text-xs" placeholder="30" />
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={handleTranscode} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1.5 h-3 w-3" />}
              转码
            </Button>
          </div>
        )}

        {/* Subtitle form */}
        {opMode === 'subtitle' && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="text-xs font-medium">添加字幕</div>
            <input value={subtitleText} onChange={(e) => setSubtitleText(e.target.value)} className="w-full rounded border border-input bg-background px-2 py-1 text-xs" placeholder="字幕文字" />
            <Button size="sm" className="w-full" onClick={handleSubtitle} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Subtitles className="mr-1.5 h-3 w-3" />}
              添加字幕
            </Button>
          </div>
        )}

        {/* Result */}
        {result?.success && (
          <div className="rounded-md border border-emerald-500/50 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">操作完成</span>
            </div>
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              <div>输出: {result.outputFile.split('/').pop()}</div>
              <div>时长: {result.duration}</div>
              <div>大小: {result.size}</div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-500/50 bg-red-500/5 p-3">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">错误</span>
            </div>
            <p className="mt-1 text-xs text-red-500/80">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

function OpButton({ icon: Icon, label, active, onClick, className }: {
  icon: any
  label: string
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
