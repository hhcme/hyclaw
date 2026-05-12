import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Globe, ArrowRight, Code, FileText, RefreshCw, ExternalLink, Loader2 } from 'lucide-react'

interface BrowserState {
  url: string
  title: string
  screenshot?: string
  isLoading: boolean
}

export function BrowserPanel() {
  const [url, setUrl] = useState('https://www.example.com')
  const [state, setState] = useState<BrowserState>({ url: '', title: '', isLoading: false })
  const [sourceMode, setSourceMode] = useState<'preview' | 'html' | 'text'>('preview')
  const [sourceContent, setSourceContent] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleNavigate = async () => {
    let targetUrl = url.trim()
    if (!targetUrl) return
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl
      setUrl(targetUrl)
    }

    setLoading(true)
    setState({ url: targetUrl, title: '', isLoading: true })
    setSourceContent('')

    try {
      if (window.electronAPI?.browser) {
        const result = await window.electronAPI.browser.navigate(targetUrl)
        setState(result)
      } else {
        // Mock for web dev mode
        await new Promise((r) => setTimeout(r, 800))
        setState({
          url: targetUrl,
          title: targetUrl.replace(/^https?:\/\//, ''),
          isLoading: false,
          screenshot: undefined
        })
      }
    } catch (e: any) {
      setState((s) => ({ ...s, isLoading: false, title: '加载失败: ' + e.message }))
    } finally {
      setLoading(false)
    }
  }

  const handleFetchSource = async (mode: 'html' | 'text') => {
    setLoading(true)
    try {
      if (mode === 'html') {
        const html = await window.electronAPI.browser?.getHTML() ?? ''
        setSourceContent(html)
      } else {
        const text = await window.electronAPI.browser?.getText() ?? ''
        setSourceContent(text)
      }
      setSourceMode(mode)
    } catch {
      setSourceContent('获取失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => handleNavigate()

  const handleShowView = () => {
    if (window.electronAPI?.browser) {
      window.electronAPI.browser.showView(state.url || url)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* URL Bar */}
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-input bg-background px-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate() }}
            placeholder="输入网址..."
            className="flex-1 bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground/50"
          />
          <button onClick={handleNavigate} disabled={loading} className="shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShowView} title="打开独立窗口">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <Button
          variant={sourceMode === 'preview' ? 'default' : 'ghost'}
          size="sm"
          className="h-6 text-xs"
          onClick={() => setSourceMode('preview')}
        >
          预览
        </Button>
        <Button
          variant={sourceMode === 'html' ? 'default' : 'ghost'}
          size="sm"
          className="h-6 text-xs"
          onClick={() => handleFetchSource('html')}
        >
          <Code className="mr-1 h-3 w-3" />
          HTML
        </Button>
        <Button
          variant={sourceMode === 'text' ? 'default' : 'ghost'}
          size="sm"
          className="h-6 text-xs"
          onClick={() => handleFetchSource('text')}
        >
          <FileText className="mr-1 h-3 w-3" />
          文本
        </Button>
        {state.title && (
          <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[100px]">
            {state.title}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading && !state.screenshot ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sourceMode === 'preview' ? (
          state.screenshot ? (
            <img
              src={state.screenshot}
              alt="Screenshot"
              className="w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Globe className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                {state.url ? `已加载: ${state.title}` : '输入网址开始浏览'}
              </p>
              {state.url && !state.screenshot && (
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  截图功能仅在 Electron 环境中可用
                </p>
              )}
            </div>
          )
        ) : sourceMode === 'html' ? (
          <div className="h-full overflow-auto p-2">
            <pre className="text-[10px] font-mono whitespace-pre-wrap break-all text-muted-foreground">
              {sourceContent || '点击 HTML 按钮获取源码'}
            </pre>
          </div>
        ) : (
          <div className="h-full overflow-auto p-2">
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
              {sourceContent || '点击文本按钮提取文字'}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      {state.url && (
        <div className="border-t border-border px-2 py-1">
          <span className="text-[10px] text-muted-foreground/50 truncate block">
            {state.url}
          </span>
        </div>
      )}
    </div>
  )
}
