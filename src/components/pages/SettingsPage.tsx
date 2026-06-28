import { useState } from 'react'
import type { AppDataApi } from '../../hooks/useAppData'
import type { SyncResult } from '../../hooks/useGitHubSync'
import { SectionTitle } from '../ui/SectionTitle'
import { Divider } from '../ui/Divider'
import type { GitHubConfig } from '../../lib/storage'
import { verifyToken } from '../../lib/github'

interface SettingsPageProps {
  app: AppDataApi
  cfg: GitHubConfig
  onCfgChange: (cfg: GitHubConfig) => void
  onPull: () => Promise<SyncResult>
  onPush: () => Promise<SyncResult>
  onSync: () => Promise<SyncResult>
  message: string
}

export function SettingsPage({
  cfg,
  onCfgChange,
  onPull,
  onPush,
  onSync,
  message,
}: SettingsPageProps) {
  const [draft, setDraft] = useState<GitHubConfig>(cfg)
  const [verifyMsg, setVerifyMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [flash, setFlash] = useState<string>('')

  const set = <K extends keyof GitHubConfig>(k: K, v: GitHubConfig[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const save = () => {
    onCfgChange(draft)
    setFlash('配置已保存')
    setTimeout(() => setFlash(''), 2000)
  }

  const verify = async () => {
    setVerifying(true)
    setVerifyMsg(null)
    try {
      const r = await verifyToken(draft)
      setVerifyMsg(
        r.ok
          ? { ok: true, text: `验证通过 · 账号 ${r.login}` }
          : { ok: false, text: r.message ?? '验证失败' },
      )
    } catch {
      setVerifyMsg({ ok: false, text: '网络错误，无法验证' })
    } finally {
      setVerifying(false)
    }
  }

  const doClearToken = () => {
    const next = { ...draft, token: '' }
    setDraft(next)
    onCfgChange(next)
    setVerifyMsg({ ok: true, text: 'Token 已清除' })
  }

  const handle = (fn: () => Promise<SyncResult>) => async () => {
    onCfgChange(draft)
    await fn()
  }

  return (
    <section>
      <SectionTitle roman="IV" title="同步配置" sub="The Wire" />

      <p className="deck">
        数据存于 GitHub 仓库的 <code className="mono">data/app.json</code>。填写下方的
        令牌与仓库信息，即可在多设备间同步打卡记录。同步采用乐观锁与日期级合并，
        冲突时保留两份备注，不会丢失手记。
      </p>

      <div className="warning">
        <strong>关于安全。</strong> Personal Access Token 仅保存在你当前浏览器的
        localStorage 中，不会上传至任何第三方服务器。但 localStorage 对页面脚本可见，
        若他人获得该令牌，可读写你授权范围内的仓库。建议使用 Fine-grained Token，
        仅授权本仓库的 Contents 读写权限，并定期更换。
      </div>

      <div className="settings-form">
        <div className="form-row">
          <label htmlFor="f-owner">用户名 / Owner</label>
          <input
            id="f-owner"
            className="field"
            value={draft.owner}
            placeholder="Weilv-D"
            onChange={(e) => set('owner', e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="f-repo">仓库 / Repo</label>
          <input
            id="f-repo"
            className="field"
            value={draft.repo}
            placeholder="tomyself2026"
            onChange={(e) => set('repo', e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="f-branch">分支 / Branch</label>
          <input
            id="f-branch"
            className="field"
            value={draft.branch}
            placeholder="main"
            onChange={(e) => set('branch', e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="f-path">文件路径 / Path</label>
          <input
            id="f-path"
            className="field"
            value={draft.path}
            placeholder="data/app.json"
            onChange={(e) => set('path', e.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="f-token">令牌 / Token</label>
          <input
            id="f-token"
            className="field"
            type="password"
            value={draft.token}
            placeholder="github_pat_… 或 ghp_…"
            onChange={(e) => set('token', e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="form-row">
          <label>自动行为</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.autoPull}
                onChange={(e) => set('autoPull', e.target.checked)}
              />
              打开应用时自动拉取远程数据
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={draft.autoPush}
                onChange={(e) => set('autoPush', e.target.checked)}
              />
              每次打卡后自动推送至远程
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn--solid" onClick={save}>保存配置</button>
          <button
            type="button"
            className="btn"
            onClick={verify}
            disabled={verifying || !draft.token}
          >
            {verifying ? '验证中…' : '验证连通性'}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={doClearToken}
            disabled={!draft.token}
          >
            清除 Token
          </button>
        </div>

        {verifyMsg && (
          <div className={'alert ' + (verifyMsg.ok ? 'ok' : 'err')} style={{ marginTop: 'var(--sp-3)' }}>
            {verifyMsg.text}
          </div>
        )}
        {flash && <div className="alert ok" style={{ marginTop: 'var(--sp-3)' }}>{flash}</div>}
      </div>

      <Divider />

      <div style={{ marginTop: 'var(--sp-5)' }}>
        <div className="panel-head">手动同步</div>
        <p className="help-text">
          拉取：远程覆盖本地（合并）。推送：本地写回远程。同步：先拉取合并再推送。
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={handle(onPull)}
            disabled={!draft.token}
          >
            拉取
          </button>
          <button
            type="button"
            className="btn"
            onClick={handle(onPush)}
            disabled={!draft.token}
          >
            推送
          </button>
          <button
            type="button"
            className="btn btn--solid"
            onClick={handle(onSync)}
            disabled={!draft.token}
          >
            同步
          </button>
        </div>
        {message && <div className="alert ok" style={{ marginTop: 'var(--sp-3)' }}>{message}</div>}
      </div>
    </section>
  )
}
