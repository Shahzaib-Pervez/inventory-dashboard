import { useCallback, useEffect, useRef, useState } from 'react'
import CardWrapper from './CardWrapper'
import StockBadge from './StockBadge'
import { getStockStatus } from '../../utils/inventory'

const EMPTY_VALUES = { title: '', category: '', price: '', stock: '' }

function validate(values) {
  const errors = {}
  const title = values.title.trim()

  if (title.length < 2) errors.title = 'Enter a product title (at least 2 characters).'
  else if (title.length > 60) errors.title = 'Title must be 60 characters or fewer.'

  if (!values.category) errors.category = 'Please choose a category.'

  if (values.price === '' || Number.isNaN(Number(values.price)) || Number(values.price) < 0) {
    errors.price = 'Enter a valid price (0 or more).'
  }

  if (values.stock === '' || !Number.isInteger(Number(values.stock)) || Number(values.stock) < 0) {
    errors.stock = 'Stock must be a whole number (0 or more).'
  }

  return errors
}

/**
 * Add / edit form.
 * - Controlled inputs managed with useState.
 * - useRef focuses the title input on mount and after every submit.
 * - The parent passes `key` so switching between "new" and "edit" remounts the form
 *   with fresh initial values (and re-runs the focus effect).
 */
export default function ProductForm({ editingProduct, categories, onSubmit, onCancelEdit }) {
  const isEditing = Boolean(editingProduct)

  const [values, setValues] = useState(() =>
    editingProduct
      ? {
          title: editingProduct.title,
          category: editingProduct.category,
          price: String(editingProduct.price),
          stock: String(editingProduct.stock),
        }
      : EMPTY_VALUES,
  )
  const [errors, setErrors] = useState({})
  const titleRef = useRef(null)

  // Focus the title field as soon as the form mounts.
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      titleRef.current?.focus()
      return
    }

    onSubmit(
      {
        title: values.title.trim(),
        category: values.category,
        price: Math.round(Number(values.price) * 100) / 100,
        stock: Number(values.stock),
      },
      editingProduct?.id ?? null,
    )

    if (!isEditing) setValues(EMPTY_VALUES)
    titleRef.current?.focus()
  }

  const previewStatus = values.stock !== '' && Number(values.stock) >= 0 ? getStockStatus(Number(values.stock)) : null

  return (
    <CardWrapper
      id="product-form-card"
      icon={isEditing ? '✏️' : '➕'}
      title={isEditing ? 'Edit product' : 'Add new product'}
      subtitle={isEditing ? `Updating “${editingProduct.title}”` : 'Create a listing and set its opening stock'}
      variant="accent"
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className={`field ${errors.title ? 'field--error' : ''}`}>
          <label htmlFor="product-title">Product title</label>
          <input
            id="product-title"
            ref={titleRef}
            name="title"
            type="text"
            value={values.title}
            onChange={handleChange}
            placeholder="e.g. Wireless Mouse"
            maxLength={80}
            autoComplete="off"
          />
          {errors.title && (
            <span className="field__error" role="alert">
              {errors.title}
            </span>
          )}
        </div>

        <div className={`field ${errors.category ? 'field--error' : ''}`}>
          <label htmlFor="product-category">Category</label>
          <select id="product-category" name="category" value={values.category} onChange={handleChange}>
            <option value="">Select a category…</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="field__error" role="alert">
              {errors.category}
            </span>
          )}
        </div>

        <div className="form__row">
          <div className={`field ${errors.price ? 'field--error' : ''}`}>
            <label htmlFor="product-price">Price (USD)</label>
            <input
              id="product-price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={values.price}
              onChange={handleChange}
              placeholder="0.00"
            />
            {errors.price && (
              <span className="field__error" role="alert">
                {errors.price}
              </span>
            )}
          </div>

          <div className={`field ${errors.stock ? 'field--error' : ''}`}>
            <label htmlFor="product-stock">Stock units</label>
            <input
              id="product-stock"
              name="stock"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={values.stock}
              onChange={handleChange}
              placeholder="0"
            />
            {errors.stock && (
              <span className="field__error" role="alert">
                {errors.stock}
              </span>
            )}
          </div>
        </div>

        <div className="form__preview" aria-live="polite">
          {previewStatus ? (
            <>
              <span>Status preview</span>
              <StockBadge status={previewStatus} />
            </>
          ) : (
            <span className="muted">Enter a stock quantity to preview its status.</span>
          )}
        </div>

        <div className="form__actions">
          <button id="product-submit" type="submit" className="btn btn--primary">
            {isEditing ? 'Save changes' : 'Add product'}
          </button>
          {isEditing && (
            <button id="product-cancel" type="button" className="btn btn--ghost" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </CardWrapper>
  )
}
