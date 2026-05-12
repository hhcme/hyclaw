import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatArea } from '@/components/layout/ChatArea'
import { ToolPanel } from '@/components/layout/ToolPanel'
import { ProjectSettingsPage } from '@/components/layout/ProjectSettingsPage'
import { WelcomeScreen } from '@/components/layout/WelcomeScreen'
import { useAppStore } from '@/stores/app'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

function App() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const hasProjects = useAppStore((s) => s.projects.length > 0)
  const rightPanel = useAppStore((s) => s.rightPanel)
  const showSettings = useAppStore((s) => s.showProjectSettings)
  const hydrate = useAppStore((s) => s.hydrate)

  useEffect(() => { hydrate() }, [])

  if (!hasProjects) {
    return <WelcomeScreen />
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-muted/30 flex">
      <PanelGroup direction="horizontal" autoSaveId="main-layout" className="gap-2 p-2 flex-1 min-w-0">
        {/* Left Sidebar */}
        <Panel defaultSize={20} minSize={sidebarCollapsed ? 4 : 14} maxSize={28}>
          <div className="h-full rounded-xl border border-border/50 bg-background shadow-sm overflow-hidden">
            <Sidebar />
          </div>
        </Panel>

        <PanelResizeHandle className="group relative w-1.5 rounded transition-colors hover:bg-blue-400/30 active:bg-blue-400/50">
          <GripVertical className="absolute inset-y-0 left-1/2 -translate-x-1/2 h-5 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </PanelResizeHandle>

        {/* Center */}
        <Panel defaultSize={58} minSize={35}>
          <div className="h-full rounded-xl border border-border/50 bg-background shadow-sm overflow-hidden">
            {showSettings ? <ProjectSettingsPage /> : <ChatArea />}
          </div>
        </Panel>
      </PanelGroup>

      {/* Right Tool Bar - sticks to the right edge */}
      <div className={cn(
        'flex shrink-0 transition-all duration-200',
        rightPanel ? 'w-80' : 'w-12'
      )}>
        <ToolPanel />
      </div>
    </div>
  )
}

export default App
