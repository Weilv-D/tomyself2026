import { useState } from 'react'
import type { SyncResult } from '../../hooks/useGitHubSync'
import { SectionTitle } from '../ui/SectionTitle'
import { Divider } from '../ui/Divider'
import type { GitHubConfig } from '../../lib/storage'
import { verifyToken } from '../../lib/github'

interface SettingsPageProps {
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

  const ready = !!(draft.owner.trim() && draft.repo.trim() && draft.branch.trim() && draft.path.trim() && draft.token.trim())

  const validate = (): string | null => {
    if (!draft.owner.trim()) return '请填写用户名（Owner），如 Weilv-D'
    if (!draft.repo.trim()) return '请填写仓库名（Repo），如 tomyself2026'
    if (!draft.branch.trim()) return '请填写分支名（Branch），如 main'
    if (!draft.path.trim()) return '请填写文件路径，如 data/app.json'
    if (!draft.token.trim()) return '请填写令牌（Token）'
    return null
  }

  const verify = async () => {
    const missing = validate()
    if (missing) {
      setVerifyMsg({ ok: false, text: missing })
      return
    }
    setVerifying(true)
    setVerifyMsg(null)
    try {
      const r = await verifyToken(draft)
      setVerifyMsg(
        r.ok
          ? {
              ok: true,
              text:
                `验证通过 · 账号 ${r.login}` +
                (r.canWrite === false
                  ? '（只读：token 缺少 Contents 写权限，推送会失败）'
                  : ''),
            }
          : { ok: false, text: r.message ?? '验证失败' },
      )
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e)
      setVerifyMsg({
        ok: false,
        text: '连接失败：' + reason + '。常见原因：广告拦截/隐私扩展拦截了请求，或网络受限。',
      })
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
    const missing = validate()
    if (missing) {
      setVerifyMsg({ ok: false, text: missing })
      return
    }
    onCfgChange(draft)
    await fn()
  }

  return (
    <section>
      <SectionTitle roman="IV" title="同步配置" sub="The Wire" />

      <p className="deck">
        打卡记录存在仓库的 <code className="mono">data/app.json</code> 里。填好令牌和仓库信息，
        多台设备就能共用一份记录。
      </p>

      <div className="warning">
        <strong>令牌说明。</strong> 令牌存在本地浏览器，不经过任何第三方。
        请用 Fine-grained Token，只勾选本仓库的 Contents 读写权限；怀疑泄露时
        在 GitHub 把它删掉重发即可。
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
            disabled={!ready}
          >
            拉取
          </button>
          <button
            type="button"
            className="btn"
            onClick={handle(onPush)}
            disabled={!ready}
          >
            推送
          </button>
          <button
            type="button"
            className="btn btn--solid"
            onClick={handle(onSync)}
            disabled={!ready}
          >
            同步
          </button>
        </div>
        {message && <div className="alert ok" style={{ marginTop: 'var(--sp-3)' }}>{message}</div>}
      </div>
    </section>
  )
}
