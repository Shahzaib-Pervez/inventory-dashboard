import { memo, useState } from 'react'
import CardWrapper from './CardWrapper'
import StockBadge from './StockBadge'
import { formatCurrency, getCategoryMeta, getStockStatus } from '../../utils/inventory'

/** Stock level at which the progress meter shows as "full". */
const METER_MAX = 50

/**
 * A single product. Wrapped in React.memo: because App passes stable
 * (useCallback) handlers, a card only re-renders when its own product changes.
 */
function ProductCard({ product, onStockChange, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const status = getStockStatus(product.stock)
  const meta = getCategoryMeta(product.category)
  const meterPercent = Math.min(100, Math.round((product.stock / METER_MAX) * 100))

  return (
    <CardWrapper id={`product-${product.id}`} variant={status} className="product-card">
      <div className="product-card__top">
        <div className="product-card__icon" style={{ '--hue': meta.hue }} aria-hidden="true">
          {meta.icon}
        </div>
        <div className="product-card__heading">
          <h3 className="product-card__title" title={product.title}>
            {product.title}
          </h3>
          <span className="chip">{product.category}</span>
        </div>
      </div>

      <StockBadge status={status} />

      <dl className="product-card__stats">
        <div>
          <dt>Price</dt>
          <dd>{formatCurrency(product.price)}</dd>
        </div>
        <div>
          <dt>On hand</dt>
          <dd>
            {product.stock} {product.stock === 1 ? 'unit' : 'units'}
          </dd>
        </div>
        <div>
          <dt>Value</dt>
          <dd>{formatCurrency(product.price * product.stock)}</dd>
        </div>
      </dl>

      <div
        className={`meter meter--${status}`}
        role="progressbar"
        aria-label="Stock level"
        aria-valuemin={0}
        aria-valuemax={METER_MAX}
        aria-valuenow={Math.min(product.stock, METER_MAX)}
      >
        <div className="meter__fill" style={{ width: `${meterPercent}%` }} />
      </div>

      <div className="product-card__actions">
        <div className="stepper" role="group" aria-label={`Adjust stock for ${product.title}`}>
          <button
            id={`stock-dec-${product.id}`}
            type="button"
            className="stepper__btn"
            onClick={() => onStockChange(product.id, -1)}
            disabled={product.stock === 0}
            aria-label="Decrease stock by 1"
          >
            −
          </button>
          <span className="stepper__value">{product.stock}</span>
          <button
            id={`stock-inc-${product.id}`}
            type="button"
            className="stepper__btn"
            onClick={() => onStockChange(product.id, 1)}
            aria-label="Increase stock by 1"
          >
            +
          </button>
          <button
            id={`stock-restock-${product.id}`}
            type="button"
            className="stepper__btn stepper__btn--wide"
            onClick={() => onStockChange(product.id, 10)}
            aria-label="Restock 10 units"
          >
            +10
          </button>
        </div>

        {confirmingDelete ? (
          <div className="confirm" role="alertdialog" aria-label={`Confirm deleting ${product.title}`}>
            <span>Delete?</span>
            <button
              id={`delete-yes-${product.id}`}
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => onDelete(product.id)}
            >
              Yes
            </button>
            <button
              id={`delete-no-${product.id}`}
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setConfirmingDelete(false)}
            >
              No
            </button>
          </div>
        ) : (
          <div className="product-card__buttons">
            <button
              id={`edit-${product.id}`}
              type="button"
              className="icon-btn"
              onClick={() => onEdit(product)}
              aria-label={`Edit ${product.title}`}
              title="Edit"
            >
              ✏️
            </button>
            <button
              id={`delete-${product.id}`}
              type="button"
              className="icon-btn icon-btn--danger"
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Delete ${product.title}`}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </CardWrapper>
  )
}

export default memo(ProductCard)
