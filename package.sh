#!/usr/bin/env bash

# Update dependencies
npm install

# Run rollup build
npm run build

## FIREFOX

# Copy files to artifacts folder
mkdir -p artifacts/firefox
cp -r build icons options popup styles artifacts/firefox

# Build manifest file for Firefox
npm run merge firefox artifacts/firefox

# Lint extension
npx web-ext lint --source-dir artifacts/firefox

# Build extension
npx web-ext build --overwrite-dest --source-dir artifacts/firefox --artifacts-dir artifacts/firefox

## CHROME

# Copy files to artifacts folder
mkdir -p artifacts/chrome
cp -r build icons options popup styles artifacts/chrome

# Build manifest file
npm run merge chrome artifacts/chrome

# Build extension
npx web-ext build --overwrite-dest --source-dir artifacts/chrome --artifacts-dir artifacts/chrome

echo "✅ Done"
