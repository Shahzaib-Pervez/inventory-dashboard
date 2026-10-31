import { STOCK_STATUS_LABELS } from '../../utils/inventory'

/** Colour-coded pill showing In Stock / Low Stock / Out of Stock. */
export default function StockBadge({ status, className = '' }) {
  return (
    <span className={`badge badge--${status} ${className}`.trim()}>
      <span className="badge__dot" aria-hidden="true" />
      {STOCK_STATUS_LABELS[status]}
    </span>
  )
}
