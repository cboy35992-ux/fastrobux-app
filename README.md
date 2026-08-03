# RSR Shop V16.2

Production package with separate CT, NCT, Instant Robux, and In-Game Gifting admin fulfillment portals.

## Deploy
1. Upload every file and folder in this package to the repository root.
2. Keep the existing Render environment variables.
3. Use `npm install` as the build command and `npm start` as the start command.
4. Deploy and test one order for each delivery method before accepting live payments.

## Important: permanent receipt and proof images
Receipts and delivery proofs are stored under `DATA_ROOT/uploads`. Do not use `/tmp/rsr-data` for permanent production storage because Render can erase temporary files after a restart or redeploy.

Attach a Render persistent disk and set `DATA_ROOT` to its mount path, for example `/var/data/rsr-data`. Existing files in the old temporary path are not automatically copied.

## Supported images
PNG, JPG/JPEG, WEBP, and GIF are accepted. SVG is intentionally rejected for security.
