import { LitElement, html } from "lit";
import { openOptions } from "./browser.js";

export class PopupIntro extends LitElement {
  createRenderRoot() {
    return this;
  }

  handleOptions() {
    openOptions();
  }

  render() {
    return html`
      <h6>Welcome</h6>
      <div class="divider"></div>
      <p>
        This is a companion extension for the
        <a href="https://github.com/sissbruecker/linkding">linkding</a> bookmark
        service. Before you can start using it you have to configure some basic
        settings, so that the extension can communicate with your linkding
        installation.
      </p>
      <div style="text-align: center">
        <button
          type="submit"
          class="btn btn-primary"
          @click="${this.handleOptions}"
        >
          Get started
        </button>
      </div>
    `;
  }
}

customElements.define("ld-popup-intro", PopupIntro);
