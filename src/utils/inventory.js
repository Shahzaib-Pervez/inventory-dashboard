/**
 * Shared constants and pure helpers for the inventory domain.
 * Keeping these outside of components makes them trivially testable and
 * keeps component files focused on rendering.
 */

export const STORAGE_KEYS = {
  products: 'stockpilot.products.v1',
  audit: 'stockpilot.audit.v1',
  theme: 'stockpilot.theme.v1',
}

/** Stock at or below this number (but above zero) is flagged as "Low Stock". */
export const LOW_STOCK_THRESHOLD = 10

export const STOCK_STATUS = {
  IN_STOCK: 'in-stock',
  LOW_STOCK: 'low-stock',
  OUT_OF_STOCK: 'out-of-stock',
}

export const STOCK_STATUS_LABELS = {
  [STOCK_STATUS.IN_STOCK]: 'In Stock',
  [STOCK_STATUS.LOW_STOCK]: 'Low Stock',
  [STOCK_STATUS.OUT_OF_STOCK]: 'Out of Stock',
}

export const AUDIT_TYPES = {
  ADDED: 'added',
  UPDATED: 'updated',
  STOCK: 'stock',
  DELETED: 'deleted',
  SYSTEM: 'system',
}

/** Category name, emoji icon and a hue used to tint the product tile. */
export const CATEGORIES = [
  { name: 'Electronics', icon: '🎧', hue: 255 },
  { name: 'Clothing', icon: '👕', hue: 320 },
  { name: 'Home & Kitchen', icon: '☕', hue: 28 },
  { name: 'Books', icon: '📚', hue: 200 },
  { name: 'Sports', icon: '🏃', hue: 150 },
  { name: 'Beauty', icon: '✨', hue: 345 },
  { name: 'Toys', icon: '🧩', hue: 48 },
]

const FALLBACK_CATEGORY = { name: 'Other', icon: '📦', hue: 220 }

export function getCategoryMeta(name) {
  return CATEGORIES.find((category) => category.name === name) ?? FALLBACK_CATEGORY
}

export function getStockStatus(stock) {
  if (stock <= 0) return STOCK_STATUS.OUT_OF_STOCK
  if (stock <= LOW_STOCK_THRESHOLD) return STOCK_STATUS.LOW_STOCK
  return STOCK_STATUS.IN_STOCK
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatCurrency(amount) {
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const DAY = 24 * 60 * 60 * 1000

/** Demo data used on first launch (or when the user clicks "Load sample data"). */
export function createSeedProducts() {
  const now = Date.now()
  const rows = [
    ['Wireless Noise-Cancelling Headphones', 'Electronics', 189.99, 24],
    ['Mechanical Keyboard RGB', 'Electronics', 129.5, 8],
    ['4K Action Camera', 'Electronics', 249, 0],
    ['Organic Cotton Hoodie', 'Clothing', 59.9, 42],
    ['Running Sneakers Pro', 'Sports', 119, 6],
    ['Yoga Mat Premium', 'Sports', 34.5, 31],
    ['Ceramic Pour-Over Coffee Set', 'Home & Kitchen', 48, 15],
    ['Air Fryer XL 5L', 'Home & Kitchen', 99.99, 3],
    ['Atomic Habits (Hardcover)', 'Books', 18.75, 57],
    ['Clean Code', 'Books', 36, 0],
    ['Vitamin C Serum 30ml', 'Beauty', 24.9, 9],
    ['Building Blocks Castle Set', 'Toys', 64.99, 19],
  ]

  return rows.map(([title, category, price, stock], index) => ({
    id: createId(),
    title,
    category,
    price,
    stock,
    createdAt: now - (rows.length - index) * DAY,
    updatedAt: now - (rows.length - index) * DAY,
  }))
}

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage may be full or disabled - the app keeps working in memory */
  }
}
