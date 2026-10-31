import { Component } from 'react'
import CardWrapper from '../functional/CardWrapper'
import { ThemeContext } from '../../context/ThemeContext'
import { AUDIT_TYPES, STORAGE_KEYS, readJSON, writeJSON } from '../../utils/inventory'

const MAX_ENTRIES = 50
const TOAST_DURATION_MS = 3200

const TYPE_META = {
  [AUDIT_TYPES.ADDED]: { icon: '🟢', label: 'Added' },
  [AUDIT_TYPES.UPDATED]: { icon: '🟣', label: 'Updated' },
  [AUDIT_TYPES.STOCK]: { icon: '🔵', label: 'Stock' },
  [AUDIT_TYPES.DELETED]: { icon: '🔴', label: 'Deleted' },
  [AUDIT_TYPES.SYSTEM]: { icon: '⚪', label: 'System' },
}

/**
 * AuditLogger - a CLASS component that records every inventory operation.
 *
 * Data flow:
 *   App emits a new `event` prop  ->  componentDidUpdate sees it  ->  setState adds it to `logs`
 *   `logs` changed                ->  componentDidUpdate persists it to localStorage
 *   a new entry was added         ->  componentDidUpdate shows a toast notification
 *
 * Lifecycle summary:
 *   componentDidMount     load saved logs from localStorage, subscribe to cross-tab `storage` events
 *   componentDidUpdate    ingest new events, persist logs, trigger toast
 *   componentWillUnmount  clear the toast timer and unsubscribe from the global listener
 */
export default class AuditLogger extends Component {
  static contextType = ThemeContext

  constructor(props) {
    super(props)

    this.state = {
      logs: [],
      lastAdded: null,
      toast: null,
      expanded: true,
    }

    this.toastTimer = null
  }

  componentDidMount() {
    // 1. Retrieve the initial audit logs from localStorage.
    const saved = readJSON(STORAGE_KEYS.audit, [])
    if (Array.isArray(saved) && saved.length > 0) {
      // Intentional: the lifecycle requirement is to hydrate logs in componentDidMount.
      // oxlint-disable-next-line react/no-did-mount-set-state
      this.setState({ logs: saved })
    }

    // 2. Keep multiple browser tabs in sync (global event listener).
    window.addEventListener('storage', this.handleStorageEvent)
  }

  componentDidUpdate(prevProps, prevState) {
    const { event } = this.props

    // A new inventory operation was reported by the parent.
    if (event && event !== prevProps.event) {
      this.addLog(event)
    }

    // Persist newly added logs.
    if (this.state.logs !== prevState.logs) {
      writeJSON(STORAGE_KEYS.audit, this.state.logs)
    }

    // Trigger a visual notification for a freshly added entry only
    // (not for logs restored from storage or synced from another tab).
    if (this.state.lastAdded && this.state.lastAdded !== prevState.lastAdded) {
      this.showToast(this.state.lastAdded)
    }
  }

  componentWillUnmount() {
    // Clean up the pending timer and the global listener to avoid leaks.
    clearTimeout(this.toastTimer)
    window.removeEventListener('storage', this.handleStorageEvent)
  }

  /* ----------------------------- helpers ----------------------------- */

  handleStorageEvent = (event) => {
    if (event.key !== STORAGE_KEYS.audit) return
    try {
      const incoming = JSON.parse(event.newValue ?? '[]')
      if (Array.isArray(incoming)) this.setState({ logs: incoming })
    } catch {
      /* ignore malformed data from other tabs */
    }
  }

  addLog(entry) {
    this.setState((state) => {
      if (state.logs.some((log) => log.id === entry.id)) return null
      return {
        logs: [entry, ...state.logs].slice(0, MAX_ENTRIES),
        lastAdded: entry,
      }
    })
  }

  showToast(entry) {
    clearTimeout(this.toastTimer)
    this.setState({ toast: entry })
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), TOAST_DURATION_MS)
  }

  dismissToast = () => {
    clearTimeout(this.toastTimer)
    this.setState({ toast: null })
  }

  clearLogs = () => {
    this.setState({ logs: [], lastAdded: null })
  }

  toggleExpanded = () => {
    this.setState((state) => ({ expanded: !state.expanded }))
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  /* ------------------------------ render ----------------------------- */

  render() {
    const { logs, toast, expanded } = this.state
    const { theme } = this.context

    return (
      <>
        <CardWrapper
          id="audit-log-card"
          icon="📜"
          title="Audit log"
          subtitle={`${logs.length} ${logs.length === 1 ? 'entry' : 'entries'} · ${theme} mode`}
          actions={
            <>
              {logs.length > 0 && (
                <button id="audit-clear" type="button" className="btn btn--ghost btn--sm" onClick={this.clearLogs}>
                  Clear
                </button>
              )}
              <button
                id="audit-toggle"
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={this.toggleExpanded}
                aria-expanded={expanded}
              >
                {expanded ? 'Hide' : 'Show'}
              </button>
            </>
          }
        >
          {expanded &&
            (logs.length === 0 ? (
              <p className="muted audit__empty">No activity yet. Add, edit or delete a product to see it here.</p>
            ) : (
              <ol className="audit">
                {logs.map((log) => {
                  const meta = TYPE_META[log.type] ?? TYPE_META[AUDIT_TYPES.SYSTEM]
                  return (
                    <li key={log.id} className={`audit__item audit__item--${log.type}`}>
                      <span className="audit__icon" aria-hidden="true">
                        {meta.icon}
                      </span>
                      <div className="audit__text">
                        <p className="audit__message">{log.message}</p>
                        <p className="audit__meta">
                          {meta.label} · {this.formatTime(log.timestamp)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ))}
        </CardWrapper>

        {toast && (
          <div id="audit-toast" className={`toast toast--${toast.type}`} role="status" aria-live="polite">
            <span aria-hidden="true">{(TYPE_META[toast.type] ?? TYPE_META[AUDIT_TYPES.SYSTEM]).icon}</span>
            <span className="toast__message">{toast.message}</span>
            <button type="button" className="toast__close" onClick={this.dismissToast} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        )}
      </>
    )
  }
}
