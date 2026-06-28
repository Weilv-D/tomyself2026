import type { HeatCell } from '../../lib/stats'

interface StreakHeatmapProps {
  current: number
  longest: number
  cells: HeatCell[]
}

function levelOf(rate: number): 0 | 1 | 2 | 3 | 4 {
  if (rate <= 0) return 0
  if (rate < 0.25) return 1
  if (rate < 0.5) return 2
  if (rate < 0.85) return 3
  return 4
}

export function StreakHeatmap({ current, longest, cells }: StreakHeatmapProps) {
  return (
    <div>
      <div className="big-number-row" style={{ marginBottom: 'var(--sp-5)' }}>
        <div>
          <div className="big-number">
            {current}<span className="big-number-unit">日</span>
          </div>
          <div className="big-number-label">当前连续打卡</div>
          <div className="big-number-en">Current Streak</div>
        </div>
        <div>
          <div className="big-number" style={{ fontSize: '2.4rem', color: 'var(--gray-70)' }}>
            {longest}
          </div>
          <div className="big-number-label">最长纪录</div>
          <div className="big-number-en">Longest</div>
        </div>
      </div>

      <div className="heatmap">
        {cells.map((c) => (
          <div
            key={c.date}
            className={'heat-cell l' + levelOf(c.rate) + (c.isToday ? ' today' : '')}
            title={`${c.date} · 完成率 ${Math.round(c.rate * 100)}%`}
          />
        ))}
      </div>

      <div className="heat-legend">
        <span>少 Less</span>
        <div className="heat-cell" />
        <div className="heat-cell l1" />
        <div className="heat-cell l2" />
        <div className="heat-cell l3" />
        <div className="heat-cell l4" />
        <span>More 多</span>
      </div>
    </div>
  )
}
