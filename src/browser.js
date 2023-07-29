export const browserAPI = typeof browser !== "undefined" ? browser : chrome;

export async function getCurrentTabInfo() {
  const tabs = await browserAPI.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs && tabs[0];

  return {
    url: tab ? tab.url : "",
    title: tab ? tab.title : "",
  };
}

export function getStorageItem(key) {
  return browserAPI.storage.local.get([key]).then((data) => data[key]);
}

export function setStorageItem(key, value) {
  return browserAPI.storage.local.set({ [key]: value });
}

export function openOptions() {
  browserAPI.runtime.openOptionsPage();
  window.close();
}
