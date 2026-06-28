import type { AppData } from '../types'
import { DEFAULT_SCHEDULE, DEFAULT_META } from '../data/defaultSchedule'

const DATA_KEY = 'kyrc.data.v1'
const CONFIG_KEY = 'kyrc.github.v1'

/** GitHub 同步配置 */
export interface GitHubConfig {
  owner: string
  repo: string
  branch: string
  /** Personal Access Token */
  token: string
  /** 文件路径，默认 data/app.json */
  path: string
  /** 启动时自动拉取 */
  autoPull: boolean
  /** 打卡后自动推送 */
  autoPush: boolean
}

export const DEFAULT_CONFIG: GitHubConfig = {
  owner: '',
  repo: 'tomyself2026',
  branch: 'main',
  token: '',
  path: 'data/app.json',
  autoPull: true,
  autoPush: false,
}

/** 创建初始数据（与 data/app.json seed 一致） */
export function createInitialData(): AppData {
  return {
    records: {},
    schedule: DEFAULT_SCHEDULE,
    meta: { ...DEFAULT_META },
  }
}

/** 读取本地数据，缺失或损坏时回退初始数据 */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return createInitialData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      records: parsed.records ?? {},
      schedule: parsed.schedule?.length ? parsed.schedule : DEFAULT_SCHEDULE,
      meta: { ...DEFAULT_META, ...parsed.meta },
    }
  } catch {
    return createInitialData()
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('保存失败', e)
  }
}

export function loadConfig(): GitHubConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<GitHubConfig>) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(cfg: GitHubConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}
