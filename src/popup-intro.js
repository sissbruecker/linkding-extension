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
      <div class="modal active">
        <div class="modal-overlay"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="h6">Welcome</h2>
          </div>
          <div class="modal-body">
            <div class="content">
              <p>
                This is a companion extension for the
                <a href="https://github.com/sissbruecker/linkding">linkding</a>
                bookmark service. Before you can start using it you have to
                configure some basic settings, so that the extension can
                communicate with your linkding installation.
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
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("ld-popup-intro", PopupIntro);
