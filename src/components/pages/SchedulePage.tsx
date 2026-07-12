import { useMemo, useState } from 'react'
import type { AppDataApi } from '../../hooks/useAppData'
import type { ScheduleBlock, Category } from '../../types'
import { CATEGORY_LABEL, SUBJECTS, SUBJECT_OTHER } from '../../types'
import { SectionTitle } from '../ui/SectionTitle'
import { Divider } from '../ui/Divider'
import { DEFAULT_SCHEDULE } from '../../data/defaultSchedule'
import { timeToMin } from '../../lib/time'

interface SchedulePageProps {
  app: AppDataApi
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]

export function SchedulePage({ app }: SchedulePageProps) {
  const { data } = app
  const [importText, setImportText] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const schedule = data.schedule

  const update = (id: string, patch: Partial<ScheduleBlock>) => {
    app.setSchedule(
      schedule.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    )
  }

  const remove = (id: string) => {
    app.setSchedule(schedule.filter((b) => b.id !== id))
  }

  const add = () => {
    const id = 'b-' + Date.now().toString(36)
    const next: ScheduleBlock = {
      id,
      start: '12:00',
      end: '13:00',
      title: '新增时段',
      category: 'other',
    }
    app.setSchedule([...schedule, next])
  }

  const move = (id: string, dir: -1 | 1) => {
    const idx = schedule.findIndex((b) => b.id === id)
    const ni = idx + dir
    if (idx < 0 || ni < 0 || ni >= schedule.length) return
    const arr = [...schedule]
    ;[arr[idx], arr[ni]] = [arr[ni], arr[idx]]
    app.setSchedule(arr)
  }

  // 编辑视图按开始时间排序，与今日课表的展示顺序一致。
  // ↑↓ 调整的是数组顺序，但展示时仍按 start 排序，避免顺序与钟点错乱。
  const editView = useMemo(
    () => [...schedule].sort((a, b) => {
      const as = timeToMin(a.start)
      const bs = timeToMin(b.start)
      // 跨午夜块（end ≤ start）排到末尾
      const aOver = timeToMin(a.end) <= as
      const bOver = timeToMin(b.end) <= bs
      if (aOver !== bOver) return aOver ? 1 : -1
      return as - bs
    }),
    [schedule],
  )

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(schedule, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'schedule.json'
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ ok: true, text: '已导出当前作息计划为 schedule.json' })
  }

  const doImport = () => {
    setMsg(null)
    try {
      const parsed = JSON.parse(importText)
      const arr: unknown = Array.isArray(parsed) ? parsed : parsed?.schedule
      if (!Array.isArray(arr)) {
        throw new Error('需要数组或含 schedule 字段的对象')
      }
      const validated: ScheduleBlock[] = arr.map(validateBlock)
      app.setSchedule(validated)
      setMsg({ ok: true, text: `已导入 ${validated.length} 个时段` })
      setImportText('')
    } catch (e) {
      setMsg({
        ok: false,
        text: '导入失败：' + (e instanceof Error ? e.message : String(e)),
      })
    }
  }

  return (
    <section>
      <SectionTitle roman="III" title="作息方略" sub="The Regimen" />

      <p className="deck">
        增删改时间块，或整体导入一份作息计划。
      </p>

      <div className="schedule-tools">
        <button type="button" className="btn" onClick={add}>＋ 新增时段</button>
        <button type="button" className="btn btn--ghost" onClick={exportJson}>导出 JSON</button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => {
            if (confirm('恢复内置作息计划？当前编辑将被覆盖。')) {
              app.setSchedule(DEFAULT_SCHEDULE.map((b) => ({ ...b })))
              setMsg({ ok: true, text: '已恢复内置作息计划' })
            }
          }}
        >
          恢复默认
        </button>
      </div>

      {msg && <div className={'alert ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</div>}

      <div className="block-list">
        {editView.map((b) => (
          <div className="schedule-edit-row" key={b.id}>
            <input
              type="time"
              className="field"
              value={b.start}
              onChange={(e) => update(b.id, { start: e.target.value })}
            />
            <input
              type="time"
              className="field"
              value={b.end}
              onChange={(e) => update(b.id, { end: e.target.value })}
            />
            <input
              type="text"
              className="field title-field"
              value={b.title}
              onChange={(e) => update(b.id, { title: e.target.value })}
            />
            <select
              className="field"
              value={b.category}
              onChange={(e) => update(b.id, { category: e.target.value as Category })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
            <input
              type="text"
              className="field"
              placeholder="科目（学习类填）"
              list="subject-options"
              value={b.subject ?? ''}
              onChange={(e) => update(b.id, { subject: e.target.value || undefined })}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" className="btn btn--ghost btn-remove" onClick={() => move(b.id, -1)}>↑</button>
              <button type="button" className="btn btn--ghost btn-remove" onClick={() => move(b.id, 1)}>↓</button>
              <button type="button" className="btn btn--danger btn-remove" onClick={() => remove(b.id)}>删</button>
            </div>
          </div>
        ))}
      </div>

      {/* 科目候选项：四科 + 其他，datalist 既能选也能自由输入 */}
      <datalist id="subject-options">
        {[...SUBJECTS, SUBJECT_OTHER].map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <Divider />

      <div className="import-area">
        <div className="panel-head" style={{ marginTop: 'var(--sp-4)' }}>导入作息计划</div>
        <p className="import-help">
          粘贴时间块数组（或含 schedule 字段的对象），将覆盖当前计划。每项需含 id、start、end、title、category。
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={'[{"id":"x","start":"08:00","end":"09:30","title":"深度工作","category":"deepwork","subject":"数学"}]'}
        />
        <div className="import-actions">
          <button
            type="button"
            className="btn btn--solid"
            onClick={doImport}
            disabled={!importText.trim()}
          >
            导入并覆盖
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setImportText('')}
          >
            清空
          </button>
        </div>
      </div>
    </section>
  )
}

function validateBlock(raw: any): ScheduleBlock {
  if (!raw || typeof raw !== 'object') throw new Error('存在非对象项')
  const { id, start, end, title, category } = raw
  if (!id || !start || !end || !title || !category) {
    throw new Error('缺少必要字段：id/start/end/title/category')
  }
  if (!(category in CATEGORY_LABEL)) {
    throw new Error('未知类别：' + category)
  }
  return {
    id: String(id),
    start: String(start),
    end: String(end),
    title: String(title),
    category,
    subject: raw.subject ? String(raw.subject) : undefined,
    detail: raw.detail ? String(raw.detail) : undefined,
    weekdayVariant: raw.weekdayVariant,
    dateParityVariant: raw.dateParityVariant,
  }
}
