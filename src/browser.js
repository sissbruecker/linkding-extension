function isChrome() {
  return typeof chrome !== "undefined";
}

function getMeta() {
  var meta = document.querySelector('meta[name="description" i], meta[property="og:description" i]');
  return { description: meta ? meta.content : "" }
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

  const tabsMetaPromise = isChrome() ? new Promise(resolve => getBrowser().scripting.executeScript({
    target: {tabId: tab.id},
    func: getMeta
  }, resolve)) : getBrowser().scripting.executeScript({ target: {tabId: tab.id}, func: getMeta });

  const metas = await tabsMetaPromise;
  const meta = metas && metas[0] && metas[0].result;

  return {
    url: tab ? tab.url : "",
    title: tab ? tab.title : "",
    description: meta ? meta.description : ""
  };
}

export function openOptions() {
  getBrowser().runtime.openOptionsPage();
  window.close();
}