# linkding extension

Companion extension for the self-hosted [linkding](https://github.com/sissbruecker/linkding) bookmark service.

**Features**
- Quickly add a bookmark for the current tab (keyboard shortcut: <kbd>Alt</kbd><kbd>Shift</kbd><kbd>L</kbd>)
- Search bookmarks through the Omnibox / address bar (keyword: <kbd>ld</kbd>)
- Optionally use AI to suggest bookmark tags and a description

Works with: Firefox, Chrome

**Screenshot**

![Screenshot](/docs/screenshot-chrome-AI.png?raw=true "Screenshot")

## AI suggestions

The add-bookmark popup can optionally use an OpenAI-compatible chat completions API to suggest tags and a short description.

To enable it, open the extension options and configure:

- **Enable AI suggestions**
- **AI API Endpoint**, for example `https://api.openai.com/v1/chat/completions`
- **AI API Key**, if your endpoint requires one
- **AI Model**, for example `gpt-4o-mini`

AI suggestions are manual. The extension only calls the AI API after you click **Suggest** in the add-bookmark popup.

For better suggestions, the popup starts reading a small page excerpt as soon as it opens. This excerpt is capped for speed and privacy:

- Up to 1,800 characters
- Up to 50 inspected page nodes
- Up to 1.5 seconds waiting in the popup

If the AI request times out or fails, the popup shows a short status message and keeps the form editable. You can continue entering tags and description manually, save the bookmark, or try **Suggest** again.

## Installation

Firefox: [Mozilla Addon Store](https://addons.mozilla.org/firefox/addon/linkding-extension/)

Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/linkding-extension/beakmhbijpdhipnjhnclmhgjlddhidpe) 

## Manual installation

### Firefox

Run the build as described below and then follow the instructions [here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) to load it into Firefox.

### Chrome

Run the build as described below from the `chrome` branch and then follow the instructions [here](https://developer.chrome.com/docs/extensions/mv3/getstarted/#manifest) to load it into Chrome.

## Build

**Requirements**
- Latest LTS Node version
- Latest LTS NPM version
- bash
- zip

Run the following bash script to generate a build (might need to make the file executable using `chmod +x build.sh`):
```
./build.sh
```

The script does:
- Install all dependencies using NPM
- Runs rollup to transpile and minify source files, with output written to `build`
- Packages the extension contents into a zip file in the `dist` folder

After the build, the root directory contains the complete, unpackaged extension. Use the `manifest.json` file to load it manually into the browser.

The packaged extension can be found in the `dist` folder.
