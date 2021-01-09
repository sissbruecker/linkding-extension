# linkding extension

Companion extension for the self-hosted [linkding](https://github.com/sissbruecker/linkding) bookmark service.

*NOTE: Currently only developed and tested for Firefox. Will try to add Chrome support later*

**Screenshot**

![Screenshot](/docs/screenshot.png?raw=true "Screenshot")

## Installation

*TODO: Link to extension stores as soon as extension is published*

## Manual installation

### Firefox

Run the build as described below and then follow the instructions [here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) to load it into Firefox.

### Chrome

*TODO*

## Build

**Requirements**
- Node.js
- yarn

Install dependencies:
```
yarn install
```

Run build script:
```
./dist.sh
```

The build will create a `dist` folder that contains the unpacked extension.
