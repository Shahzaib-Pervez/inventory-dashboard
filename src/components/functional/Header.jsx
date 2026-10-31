import ThemeToggle from './ThemeToggle'

export default function Header({ activeCount, totalCount }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand">
          <img className="brand__logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="40" height="40" />
          <div>
            <h1 className="brand__name">StockPilot</h1>
            <p className="brand__tag">E-Commerce Inventory &amp; Stock Dashboard</p>
          </div>
        </div>

        <div className="app-header__right">
          <span className="live-pill" title="Inventory is saved to your browser automatically">
            <span className="live-pill__dot" aria-hidden="true" />
            {activeCount} active
            {totalCount > 0 && <span className="live-pill__muted"> / {totalCount} products</span>}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
