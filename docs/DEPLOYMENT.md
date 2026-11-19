# Deployment and repository handover

## Existing hosting

The production site remains at https://palomite-project-intelligence.junaid-idris2.chatgpt.site.
The existing Sites source repository contains the application history. Keep that history when adding the destination GitHub remote. Do not replace the application with a generated scaffold.

The current host provides three essential services:

1. Trusted ChatGPT authentication headers and login routes.
2. Cloudflare D1 database storage.
3. Cloudflare R2 original document storage.

A GitHub push alone does not provision these services. The GitHub workflow validates source; it does not deploy. Sites publication still requires saving the pushed source version and deploying that saved version through Sites.

## Move to independently managed hosting

Before enabling automatic deployment, implement and verify an independent authentication provider and map existing account ownership to its identities. Never trust a caller supplied oai-authenticated-user-id header on an independently exposed server.

Provision separate staging and production databases and document buckets. Apply migrations in order, configure actual resource bindings, migrate data with verified ownership mappings, and test restoration. The placeholder database ID in vite.config.ts is for local development only.

Choose the production hosting account after validating runtime compatibility. The existing server imports cloudflare:workers and is not a drop in Node server deployment.

## Release acceptance

1. Run type checking, automated tests, and production build.
2. Check navigation and responsive layout in desktop and mobile browsers.
3. Sign in and verify project isolation with two test accounts.
4. Upload a synthetic quotation, review extraction, save it, and reload.
5. Schedule an installment, reschedule it, mark it ready, and record collection using synthetic data.
6. Verify over allocation prevention, history, and document access permissions.
7. Verify production migrations and a rollback or restoration procedure.

Do not report a full release as verified until the authenticated browser checks pass.

## GitHub destination

A dedicated private repository is required. Suggested name: Palomite-PI. Preserve the existing main branch history when importing. GitHub Actions configuration is included, but its execution remains unverified until the destination repository exists and receives the source.
