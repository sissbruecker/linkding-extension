import { getStorageItem, setStorageItem } from "./browser";

const CONFIG_KEY = "ld_ext_config";
const TAB_METADATA_CACHE_KEY = "ld_tab_metadata_cache";
const DEFAULTS = {
  baseUrl: "",
  token: "",
  default_tags: "",
};

export async function getConfiguration() {
  const configJson = await getStorageItem(CONFIG_KEY);
  const config = configJson ? JSON.parse(configJson) : {};
  return {
    ...DEFAULTS,
    ...config,
  };
}

export async function saveConfiguration(config) {
  const configJson = JSON.stringify(config);
  await setStorageItem(CONFIG_KEY, configJson);
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

export function isConfigurationComplete(config) {
  return config.baseUrl && config.token;
}
