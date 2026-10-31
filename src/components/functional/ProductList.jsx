import ProductCard from './ProductCard'

/**
 * Renders the product grid, or an appropriate empty state:
 *  - inventory is empty            -> offer to load sample data
 *  - filters match nothing         -> offer to clear the filters
 */
export default function ProductList({
  products,
  totalCount,
  onStockChange,
  onEdit,
  onDelete,
  onClearFilters,
  onLoadSample,
}) {
  if (products.length === 0) {
    return (
      <div className="empty" id="empty-state">
        <div className="empty__art" aria-hidden="true">
          {totalCount === 0 ? '📭' : '🔍'}
        </div>
        <h3 className="empty__title">
          {totalCount === 0 ? 'Your inventory is empty' : 'No products match your filters'}
        </h3>
        <p className="empty__text">
          {totalCount === 0
            ? 'Add your first product using the form, or load a set of sample products to explore the dashboard.'
            : 'Try a different search term, category or stock status.'}
        </p>
        {totalCount === 0 ? (
          <button id="load-sample" type="button" className="btn btn--primary" onClick={onLoadSample}>
            Load sample data
          </button>
        ) : (
          <button id="empty-clear-filters" type="button" className="btn btn--ghost" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <ul className="product-grid" aria-label="Products">
      {products.map((product) => (
        <li key={product.id} className="product-grid__item">
          <ProductCard
            product={product}
            onStockChange={onStockChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  )
}
