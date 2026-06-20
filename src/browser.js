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

function isFirefox() {
  const runtime = getBrowser().runtime;
  if (runtime && typeof runtime.getURL === "function") {
    const extensionUrl = runtime.getURL("");
    return extensionUrl.startsWith("moz-extension://");
  }

  return (
    typeof navigator !== "undefined" && navigator.userAgent.includes("Firefox/")
  );
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

export async function getPageContentPreview() {
  const tabs = await getBrowser().tabs.query({
    active: true,
    currentWindow: true,
  });
  const tab = tabs && tabs[0];

  if (!tab?.id) {
    return "";
  }

  const errorHandler = (error) => {
    console.error("Failed to load page content preview", error);
    return "";
  };

  const timeout = new Promise((resolve) => {
    window.setTimeout(() => resolve(""), 1500);
  });

  const preview = useChromeScripting()
    ? getBrowser()
        .scripting.executeScript({
          target: { tabId: tab.id },
          func: extractPageContentPreview,
        })
        .then((result) => result[0].result)
        .catch(errorHandler)
    : getBrowser()
        .tabs.executeScript(tab.id, {
          code: `(${extractPageContentPreview.toString()})();`,
        })
        .then((result) => result[0])
        .catch(errorHandler);

  return Promise.race([preview, timeout]);
}

function extractPageContentPreview() {
  const MAX_CHARS = 1800;
  const MAX_NODES = 50;
  const MIN_TEXT_LENGTH = 40;
  const TIME_BUDGET_MS = 250;
  const startedAt = performance.now();
  const parts = [];
  const seen = new Set();
  let length = 0;
  let inspectedNodes = 0;

  const add = (text) => {
    const normalized = String(text || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized || seen.has(normalized) || length >= MAX_CHARS) {
      return;
    }

    seen.add(normalized);
    const remaining = MAX_CHARS - length;
    const excerpt = normalized.slice(0, remaining);
    parts.push(excerpt);
    length += excerpt.length;
  };

  const isDone = () =>
    length >= MAX_CHARS ||
    inspectedNodes >= MAX_NODES ||
    performance.now() - startedAt > TIME_BUDGET_MS;

  add(document.getSelection()?.toString());
  add(document.querySelector("h1")?.textContent);
  add(
    document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content"),
  );
  add(
    document.querySelector('meta[name="description"]')?.getAttribute("content"),
  );

  const container =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.body;

  if (!container || isDone()) {
    return parts.join("\n").slice(0, MAX_CHARS);
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;

  while (node && !isDone()) {
    inspectedNodes += 1;

    if (["H1", "H2", "P"].includes(node.tagName)) {
      const text = node.textContent;
      if (text && text.trim().length >= MIN_TEXT_LENGTH) {
        add(text);
      }
    }

    node = walker.nextNode();
  }

  return parts.join("\n").slice(0, MAX_CHARS);
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

export function showSuccessBadge(tabId) {
  const browser = getBrowser();
  const action = browser.browserAction || browser.action;
  action.setBadgeText({ text: "✔", tabId: tabId });
  action.setBadgeTextColor({ color: "#FFFFFF", tabId: tabId });
  action.setBadgeBackgroundColor({
    color: "rgba(76,175,80,1)",
    tabId: tabId,
  });
}

export function runSinglefile() {
  const browser = getBrowser();
  const extensionId = isFirefox()
    ? "{531906d3-e22f-4a6c-a102-8057b88a1a63}"
    : "mpiodijhokgodhhofbcjdecpffjipkle";
  browser.runtime.sendMessage(extensionId, "save-page");
}

export function createTab(url) {
  const browser = getBrowser();
  browser.tabs.create({ url });
}
