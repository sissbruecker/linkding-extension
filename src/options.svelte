<script>
  import {getConfiguration, saveConfiguration} from "./configuration";
  import {LinkdingApi} from "./linkding";

  let baseUrl = "";
  let token = "";
  let default_tags = "";
  let isSuccess = false;
  let isError = false;

  async function init() {
    const config = await getConfiguration();
    baseUrl = config.baseUrl;
    token = config.token;
    default_tags = config.default_tags;
  }

  init();

  async function handleSubmit() {
    const config = {
      baseUrl,
      token,
      default_tags,
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
<div class="divider"></div>
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
  <div class="divider"></div>
  <div class="button-row">
    {#if isSuccess}
      <div class="form-group has-success mr-2">
        <span class="form-input-hint"><i class="icon icon-check"></i> Connection successful</span>
      </div>
    {/if}
    {#if isError}
      <div class="form-group has-error mr-2">
        <span class="form-input-hint"><i class="icon icon-cross"></i> Connection failed</span>
      </div>
    {/if}
    <button type="submit" class="btn btn-primary ml-2" disabled={!(baseUrl && token)}>
      Save
    </button>
  </div>
</form>
<style>
    .button-row {
        display: flex;
        justify-content: flex-end;
        align-items: baseline;
    }

    .button-row button {
        padding-left: 32px;
        padding-right: 32px;
    }
</style>