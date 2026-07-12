import { useCallback, useEffect, useRef, useState } from 'react'
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Masthead } from './components/Masthead'
import { Nav } from './components/Nav'
import { TodayPage } from './components/pages/TodayPage'
import { DashboardPage } from './components/pages/DashboardPage'
import { SchedulePage } from './components/pages/SchedulePage'
import { SettingsPage } from './components/pages/SettingsPage'
import { useAppData } from './hooks/useAppData'
import { useGitHubSync } from './hooks/useGitHubSync'
import { loadConfig, saveConfig, type GitHubConfig } from './lib/storage'

function AppInner() {
  const app = useAppData()
  const [cfg, setCfgState] = useState<GitHubConfig>(() => loadConfig())

  const setCfg = useCallback((next: GitHubConfig) => {
    setCfgState(next)
    saveConfig(next)
  }, [])

  // 同步：currentData 用 ref 保证读到最新
  const dataRef = useRef(app.data)
  dataRef.current = app.data

  const onData = useCallback(
    (next: typeof app.data) => app.replaceData(next),
    [app],
  )
  const currentData = useCallback(() => dataRef.current, [])

  const sync = useGitHubSync(cfg, onData, currentData)

  // 启动时自动拉取（仅一次）
  const didAutoPull = useRef(false)
  useEffect(() => {
    if (didAutoPull.current) return
    if (cfg.autoPull && sync.isConfigured) {
      didAutoPull.current = true
      void sync.pull()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 打卡后自动推送：监听 dirty + autoPush，防抖
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (cfg.autoPush && app.dirty && sync.isConfigured && !sync.syncing) {
      const t = setTimeout(() => void sync.push(), 1500)
      return () => clearTimeout(t)
    }
  }, [app.dirty, cfg.autoPush, sync])

  const navigate = useNavigate()

  return (
    <div className="sheet">
      <Masthead
        startDate={app.data.meta.startDate}
        examDate={app.data.meta.examDate}
        title={app.data.meta.title ?? '考研日课'}
        onTitleChange={(v) => app.setMeta({ title: v })}
      />

      <Nav
        syncStatus={sync.status}
        syncLabel={sync.message}
        onSyncClick={() => navigate('/settings')}
      />

      <main>
        <Routes>
          <Route path="/" element={<TodayPage app={app} />} />
          <Route path="/dashboard" element={<DashboardPage app={app} />} />
          <Route path="/schedule" element={<SchedulePage app={app} />} />
          <Route
            path="/settings"
            element={
              <SettingsPage
                cfg={cfg}
                onCfgChange={setCfg}
                onPull={sync.pull}
                onPush={sync.push}
                onSync={sync.sync}
                message={sync.message}
              />
            }
          />
          <Route path="*" element={<TodayPage app={app} />} />
        </Routes>
      </main>

      <footer className="footer">
        {app.data.meta.title ?? '考研日课'} · {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  )
}
