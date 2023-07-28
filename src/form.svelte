<script>
  import TagAutocomplete from "./TagAutocomplete.svelte";
  import {
    getCurrentTabInfo,
    openOptions,
    setStarredBadge,
    resetStarredBadge,
  } from "./browser";
  import { loadTabMetadata, clearCachedTabMetadata } from "./cache";

  export let api;
  export let configuration;

  let url = "";
  let title = "";
  let titlePlaceholder = "";
  let descriptionPlaceholder = "";
  let description = "";
  let notes = "";
  let tags = "";
  let unread = false;
  let saveState = "";
  let errorMessage = "";
  let availableTagNames = [];
  let bookmarkId = null;
  let editNotes = false;

  $: {
    if (api && configuration) {
      init();
    }
  }

  async function init() {
    const tabInfo = await getCurrentTabInfo();
    url = tabInfo.url;

    tags = configuration.default_tags;
    const availableTags = await api.getTags().catch(() => []);
    availableTagNames = availableTags.map((tag) => tag.name);

    loadExistingBookmarkData();
  }

  async function loadExistingBookmarkData() {
    const tabMetadata = await loadTabMetadata(url);
    if (!tabMetadata) {
      return;
    }

    titlePlaceholder = tabMetadata.metadata.title ?? "";
    descriptionPlaceholder = tabMetadata.metadata.description ?? "";

    const existingBookmark = tabMetadata.bookmark;
    if (existingBookmark) {
      bookmarkId = existingBookmark.id;
      title = existingBookmark.title;
      tags = existingBookmark.tag_names
        ? existingBookmark.tag_names.join(" ")
        : "";
      description = existingBookmark.description;
      notes = existingBookmark.notes;
      unread = existingBookmark.unread;
    }
  }

  async function handleSubmit() {
    const tagNames = tags
      .split(" ")
      .map((tag) => tag.trim())
      .filter((tag) => !!tag);

    const bookmark = {
      url,
      title: title || titlePlaceholder,
      description: description || descriptionPlaceholder,
      notes,
      tag_names: tagNames,
      unread,
    };

    try {
      saveState = "loading";
      const newBookmark = await api.saveBookmark(bookmark);
      await clearCachedTabMetadata();
      saveState = "success";

      title = newBookmark.title;
      description = newBookmark.description;
      bookmarkId = newBookmark.id;

      const tabInfo = await getCurrentTabInfo();
      setStarredBadge(tabInfo.id);

      window.setTimeout(() => {
        saveState = "";
      }, 1750);
    } catch (e) {
      saveState = "error";
      errorMessage = e.toString();
      console.error(errorMessage);
    }
  }

  function handleOptions() {
    openOptions();
  }

  async function handleDelete() {
    if (!bookmarkId) return;
    if (!confirm("Are you sure you want to delete this bookmark?")) {
      return;
    }

    try {
      await api.deleteBookmark(bookmarkId);
      await clearCachedTabMetadata();

      bookmarkId = null;
      const tabInfo = await getCurrentTabInfo();
      resetStarredBadge(tabInfo.id);
    } catch (e) {
      saveState = "error";
      errorMessage = e.toString();
      console.error(errorMessage);
    }
  }

  function toggleNotes() {
    editNotes = !editNotes;
  }
</script>

<div class="title-row">
  <div><b>{bookmarkId ? "Edit Bookmark" : "Add bookmark"}</b></div>
  <div class="title-actions">
    <a
      class="title-action"
      href={`${configuration?.baseUrl}/bookmarks`}
      target="_blank"
      role="button"
      tabindex="0"
    >
      <i class="icon icon-share" />
    </a>
    <div
      class="title-action"
      on:keypress={handleOptions}
      on:click|preventDefault={handleOptions}
      role="button"
      tabindex="0"
    >
      <i class="icon icon-menu" />
    </div>
  </div>
</div>
<div class="divider" />
<form class="form" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label class="form-label label-sm" for="input-url">URL</label>
    <input
      class="form-input input-sm"
      type="text"
      id="input-url"
      placeholder="URL"
      bind:value={url}
    />
  </div>
  <div class="form-group">
    <label class="form-label label-sm" for="input-tags">Tags</label>
    <TagAutocomplete
      id="input-tags"
      name="tags"
      bind:value={tags}
      tags={availableTagNames}
    />
  </div>
  <div class="form-group">
    <label class="form-label label-sm" for="input-title">Title</label>
    <input
      class="form-input input-sm"
      type="text"
      id="input-title"
      bind:value={title}
      placeholder={titlePlaceholder}
    />
  </div>
  <div class="form-group">
    {#if !editNotes}
      <div class="form-label-row">
        <label class="form-label label-sm" for="input-description"
          >Description</label
        >
        <button
          type="button"
          class="btn btn-link btn-sm"
          on:click|preventDefault={toggleNotes}>Edit notes</button
        >
      </div>
      <textarea
        class="form-input input-sm"
        id="input-description"
        bind:value={description}
        placeholder={descriptionPlaceholder}
      />
    {/if}
    {#if editNotes}
      <div class="form-label-row">
        <label class="form-label label-sm" for="input-notes">Notes</label>
        <button
          type="button"
          class="btn btn-link btn-sm"
          on:click|preventDefault={toggleNotes}
          >Edit description
        </button>
      </div>
      <textarea
        class="form-input input-sm"
        id="input-notes"
        rows="5"
        bind:value={notes}
      />
    {/if}
  </div>
  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={unread} />
      <i class="form-icon" />
      <span class="text-small">Mark as unread</span>
    </label>
  </div>
  <div class="divider" />
  {#if saveState === "success"}
    <div class="form-group has-success result-row">
      <div class="form-input-hint">
        <i class="icon icon-check" /> Bookmark saved
      </div>
    </div>
  {/if}
  {#if saveState === "error"}
    <div class="form-group has-error result-row">
      <div class="form-input-hint">{errorMessage}</div>
    </div>
  {/if}
  {#if saveState !== "success"}
    <div class="button-row">
      {#if bookmarkId}
        <div
          class="delete-button"
          on:keypress={handleDelete}
          on:click|preventDefault={handleDelete}
          role="button"
          tabindex="0"
        >
          <i class="icon icon-delete" />
        </div>
      {/if}
      <button
        type="submit"
        class="btn btn-primary"
        class:loading={saveState === "loading"}
      >
        {#if bookmarkId}
          Update
        {:else}
          Save
        {/if}
      </button>
    </div>
  {/if}
</form>

<style>
  form {
    max-width: 400px;
  }

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-actions {
    display: flex;
    align-items: center;
  }

  .title-action {
    color: #fff;
    cursor: pointer;
    margin-left: 0.75rem;
  }

  .form-label-row {
    display: flex;
    justify-content: space-between;
  }

  .button-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .button-row button {
    padding-left: 32px;
    padding-right: 32px;
    margin-left: auto;
  }

  .delete-button {
    color: #ff0000;
    cursor: pointer;
  }

  .result-row {
    display: flex;
    justify-content: center;
  }
</style>
