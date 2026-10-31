import { memo } from 'react'
import { formatCurrency } from '../../utils/inventory'

/**
 * Summary tiles. Wrapped in React.memo and fed a memoised `metrics` object,
 * so it only re-renders when the inventory totals really change.
 */
function InventoryMetrics({ metrics }) {
  const tiles = [
    {
      key: 'products',
      label: 'Total Products',
      value: metrics.totalProducts,
      hint: `${metrics.active} active listings`,
      icon: '📦',
      tone: 'violet',
    },
    {
      key: 'units',
      label: 'Units in Stock',
      value: metrics.totalUnits.toLocaleString(),
      hint: 'across all categories',
      icon: '🏬',
      tone: 'cyan',
    },
    {
      key: 'value',
      label: 'Inventory Value',
      value: formatCurrency(metrics.totalValue),
      hint: 'price × units on hand',
      icon: '💰',
      tone: 'green',
    },
    {
      key: 'low',
      label: 'Low Stock',
      value: metrics.lowStock,
      hint: metrics.lowStock > 0 ? 'needs restocking soon' : 'all healthy',
      icon: '⚠️',
      tone: 'amber',
    },
    {
      key: 'out',
      label: 'Out of Stock',
      value: metrics.outOfStock,
      hint: metrics.outOfStock > 0 ? 'unavailable to customers' : 'nothing missing',
      icon: '⛔',
      tone: 'red',
    },
  ]

  return (
    <section className="metrics" aria-label="Inventory metrics">
      {tiles.map((tile) => (
        <article key={tile.key} id={`metric-${tile.key}`} className={`metric metric--${tile.tone}`}>
          <span className="metric__icon" aria-hidden="true">
            {tile.icon}
          </span>
          <div className="metric__content">
            <p className="metric__label">{tile.label}</p>
            <p className="metric__value">{tile.value}</p>
            <p className="metric__hint">{tile.hint}</p>
          </div>
        </article>
      ))}
    </section>
  )
}

export default memo(InventoryMetrics)
