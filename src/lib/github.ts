import type { AppData } from '../types'
import type { GitHubConfig } from './storage'

const API = 'https://api.github.com'

export interface RemoteFile {
  /** 文件 SHA，新建文件时为 null */
  sha: string | null
  /** 解析后的数据；远程为空/损坏时回退 null */
  data: AppData | null
}

export class GitHubError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'GitHubError'
  }
}

function headers(cfg: GitHubConfig): HeadersInit {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

/** 拉取远程文件。404 → 返回 { sha:null, data:null }（远程为空） */
export async function pullRemote(cfg: GitHubConfig): Promise<RemoteFile> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    cfg.path,
  )}?ref=${encodeURIComponent(cfg.branch)}`

  const res = await fetch(url, { headers: headers(cfg) })

  if (res.status === 404) {
    return { sha: null, data: null }
  }
  if (res.status === 401 || res.status === 403) {
    throw new GitHubError('Token 无权限或已失效', res.status)
  }
  if (!res.ok) {
    throw new GitHubError(`拉取失败：HTTP ${res.status}`, res.status)
  }

  const json = await res.json()
  const sha: string = json.sha
  let data: AppData | null = null
  try {
    const decoded = atob(json.content.replace(/\n/g, ''))
    data = JSON.parse(decoded) as AppData
  } catch {
    data = null
  }
  return { sha, data }
}

/** 推送本地数据到远程。
 *  - sha=null：新建文件（不带 sha）
 *  - sha 存在：更新（带 sha 乐观锁）
 *  返回新的 sha。冲突（409/422）抛出 GitHubError */
export async function pushRemote(
  cfg: GitHubConfig,
  data: AppData,
  sha: string | null,
  message = 'chore(data): update via 考研日课',
): Promise<string> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.path)}`

  const body: Record<string, unknown> = {
    message,
    branch: cfg.branch,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
  }
  if (sha) body.sha = sha

  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(cfg),
    body: JSON.stringify(body),
  })

  if (res.status === 409 || res.status === 422) {
    throw new GitHubError('远程已更新，存在冲突，请先拉取', res.status)
  }
  if (res.status === 401 || res.status === 403) {
    throw new GitHubError('Token 无写入权限', res.status)
  }
  if (!res.ok) {
    let msg = `推送失败：HTTP ${res.status}`
    try {
      const j = await res.json()
      if (j?.message) msg = `${msg} · ${j.message}`
    } catch {
      /* ignore */
    }
    throw new GitHubError(msg, res.status)
  }

  const json = await res.json()
  return json.content?.sha as string
}

/** 测试连通性：验证 token 对该仓库可读。
 *  返回 { ok, login, message } */
export async function verifyToken(
  cfg: GitHubConfig,
): Promise<{ ok: boolean; login?: string; message?: string }> {
  // 先校验 token 本身
  const me = await fetch(`${API}/user`, { headers: headers(cfg) })
  if (!me.ok) {
    return { ok: false, message: `Token 无效（HTTP ${me.status}）` }
  }
  const meJson = await me.json()
  // 再校验仓库可读
  const repo = await fetch(
    `${API}/repos/${cfg.owner}/${cfg.repo}`,
    { headers: headers(cfg) },
  )
  if (repo.status === 404) {
    return { ok: false, message: '仓库不存在或 token 无权访问' }
  }
  if (!repo.ok) {
    return { ok: false, message: `仓库访问失败（HTTP ${repo.status}）` }
  }
  return { ok: true, login: meJson.login }
}

/** 合并两份 AppData：以 base 为主，叠加 remote 的差异。
 *  - records：按 date 合并，同日按 blockId 合并，冲突块保留本地（备注拼接）
 *  - schedule / meta：本地优先 */
export function mergeData(base: AppData, remote: AppData | null): AppData {
  if (!remote) return base
  const merged: AppData = {
    records: { ...base.records },
    schedule: base.schedule,
    meta: base.meta,
  }
  for (const [date, rRec] of Object.entries(remote.records)) {
    const localDay = merged.records[date]
    if (!localDay) {
      merged.records[date] = rRec
      continue
    }
    const mergedBlocks = { ...localDay.blocks }
    for (const [bid, rBlock] of Object.entries(rRec.blocks)) {
      const lb = mergedBlocks[bid]
      if (!lb) {
        mergedBlocks[bid] = rBlock
        continue
      }
      // 冲突：本地 done 优先；实际时长取较大值；备注拼接
      const notes = [lb.note, rBlock.note].filter(Boolean)
      mergedBlocks[bid] = {
        done: lb.done || rBlock.done,
        actualMinutes:
          (lb.actualMinutes ?? 0) >= (rBlock.actualMinutes ?? 0)
            ? lb.actualMinutes
            : rBlock.actualMinutes,
        note: notes.length ? notes.join(' ／ ') : undefined,
      }
    }
    merged.records[date] = { date, blocks: mergedBlocks }
  }
  return merged
}
