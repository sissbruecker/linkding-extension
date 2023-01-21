import { getStorageItem, setStorageItem } from "./browser";
import { getConfiguration, isConfigurationComplete } from "./configuration";
import { LinkdingApi } from "./linkding";

const TAB_METADATA_CACHE_KEY = "ld_tab_metadata_cache";

export async function loadTabMetadata(url) {
  const configuration = await getConfiguration();
  const hasCompleteConfiguration = isConfigurationComplete(configuration);

  // Skip if extension is not configured or URL is invalid
  if (!hasCompleteConfiguration || !url || !url.match(/^http(s)?:\/\//)) {
    return null;
  }

  // Check for cached metadata first
  const cachedMetadata = await getCachedTabMetadata();
  if (cachedMetadata && cachedMetadata.metadata.url === url) {
    return cachedMetadata;
  }

  // Load metadata if not cached
  const api = new LinkdingApi(configuration);
  try {
    const tabMetadata = await api.check(url);
    // Linkding <v1.17 does not return full bookmark data from check API
    // In that case fetch the bookmark with a separate request
    if (tabMetadata.bookmark && !tabMetadata.bookmark.date_added) {
      tabMetadata.bookmark = await api.getBookmark(tabMetadata.bookmark.id);
    }
    await cacheTabMetadata(tabMetadata);
    return tabMetadata;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getCachedTabMetadata() {
  const json = await getStorageItem(TAB_METADATA_CACHE_KEY);
  return json ? JSON.parse(json) : null;
}

export async function cacheTabMetadata(tabMetadata) {
  const json = JSON.stringify(tabMetadata);
  await setStorageItem(TAB_METADATA_CACHE_KEY, json);
}

export async function clearCachedTabMetadata() {
  await cacheTabMetadata(null);
}
