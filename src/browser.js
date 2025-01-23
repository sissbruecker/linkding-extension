export function getBrowser() {
  return typeof browser !== "undefined" ? browser : chrome;
}

export async function getCurrentTabInfo() {
  const tabs = await getBrowser().tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs && tabs[0];
  let url = "";
  
  if (tab) {
    // The new URI API https://caniuse.com/url keep the final slash always
    let url_api = new URL(tab.url);
    // Sort the query parameters to make sure the URL is always the same
    url_api.searchParams.sort();
    url = url_api.toString();
  }

  return {
    id: tab ? tab.id : "",
    url: url,
    title: tab ? tab.title : "",
  };
}

function useChromeScripting() {
  return typeof chrome !== "undefined" && !!chrome.scripting;
}

export async function getBrowserMetadata() {
  const tabs = await getBrowser().tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs && tabs[0];

  const errorHandler = (error) => {
    console.error("Failed to load browser metadata", error);
    return { title: "", description: "" };
  };

  if (useChromeScripting()) {
    function getMetadata() {
      const title =
        document.querySelector("title")?.textContent ||
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content") ||
        "";
      const description =
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ||
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content") ||
        "";
      return { title, description };
    }

    return getBrowser()
      .scripting.executeScript({
        target: { tabId: tab.id },
        func: getMetadata,
      })
      .then((result) => result[0].result)
      .catch(errorHandler);
  } else {
    const code = `
      (function () {
      const title =
        document.querySelector("title")?.textContent ||
        document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content") ||
        "";
      const description =
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ||
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content") ||
        "";
        return { title, description };
      })();
    `;

    return getBrowser()
      .tabs.executeScript(tab.id, { code })
      .then((result) => result[0])
      .catch(errorHandler);
  }
}

export function getStorage() {
  if (
    typeof browser !== "undefined" &&
    typeof browser.storage !== "undefined"
  ) {
    return browser.storage.local;
  } else if (
    typeof chrome !== "undefined" &&
    typeof chrome.storage !== "undefined"
  ) {
    return chrome.storage.local;
  } else {
    throw new Error("Storage API not found.");
  }
}

export async function getStorageItem(key) {
  const storage = getStorage();
  const results = await storage.get([key]);
  let data = results[key];

  if (!data) {
    // Try lookup in local storage as fallback, which was used for storing
    // settings in Firefox before switching to storage API
    try {
      data = localStorage.getItem(key);
    } catch (e) {
      // Ignore
    }
  }

  return data;
}

export function setStorageItem(key, value) {
  const storage = getStorage();
  return storage.set({ [key]: value });
}

export function openOptions() {
  getBrowser().runtime.openOptionsPage();
  window.close();
}

export function showBadge(tabId) {
  const browser = getBrowser();
  const action = browser.browserAction || browser.action;
  action.setBadgeText({ text: "★", tabId: tabId });
  action.setBadgeTextColor({ color: "#FFE234", tabId: tabId });
  action.setBadgeBackgroundColor({
    color: "rgba(100,100,100,1)",
    tabId: tabId,
  });
}

export function removeBadge(tabId) {
  const browser = getBrowser();
  const action = browser.browserAction || browser.action;
  action.setBadgeText({ text: "", tabId: tabId });
}
