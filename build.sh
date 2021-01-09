#!/usr/bin/env bash

rm -rf dist
mkdir dist

yarn build

cp manifest.json dist
cp -R build dist/build
cp -R icons dist/icons
cp -R options dist/options
cp -R popup dist/popup
cp -R styles dist/styles

echo "✅ Done"
