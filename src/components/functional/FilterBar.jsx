import { memo, useCallback } from 'react'
import { STOCK_STATUS, STOCK_STATUS_LABELS } from '../../utils/inventory'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: STOCK_STATUS.IN_STOCK, label: STOCK_STATUS_LABELS[STOCK_STATUS.IN_STOCK] },
  { value: STOCK_STATUS.LOW_STOCK, label: STOCK_STATUS_LABELS[STOCK_STATUS.LOW_STOCK] },
  { value: STOCK_STATUS.OUT_OF_STOCK, label: STOCK_STATUS_LABELS[STOCK_STATUS.OUT_OF_STOCK] },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'stock-asc', label: 'Stock: low to high' },
  { value: 'stock-desc', label: 'Stock: high to low' },
]

/** Search + category + status + sort controls (controlled by App via props). */
function FilterBar({ filters, categories, resultCount, totalCount, filtersActive, onChange, onClear }) {
  const handleInputChange = useCallback(
    (event) => onChange(event.target.name, event.target.value),
    [onChange],
  )

  return (
    <div className="filter-bar">
      <div className="filter-bar__row">
        <div className="search">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="filter-search"
            type="search"
            name="search"
            value={filters.search}
            onChange={handleInputChange}
            placeholder="Search products or categories…"
            aria-label="Search products"
          />
        </div>

        <select
          id="filter-category"
          name="category"
          value={filters.category}
          onChange={handleInputChange}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>

        <select
          id="filter-sort"
          name="sortBy"
          value={filters.sortBy}
          onChange={handleInputChange}
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-bar__row filter-bar__row--between">
        <div className="segmented" role="group" aria-label="Filter by stock status">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              id={`status-${option.value}`}
              type="button"
              className={`segmented__btn ${filters.status === option.value ? 'is-active' : ''}`}
              aria-pressed={filters.status === option.value}
              onClick={() => onChange('status', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="filter-bar__count" aria-live="polite">
          Showing <strong>{resultCount}</strong> of {totalCount}
          {filtersActive && (
            <button id="clear-filters" type="button" className="link-btn" onClick={onClear}>
              Clear filters
            </button>
          )}
        </p>
      </div>
    </div>
  )
}

export default memo(FilterBar)
