#!/usr/bin/env bash

# Update dependencies
npm install

# Run rollup build
npm run build

# Build manifest file for Firefox
jq -s '.[0] * .[1]' manifests/manifest.COMMON.json manifests/manifest.FIREFOX.json > manifest.json

# Lint extension, while excluding dev files
npx web-ext lint --ignore-files .idea dist docs src web-ext-artifacts .gitignore *.sh *.iml *.js *.lock
# Build extension, while excluding dev files
npx web-ext build --overwrite-dest --artifacts-dir web-ext-artifacts/firefox --ignore-files .idea dist docs src web-ext-artifacts .gitignore *.sh *.iml *.js *.lock

# Build manifest file for Chrome
jq -s '.[0] * .[1]' manifests/manifest.COMMON.json manifests/manifest.CHROME.json > manifest.json

# Lint extension, while excluding dev files
npx web-ext lint --ignore-files .idea dist docs src web-ext-artifacts .gitignore *.sh *.iml *.js *.lock
# Build extension, while excluding dev files
npx web-ext build --overwrite-dest --artifacts-dir web-ext-artifacts/chrome --ignore-files .idea dist docs src web-ext-artifacts .gitignore *.sh *.iml *.js *.lock

echo "✅ Done"
