# StockPilot – E-Commerce Inventory & Stock Management Dashboard

A React (Vite) single-page application for managing an online store's inventory. It deliberately combines **Class Components** (legacy lifecycle patterns) with **Functional Components + Hooks** (modern patterns).

> **Course:** Web Engineering / Frontend Development (CLO1 & CLO2) – *Advanced React Component Architecture & State Management*

- **Live deployment:** https://shahzaib-pervez.github.io/inventory-dashboard/
- **GitHub repository:** https://github.com/Shahzaib-Pervez/inventory-dashboard

## Features

- Add, edit and delete products (title, category, price, stock) with form validation
- Quick stock adjustment (`−`, `+`, `+10`) directly from each product card
- Live **In Stock / Low Stock / Out of Stock** badges (low stock = 10 units or fewer)
- Search, category filter, stock-status filter and sorting
- Inventory metrics: products, units, inventory value, low-stock and out-of-stock counts
- Persistent **audit log** (class component) with toast notifications and cross-tab sync
- Light / Dark theme via React Context, remembered between visits
- Inventory and logs persist in `localStorage`; the browser tab title shows the active product count

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build in /dist
npm run preview  # preview the production build
npm test         # run the integration tests (Vitest + Testing Library)
```

## Project structure

```
src/
├── components/
│   ├── class/
│   │   └── AuditLogger.jsx        # Class component + lifecycle methods
│   └── functional/
│       ├── CardWrapper.jsx        # Reusable container using props.children
│       ├── FilterBar.jsx
│       ├── Header.jsx
│       ├── InventoryMetrics.jsx
│       ├── ProductCard.jsx
│       ├── ProductForm.jsx
│       ├── ProductList.jsx
│       ├── StockBadge.jsx
│       └── ThemeToggle.jsx
├── context/
│   └── ThemeContext.jsx           # Light/Dark theme provider (useContext)
├── hooks/
│   ├── useDebounce.js
│   └── useLocalStorage.js
├── utils/
│   └── inventory.js               # Constants, seed data and pure helpers
├── App.jsx
├── App.css / index.css
└── main.jsx
```

## Requirement coverage

| Task | Where it is implemented |
| --- | --- |
| **1. Component architecture** | Modular components under `components/class` and `components/functional`, exactly matching the required structure |
| **2. Functional components & props** | `Header`, `ProductForm`, `ProductList`, `ProductCard`; callback props (`onSubmit`, `onStockChange`, `onEdit`, `onDelete`); `CardWrapper` renders `props.children` and is reused by the form, inventory panel, audit log and every product card |
| **3. Class component & lifecycle** | `AuditLogger.jsx` uses `this.state` / `this.setState()`; `componentDidMount` loads logs from `localStorage` and subscribes to the `storage` event; `componentDidUpdate` ingests new events, persists logs and shows a toast; `componentWillUnmount` clears the toast timer and removes the global listener |
| **4. JSX vs JavaScript logic** | `{ }` expressions throughout; ternaries and `&&` for empty states, status badges, validation errors and confirmations; `Array.map()` with unique `key`s for products, metrics, filters and log entries; `onClick`, `onChange` and `onSubmit` handlers |
| **5. Hooks** | See the table below |
| **6. CSR vs SSR** | See the analysis below |

### Hooks usage

| Hook | Usage |
| --- | --- |
| `useState` | Products, filters (search/category/status/sort), form fields and errors, editing id, delete confirmation |
| `useEffect` | Sync products to `localStorage`; update `document.title` with the active-product count; focus the title input on mount; debounce timer; apply theme to `<html>` |
| `useContext` | `ThemeContext` consumed by `ThemeToggle` (via `useTheme`) and by the class `AuditLogger` (via `static contextType`) |
| `useRef` | Title input focus on mount and after submit; latest products list for stable handlers; form scroll anchor |
| `useMemo` | Inventory metrics, filtered/sorted product list, the product being edited, theme context value |
| `useCallback` | All handlers passed to children (`handleSaveProduct`, `handleStockChange`, `handleDelete`, …); combined with `React.memo` on `ProductCard`, `FilterBar` and `InventoryMetrics` to avoid needless re-renders |

## Task 6 – Client-Side Rendering (CSR) vs Server-Side Rendering (SSR)

**Fundamental differences.** In Client-Side Rendering, used by this Vite + React SPA, the server sends an almost empty HTML shell and a JavaScript bundle. The browser downloads and executes that bundle, React builds the DOM, and data is fetched afterwards, so users see a blank screen or skeleton until the work completes. Server-side execution is trivial: any static host or CDN simply serves files. In Server-Side Rendering, used by frameworks such as Next.js, a Node or edge runtime renders the React tree on each request (or at build time for static generation) and returns complete HTML. The browser paints meaningful content immediately, then hydrates it by attaching event handlers. The price is server computation per request and code that must run safely in both environments.

**Trade-offs for an enterprise e-commerce dashboard.** *Performance:* SSR delivers faster First and Largest Contentful Paint, especially on slow devices and networks, but can increase Time To First Byte and demands caching. CSR has a heavier first load, yet later interactions are very fast because navigation and updates stay in the browser. *SEO:* Crawlers index SSR HTML reliably, which matters for public product catalogues. CSR depends on crawlers executing JavaScript, which is slower and less dependable, although this hardly matters for a private, login-protected admin tool like this dashboard. *Hosting:* CSR is cheap and scales effortlessly on Netlify, Vercel or S3 behind a CDN. SSR needs servers or serverless functions, adding operational cost, scaling concerns and monitoring. *Recommendation:* keep the internal inventory dashboard as CSR, because SEO is irrelevant and rich interactivity dominates. Use SSR or static generation for customer-facing storefront pages, where discoverability and first-paint speed directly influence conversion and revenue.

## Deployment

Any static host works because the app is a pure SPA:

- **Vercel / Netlify:** import the GitHub repository, build command `npm run build`, output directory `dist`.
- **GitHub Pages:** build locally and publish the `dist` folder.
