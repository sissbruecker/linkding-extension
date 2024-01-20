import { getBrowser, getCurrentTabInfo } from "./browser";
import { loadTabMetadata } from "./cache";
import { getConfiguration, isConfigurationComplete } from "./configuration";
import { LinkdingApi } from "./linkding";

const browser = getBrowser();
let api = null;
let configuration = null;
let hasCompleteConfiguration = false;

async function initApi() {
  if (api) {
    return true;
  }

  configuration = await getConfiguration();
  hasCompleteConfiguration = isConfigurationComplete(configuration);

  if (hasCompleteConfiguration) {
    api = new LinkdingApi(configuration);
  } else {
    api = null;
  }

  return api !== null;
}

/* Omnibox / Search integration */

browser.omnibox.onInputStarted.addListener(async () => {
  const isReady = await initApi();
  const description = isReady
    ? "Search bookmarks in linkding"
    : "⚠️ Please configure the linkding extension first";

  browser.omnibox.setDefaultSuggestion({ description });
});

browser.omnibox.onInputChanged.addListener((text, suggest) => {
  if (!api) {
    return;
  }

  api
    .search(text, { limit: 5 })
    .then((results) => {
      const bookmarkSuggestions = results.map((bookmark) => ({
        content: bookmark.url,
        description: bookmark.title || bookmark.website_title || bookmark.url,
      }));
      suggest(bookmarkSuggestions);
    })
    .catch((error) => {
      console.error(error);
    });
});

browser.omnibox.onInputEntered.addListener(async (content, disposition) => {
  if (!hasCompleteConfiguration || !content) {
    return;
  }

  const isUrl = /^http(s)?:\/\//.test(content);
  const url = isUrl
    ? content
    : `${configuration.baseUrl}/bookmarks?q=${encodeURIComponent(content)}`;

  // Edge doesn't allow updating the New Tab Page (tested with version 117).
  // Trying to do so will throw: "Error: Cannot update NTP tab."
  // As a workaround, open a new tab instead.
  if (disposition === "currentTab") {
    const tabInfo = await getCurrentTabInfo();
    if (tabInfo.url === "edge://newtab/") {
      disposition = "newForegroundTab";
    }
  }

  switch (disposition) {
    case "currentTab":
      browser.tabs.update({ url });
      break;
    case "newForegroundTab":
      browser.tabs.create({ url });
      break;
    case "newBackgroundTab":
      browser.tabs.create({ url, active: false });
      break;
  }
});

/* Precache bookmark / website metadata when tab or URL changes */

browser.tabs.onActivated.addListener(async () => {
  const tabInfo = await getCurrentTabInfo();
  await loadTabMetadata(tabInfo.url, true);
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only interested in URL changes
  // Ignore URL changes in non-active tabs
  if (!changeInfo.url || !tab.active) {
    return;
  }

  await loadTabMetadata(tab.url, true);
});


browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.method == "getConfiguration") {
    configuration = await getConfiguration();
    return {data: configuration}
  } else if (request.method == "currentTabUrl") {
    return new Promise((resolve, reject) => {
      browser.tabs.query({active:true, currentWindow: true}, (tabs) => {
        var activeTab = tabs[0];
        var activeTabUrl = activeTab.url;
        resolve({url: activeTabUrl})
      })
    })
  }
})
