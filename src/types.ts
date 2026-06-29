// ───────────────────────────────────────────────
// 数据模型定义
// ───────────────────────────────────────────────

/** 星期，0 = 周日 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 时间块类别 */
export type Category =
  | 'deepwork' // 深度工作
  | 'rest' // 休息/放空
  | 'sleep' // 睡眠
  | 'meal' // 餐饮社交
  | 'exercise' // 运动
  | 'review' // 复盘/提取练习
  | 'social' // 社交
  | 'other' // 其他

/** 是否计入"学习"统计 */
export const STUDY_CATEGORIES: Category[] = ['deepwork', 'review']

/** 科目（学习类时间块的归属，用于科目时长统计） */
export const SUBJECTS = ['数学', '控制', '英语', '政治'] as const
export type Subject = (typeof SUBJECTS)[number]

/** 「其他/未归类」科目：未设 subject 的学习类块计入此项 */
export const SUBJECT_OTHER = '其他'

/** 时间块变体：按星期或单双号覆盖基础块的标题/科目/细节 */
export interface BlockVariant {
  title?: string
  /** 覆盖科目（用于单双号交替切换「数学/控制」） */
  subject?: string
  detail?: string
}

/** 时间块（日程项） */
export interface ScheduleBlock {
  id: string
  start: string // "07:30"
  end: string // "08:00"
  title: string
  category: Category
  /** 数学/控制/英语/政治，仅学习类需要，用于科目统计 */
  subject?: string
  /** 脑科学执行细节 */
  detail?: string
  /** 按星期变化的覆盖（如运动块：一三五与二四不同） */
  weekdayVariant?: Partial<Record<Weekday, BlockVariant>>
  /** 按日期单双号变化的覆盖（如 14:00 数学/控制交替） */
  dateParityVariant?: {
    /** 奇数日 */
    odd?: BlockVariant
    /** 偶数日 */
    even?: BlockVariant
  }
}

/** 单个时间块的打卡状态 */
export interface BlockCheck {
  done: boolean
  /** 实际学习时长（分钟），仅学习类录入 */
  actualMinutes?: number
  /** 手记备注，用于改进计划 */
  note?: string
  /** 该块最近一次修改的毫秒时间戳。同步合并时按它做「最后写入优先」。 */
  updatedAt?: number
}

/** 某日打卡记录 */
export interface DayRecord {
  /** "2026-06-28" */
  date: string
  blocks: Record<string, BlockCheck>
}

/** 全部数据（同步单元） */
export interface AppData {
  /** 按 date 索引的打卡记录 */
  records: Record<string, DayRecord>
  /** 可编辑的作息计划 */
  schedule: ScheduleBlock[]
  /** 作息计划最近一次修改的毫秒时间戳。同步时整体取新者，避免逐块混搭。 */
  scheduleUpdatedAt?: number
  meta: {
    /** 打卡起始日（用于计算期号） */
    startDate: string
    /** 考研日期（可选，用于倒计时） */
    examDate?: string
  }
}

/** 类别中文标签 */
export const CATEGORY_LABEL: Record<Category, string> = {
  deepwork: '深度工作',
  rest: '休息',
  sleep: '睡眠',
  meal: '餐饮',
  exercise: '运动',
  review: '复盘',
  social: '社交',
  other: '其他',
}

/** 类别英文衬线标签（用于报刊副标） */
export const CATEGORY_LABEL_EN: Record<Category, string> = {
  deepwork: 'Deep Work',
  rest: 'Recess',
  sleep: 'Slumber',
  meal: 'Meal',
  exercise: 'Exercise',
  review: 'Recall',
  social: 'Social',
  other: 'Miscellany',
}

/** 类别对应的灰阶深度（0-1，越大越深），用于时间轴与图表着色 */
export const CATEGORY_WEIGHT: Record<Category, number> = {
  deepwork: 1.0,
  review: 0.82,
  exercise: 0.6,
  meal: 0.42,
  rest: 0.28,
  social: 0.42,
  sleep: 0.12,
  other: 0.5,
}
