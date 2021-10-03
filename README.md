# linkding extension

Companion extension for the self-hosted [linkding](https://github.com/sissbruecker/linkding) bookmark service.

**Features**
- Quickly add a bookmark for the current tab (keyboard shortcut: <kbd>Alt</kbd><kbd>Shift</kbd><kbd>L</kbd>)
- Search bookmarks through the Omnibox / address bar (keyword: <kbd>ld</kbd>)

Works with: Firefox, Chrome

**Screenshot**

![Screenshot](/docs/screenshot.png?raw=true "Screenshot")

## Installation

Firefox: [Mozilla Addon Store](https://addons.mozilla.org/de/firefox/addon/linkding-extension/)

Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/linkding-extension/beakmhbijpdhipnjhnclmhgjlddhidpe) 

## Manual installation

### Firefox

Run the build as described below and then follow the instructions [here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) to load it into Firefox.

### Chrome

Run the build as described below and then follow the instructions [here](https://developer.chrome.com/docs/extensions/mv3/getstarted/#manifest) to load it into Chrome.

## Build

**Requirements**
- Latest LTS Node version (v14)
- Latest LTS NPM version (v6)
- bash
- npx (included with npm v5.2+)

Internally, we use `web-ext` to bundle a distribution package for the extension for Firefox. You do not need to install `web-ext`. Note that `web-ext` will generate a zip file which can also be used for the Chrome Web Store.

Then run the following bash script to generate a build (might need to make the file executable using `chmod +x build.sh`):
```
./build.sh
```

The script does:
- Install all dependencies using NPM
- Runs rollup to transpile and minify source files, with output written to `build`
- Run web-ext to package the extension for uploading to the Mozilla addon store

After the build the root directory contains the complete, unpackaged extension. Use the `manifest.json` file to load it manually into the browser.

The packaged extension can be found in the `web-ext-artifacts` folder.