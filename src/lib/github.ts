import type { AppData, BlockCheck, DayRecord } from '../types'
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

/** 字符串 → base64（UTF-8 字节流）。Contents API 要求 base64 内容。
 *  TextEncoder 编码为 UTF-8 字节后逐字节拼成二进制串，再交给 btoa。 */
function encodeBase64Utf8(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

/** base64 → 字符串（UTF-8 字节流解码）。与 encodeBase64Utf8 对称。 */
function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

/** 拉取远程文件。所有请求禁用缓存，保证每次拿到最新内容与 SHA。
 *  - 文件不存在（404）→ { sha:null, data:null }。
 *  - 文件存在 → 解析为 AppData；解析失败抛 GitHubError，携带原始错误信息。
 *    （不把解析失败当成空仓库，否则会被随后的推送当作新建而覆盖远程真实数据。） */
export async function pullRemote(cfg: GitHubConfig): Promise<RemoteFile> {
  const url = `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(
    cfg.path,
  )}?ref=${encodeURIComponent(cfg.branch)}`

  const res = await fetch(url, { headers: headers(cfg), cache: 'no-store' })

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
  if (!json.content) {
    // 文件存在但无 content（目录或超过 1MB 的大文件），Contents API 不返回内联内容
    throw new GitHubError('远程文件无 content（可能是目录或过大）', res.status)
  }
  try {
    const decoded = decodeBase64Utf8(atob(json.content.replace(/\n/g, '')))
    return { sha, data: JSON.parse(decoded) as AppData }
  } catch (e) {
    throw new GitHubError(
      `远程数据解析失败：${e instanceof Error ? e.message : String(e)}`,
      res.status,
    )
  }
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
    content: encodeBase64Utf8(JSON.stringify(data, null, 2)),
  }
  if (sha) body.sha = sha

  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(cfg),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (res.status === 409 || res.status === 422) {
    // SHA 不匹配（远程已变更）或新建时文件已存在。先拉取刷新 SHA，再同步
    throw new GitHubError('远程已更新，本地 SHA 过期，请先「拉取」再同步', res.status)
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

/** 测试连通性：验证 token 有效、仓库可读，并尽量探测写权限。
 *  返回 { ok, login, message, canWrite } */
export async function verifyToken(
  cfg: GitHubConfig,
): Promise<{ ok: boolean; login?: string; message?: string; canWrite?: boolean }> {
  // 先校验 token 本身
  const me = await fetch(`${API}/user`, { headers: headers(cfg), cache: 'no-store' })
  if (!me.ok) {
    return { ok: false, message: `Token 无效（HTTP ${me.status}）` }
  }
  const meJson = await me.json()
  // 再校验仓库可读，并读取 permissions 判断是否可写
  const repo = await fetch(
    `${API}/repos/${cfg.owner}/${cfg.repo}`,
    { headers: headers(cfg), cache: 'no-store' },
  )
  if (repo.status === 404) {
    return { ok: false, message: '仓库不存在或 token 无权访问' }
  }
  if (!repo.ok) {
    return { ok: false, message: `仓库访问失败（HTTP ${repo.status}）` }
  }
  const repoJson = await repo.json()
  // Fine-grained token 的 permissions 不总在 repo 对象里，但若有则据实回报。
  // 注意：即便 push=true，fine-grained token 仍受其 Contents 权限范围限制，
  // 真正写权限以首次推送结果为准。
  const canWrite = !!repoJson.permissions?.push
  return { ok: true, login: meJson.login, canWrite }
}

/** 合并两份 AppData：按修改时间戳「最后写入优先」(Last-Write-Wins)。
 *
 *  - records：逐日逐块比较 updatedAt，取新者的整条 BlockCheck
 *    （done / actualMinutes / note 作为原子单元一起跟随时戳）。
 *    同一真冲突时旧端备注被丢弃。
 *  - schedule：作为整体单元比较 scheduleUpdatedAt，取新者的整份作息
 *    （不做逐块混搭，避免时段错乱）；meta 非用户可编辑，跟随同一胜者。
 *  - 无时间戳（老数据）视为 0（最旧），任何新写入都赢，纯加法、向后兼容。
 *
 *  工作流建议：编辑前先拉取远程最新，可进一步缩小时钟偏差导致的冲突。 */
export function mergeData(local: AppData, remote: AppData | null): AppData {
  if (!remote) return local

  // ── 作息计划：整体取新者，meta 跟随 ──
  const localScheduleTs = local.scheduleUpdatedAt ?? 0
  const remoteScheduleTs = remote.scheduleUpdatedAt ?? 0
  const scheduleWinnerIsLocal = localScheduleTs >= remoteScheduleTs
  const schedule = scheduleWinnerIsLocal ? local.schedule : remote.schedule
  const meta = scheduleWinnerIsLocal ? local.meta : remote.meta

  // ── 打卡记录：逐日逐块 LWW ──
  const records = mergeRecords(local.records, remote.records)

  return {
    records,
    schedule,
    scheduleUpdatedAt: Math.max(localScheduleTs, remoteScheduleTs),
    meta,
  }
}

/** 取时间戳较新的那条 block；相等时本地优先（保证确定性）。 */
function newerBlock(local: BlockCheck, remote: BlockCheck): BlockCheck {
  return (local.updatedAt ?? 0) >= (remote.updatedAt ?? 0) ? local : remote
}

/** 逐日逐块合并打卡记录。 */
function mergeRecords(
  local: Record<string, DayRecord>,
  remote: Record<string, DayRecord>,
): Record<string, DayRecord> {
  const merged: Record<string, DayRecord> = { ...local }
  for (const [date, rDay] of Object.entries(remote)) {
    const lDay = merged[date]
    if (!lDay) {
      merged[date] = rDay
      continue
    }
    const blocks = { ...lDay.blocks }
    for (const [bid, rBlock] of Object.entries(rDay.blocks)) {
      const lBlock = blocks[bid]
      blocks[bid] = lBlock ? newerBlock(lBlock, rBlock) : rBlock
    }
    merged[date] = { date, blocks }
  }
  return merged
}
