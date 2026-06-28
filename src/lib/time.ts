import type { Weekday } from '../types'

/** "HH:MM" → 当天从 00:00 起的分钟数 */
export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** 分钟数 → "H:MM"（24h） */
export function minToTime(min: number): string {
  const h = Math.floor(((min % 1440) + 1440) % 1440 / 60)
  const m = Math.floor(((min % 1440) + 1440) % 1440 % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

/** 区间时长（分钟）。跨天（如 23:00→07:30）按跨越午夜计算 */
export function durationMin(start: string, end: string): number {
  let s = timeToMin(start)
  let e = timeToMin(end)
  if (e <= s) e += 1440
  return e - s
}

/** 分钟 → "Xh Ym" 中文 */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** 分钟 → "X.Yh" 小数 */
export function fmtHours(min: number): string {
  return (min / 60).toFixed(1)
}

/** Date → "2026-06-28" */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 今天的 ISO 日期 */
export function todayISO(): string {
  return toISODate(new Date())
}

/** 日期偏移：返回 base +/- n 天 的 ISO 日期 */
export function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** ISO → Weekday */
export function weekdayOf(iso: string): Weekday {
  return new Date(iso + 'T00:00:00').getDay() as Weekday
}

/** 星期中文 */
export const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六']

/** 格式化为中文长日期："2026 年 6 月 28 日 周日" */
export function fmtLongDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const w = weekdayOf(iso)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${WEEKDAY_CN[w]}`
}

/** 格式化为英文长日期（报头副标用）："28 June 2026" */
export function fmtLongDateEn(iso: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/** 距今天的天数（base - today，正数=未来） */
export function daysFromToday(iso: string): number {
  const a = new Date(iso + 'T00:00:00').getTime()
  const b = new Date(todayISO() + 'T00:00:00').getTime()
  return Math.round((a - b) / 86400000)
}
