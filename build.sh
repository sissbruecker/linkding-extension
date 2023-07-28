#!/usr/bin/env bash

# Update dependencies
# npm install

# Run rollup build
npm run build

## FIREFOX

# Copy files to artifacts folder
mkdir -p artifacts/firefox
cp -r build icons options popup styles artifacts/firefox

# Build manifest file for Firefox
jq -s '.[0] * .[1]' manifests/manifest.COMMON.json manifests/manifest.FIREFOX.json > artifacts/firefox/manifest.json

# Lint extension
npx web-ext lint --source-dir artifacts/firefox

# Build extension
npx web-ext build --overwrite-dest --source-dir artifacts/firefox --artifacts-dir artifacts/firefox

## CHROME

# Copy files to artifacts folder
mkdir -p artifacts/chrome
cp -r build icons options popup styles artifacts/chrome

# Build manifest file
jq -s '.[0] * .[1]' manifests/manifest.COMMON.json manifests/manifest.CHROME.json > artifacts/chrome/manifest.json

# Build extension
npx web-ext build --overwrite-dest --source-dir artifacts/chrome --artifacts-dir artifacts/chrome

echo "✅ Done"
