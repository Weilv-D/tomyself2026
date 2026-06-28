import type { AppData, DayRecord, ScheduleBlock, BlockCheck, Category } from '../types'
import { STUDY_CATEGORIES, CATEGORY_LABEL, CATEGORY_WEIGHT } from '../types'
import { durationMin, shiftISO, todayISO } from './time'

/** 获取某日记录（无则空） */
export function getDayRecord(data: AppData, date: string): DayRecord | null {
  return data.records[date] ?? null
}

/** 某日某块的打卡状态（无则空） */
export function getBlockCheck(rec: DayRecord | null, blockId: string): BlockCheck {
  return rec?.blocks[blockId] ?? { done: false }
}

/** 该日某个 block 的有效时长：学习类用 actualMinutes，否则按计划时长 */
export function blockEffectiveMinutes(
  block: ScheduleBlock,
  check: BlockCheck,
): number {
  if (STUDY_CATEGORIES.includes(block.category)) {
    return check.actualMinutes ?? 0
  }
  // 非学习类按计划区间计
  return check.done ? durationMin(block.start, block.end) : 0
}

/** 该日实际学习总时长（分钟） */
export function dayStudyMinutes(data: AppData, date: string): number {
  const rec = getDayRecord(data, date)
  if (!rec) return 0
  return data.schedule
    .filter((b) => STUDY_CATEGORIES.includes(b.category))
    .reduce((sum, b) => sum + (rec.blocks[b.id]?.actualMinutes ?? 0), 0)
}

/** 该日计划学习总时长（分钟） */
export function dayPlannedStudyMinutes(schedule: ScheduleBlock[]): number {
  return schedule
    .filter((b) => STUDY_CATEGORIES.includes(b.category))
    .reduce((sum, b) => sum + durationMin(b.start, b.end), 0)
}

/** 该日完成率 = 已勾选块数 / 全部块数（0-1） */
export function dayCompletionRate(data: AppData, date: string): number {
  const rec = getDayRecord(data, date)
  const total = data.schedule.length
  if (!rec || total === 0) return 0
  const done = data.schedule.filter((b) => rec.blocks[b.id]?.done).length
  return done / total
}

/** 该日是否打卡（至少勾选一项） */
export function isDayActive(data: AppData, date: string): boolean {
  const rec = getDayRecord(data, date)
  if (!rec) return false
  return data.schedule.some((b) => rec.blocks[b.id]?.done)
}

/** 连续打卡天数（含今天，若今天未打卡则从昨天起算） */
export function currentStreak(data: AppData): number {
  let streak = 0
  let cursor = todayISO()
  // 如果今天还没打卡，从昨天开始数（不惩罚"今天还没开始"）
  if (!isDayActive(data, cursor)) cursor = shiftISO(cursor, -1)
  while (isDayActive(data, cursor)) {
    streak++
    cursor = shiftISO(cursor, -1)
  }
  return streak
}

/** 最长连续打卡天数 */
export function longestStreak(data: AppData): number {
  const dates = Object.keys(data.records)
    .filter((d) => isDayActive(data, d))
    .sort()
  if (dates.length === 0) return 0
  let longest = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    if (shiftISO(dates[i - 1], 1) === dates[i]) {
      run++
    } else {
      run = 1
    }
    if (run > longest) longest = run
  }
  return longest
}

export interface SubjectStat {
  subject: string
  minutes: number
}

/** 给定日期集合内，按科目的学习时长汇总 */
export function subjectMinutes(
  data: AppData,
  dates: string[],
): SubjectStat[] {
  const map = new Map<string, number>()
  for (const date of dates) {
    const rec = getDayRecord(data, date)
    if (!rec) continue
    for (const block of data.schedule) {
      if (!STUDY_CATEGORIES.includes(block.category)) continue
      const subj = block.subject ?? '其他'
      const mins = rec.blocks[block.id]?.actualMinutes ?? 0
      if (mins > 0) map.set(subj, (map.get(subj) ?? 0) + mins)
    }
  }
  return Array.from(map.entries())
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}

/** 最近 n 天（含今天）的日期数组 */
export function recentDates(n: number): string[] {
  const out: string[] = []
  let cur = todayISO()
  for (let i = 0; i < n; i++) {
    out.unshift(cur)
    cur = shiftISO(cur, -1)
  }
  return out
}

/** 本周（周一到今天）的日期数组 */
export function weekDates(): string[] {
  const today = new Date()
  const dow = today.getDay() // 0=周日
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  const out: string[] = []
  const cur = new Date(monday)
  while (cur <= today) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

/** 热力图：返回最近 weeks 周、每周 7 天（周一起）的网格，含完成率 */
export interface HeatCell {
  date: string
  rate: number // 0-1
  active: boolean
  studyMinutes: number
  isToday: boolean
  isFuture: boolean
}

export function heatmapCells(data: AppData, weeks = 18): HeatCell[] {
  const today = new Date()
  const todayDate = todayISO()
  // 找到 weeks*7 天前的那个周一
  const start = new Date(today)
  start.setDate(today.getDate() - (weeks * 7 - 1))
  // 调整到周一
  const dow = start.getDay()
  const back = dow === 0 ? 6 : dow - 1
  start.setDate(start.getDate() - back)

  const cells: HeatCell[] = []
  const cur = new Date(start)
  while (cur <= today) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    const date = `${y}-${m}-${d}`
    cells.push({
      date,
      rate: dayCompletionRate(data, date),
      active: isDayActive(data, date),
      studyMinutes: dayStudyMinutes(data, date),
      isToday: date === todayDate,
      isFuture: false,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return cells
}

/** 完成率序列：最近 n 天每天的 { date, planned, actual, rate } */
export interface CompletionPoint {
  date: string
  planned: number
  actual: number
  rate: number
}

export function completionSeries(
  data: AppData,
  dates: string[],
): CompletionPoint[] {
  const planned = dayPlannedStudyMinutes(data.schedule)
  return dates.map((date) => {
    const actual = dayStudyMinutes(data, date)
    return {
      date,
      planned,
      actual,
      rate: planned > 0 ? actual / planned : 0,
    }
  })
}

/** 24 小时时间轴片段：将当日 schedule 展开为分钟区段，标注类别 */
export interface TimelineSeg {
  blockId: string
  title: string
  category: Category
  startMin: number // 0-1440
  endMin: number
  done: boolean
  weight: number
}

export function dayTimeline(data: AppData, date: string): TimelineSeg[] {
  const rec = getDayRecord(data, date)
  return data.schedule
    .map((b) => {
      let s = toMin(b.start)
      let e = toMin(b.end)
      if (e <= s) e += 1440
      // 睡眠段（23:00→07:30）拆成两部分以正确显示在时间轴
      // 这里统一保留为跨段，渲染时按需处理
      return {
        blockId: b.id,
        title: b.title,
        category: b.category,
        startMin: s,
        endMin: e,
        done: !!rec?.blocks[b.id]?.done,
        weight: CATEGORY_WEIGHT[b.category],
      }
    })
    .sort((a, b) => a.startMin - b.startMin)
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** 类别标签映射（供组件使用） */
export { CATEGORY_LABEL }
