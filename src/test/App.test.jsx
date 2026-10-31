import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { ThemeProvider } from '../context/ThemeContext'
import { STORAGE_KEYS } from '../utils/inventory'

function renderApp() {
  return render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
}

describe('StockPilot dashboard', () => {
  it('renders seeded inventory, metrics, and focuses the title input', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'StockPilot' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(5)
    expect(screen.getByLabelText('Product title')).toHaveFocus()
    expect(document.title).toMatch(/active products/)
    expect(within(screen.getByRole('region', { name: 'Inventory metrics' })).getByText('Total Products')).toBeInTheDocument()
  })

  it('shows validation errors for an empty submit', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Add product' }))
    expect(screen.getAllByRole('alert').length).toBe(4)
  })

  it('adds a product, shows Low Stock badge, toast, audit entry and persists', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('Product title'), 'Test Gadget')
    await user.selectOptions(screen.getByLabelText('Category'), 'Electronics')
    await user.type(screen.getByLabelText('Price (USD)'), '25')
    await user.type(screen.getByLabelText('Stock units'), '4')
    await user.click(screen.getByRole('button', { name: 'Add product' }))

    const card = (await screen.findByRole('heading', { name: 'Test Gadget' })).closest('section')
    expect(within(card).getByText('Low Stock')).toBeInTheDocument()
    expect(screen.getByLabelText('Product title')).toHaveFocus()
    expect(screen.getByLabelText('Product title')).toHaveValue('')

    expect(await screen.findByRole('status')).toHaveTextContent('Added “Test Gadget”')
    const log = within(document.getElementById('audit-log-card'))
    expect(log.getByText(/Added “Test Gadget”/)).toBeInTheDocument()

    const savedLogs = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.audit))
    expect(savedLogs).toHaveLength(1)
    const savedProducts = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.products))
    expect(savedProducts.some((p) => p.title === 'Test Gadget')).toBe(true)
  })

  it('adjusts stock, logs it, and deletes with confirmation', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('Product title'), 'Widget')
    await user.selectOptions(screen.getByLabelText('Category'), 'Toys')
    await user.type(screen.getByLabelText('Price (USD)'), '5')
    await user.type(screen.getByLabelText('Stock units'), '0')
    await user.click(screen.getByRole('button', { name: 'Add product' }))

    const card = (await screen.findByRole('heading', { name: 'Widget' })).closest('section')
    expect(within(card).getByText('Out of Stock')).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: 'Increase stock by 1' }))
    expect(within(card).getByText('Low Stock')).toBeInTheDocument()
    expect(within(document.getElementById('audit-log-card')).getByText(/Stock for “Widget”: 0 → 1/)).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: 'Delete Widget' }))
    await user.click(within(card).getByRole('button', { name: 'Yes' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Widget' })).not.toBeInTheDocument())
  })

  it('filters by status, shows empty state, and clears filters', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Out of Stock' }))
    const items = screen.getAllByRole('listitem').filter((li) => li.classList.contains('product-grid__item'))
    expect(items).toHaveLength(2)

    await user.type(screen.getByLabelText('Search products'), 'zzzz-nothing')
    expect(await screen.findByText('No products match your filters')).toBeInTheDocument()
    await user.click(document.getElementById('empty-clear-filters'))
    expect(screen.queryByText('No products match your filters')).not.toBeInTheDocument()
  })

  it('shows the empty inventory state after clearing everything', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText('Your inventory is empty')).toBeInTheDocument()
    expect(document.title).toMatch(/Inventory & Stock/)
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))
    expect(screen.queryByText('Your inventory is empty')).not.toBeInTheDocument()
  })

  it('toggles theme and persists audit logs across remounts', async () => {
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(document.getElementById('theme-toggle'))
    expect(document.documentElement.getAttribute('data-theme')).toBe(
      window.localStorage.getItem(STORAGE_KEYS.theme).replaceAll('"', ''),
    )

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    first.unmount()

    renderApp()
    expect(within(document.getElementById('audit-log-card')).getByText(/Cleared inventory/)).toBeInTheDocument()
    expect(screen.getByText('Your inventory is empty')).toBeInTheDocument()
  })
})
