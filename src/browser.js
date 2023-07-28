export function getBrowser() {
  return typeof browser !== "undefined" ? browser : chrome;
}

export async function getCurrentTabInfo() {
  const tabs = await getBrowser().tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs && tabs[0];

  if (!tab) {
    return { url: "", title: "" };
  }

  return tab;
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

export function setStarredBadge(tabId) {
  chrome.action.setBadgeText({ text: "★", tabId: tabId });
  chrome.action.setBadgeTextColor({ color: "#FFE234", tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#666", tabId: tabId });
  chrome.action.setTitle({ title: "Edit bookmark", tabId: tabId });

  // chrome.action.setIcon({
  //   path: {
  //     19: "/icons/button_star_19x19.png",
  //     32: "/icons/button_star_32x32.png",
  //     38: "/icons/button_star_38x38.png",
  //   },
  //   tabId: tab.id
  // });
}

export function resetStarredBadge(tabId) {
  chrome.action.setBadgeText({ text: "", tabId: tabId });
  chrome.action.setTitle({ title: "Save bookmark", tabId: tabId });

  // chrome.action.setIcon({
  //   path: {
  //     19: "/icons/button_19x19.png",
  //     32: "/icons/button_32x32.png",
  //     38: "/icons/button_38x38.png",
  //   },
  //   tabId: tab.id
  // });
}
