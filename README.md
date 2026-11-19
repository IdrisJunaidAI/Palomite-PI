# Palomite Project Intelligence

Construction project records for Palomita Dental, Welby Storage, and Palomita Layout.

## Current product

The web application includes procurement document extraction and review, vendor and item registers, and check pickup scheduling. Scheduling records an appointment; it does not execute a payment or verify bank clearance.

The current application is a Sites hosted Vinext application. A native iOS or Android application has not been implemented.

## Development

Use Node.js 22.13 or newer and the pnpm version pinned in package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
pnpm run build
pnpm run dev
```

Local development uses the existing portable execution profile on a clean clone. Local authentication simulation is for development only. See docs/STARTER.md for runtime details.

## Repository layout

| Location | Purpose |
| --- | --- |
| app/ | Website pages and server API routes |
| components/procurement/ | Documents and vendor pickup scheduling |
| lib/ | Extraction, validation, and scheduling rules |
| db/ and drizzle/ | Database schema and migrations |
| scripts/tests/ | Automated checks |
| .openai/hosting.json | Existing Sites deployment identity |
| docs/DEPLOYMENT.md | Deployment boundaries and release checks |
| docs/MOBILE.md | Web and mobile implementation plan |

## Verification

The GitHub workflow runs type checking, automated tests, and a production build. A successful build does not verify browser behavior, authentication, document uploads, or persistence. Those require separate acceptance checks described in docs/DEPLOYMENT.md.

Keep this repository private: the current source includes project budget data. Never commit credentials, production database exports, uploaded documents, or local runtime state.
