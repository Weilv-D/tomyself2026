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
        {segs.map((seg, i) => {
          // 按绝对钟点定位：左偏移 = startMin/1440，宽度 = span/1440，
          // 这样色块与底部 00/06/12/18/24 刻度及红色 now 线对齐。
          const span = seg.endMin - seg.startMin
          if (span <= 0) return null
          const leftPct = (seg.startMin / 1440) * 100
          const widthPct = (span / 1440) * 100
          return (
            <div
              key={seg.blockId + '-' + i}
              className={'timeline-seg' + (seg.done ? ' done' : '')}
              style={{
                left: leftPct + '%',
                width: widthPct + '%',
                background: seg.done ? weightToColor(seg.weight) : 'var(--paper)',
                opacity: seg.done ? 1 : 0.5,
              }}
              title={`${minToTime(seg.startMin)}–${minToTime(seg.endMin)} ${seg.title}${seg.done ? ' · 已完成' : ''}`}
            />
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
