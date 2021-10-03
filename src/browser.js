function isChrome() {
  return typeof chrome !== "undefined";
}

export function getBrowser() {
  return isChrome() ? chrome : browser;
}

export async function getCurrentTabInfo() {
  const tabsPromise = isChrome() ? new Promise(resolve => getBrowser().tabs.query({
    active: true,
    currentWindow: true
  }, resolve)) : getBrowser().tabs.query({ active: true, currentWindow: true });

  const tabs = await tabsPromise;
  const tab = tabs && tabs[0];

  return {
    url: tab ? tab.url : "",
    title: tab ? tab.title : ""
  };
}

export function openOptions() {
  getBrowser().runtime.openOptionsPage();
  window.close();
}