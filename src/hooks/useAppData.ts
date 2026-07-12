import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData, BlockCheck, ScheduleBlock } from '../types'
import { loadData, saveData } from '../lib/storage'

export interface AppDataApi {
  data: AppData
  /** 切换某块勾选 */
  toggleBlock: (date: string, blockId: string) => void
  /** 设置某块的实际学习时长 */
  setBlockMinutes: (date: string, blockId: string, minutes: number) => void
  /** 设置某块备注 */
  setBlockNote: (date: string, blockId: string, note: string) => void
  /** 整体替换数据（同步/导入时） */
  replaceData: (next: AppData) => void
  /** 替换作息计划 */
  setSchedule: (schedule: ScheduleBlock[]) => void
  /** 更新 meta（如刊名、考研日期），同步走 schedule 时间戳 */
  setMeta: (patch: Partial<AppData['meta']>) => void
  /** 是否已修改但未同步（本地 vs 上次加载） */
  dirty: boolean
  markSynced: () => void
}

export function useAppData(): AppDataApi {
  const [data, setData] = useState<AppData>(() => loadData())
  const lastSavedRef = useRef<string>('')

  // 持久化
  useEffect(() => {
    const json = JSON.stringify(data)
    saveData(data)
    lastSavedRef.current = json
  }, [data])

  const [dirty, setDirty] = useState(false)

  const toggleBlock = useCallback(
    (date: string, blockId: string) => {
      setData((prev) => withBlock(prev, date, blockId, (bc) => ({ ...bc, done: !bc.done })))
      setDirty(true)
    },
    [],
  )

  const setBlockMinutes = useCallback(
    (date: string, blockId: string, minutes: number) => {
      setData((prev) =>
        withBlock(prev, date, blockId, (bc) => ({
          ...bc,
          actualMinutes: Math.max(0, Math.round(minutes)),
          // 录入时长视为已开始学习，标记 done
          done: minutes > 0 ? true : bc.done,
        })),
      )
      setDirty(true)
    },
    [],
  )

  const setBlockNote = useCallback(
    (date: string, blockId: string, note: string) => {
      setData((prev) =>
        withBlock(prev, date, blockId, (bc) => ({ ...bc, note: note.trim() || undefined })),
      )
      setDirty(true)
    },
    [],
  )

  const replaceData = useCallback((next: AppData) => {
    setData(next)
    setDirty(false)
  }, [])

  const setSchedule = useCallback((schedule: ScheduleBlock[]) => {
    setData((prev) => ({ ...prev, schedule, scheduleUpdatedAt: Date.now() }))
    setDirty(true)
  }, [])

  // meta 随 schedule 走「最后写入优先」合并（见 mergeData），
  // 因此改 meta 须同步刷新 scheduleUpdatedAt，否则旧远程会覆盖本地。
  const setMeta = useCallback((patch: Partial<AppData['meta']>) => {
    setData((prev) => ({
      ...prev,
      meta: { ...prev.meta, ...patch },
      scheduleUpdatedAt: Date.now(),
    }))
    setDirty(true)
  }, [])

  const markSynced = useCallback(() => setDirty(false), [])

  return {
    data,
    toggleBlock,
    setBlockMinutes,
    setBlockNote,
    replaceData,
    setSchedule,
    setMeta,
    dirty,
    markSynced,
  }
}

/** 不可变地更新某日某块的打卡状态。
 *  写入时统一打 updatedAt 时间戳，供同步「最后写入优先」合并使用。 */
function withBlock(
  prev: AppData,
  date: string,
  blockId: string,
  fn: (bc: BlockCheck) => BlockCheck,
): AppData {
  const day = prev.records[date] ?? { date, blocks: {} }
  const current: BlockCheck = day.blocks[blockId] ?? { done: false }
  const nextBlock: BlockCheck = { ...fn(current), updatedAt: Date.now() }
  const nextDay = {
    ...day,
    blocks: { ...day.blocks, [blockId]: nextBlock },
  }
  return {
    ...prev,
    records: { ...prev.records, [date]: nextDay },
  }
}
