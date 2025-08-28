import { LitElement, html } from "lit";
import "./popup-form.js";
import "./popup-intro.js";
import { getConfiguration, isConfigurationComplete } from "./configuration.js";
import { LinkdingApi } from "./linkding.js";

export class Popup extends LitElement {
  static properties = {
    hasCompleteConfiguration: { type: Boolean, state: true },
    configuration: { type: Object, state: true },
    api: { type: Object, state: true },
  };

  constructor() {
    super();
    this.hasCompleteConfiguration = true;
    this.configuration = null;
    this.api = null;
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated(props) {
    super.firstUpdated(props);

    this.init();
  }

  async init() {
    this.configuration = await getConfiguration();
    this.hasCompleteConfiguration = isConfigurationComplete(this.configuration);
    if (this.hasCompleteConfiguration) {
      this.api = new LinkdingApi(this.configuration);
    }
  }

  render() {
    return html`
      <ld-popup-form
        .configuration="${this.configuration}"
        .api="${this.api}"
      ></ld-popup-form>

      ${!this.hasCompleteConfiguration
        ? html` <ld-popup-intro></ld-popup-intro> `
        : ""}
    `;
  }
}

customElements.define("ld-popup", Popup);
