import { useState } from 'react'
import type { ScheduleBlock, Weekday, BlockCheck } from '../../types'
import { CATEGORY_LABEL, CATEGORY_LABEL_EN, STUDY_CATEGORIES } from '../../types'
import { durationMin, fmtDuration } from '../../lib/time'

interface TimeBlockCardProps {
  block: ScheduleBlock
  weekday: Weekday
  check: BlockCheck
  isNow: boolean
  onToggle: () => void
  onMinutes: (m: number) => void
  onNote: (n: string) => void
}

export function TimeBlockCard({
  block,
  weekday,
  check,
  isNow,
  onToggle,
  onMinutes,
  onNote,
}: TimeBlockCardProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  // 应用星期变体（运动块等）
  const variant = block.weekdayVariant?.[weekday]
  const title = variant?.title ?? block.title
  const detail = variant?.detail ?? block.detail ?? ''
  const isStudy = STUDY_CATEGORIES.includes(block.category)

  return (
    <article className={'block-card' + (check.done ? ' done' : '') + (isNow ? ' now' : '')}>
      {/* 时间列 */}
      <div className="block-time">
        <span className="start">{block.start}</span>
        <span className="mono" style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-50)' }}>
          {block.end}
        </span>
        <span className="dur">{fmtDuration(durationMin(block.start, block.end))}</span>
      </div>

      {/* 正文列 */}
      <div className="block-body">
        <div className="block-title-row">
          <span className="block-title">{title}</span>
          <span className="block-cat-en">{CATEGORY_LABEL_EN[block.category]}</span>
          <span className="block-cat">{CATEGORY_LABEL[block.category]}</span>
          {block.subject && <span className="block-cat">{block.subject}</span>}
        </div>
        {detail && <p className="block-detail">{detail}</p>}

        {isStudy && (
          <div style={{ marginTop: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <span className="minutes-label">实际时长 / m</span>
            <input
              type="number"
              min={0}
              max={600}
              className="minutes-input"
              value={check.actualMinutes ?? ''}
              placeholder="0"
              onChange={(e) => onMinutes(Number(e.target.value) || 0)}
            />
          </div>
        )}

        <button
          type="button"
          className="block-note-toggle"
          onClick={() => setNoteOpen((v) => !v)}
        >
          {noteOpen ? '收起备注' : check.note ? '查看备注' : '添加备注'}
        </button>

        {noteOpen && (
          <div className="block-note">
            <textarea
              value={check.note ?? ''}
              placeholder="备注：今天这个时段的情况……"
              onChange={(e) => onNote(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 勾选列 */}
      <div className="block-actions">
        <button
          type="button"
          className={'check' + (check.done ? ' checked' : '')}
          onClick={onToggle}
          aria-pressed={check.done}
          aria-label={check.done ? '标记未完成' : '标记完成'}
        >
          {check.done && <span className="check-mark">✓</span>}
        </button>
      </div>
    </article>
  )
}
