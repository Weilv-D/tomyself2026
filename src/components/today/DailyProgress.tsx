import { fmtHours, fmtDuration } from '../../lib/time'

interface DailyProgressProps {
  studiedMinutes: number
  plannedMinutes: number
  completionRate: number // 0-1
}

export function DailyProgress({
  studiedMinutes,
  plannedMinutes,
  completionRate,
}: DailyProgressProps) {
  const pct = Math.round(completionRate * 100)
  const studyPct =
    plannedMinutes > 0
      ? Math.min(100, Math.round((studiedMinutes / plannedMinutes) * 100))
      : 0

  return (
    <div className="daily-progress">
      <div className="daily-stat">
        <div className="daily-stat-value">
          {fmtHours(studiedMinutes)}<small>h</small>
        </div>
        <div className="daily-stat-label">实际学习 · {fmtDuration(studiedMinutes)}</div>
      </div>
      <div className="daily-stat">
        <div className="daily-stat-value">
          {fmtHours(plannedMinutes)}<small>h</small>
        </div>
        <div className="daily-stat-label">计划学习 · {fmtDuration(plannedMinutes)}</div>
      </div>
      <div className="daily-stat">
        <div className="daily-stat-value">{pct}<small>%</small></div>
        <div className="daily-stat-label">打卡完成率</div>
      </div>

      <div className="progress-track" title={`学习进度 ${studyPct}%`}>
        <div className="progress-fill" style={{ width: `${studyPct}%` }} />
      </div>
      <div className="progress-ticks">
        <span>0</span>
        <span>{studyPct}%</span>
        <span>100</span>
      </div>
    </div>
  )
}
