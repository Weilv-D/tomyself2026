import type { SubjectStat } from '../../lib/stats'
import { fmtDuration } from '../../lib/time'

interface SubjectBarsProps {
  stats: SubjectStat[]
}

export function SubjectBars({ stats }: SubjectBarsProps) {
  if (stats.length === 0) {
    return (
      <p className="subject-empty">还没有学习记录。</p>
    )
  }
  const max = Math.max(...stats.map((s) => s.minutes), 1)
  return (
    <div>
      {stats.map((s) => {
        const pct = Math.round((s.minutes / max) * 100)
        return (
          <div className="subject-row" key={s.subject}>
            <span className="subject-name">{s.subject}</span>
            <div className="subject-bar-track">
              <div className="subject-bar-fill" style={{ width: pct + '%' }} />
            </div>
            <span className="subject-value">{fmtDuration(s.minutes)}</span>
          </div>
        )
      })}
    </div>
  )
}
