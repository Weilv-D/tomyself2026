import { useEffect, useRef, useState } from 'react'
import { todayISO, fmtLongDate, fmtLongDateEn, daysFromToday } from '../lib/time'

interface MastheadProps {
  startDate: string
  examDate?: string
  title: string
  onTitleChange: (v: string) => void
}

/** 报头：刊名「考研日课」+ 拉丁副刊名 + 日期 + 期号 + 倒计时 */
export function Masthead({ startDate, examDate, title, onTitleChange }: MastheadProps) {
  const today = todayISO()
  // 期号 = 自起始日起的天数
  const issue = Math.max(1, daysFromToday(startDate) * -1 + 1)
  const examDays = examDate ? daysFromToday(examDate) : null

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  // 进入编辑态时同步草稿并聚焦
  useEffect(() => {
    if (editing) {
      setDraft(title)
      // 下一帧聚焦 + 全选，便于整体替换
      const el = inputRef.current
      if (el) {
        requestAnimationFrame(() => {
          el.focus()
          el.select()
        })
      }
    }
  }, [editing, title])

  const commit = () => {
    const next = draft.trim() || '考研日课'
    if (next !== title) onTitleChange(next)
    setEditing(false)
  }

  const cancel = () => {
    setEditing(false)
  }

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

      {/* 刊名：点击可编辑 */}
      {editing ? (
        <input
          ref={inputRef}
          className="masthead-title-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancel()
            }
          }}
          maxLength={20}
          aria-label="编辑刊名"
        />
      ) : (
        <h1
          className="masthead-title masthead-title--editable"
          onClick={() => setEditing(true)}
          title="点击编辑刊名"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setEditing(true)
            }
          }}
        >
          {title}
        </h1>
      )}
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
