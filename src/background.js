import { getBrowser, getCurrentTabInfo } from "./browser";
import { LinkdingApi } from "./linkding";
import {
  getConfiguration,
  isConfigurationComplete,
  cacheTabMetadata,
} from "./configuration";

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

browser.omnibox.onInputEntered.addListener((content, disposition) => {
  if (!hasCompleteConfiguration || !content) {
    return;
  }

  const isUrl = /^http(s)?:\/\//.test(content);
  const url = isUrl
    ? content
    : `${configuration.baseUrl}/bookmarks?q=${encodeURIComponent(content)}`;

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

let cachedUrl = null;

async function loadTabMetadata(url) {
  const isReady = await initApi();
  if (!isReady || !url || url === cachedUrl) {
    return;
  }

  cachedUrl = url;

  try {
    const tabMetadata = await api.check(url);

    await cacheTabMetadata(tabMetadata);
  } catch (e) {
    console.error(e);
  }
}

browser.tabs.onActivated.addListener(async () => {
  const tabInfo = await getCurrentTabInfo();
  await loadTabMetadata(tabInfo.url);
});

browser.tabs.onUpdated.addListener(
  async (tabId, changeInfo, tab) => {
    // Ignore URL changes in non-active tabs
    if (!tab.active) {
      return;
    }

    await loadTabMetadata(tab.url);
  },
  { properties: ["url"] }
);
