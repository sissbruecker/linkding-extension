export async function getCurrentTabInfo() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs && tabs[0];

  return {
    url: tab ? tab.url : "",
    title: tab ? tab.title : ""
  };
}

export function openOptions () {
  browser.runtime.openOptionsPage()
  window.close()
}