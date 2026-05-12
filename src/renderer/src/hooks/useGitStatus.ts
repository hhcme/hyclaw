import { useState, useEffect, useCallback } from 'react'
import type { GitStatus } from '@/types'

export function useGitStatus(workspacePath: string | undefined) {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!workspacePath || !window.electronAPI?.git) return

    setLoading(true)
    setError(null)
    try {
      await window.electronAPI.git.init(workspacePath)
      const s = await window.electronAPI.git.status(workspacePath)
      setStatus(s)
    } catch (err: any) {
      setError(err.message || 'Git 状态获取失败')
    } finally {
      setLoading(false)
    }
  }, [workspacePath])

  useEffect(() => {
    refresh()
    // Poll every 10 seconds
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  return { status, loading, error, refresh }
}
