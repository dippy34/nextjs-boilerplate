#!/usr/bin/env bash
# Build and publish the site to the gh-pages branch (served by GitHub Pages at
# https://dippy34.github.io/nextjs-boilerplate/). The branch holds only the build output.
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="$(git remote get-url origin)"
SRC="$(git rev-parse --short HEAD)"
npm run build
TMP="$(mktemp -d)"
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll"            # serve files as-is, skip Jekyll
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-deploy}" -c user.email="${GIT_AUTHOR_EMAIL:-deploy@localhost}" commit -q -m "Deploy Space Explorer ($SRC)"
git push -f "$REMOTE" gh-pages
rm -rf "$TMP"
echo "Deployed $SRC to gh-pages"
