#!/usr/bin/env bash
# Build and publish the site to the gh-pages branch (served by GitHub Pages at
# https://dippy34.github.io/nextjs-boilerplate/). The branch holds only the build output.
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="$(git remote get-url origin)"
SRC="${SRC_OVERRIDE:-$(git rev-parse --short HEAD)}"
# SKIP_BUILD=1 publishes the existing dist/ (e.g. the exact build that was just verified)
if [ "${SKIP_BUILD:-0}" != "1" ]; then npm run build; fi
TMP="$(mktemp -d)"
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll"            # serve files as-is, skip Jekyll
cd "$TMP"
git init -q -b gh-pages
# Start from the published branch (shallow) so the push only uploads files that changed.
if git fetch -q --depth=1 "$REMOTE" gh-pages 2>/dev/null; then
  git reset -q --soft FETCH_HEAD
fi
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-deploy}" -c user.email="${GIT_AUTHOR_EMAIL:-deploy@localhost}" commit -q -m "Deploy Space Explorer ($SRC)"
git push -f "$REMOTE" gh-pages
rm -rf "$TMP"
echo "Deployed $SRC to gh-pages"
