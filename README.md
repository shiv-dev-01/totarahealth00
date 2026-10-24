# Totara Health Checkout

Checkout for **Totara Health**. Shoppers choose a treatment, enter contact and shipping details, apply a coupon when one is offered, pay, and reach the order confirmation page.

The code is in the existing repository `totarahealth00`. A second repository was not created.

## Stack

- React
- Create React App
- React Router
- Axios
- Tailwind CSS
- styled-components
- React Hot Toast
- Stripe

## Requirements

- Node.js 18 or later
- npm

## Run locally

```bash
git clone https://github.com/shiv-dev-01/totarahealth00.git
cd totarahealth00
npm install
npm start
```

The dev server opens at http://localhost:3000.

## Scripts

| Command | What it runs |
| --- | --- |
| `npm run start` | `react-scripts start` |
| `npm run build` | `react-scripts build` |
| `npm run test` | `react-scripts test` |
| `npm run eject` | `react-scripts eject` |

## Project files

- `docs`
- `public`
- `src`
- `.env`
- `.gitattributes`
- `.gitignore`
- `package-lock.json`
- `package.json`
- `README.md`
- `tailwind.config.js`

## Configuration

API hosts and site settings are in `src\utils\Constant.js`.
Files named `.env` stay on your machine and are not part of this repository. Use `.env.example` when the project includes one.

