import type { CompletionPoint } from '../../lib/stats'
import { fmtHours } from '../../lib/time'

interface CompletionChartProps {
  points: CompletionPoint[]
}

const W = 760
const H = 240
const PAD_L = 44
const PAD_R = 16
const PAD_T = 20
const PAD_B = 36

export function CompletionChart({ points }: CompletionChartProps) {
  if (points.length === 0) {
    return <p className="subject-empty">还没有数据。</p>
  }

  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const maxVal = Math.max(...points.map((p) => Math.max(p.planned, p.actual)), 60)
  // 取整到 30 的倍数，刻度好看
  const yMax = Math.ceil(maxVal / 30) * 30

  const x = (i: number) =>
    points.length === 1 ? PAD_L + innerW / 2 : PAD_L + (i / (points.length - 1)) * innerW
  const y = (v: number) => PAD_T + innerH - (v / yMax) * innerH

  const actualPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.actual)}`).join(' ')
  const plannedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.planned)}`).join(' ')

  // Y 轴刻度
  const ticks = [0, yMax / 2, yMax]

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="计划与实际学习时长对比折线图">
        {/* 网格线 */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--gray-15)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 8}
              y={y(t) + 3}
              textAnchor="end"
              className="chart-axis-label"
            >
              {fmtHours(t)}h
            </text>
          </g>
        ))}

        {/* 计划线（虚线灰） */}
        <path d={plannedPath} fill="none" stroke="var(--gray-50)" strokeWidth="1.5" strokeDasharray="4 4" />
        {/* 实际线（实线墨） */}
        <path d={actualPath} fill="none" stroke="var(--ink)" strokeWidth="2.5" />

        {/* 实际点 */}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.actual)} r="3" fill="var(--ink)" />
        ))}

        {/* X 轴日期标签（首/中/尾） */}
        {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => (
          <text
            key={idx}
            x={x(idx)}
            y={H - 12}
            textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
            className="chart-axis-label"
          >
            {points[idx].date.slice(5)}
          </text>
        ))}
      </svg>
      <div className="timeline-legend" style={{ marginTop: 'var(--sp-2)' }}>
        <div className="timeline-legend-item">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="var(--ink)" strokeWidth="2.5" /></svg>
          实际学习
        </div>
        <div className="timeline-legend-item">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="var(--gray-50)" strokeWidth="1.5" strokeDasharray="4 4" /></svg>
          计划学习
        </div>
      </div>
    </div>
  )
}
