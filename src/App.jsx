import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/functional/Header'
import InventoryMetrics from './components/functional/InventoryMetrics'
import FilterBar from './components/functional/FilterBar'
import ProductForm from './components/functional/ProductForm'
import ProductList from './components/functional/ProductList'
import CardWrapper from './components/functional/CardWrapper'
import AuditLogger from './components/class/AuditLogger'
import useDebounce from './hooks/useDebounce'
import {
  AUDIT_TYPES,
  CATEGORIES,
  STORAGE_KEYS,
  STOCK_STATUS,
  createId,
  createSeedProducts,
  formatCurrency,
  getStockStatus,
  readJSON,
  writeJSON,
} from './utils/inventory'

const DEFAULT_FILTERS = { search: '', category: 'all', status: 'all', sortBy: 'newest' }

const SORTERS = {
  newest: (a, b) => b.createdAt - a.createdAt,
  name: (a, b) => a.title.localeCompare(b.title),
  'price-desc': (a, b) => b.price - a.price,
  'price-asc': (a, b) => a.price - b.price,
  'stock-asc': (a, b) => a.stock - b.stock,
  'stock-desc': (a, b) => b.stock - a.stock,
}

/** Lazy initialiser: saved inventory if present, otherwise the demo data. */
function loadInitialProducts() {
  const saved = readJSON(STORAGE_KEYS.products, null)
  return Array.isArray(saved) ? saved : createSeedProducts()
}

