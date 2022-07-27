<script>
  import Form from "./form.svelte";
  import Intro from "./intro.svelte";
  import {getConfiguration, isConfigurationComplete} from "./configuration";
  import {LinkdingApi} from "./linkding";

  let hasCompleteConfiguration = true;
  let configuration;
  let api;

  async function init() {
    configuration = await getConfiguration();
    hasCompleteConfiguration = isConfigurationComplete(configuration);
    if (hasCompleteConfiguration) {
      api = new LinkdingApi(configuration);
    }
  }

  init();
</script>

<Form configuration="{configuration}" api="{api}"/>

{#if !hasCompleteConfiguration}
  <div class="modal active" id="modal-id">
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal-body">
        <div class="content">
          <Intro/>
        </div>
      </div>
    </div>
  </div>
{/if}
