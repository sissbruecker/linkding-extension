export function getBrowser() {
  return typeof browser !== 'undefined' ? browser : chrome;
}

export async function getCurrentTabInfo() {
  const tabs = await getBrowser().tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs && tabs[0];

  return {
    id: tab ? tab.id : "",
    url: tab ? tab.url : "",
    title: tab ? tab.title : "",
  };
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
  action.setBadgeBackgroundColor({ color: "rgba(100,100,100,1)", tabId: tabId });
}

export function removeBadge(tabId) {
  const browser = getBrowser();
  const action = browser.browserAction || browser.action;
  action.setBadgeText({ text: "", tabId: tabId });
}
