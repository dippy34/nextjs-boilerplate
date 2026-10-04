#!/usr/bin/env bash
# Build and publish the site to Cloudflare Pages (project "space-explorer",
# served at https://space-explorer-1vx.pages.dev/). Needs CLOUDFLARE_API_TOKEN
# (Account > Cloudflare Pages > Edit) and CLOUDFLARE_ACCOUNT_ID in the environment.
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT="${CF_PAGES_PROJECT:-space-explorer}"
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is not set}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is not set}"
SHA="$(git rev-parse HEAD)"
SRC="$(git rev-parse --short HEAD)"
# SKIP_BUILD=1 publishes the existing dist/ (e.g. the exact build that was just verified)
if [ "${SKIP_BUILD:-0}" != "1" ]; then npm run build; fi
# The project already exists, so this runs directly against Pages (no --force, which
# would only matter for "pages project create"). Output is filtered so secrets never show.
npx --yes wrangler@latest pages deploy dist \
  --project-name="$PROJECT" --branch=main \
  --commit-hash="$SHA" --commit-message="Space Explorer $SRC" 2>&1 \
  | sed -e "s/${CLOUDFLARE_ACCOUNT_ID}/<ACCOUNT_ID>/g" -e "s/${CLOUDFLARE_API_TOKEN}/<TOKEN>/g"
status="${PIPESTATUS[0]}"
[ "$status" = 0 ] || { echo "Cloudflare deploy failed ($status)" >&2; exit "$status"; }
echo "Deployed $SRC to Cloudflare Pages project $PROJECT"
