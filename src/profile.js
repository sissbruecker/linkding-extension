import { getStorageItem, setStorageItem } from "./browser";
import { getConfiguration, isConfigurationComplete } from "./configuration";
import { LinkdingApi } from "./linkding";

const PROFILE_CACHE_KEY = "ld_profile_cache";

export async function updateProfile() {
  const configuration = await getConfiguration();
  const hasCompleteConfiguration = isConfigurationComplete(configuration);

  if (!hasCompleteConfiguration) {
    return null;
  }

  const api = new LinkdingApi(configuration);

  try {
    const profile = await api.getUserProfile();
    await cacheProfile(profile);
    return profile;
  } catch (e) {
    // Linkding <v1.22 does not support the profile API
    // In that case return null
    return null;
  }
}

export async function getProfile() {
  const json = await getStorageItem(PROFILE_CACHE_KEY);
  return json ? JSON.parse(json) : null;
}

export async function cacheProfile(profile) {
  const json = JSON.stringify(profile);
  await setStorageItem(PROFILE_CACHE_KEY, json);
}
