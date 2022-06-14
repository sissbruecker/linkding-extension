<script>
  import { getConfiguration, saveConfiguration } from './configuration';
  import { testConnection } from './linkding';

  let baseUrl = '';
  let token = '';
  let theme = 'auto';
  let isSuccess = false;
  let isError = false;

  function init() {
    const config = getConfiguration();
    baseUrl = config.baseUrl;
    token = config.token;
    theme = config.theme;

    document.body.dataset['theme'] = theme;
  }

  init();

  async function handleSubmit() {
    const config = {
      baseUrl,
      token,
      theme,
    };

    const testResult = await testConnection(config);

    if (testResult) {
      saveConfiguration(config);

      document.body.dataset['theme'] = theme;

      isError = false;
      isSuccess = true;
    } else {
      isSuccess = false;
      isError = true;
    }
  }
</script>

<h6>Configuration</h6>
<div class="divider" />
<p>
  This is a companion extension for the <a
    href="https://github.com/sissbruecker/linkding">linkding</a
  > bookmark service. Before you can start using it you have to configure some basic
  settings, so that the extension can communicate with your linkding installation.
</p>
<form class="form" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label class="form-label" for="input-base-url">Base URL</label>
    <input
      class="form-input"
      type="text"
      id="input-base-url"
      placeholder="https://linkding.mydomain.com"
      bind:value={baseUrl}
    />
    <div class="form-input-hint">
      The base URL of your linkding installation, <b>without</b> the
      <samp>/bookmark</samp> path or a trailing slash
    </div>
  </div>
  <div class="form-group">
    <label class="form-label" for="input-token">API Authentication Token</label>
    <input
      class="form-input"
      type="password"
      id="input-token"
      placeholder="Token"
      bind:value={token}
    />
    <div class="form-input-hint">
      Used to authenticate against the linkding API. You can find this on your
      linkding settings page.
    </div>
  </div>
  <div class="form-group">
    <label class="form-label" for="input-theme">Theme</label>
    <select
      name="input-theme"
      class="form-select col-2 col-sm-12"
      id="input-theme"
      bind:value={theme}
    >
      <option value="auto">Auto</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
    <div class="form-input-hint">
      Whether to use a light or dark theme, or automatically adjust the theme
      based on your system's settings.
    </div>
  </div>
  <div class="divider" />
  <div class="button-row">
    {#if isSuccess}
      <div class="form-group has-success mr-2">
        <span class="form-input-hint"
          ><i class="icon icon-check" /> Connection successful</span
        >
      </div>
    {/if}
    {#if isError}
      <div class="form-group has-error mr-2">
        <span class="form-input-hint"
          ><i class="icon icon-cross" /> Connection failed</span
        >
      </div>
    {/if}
    <button
      type="submit"
      class="btn btn-primary ml-2"
      disabled={!(baseUrl && token)}
    >
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
