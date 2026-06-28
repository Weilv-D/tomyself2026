import { todayISO, fmtLongDate, fmtLongDateEn, daysFromToday } from '../lib/time'

interface MastheadProps {
  startDate: string
  examDate?: string
}

/** 报头：刊名「考研日课」+ 拉丁副刊名 + 日期 + 期号 + 倒计时 */
export function Masthead({ startDate, examDate }: MastheadProps) {
  const today = todayISO()
  // 期号 = 自起始日起的天数
  const issue = Math.max(1, daysFromToday(startDate) * -1 + 1)
  const examDays = examDate ? daysFromToday(examDate) : null

  return (
    <header className="masthead">
      {/* 顶部细信息条：左日期 / 右期号与倒计时 */}
      <div className="masthead-top">
        <span className="eyebrow">{fmtLongDate(today)}</span>
        <span className="masthead-top-right eyebrow">
          <span>No. {String(issue).padStart(4, '0')}</span>
          {examDays !== null && (
            <span className="masthead-countdown">
              距考研 <strong className="mono vermilion">{examDays}</strong> 日
            </span>
          )}
        </span>
      </div>

      <hr className="rule" />

      {/* 刊名 */}
      <h1 className="masthead-title">考&nbsp;研&nbsp;日&nbsp;课</h1>
      <p className="masthead-subtitle quote-en">The Daily Chronicle of Discipline</p>

      <hr className="rule-double" />

      {/* 底部拉丁日期 + 标语 */}
      <div className="masthead-bottom">
        <span className="serif-en">{fmtLongDateEn(today)}</span>
        <span className="masthead-motto accent">「日拱一卒，功不唐捐」</span>
        <span className="masthead-motto-en quote-en">Vol. MMXXVI</span>
      </div>
    </header>
  )
}
