import { useCallback, useRef, useState } from 'react'
import type { AppData } from '../types'
import type { GitHubConfig } from '../lib/storage'
import { pullRemote, pushRemote, mergeData, GitHubError } from '../lib/github'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'conflict' | 'error' | 'offline'

export interface SyncResult {
  ok: boolean
  message: string
  status: SyncStatus
}

export function useGitHubSync(
  cfg: GitHubConfig,
  onData: (next: AppData) => void,
  currentData: () => AppData,
) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState<string>('')
  const [syncing, setSyncing] = useState(false)
  // 远程 SHA 缓存（用于乐观锁）
  const shaRef = useRef<string | null>(null)

  const isConfigured = !!(cfg.owner && cfg.repo && cfg.token)

  const run = useCallback(
    async (
      action: 'pull' | 'push' | 'sync',
    ): Promise<SyncResult> => {
      if (!isConfigured) {
        const r = { ok: false, message: '未配置 GitHub 同步', status: 'idle' as SyncStatus }
        setStatus('idle')
        setMessage(r.message)
        return r
      }
      setSyncing(true)
      setStatus('syncing')

      try {
        if (action === 'pull') {
          const remote = await pullRemote(cfg)
          shaRef.current = remote.sha
          if (!remote.data) {
            const r = { ok: true, message: '远程为空，已记录 SHA', status: 'synced' as SyncStatus }
            setStatus('synced')
            setMessage(r.message)
            return r
          }
          const merged = mergeData(currentData(), remote.data)
          onData(merged)
          const r = { ok: true, message: '已拉取并合并远程数据', status: 'synced' as SyncStatus }
          setStatus('synced')
          setMessage(r.message)
          return r
        }

        if (action === 'push') {
          const newSha = await pushRemote(cfg, currentData(), shaRef.current)
          shaRef.current = newSha
          const r = { ok: true, message: '已推送至远程', status: 'synced' as SyncStatus }
          setStatus('synced')
          setMessage(r.message)
          return r
        }

        // sync：先 pull 合并，再 push
        const remote = await pullRemote(cfg)
        shaRef.current = remote.sha
        let merged = currentData()
        if (remote.data) merged = mergeData(currentData(), remote.data)
        onData(merged)
        const newSha = await pushRemote(cfg, merged, remote.sha)
        shaRef.current = newSha
        const r = { ok: true, message: '已同步（拉取合并并推送）', status: 'synced' as SyncStatus }
        setStatus('synced')
        setMessage(r.message)
        return r
      } catch (e) {
        const offline = e instanceof TypeError
        const msg = e instanceof GitHubError ? e.message : offline ? '网络离线' : '同步失败'
        const st: SyncStatus = offline ? 'offline' : e instanceof GitHubError && (e.status === 409 || e.status === 422) ? 'conflict' : 'error'
        setStatus(st)
        setMessage(msg)
        return { ok: false, message: msg, status: st }
      } finally {
        setSyncing(false)
      }
    },
    [cfg, currentData, isConfigured, onData],
  )

  const pull = useCallback(() => run('pull'), [run])
  const push = useCallback(() => run('push'), [run])
  const sync = useCallback(() => run('sync'), [run])

  return { status, message, syncing, isConfigured, pull, push, sync }
}
