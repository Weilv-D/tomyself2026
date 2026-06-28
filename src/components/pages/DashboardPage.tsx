import { useMemo, useState } from 'react'
import type { AppDataApi } from '../../hooks/useAppData'
import { SectionTitle } from '../ui/SectionTitle'
import { Divider } from '../ui/Divider'
import { SubjectBars } from '../dashboard/SubjectBars'
import { StreakHeatmap } from '../dashboard/StreakHeatmap'
import { CompletionChart } from '../dashboard/CompletionChart'
import { DayTimeline } from '../dashboard/DayTimeline'
import {
  subjectMinutes,
  currentStreak,
  longestStreak,
  heatmapCells,
  completionSeries,
  dayTimeline,
  weekDates,
  recentDates,
} from '../../lib/stats'
import { todayISO } from '../../lib/time'

interface DashboardPageProps {
  app: AppDataApi
}

type Range = 'week' | 'month' | 'all'

export function DashboardPage({ app }: DashboardPageProps) {
  const { data } = app
  const [range, setRange] = useState<Range>('week')

  const dates = useMemo(() => {
    if (range === 'week') return weekDates()
    if (range === 'month') return recentDates(30)
    // all：全部有记录的日期
    return Object.keys(data.records).sort()
  }, [range, data.records])

  const subjects = useMemo(() => subjectMinutes(data, dates), [data, dates])
  const streak = useMemo(() => currentStreak(data), [data])
  const longest = useMemo(() => longestStreak(data), [data])
  const cells = useMemo(() => heatmapCells(data, 18), [data])
  const series = useMemo(() => completionSeries(data, dates), [data, dates])
  const timeline = useMemo(() => dayTimeline(data, todayISO()), [data])

  const totalStudy = subjects.reduce((s, x) => s + x.minutes, 0)

  return (
    <section>
      <SectionTitle roman="II" title="数据档案" sub="The Ledger" />

      <p className="deck">
        凡走过必留痕。此处记录每一日的时间去向——哪些科目占了你的清晨，哪些
        悄然偷走午后，又有哪些计划从未兑现。数据从不撒谎，它只是等待被阅读。
      </p>

      {/* 周期切换 */}
      <div className="range-tabs">
        <button
          type="button"
          className={'range-tab' + (range === 'week' ? ' active' : '')}
          onClick={() => setRange('week')}
        >
          本周
        </button>
        <button
          type="button"
          className={'range-tab' + (range === 'month' ? ' active' : '')}
          onClick={() => setRange('month')}
        >
          近 30 日
        </button>
        <button
          type="button"
          className={'range-tab' + (range === 'all' ? ' active' : '')}
          onClick={() => setRange('all')}
        >
          全部
        </button>
      </div>

      <div className="dashboard-grid">
        {/* 科目时长 */}
        <div className="panel">
          <div className="panel-head">
            科目时长 · 共 {Math.round(totalStudy / 60 * 10) / 10}h
          </div>
          <SubjectBars stats={subjects} />
        </div>

        {/* 连续打卡 + 热力图 */}
        <div className="panel">
          <div className="panel-head">连续打卡 · 热力图</div>
          <StreakHeatmap current={streak} longest={longest} cells={cells} />
        </div>

        {/* 计划完成率折线 */}
        <div className="panel panel-full">
          <Divider />
          <div className="panel-head" style={{ marginTop: 'var(--sp-4)' }}>
            计划完成率 · 实际 vs 计划学习时长
          </div>
          <CompletionChart points={series} />
        </div>

        {/* 作息时间轴 */}
        <div className="panel panel-full">
          <Divider />
          <div className="panel-head" style={{ marginTop: 'var(--sp-4)' }}>
            今日作息时间轴 · 24h
          </div>
          <DayTimeline segs={timeline} data={data} />
        </div>
      </div>
    </section>
  )
}
