import type { TimelineSeg } from '../../lib/stats'
import type { Category, AppData } from '../../types'
import { CATEGORY_LABEL, CATEGORY_WEIGHT } from '../../types'
import { minToTime } from '../../lib/time'

interface DayTimelineProps {
  segs: TimelineSeg[]
  data: AppData
}

/** 灰阶 weight (0-1) → 实际墨色，越深越接近纯黑 */
function weightToColor(w: number): string {
  // 0.12 → 最浅灰，1.0 → 纯黑
  const lightest = 217 // 对应 --gray-15 的近似
  const darkest = 10
  const v = Math.round(darkest + (lightest - darkest) * (1 - w))
  return `rgb(${v}, ${v - 2}, ${v - 8})`
}

export function DayTimeline({ segs, data }: DayTimelineProps) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const nowPct = (nowMin / 1440) * 100

  return (
    <div className="timeline-wrap">
      <div className="timeline-bar">
        {segs.map((seg) => {
          // 跨午夜块（如睡眠 23:00→07:30）拆成两段显示
          const span = seg.endMin > seg.startMin ? seg.endMin - seg.startMin : seg.endMin + 1440 - seg.startMin
          const pct = (span / 1440) * 100
          const isCross = seg.endMin <= seg.startMin
          return (
            <div
              key={seg.blockId}
              className={'timeline-seg' + (seg.done ? ' done' : '')}
              style={{
                width: pct + '%',
                background: seg.done ? weightToColor(seg.weight) : 'var(--paper)',
                opacity: seg.done ? 1 : 0.5,
              }}
              title={`${minToTime(seg.startMin)} ${seg.title}${seg.done ? ' · 已完成' : ''}`}
            >
              {isCross && <span className="sr-only">跨午夜</span>}
            </div>
          )
        })}
        {/* 当前时刻指示线（仅今天有意义，但简单起见始终显示） */}
        <div className="timeline-now" style={{ left: nowPct + '%' }} title={`现在 ${minToTime(nowMin)}`} />
      </div>

      <div className="timeline-scale">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>

      <div className="timeline-legend">
        {legendCategories(data).map((c) => (
          <div className="timeline-legend-item" key={c}>
            <span className="legend-swatch" style={{ background: weightToColor(CATEGORY_WEIGHT[c]) }} />
            {CATEGORY_LABEL[c]}
          </div>
        ))}
      </div>
    </div>
  )
}

function legendCategories(data: AppData): Category[] {
  const used = new Set<Category>()
  for (const b of data.schedule) used.add(b.category)
  // 固定顺序，便于阅读
  const order: Category[] = ['deepwork', 'review', 'exercise', 'meal', 'rest', 'sleep', 'social', 'other']
  return order.filter((c) => used.has(c))
}
