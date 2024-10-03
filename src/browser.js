export function getBrowser() {
  return typeof browser !== "undefined" ? browser : chrome;
}

export async function getCurrentTabInfo() {
  const tabs = await getBrowser().tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs && tabs[0];

  return {
    id: tab ? tab.id : "",
    url: tab ? tab.url : "",
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

function useChromeStorage() {
  return typeof chrome !== "undefined" && !!chrome.storage;
}

export function getStorageItem(key) {
  if (useChromeStorage()) {
    const result = chrome.storage.local.get([key]);
    return result.then((data) => data[key]);
  } else {
    return Promise.resolve(localStorage.getItem(key));
  }
}

export function setStorageItem(key, value) {
  if (useChromeStorage()) {
    return chrome.storage.local.set({ [key]: value });
  } else {
    localStorage.setItem(key, value);
    return Promise.resolve();
  }
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
