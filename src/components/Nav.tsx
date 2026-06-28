import { NavLink } from 'react-router-dom'
import type { SyncStatus } from '../hooks/useGitHubSync'

interface NavProps {
  syncStatus: SyncStatus
  syncLabel: string
  onSyncClick: () => void
}

const ITEMS = [
  { to: '/', label: '今日', end: true },
  { to: '/dashboard', label: '数据', end: false },
  { to: '/schedule', label: '作息', end: false },
  { to: '/settings', label: '同步', end: false },
]

export function Nav({ syncStatus, syncLabel, onSyncClick }: NavProps) {
  return (
    <nav className="nav">
      <ul className="nav-list">
        {ITEMS.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                'nav-item' + (isActive ? ' active' : '')
              }
            >
              {it.label}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="nav-sync-badge"
            onClick={onSyncClick}
            title={syncLabel || '同步状态'}
            aria-label={syncLabel || '同步状态'}
          >
            <span className={'nav-sync-dot ' + syncStatus} />
            <span>{syncDotText(syncStatus)}</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

function syncDotText(s: SyncStatus): string {
  switch (s) {
    case 'syncing':
      return '同步中'
    case 'synced':
      return '已同步'
    case 'conflict':
      return '冲突'
    case 'error':
      return '错误'
    case 'offline':
      return '离线'
    default:
      return '未同步'
  }
}
