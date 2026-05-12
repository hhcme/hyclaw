import { useThemeStore } from '@/stores/theme'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const cycle = () => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const label = theme === 'dark' ? '暗色' : theme === 'light' ? '亮色' : '跟随系统'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      className="no-drag"
      title={`主题：${label}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}
