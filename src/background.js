import { getBrowser, getCurrentTabInfo, setStarredBadge, resetStarredBadge } from "./browser";
import { loadTabMetadata, clearCachedTabMetadata } from "./cache";
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

/* Context menu integration */

async function saveToLinkding(info, tab) {
  const isReady = await initApi();
  if (!isReady) return;

  const urlMetadata = await loadTabMetadata(info.linkUrl);
  if (!urlMetadata) return;

  // Check if bookmark already exists
  if (urlMetadata.bookmark) {
    chrome.notifications.create("linkding-bookmark-exists", {
      type: "basic",
      iconUrl: chrome.runtime.getURL("/icons/logo_48x48.png"),
      title: "Linkding",
      message: `Bookmark already saved`,
      silent: true, // Prevents notification sound
    });
    return;
  }

  const { description, title, url } = urlMetadata.metadata;
  const tagNames =
    api.default_tags
      ?.split(" ")
      .map((tag) => tag.trim())
      .filter((tag) => !!tag) ?? [];

  const bookmark = {
    url,
    title: title ?? "",
    description: description ?? "",
    tag_names: tagNames,
  };

  try {
    await api.saveBookmark(bookmark);
    await clearCachedTabMetadata();

    chrome.notifications.create("linkding-bookmark-saved", {
      type: "basic",
      iconUrl: chrome.runtime.getURL("/icons/logo_48x48.png"),
      title: "Linkding",
      message: `Saved bookmark "${bookmark.title}"`,
      silent: true, // Prevents notification sound
    });
  } catch (e) {
    console.error(e);
  }
}

// Removing all context menu items first is safer to avoid duplicates
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: "save-to-linkding",
    title: "Save bookmark",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(saveToLinkding);

/* Dynamic badge */

// Set the badge when the tab is created/changed/focused
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  const tabMetadata = await loadTabMetadata(tab.url);
  if (tabMetadata?.bookmark) {
    setStarredBadge(tab.id);
    return;
  }
  
  // Reset badge if tab is not bookmarked
  if (chrome.action.getBadgeText({ tabId: tab.id }) === "★") {
    resetStarredBadge(tab.id);
  }
});
