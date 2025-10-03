import { LitElement, html, nothing } from "lit";
import "./tag-autocomplete.js";
import {
  getBrowserMetadata,
  getCurrentTabInfo,
  openOptions,
  showBadge,
  runSinglefile,
  removeBadge,
} from "./browser.js";
import { loadServerMetadata, clearCachedServerMetadata } from "./cache.js";
import { getProfile, updateProfile } from "./profile.js";
import { getConfiguration } from "./configuration.js";
import { icons } from "./icons";

export class PopupForm extends LitElement {
  static properties = {
    api: { type: Object },
    configuration: { type: Object },
    url: { type: String, state: true },
    title: { type: String, state: true },
    titlePlaceholder: { type: String, state: true },
    descriptionPlaceholder: { type: String, state: true },
    description: { type: String, state: true },
    notes: { type: String, state: true },
    tags: { type: String, state: true },
    autoTags: { type: String, state: true },
    unread: { type: Boolean, state: true },
    shared: { type: Boolean, state: true },
    saveState: { type: String, state: true },
    errorMessage: { type: String, state: true },
    availableTagNames: { type: Array, state: true },
    existingBookmark: { type: Object, state: true },
    editNotes: { type: Boolean, state: true },
    profile: { type: Object, state: true },
    tabInfo: { type: Object, state: true },
    extensionConfiguration: { type: Object, state: true },
    loading: { type: Boolean, state: true },
    deleteConfirmVisible: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.api = null;
    this.configuration = null;
    this.url = "";
    this.title = "";
    this.titlePlaceholder = "";
    this.descriptionPlaceholder = "";
    this.description = "";
    this.notes = "";
    this.tags = "";
    this.autoTags = "";
    this.unread = false;
    this.shared = false;
    this.saveState = "";
    this.errorMessage = "";
    this.availableTagNames = [];
    this.existingBookmark = null;
    this.editNotes = false;
    this.profile = null;
    this.tabInfo = null;
    this.extensionConfiguration = null;
    this.loading = false;
    this.deleteConfirmVisible = false;
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated(props) {
    super.firstUpdated(props);

    this.classList.add("bookmark-form");
  }

  updated(changedProperties) {
    if (
      changedProperties.has("api") ||
      changedProperties.has("configuration")
    ) {
      if (this.api && this.configuration) {
        this.init();
      }
    }
  }

  async init() {
    // First get cached user profile to quickly show something, then update it
    // in the background
    this.profile = await getProfile();
    updateProfile().then((updatedProfile) => {
      this.profile = updatedProfile;
    });

    // Load available tags in the background
    this.tags = this.configuration.default_tags;
    this.api
      .getTags()
      .catch(() => [])
      .then((tags) => {
        this.availableTagNames = tags.map((tag) => tag.name);
      });

    // Initialize bookmark form
    await this.initForm();
    this.extensionConfiguration = await getConfiguration();
  }

  async initForm() {
    this.tabInfo = await getCurrentTabInfo();
    this.url = this.tabInfo.url;

    this.loading = true;

    const [serverMetadata, browserMetadata] = await Promise.all([
      loadServerMetadata(this.url),
      getBrowserMetadata(this.url),
    ]);

    this.loading = false;

    if (this.configuration.useBrowserMetadata) {
      this.title = browserMetadata.title;
      this.description = browserMetadata.description;
    } else {
      this.title = serverMetadata.metadata.title;
      this.description = serverMetadata.metadata.description;
    }

    this.shared = this.configuration.shareSelected;
    this.unread = this.configuration.unreadSelected;

    // If the bookmark already exists, prefill the form with the existing bookmark
    if (!serverMetadata) {
      return;
    }

    const existingBookmark = serverMetadata.bookmark;
    if (existingBookmark) {
      this.existingBookmark = existingBookmark;
      this.title = existingBookmark.title;
      this.tags = existingBookmark.tag_names
        ? existingBookmark.tag_names.join(" ")
        : "";
      this.description = existingBookmark.description;
      this.notes = existingBookmark.notes;
      this.unread = existingBookmark.unread;
      this.shared = existingBookmark.shared;
      this.autoTags = "";
    } else {
      // Only show auto tags for new bookmarks
      // Auto tags are only supported since v1.31.0, so we need to check if they are available
      const autoTagsList = serverMetadata.auto_tags;
      if (autoTagsList) {
        this.autoTags = autoTagsList.join(" ");
      }
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    const tagNames = this.tags
      .split(" ")
      .map((tag) => tag.trim())
      .filter((tag) => !!tag);
    const bookmark = {
      url: this.url,
      title: this.title || "",
      description: this.description || "",
      notes: this.notes,
      tag_names: tagNames,
      unread: this.unread,
      shared: this.shared,
    };

    try {
      this.saveState = "loading";

      await this.api.saveBookmark(bookmark, {
        disable_html_snapshot: this.extensionConfiguration?.runSinglefile,
      });
      await clearCachedServerMetadata();

      this.saveState = "success";

      // Show star badge on the tab to indicate that it's now bookmarked
      // but only if precaching is enabled, since the badge will never
      // show when browsing without precaching
      if (this.extensionConfiguration?.precacheEnabled) {
        showBadge(this.tabInfo.id);
      }

      // Close popup window after saving the bookmark, if configured
      if (
        this.extensionConfiguration?.closeAddBookmarkWindowOnSave === true &&
        this.extensionConfiguration?.closeAddBookmarkWindowOnSaveMs >= 0
      ) {
        window.setTimeout(() => {
          window.close();
        }, this.extensionConfiguration?.closeAddBookmarkWindowOnSaveMs);
      }

      // Run singlefile, if configured
      if (
        !this.existingBookmark &&
        this.extensionConfiguration?.runSinglefile
      ) {
        runSinglefile();
      }
    } catch (e) {
      this.saveState = "error";
      this.errorMessage = e.toString();
      console.error(this.errorMessage);
    }
  }

  showDeleteConfirmation() {
    this.deleteConfirmVisible = true;
  }

  cancelDelete() {
    this.deleteConfirmVisible = false;
  }

  async confirmDelete() {
    if (!this.existingBookmark) {
      return;
    }

    try {
      await this.api.deleteBookmark(this.existingBookmark.id);
      await clearCachedServerMetadata();
      removeBadge(this.tabInfo.id);
      window.close();
    } catch (e) {
      this.saveState = "error";
      this.errorMessage = e.toString();
      console.error(this.errorMessage);
    }
  }

  handleOptions() {
    openOptions();
  }

  toggleNotes() {
    this.editNotes = !this.editNotes;
  }

  handleTagsChange(e) {
    this.tags = e.detail.value;
  }

  handleInputChange(e, property) {
    this[property] =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
  }

  render() {
    return html`
      <div class="title-row">
        <h1 class="h6">
          ${this.existingBookmark ? "Edit Bookmark" : "Add bookmark"}
        </h1>
        <a
          href="#"
          @click="${(e) => {
            e.preventDefault();
            this.handleOptions();
          }}"
          >Options</a
        >
      </div>
      <form class="form" @submit="${this.handleSubmit}">
        <div class="form-group">
          <label class="form-label" for="input-url">URL</label>
          <div class="has-icon-right">
            <input
              class="form-input"
              type="text"
              id="input-url"
              placeholder="URL"
              .value="${this.url}"
              @input="${(e) => this.handleInputChange(e, "url")}"
            />
            ${this.loading ? html`<i class="form-icon loading"></i>` : ""}
          </div>
          ${this.existingBookmark
            ? html`
                <div class="form-input-hint text-warning">
                  This URL is already bookmarked. The form has been prefilled
                  from the existing bookmark, and saving the form will update
                  the existing bookmark.
                </div>
              `
            : ""}
        </div>
        <div class="form-group">
          <label class="form-label" for="input-tags">Tags</label>
          <ld-tag-autocomplete
            inputid="input-tags"
            inputname="${this.tags}"
            .value="${this.tags}"
            .tags="${this.availableTagNames}"
            @value-change="${this.handleTagsChange}"
          ></ld-tag-autocomplete>
          ${this.autoTags
            ? html`
                <div class="form-input-hint text-success">
                  Auto tags: ${this.autoTags}
                </div>
              `
            : ""}
        </div>
        <div class="form-group">
          <label class="form-label" for="input-title">Title</label>
          <input
            class="form-input"
            type="text"
            id="input-title"
            .value="${this.title}"
            placeholder="${this.titlePlaceholder}"
            @input="${(e) => this.handleInputChange(e, "title")}"
          />
        </div>
        <div class="form-group">
          ${!this.editNotes
            ? html`
                <div class="form-label-row">
                  <label class="form-label" for="input-description"
                    >Description</label
                  >
                  <button
                    type="button"
                    class="btn btn-link"
                    @click="${(e) => {
                      e.preventDefault();
                      this.toggleNotes();
                    }}"
                  >
                    Edit notes
                  </button>
                </div>
                <textarea
                  class="form-input"
                  id="input-description"
                  .value="${this.description}"
                  placeholder="${this.descriptionPlaceholder}"
                  @input="${(e) => this.handleInputChange(e, "description")}"
                ></textarea>
              `
            : ""}
          ${this.editNotes
            ? html`
                <div class="form-label-row">
                  <label class="form-label" for="input-notes">Notes</label>
                  <button
                    type="button"
                    class="btn btn-link"
                    @click="${(e) => {
                      e.preventDefault();
                      this.toggleNotes();
                    }}"
                  >
                    Edit description
                  </button>
                </div>
                <textarea
                  class="form-input"
                  id="input-notes"
                  rows="5"
                  .value="${this.notes}"
                  @input="${(e) => this.handleInputChange(e, "notes")}"
                ></textarea>
              `
            : ""}
        </div>
        <div class="form-group d-flex">
          <label class="form-checkbox">
            <input
              type="checkbox"
              .checked="${this.unread}"
              @change="${(e) => this.handleInputChange(e, "unread")}"
            />
            <i class="form-icon"></i>
            <span>Mark as unread</span>
          </label>
          ${this.profile?.enable_sharing
            ? html`
                <label class="form-checkbox ml-4">
                  <input
                    type="checkbox"
                    .checked="${this.shared}"
                    @change="${(e) => this.handleInputChange(e, "shared")}"
                  />
                  <i class="form-icon"></i>
                  <span>Share</span>
                </label>
              `
            : ""}
        </div>
        <div class="footer">
          ${this.saveState === "success"
            ? html`
                <div class="result-row text-success">
                  ${icons.success()}
                  <span>Bookmark saved</span>
                </div>
              `
            : ""}
          ${this.saveState === "error"
            ? html`
                <div class="result-row text-error">
                  Error saving bookmark: ${this.errorMessage}
                </div>
              `
            : ""}
          ${this.saveState !== "success"
            ? html`
                <div class="button-row">
                  ${this.existingBookmark
                    ? html`
                        <button
                          type="button"
                          class="btn btn-error"
                          aria-label="Delete bookmark"
                          @click="${this.showDeleteConfirmation}"
                        >
                          ${icons.delete()}
                        </button>
                      `
                    : nothing}
                  <button
                    type="submit"
                    class="btn btn-primary btn-wide ml-auto ${this.saveState}"
                    ?disabled="${this.saveState === "loading"}"
                  >
                    Save
                  </button>
                </div>
              `
            : ""}
        </div>
      </form>

      ${this.deleteConfirmVisible ? this.renderDeleteConfirmation() : nothing}
    `;
  }

  renderDeleteConfirmation() {
    return html`
      <div class="modal active">
        <div class="modal-overlay"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="h6">Delete bookmark?</h2>
          </div>
          <div class="modal-body">
            <div class="content">
              Are you sure you want to delete this bookmark?
            </div>
          </div>
          <div class="modal-footer d-flex justify-between mt-2">
            <button type="button" class="btn" @click="${this.cancelDelete}">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-error"
              @click="${this.confirmDelete}"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("ld-popup-form", PopupForm);
