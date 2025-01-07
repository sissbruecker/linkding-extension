<script>
  import {getConfiguration, saveConfiguration} from "./configuration";
  import {LinkdingApi} from "./linkding";

  let baseUrl = "";
  let token = "";
  let default_tags = "";
  let unreadSelected = false;
  let shareSelected = false;
  let useBrowserMetadata = false;
  let precacheEnabled = false;
  let closeAddBookmarkWindowOnSave = false;
  let closeAddBookmarkWindowOnSaveMs = 500;
  let isSuccess = false;
  let isError = false;

  async function init() {
    const config = await getConfiguration();
    baseUrl = config.baseUrl;
    token = config.token;
    default_tags = config.default_tags;
    unreadSelected = config.unreadSelected;
    shareSelected = config.shareSelected;
    useBrowserMetadata = config.useBrowserMetadata;
    precacheEnabled = config.precacheEnabled;
    closeAddBookmarkWindowOnSave = config.closeAddBookmarkWindowOnSave;
    closeAddBookmarkWindowOnSaveMs = config.closeAddBookmarkWindowOnSaveMs;
  }

  init();

  async function handleSubmit() {
    const config = {
      baseUrl,
      token,
      default_tags,
      unreadSelected,
      shareSelected,
      useBrowserMetadata,
      precacheEnabled,
      closeAddBookmarkWindowOnSave,
      closeAddBookmarkWindowOnSaveMs,
    };

    const testResult = await new LinkdingApi(config).testConnection(config);

    if (testResult) {
      await saveConfiguration(config);
      isError = false;
      isSuccess = true;
    } else {
      isSuccess = false;
      isError = true;
    }
  }
</script>
<h6>Configuration</h6>
<p>This is a companion extension for the <a href="https://github.com/sissbruecker/linkding">linkding</a> bookmark
  service. Before you can start using it you have to configure some basic settings, so that the extension can
  communicate with your linkding installation.</p>
<form class="form" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label class="form-label" for="input-base-url">Base URL <span class="text-error">*</span></label>
    <input class="form-input" type="text" id="input-base-url" placeholder="https://linkding.mydomain.com"
           bind:value={baseUrl}>
    <div class="form-input-hint">The base URL of your linkding installation, <b>without</b> the <samp>/bookmark</samp>
      path or a trailing slash
    </div>
  </div>
  <div class="form-group">
    <label class="form-label" for="input-token">API Authentication Token <span class="text-error">*</span></label>
    <input class="form-input" type="password" id="input-token" placeholder="Token" bind:value={token}>
    <div class="form-input-hint">Used to authenticate against the linkding API. You can find this on your linkding
      settings page.
    </div>
  </div>
  <div class="form-group">
    <label class="form-label" for="input-default-tags">Default Tags</label>
    <input class="form-input" type="text" id="input-default-tags" placeholder="" bind:value={default_tags}>
    <div class="form-input-hint">
      Set of tags that should be added to new bookmarks by default.
    </div>
  </div>

  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={unreadSelected}>
      <i class="form-icon"></i>
      <span>Pre-select unread when adding bookmark</span>
    </label>
    <div class="form-input-hint">
      Marks new bookmarks as unread by default.
    </div>
  </div>

  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={shareSelected}>
      <i class="form-icon"></i>
      <span>Pre-select share when saving bookmark</span>
    </label>
    <div class="form-input-hint">
      Marks new bookmarks as shared by default. Only useful if you have enabled bookmark sharing in linkding.
    </div>
  </div>

  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={useBrowserMetadata}>
      <i class="form-icon"></i>
      <span>Use browser metadata</span>
    </label>
    <div class="form-input-hint">
      By default, the extension will fetch the page title and description from the linkding server when adding a new
      bookmark. Enabling this will use the metadata from the current browser tab instead. This gives better results
      for websites that use bot detection or require login, but can give worse results for websites that don't properly
      update the page title or description while browsing.
    </div>
  </div>

  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={precacheEnabled}>
      <i class="form-icon"></i>
      <span>Pre-load page information while browsing</span>
    </label>
    <div class="form-input-hint">
      Pre-loads the page title and description while browsing, so that these are already available when opening the add
      bookmark popup. Otherwise the page title and description will be fetched after opening popup, which can take a
      moment for them to show up.
      <br>
      <br>
      Enabling this will also enable the extension to show a starred linkding logo if the website
      in question is already bookmarked.
      <br>
      <br>
      <strong>Note:</strong> This will send the URL of all websites that you visit to your Linkding server, which will
      also be stored in the server logs.
    </div>
  </div>

  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={closeAddBookmarkWindowOnSave}>
      <i class="form-icon"></i>
      <span>Automatically close the popup window after saving a bookmark</span>
    </label>
    <div class="form-input-hint">
      The popup window will automatically close once you’ve saved a bookmark, otherwise by default it will remain open until you close it.
    </div>
  </div>

  {#if closeAddBookmarkWindowOnSave}
    <div class="form-group">
      <label class="form-label" for="input-close-window-on-save-time">Popup window close time delay after saving a bookmark<span class="text-error">*</span></label>
      <input class="form-input" type="number" id="input-close-window-on-save-time" placeholder="500" bind:value={closeAddBookmarkWindowOnSaveMs}>
      <div class="form-input-hint">
        The time in milliseconds to wait before closing the bookmark popup window after saving a bookmark.
      </div>
    </div>
  {/if}

  <div class="button-row">
    {#if isSuccess}
      <div class="status text-success mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 12l5 5l10 -10"/>
        </svg>
        <span>Connection successful</span>
      </div>
    {/if}
    {#if isError}
      <div class="status text-error mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/>
          <path d="M12 9v4"/>
          <path d="M12 16v.01"/>
        </svg>
        <span>Connection failed</span>
      </div>
    {/if}
    <button type="submit" class="btn btn-primary btn-wide ml-2" disabled={!(baseUrl && token)}>
      Save
    </button>
  </div>
</form>
<style>
    .status {
        display: flex;
        align-items: center;
        gap: var(--unit-2);
    }

    .button-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }
</style>
