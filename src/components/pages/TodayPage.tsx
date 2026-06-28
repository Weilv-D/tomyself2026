import { useMemo, useState } from 'react'
import type { AppDataApi } from '../../hooks/useAppData'
import { SectionTitle } from '../ui/SectionTitle'
import { TimeBlockCard } from '../today/TimeBlockCard'
import { DailyProgress } from '../today/DailyProgress'
import {
  getBlockCheck,
  dayStudyMinutes,
  dayPlannedStudyMinutes,
  dayCompletionRate,
} from '../../lib/stats'
import {
  todayISO,
  shiftISO,
  fmtLongDate,
  fmtLongDateEn,
  weekdayOf,
  WEEKDAY_CN,
  timeToMin,
} from '../../lib/time'

interface TodayPageProps {
  app: AppDataApi
}

export function TodayPage({ app }: TodayPageProps) {
  const [date, setDate] = useState<string>(todayISO())
  const { data } = app
  const weekday = weekdayOf(date)
  const isToday = date === todayISO()

  const studied = useMemo(() => dayStudyMinutes(data, date), [data, date])
  const planned = useMemo(() => dayPlannedStudyMinutes(data.schedule), [data.schedule])
  const rate = useMemo(() => dayCompletionRate(data, date), [data, date])

  // 当前时刻所在块（仅今天高亮）
  const nowId = useMemo(() => {
    if (!isToday) return null
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    for (const b of data.schedule) {
      let s = timeToMin(b.start)
      let e = timeToMin(b.end)
      if (e <= s) e += 1440
      // 睡眠跨日块不在"当前"判定里
      if (b.category === 'sleep') continue
      if (cur >= s && cur < e) return b.id
    }
    return null
  }, [data.schedule, isToday])

  // 今天之后没有日程，禁止跳到未来
  const canGoNext = !isToday
  const issueNo = useMemo(() => {
    const start = data.meta.startDate
    const diff = Math.round(
      (new Date(date + 'T00:00:00').getTime() -
        new Date(start + 'T00:00:00').getTime()) /
        86400000,
    )
    return diff + 1
  }, [date, data.meta.startDate])

  return (
    <section>
      <SectionTitle
        roman="I"
        title="今日课表"
        sub="Today's Chronicle"
      />

      {/* 日期翻页 */}
      <div className="date-pager">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setDate((d) => shiftISO(d, -1))}
        >
          ‹ 前日
        </button>
        <div className="date-pager-info">
          <div className="date-pager-cn">{fmtLongDate(date)}</div>
          <div className="date-pager-en">
            {fmtLongDateEn(date)} · No. {String(issueNo).padStart(4, '0')} · 周{WEEKDAY_CN[weekday]}
          </div>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setDate((d) => shiftISO(d, 1))}
          disabled={!canGoNext}
          style={canGoNext ? {} : { opacity: 0.3 }}
        >
          次日 ›
        </button>
      </div>

      <DailyProgress
        studiedMinutes={studied}
        plannedMinutes={planned}
        completionRate={rate}
      />

      {/* 时间块列表 */}
      <div className="block-list">
        {data.schedule.map((block) => (
          <TimeBlockCard
            key={block.id}
            block={block}
            weekday={weekday}
            check={getBlockCheck(data.records[date] ?? null, block.id)}
            isNow={block.id === nowId}
            onToggle={() => app.toggleBlock(date, block.id)}
            onMinutes={(m) => app.setBlockMinutes(date, block.id, m)}
            onNote={(n) => app.setBlockNote(date, block.id, n)}
          />
        ))}
      </div>
    </section>
  )
}