export default function App() {
  /* ------------------------------ state ------------------------------ */
  const [products, setProducts] = useState(loadInitialProducts)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [editingId, setEditingId] = useState(null)
  const [auditEvent, setAuditEvent] = useState(null)

  // Refs: the freshest product list (so handlers can stay referentially stable)
  // and the form container (to scroll it into view when editing).
  const productsRef = useRef(products)
  const formAreaRef = useRef(null)

  const debouncedSearch = useDebounce(filters.search, 200)

  /* ----------------------------- derived data ------------------------ */
  // Totals are recomputed only when the product list changes.
  const metrics = useMemo(
    () =>
      products.reduce(
        (totals, product) => {
          const status = getStockStatus(product.stock)
          totals.totalUnits += product.stock
          totals.totalValue += product.stock * product.price
          if (status === STOCK_STATUS.LOW_STOCK) totals.lowStock += 1
          if (status === STOCK_STATUS.OUT_OF_STOCK) totals.outOfStock += 1
          else totals.active += 1
          return totals
        },
        { totalProducts: products.length, totalUnits: 0, totalValue: 0, lowStock: 0, outOfStock: 0, active: 0 },
      ),
    [products],
  )

  // Filtering + sorting only re-runs when the inputs actually change.
  const visibleProducts = useMemo(() => {
    const query = (filters.search === '' ? '' : debouncedSearch).trim().toLowerCase()

    return products
      .filter(
        (product) =>
          (filters.category === 'all' || product.category === filters.category) &&
          (filters.status === 'all' || getStockStatus(product.stock) === filters.status) &&
          (query === '' ||
            product.title.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query)),
      )
      .sort(SORTERS[filters.sortBy] ?? SORTERS.newest)
  }, [products, filters.category, filters.status, filters.sortBy, filters.search, debouncedSearch])

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingId) ?? null,
    [products, editingId],
  )

  const filtersActive = filters.search !== '' || filters.category !== 'all' || filters.status !== 'all'

  /* ----------------------------- effects ----------------------------- */
  // Synchronise inventory with localStorage (and keep the ref current).
  useEffect(() => {
    productsRef.current = products
    writeJSON(STORAGE_KEYS.products, products)
  }, [products])

  // Dynamically update the document title with the number of active products.
  useEffect(() => {
    document.title =
      metrics.active > 0
        ? `(${metrics.active}) StockPilot – ${metrics.active} active ${metrics.active === 1 ? 'product' : 'products'}`
        : 'StockPilot – Inventory & Stock Management Dashboard'
  }, [metrics.active])

  /* ----------------------------- handlers ---------------------------- */
  const emitAudit = useCallback((type, message) => {
    setAuditEvent({ id: createId(), type, message, timestamp: Date.now() })
  }, [])

  const commitProducts = useCallback((next) => {
    productsRef.current = next
    setProducts(next)
  }, [])

  const handleSaveProduct = useCallback(
    (data, id) => {
      const now = Date.now()

      if (id) {
        const previous = productsRef.current.find((product) => product.id === id)
        commitProducts(
          productsRef.current.map((product) => (product.id === id ? { ...product, ...data, updatedAt: now } : product)),
        )
        setEditingId(null)
        emitAudit(
          AUDIT_TYPES.UPDATED,
          `Updated “${data.title}” (${formatCurrency(data.price)}, stock ${previous?.stock ?? '?'} → ${data.stock})`,
        )
        return
      }

      commitProducts([{ id: createId(), ...data, createdAt: now, updatedAt: now }, ...productsRef.current])
      emitAudit(AUDIT_TYPES.ADDED, `Added “${data.title}” with ${data.stock} units in ${data.category}`)
    },
    [commitProducts, emitAudit],
  )

  const handleStockChange = useCallback(
    (id, delta) => {
      const target = productsRef.current.find((product) => product.id === id)
      if (!target) return

      const nextStock = Math.max(0, target.stock + delta)
      if (nextStock === target.stock) return

      commitProducts(
        productsRef.current.map((product) =>
          product.id === id ? { ...product, stock: nextStock, updatedAt: Date.now() } : product,
        ),
      )
      emitAudit(AUDIT_TYPES.STOCK, `Stock for “${target.title}”: ${target.stock} → ${nextStock}`)
    },
    [commitProducts, emitAudit],
  )

  const handleDelete = useCallback(
    (id) => {
      const target = productsRef.current.find((product) => product.id === id)
      if (!target) return

      commitProducts(productsRef.current.filter((product) => product.id !== id))
      setEditingId((current) => (current === id ? null : current))
      emitAudit(AUDIT_TYPES.DELETED, `Deleted “${target.title}” (${target.stock} units removed)`)
    },
    [commitProducts, emitAudit],
  )

  const handleEdit = useCallback((product) => {
    setEditingId(product.id)
    formAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleCancelEdit = useCallback(() => setEditingId(null), [])

  const handleFilterChange = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }))
  }, [])

  const handleClearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const handleLoadSample = useCallback(() => {
    const samples = createSeedProducts()
    commitProducts(samples)
    emitAudit(AUDIT_TYPES.SYSTEM, `Loaded ${samples.length} sample products`)
  }, [commitProducts, emitAudit])

  const handleResetInventory = useCallback(() => {
    const count = productsRef.current.length
    commitProducts([])
    setEditingId(null)
    emitAudit(AUDIT_TYPES.SYSTEM, `Cleared inventory (${count} ${count === 1 ? 'product' : 'products'} removed)`)
  }, [commitProducts, emitAudit])

  /* ------------------------------ render ----------------------------- */
  return (
    <div className="app">
      <div className="app__backdrop" aria-hidden="true" />

      <Header activeCount={metrics.active} totalCount={metrics.totalProducts} />

      <main className="app__main">
        <InventoryMetrics metrics={metrics} />

        <div className="layout">
          <aside className="layout__side">
            <div ref={formAreaRef} className="scroll-anchor">
              <ProductForm
                key={editingProduct ? `edit-${editingProduct.id}` : 'new'}
                editingProduct={editingProduct}
                categories={CATEGORIES}
                onSubmit={handleSaveProduct}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            <AuditLogger event={auditEvent} />
          </aside>

          <section className="layout__content" aria-label="Product inventory">
            <CardWrapper
              id="inventory-card"
              icon="🗂️"
              title="Inventory"
              subtitle="Browse, filter and adjust stock in real time"
              actions={
                products.length > 0 && (
                  <button id="clear-inventory" type="button" className="btn btn--ghost btn--sm" onClick={handleResetInventory}>
                    Clear all
                  </button>
                )
              }
            >
              <FilterBar
                filters={filters}
                categories={CATEGORIES}
                resultCount={visibleProducts.length}
                totalCount={products.length}
                filtersActive={filtersActive}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />

              <ProductList
                products={visibleProducts}
                totalCount={products.length}
                onStockChange={handleStockChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClearFilters={handleClearFilters}
                onLoadSample={handleLoadSample}
              />
            </CardWrapper>
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          StockPilot · Built with React — Class &amp; Functional components, Hooks and Context · Data is stored locally in your browser.
        </p>
      </footer>
    </div>
  )
}
