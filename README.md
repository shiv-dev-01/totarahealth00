# Totara Health Checkout

A React-based checkout portal for **Totara Health**, providing product selection, payment processing, coupon validation, and order confirmation.

## Features

- **Checkout flow** — Multi-step checkout with contact details, shipping, and payment (`Checkout2`)
- **Product pages** — Product display and treatment selection
- **Coupon validation** — Promo code verification via `check_coupons_v3` API (requires email + product ID)
- **Thank-you page** — Post-order confirmation (`/thankyou-page`)
- **Error handling** — Dedicated error page for invalid routes
- **State validation** — Shipping state eligibility checks
- **Sticky.io integration** — Payment SDK for order processing

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Create React App | Build tooling & dev server |
| React Router v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Styled Components | Component-level styles |
| Axios | HTTP client for API calls |
| React Hot Toast | Toast notifications |
| Lucide React / React Icons | Icon library |

## Prerequisites

- **Node.js** 18 or later
- **npm** (comes with Node.js)

## Getting Started

### Clone

```bash
git clone https://github.com/shiv-dev-01/totarahealth00.git
cd totarahealth00
```

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start development server |
| `npm run build` | Create production build in `build/` |
| `npm test` | Run test suite |
| `npm run eject` | Eject from CRA (irreversible) |

## Project Structure

```
totarahealth/
├── public/              # Static assets, index.html, manifest
├── src/
│   ├── App.js           # Root component & routes
│   ├── assets/logos/    # Brand logos and images
│   ├── common/          # Navbar, footer, loading
│   ├── components/      # Reusable UI (e.g. ProductCard)
│   ├── container/       # Landing page sections (FAQ, GLP-1, etc.)
│   ├── pages/           # Checkout, thank-you, error pages
│   ├── utils/
│   │   └── Constant.js  # API endpoints & site configuration
│   └── index.js         # App entry point
├── package.json
└── tailwind.config.js
```

## API Configuration

API endpoints are defined in `src/utils/Constant.js`:

| Setting | Value |
|---|---|
| **Base URL** | `https://panel.whitelabelmd.com/totara/api/` |
| **Site ID** | `395` |
| **Coupon API** | `https://panel.whitelabelmd.com/wlmdbackend/api/check_coupons_v3` |

Key endpoints include `get_products`, `get_product_details`, `createOrder_test`, `cheke_state`, and `get_checkout_link_data`.

## Production Build

```bash
npm run build
```

Output is written to the `build/` directory. Deploy the contents of `build/` to any static hosting provider.
