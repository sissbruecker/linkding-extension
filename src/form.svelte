<script>
  import TagAutocomplete from './TagAutocomplete.svelte'
  import {getBrowserMetadata, getCurrentTabInfo, openOptions, showBadge} from "./browser";
  import {loadServerMetadata, clearCachedServerMetadata} from "./cache";
  import {getProfile, updateProfile} from "./profile";
  import {getConfiguration} from "./configuration";
  import {onDestroy} from 'svelte';

  export let api;
  export let configuration;

  let url = "";
  let title = "";
  let titlePlaceholder = "";
  let descriptionPlaceholder = "";
  let description = "";
  let notes = "";
  let tags = "";
  let autoTags = "";
  let unread = false;
  let shared = false;
  let saveState = "";
  let errorMessage = "";
  let availableTagNames = []
  let bookmarkExists = false;
  let editNotes = false;
  let profile = null;
  let tabInfo = null;
  let extensionConfiguration = null;
  let loading = false;
  let timeoutId;

  $: {
    if (api && configuration) {
      init();
    }
  }

  async function init() {
    // First get cached user profile to quickly show something, then update it
    // in the background
    profile = await getProfile();
    updateProfile().then(updatedProfile => {
      profile = updatedProfile;
    });

    // Load available tags in the background
    tags = configuration.default_tags;
    api.getTags().catch(() => []).then(tags => {
      availableTagNames = tags.map(tag => tag.name)
    });

    // Initialize bookmark form
    await initForm();
    extensionConfiguration = await getConfiguration();
  }

  async function initForm() {
    tabInfo = await getCurrentTabInfo();
    url = tabInfo.url;

    loading = true;
    const [serverMetadata, browserMetadata] = await Promise.all([
      loadServerMetadata(url),
      getBrowserMetadata(url),
    ]);
    loading = false;

    if (configuration.useBrowserMetadata) {
      title = browserMetadata.title;
      description = browserMetadata.description;
    } else {
      title = serverMetadata.metadata.title;
      description = serverMetadata.metadata.description;
    }

    shared = configuration.shareSelected;
    unread = configuration.unreadSelected;

    // If the bookmark already exists, prefill the form with the existing bookmark
    if (!serverMetadata) {
      return;
    }

    const existingBookmark = serverMetadata.bookmark;
    if (existingBookmark) {
      bookmarkExists = true;
      title = existingBookmark.title;
      tags = existingBookmark.tag_names ? existingBookmark.tag_names.join(" ") : "";
      description = existingBookmark.description;
      notes = existingBookmark.notes;
      unread = existingBookmark.unread;
      shared = existingBookmark.shared;
      autoTags = "";
    } else {
      // Only show auto tags for new bookmarks
      // Auto tags are only supported since v1.31.0, so we need to check if they are available
      const autoTagsList = serverMetadata.auto_tags;
      if (autoTagsList) {
        autoTags = autoTagsList.join(" ");
      }
    }
  }

  async function handleSubmit() {
    const tagNames = tags.split(" ").map(tag => tag.trim()).filter(tag => !!tag);
    const bookmark = {
      url,
      title: title || "",
      description: description || "",
      notes,
      tag_names: tagNames,
      unread,
      shared,
    };

    try {
      saveState = "loading";
      await api.saveBookmark(bookmark);
      await clearCachedServerMetadata();

      const tabInfo = await getCurrentTabInfo();
      showBadge(tabInfo.id)

      // Show success state, then reset it after a short delay
      saveState = "success";
      timeoutId = setTimeout(() => {
        saveState = "";
        bookmarkExists = true;
      }, 1500);

      // Show star badge on the tab to indicate that it's now bookmarked
      // but only if precaching is enabled, since the badge will never
      // show when browsing without precaching
      if (extensionConfiguration?.precacheEnabled) {
        showBadge(tabInfo.id);
      }
    } catch (e) {
      saveState = "error";
      errorMessage = e.toString();
      console.error(errorMessage);
    }
  }

  onDestroy(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });

  function handleOptions() {
    openOptions();
  }

  function toggleNotes() {
    editNotes = !editNotes;
  }

</script>
<div class="title-row">
  <h6>{bookmarkExists ? "Edit Bookmark" : "Add bookmark"}</h6>
  <a href="#" on:click|preventDefault={handleOptions}>Options</a>
</div>
<form class="form" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label class="form-label" for="input-url">URL</label>
    <div class="has-icon-right">
      <input class="form-input" type="text" id="input-url" placeholder="URL"
             bind:value={url}>
      {#if loading}
        <i class="form-icon loading"></i>
      {/if}
    </div>
    {#if bookmarkExists}
      <div class="form-input-hint text-warning">
        This URL is already bookmarked. The form has been prefilled from the existing bookmark, and saving the form will
        update the existing bookmark.
      </div>
    {/if}
  </div>
  <div class="form-group">
    <label class="form-label" for="input-tags">Tags</label>
    <TagAutocomplete id="input-tags" name="tags" bind:value={tags} tags={availableTagNames}/>
    {#if autoTags}
      <div class="form-input-hint text-success">
        Auto tags: {autoTags}
      </div>
    {/if}
  </div>
  <div class="form-group">
    <label class="form-label" for="input-title">Title</label>
    <input class="form-input" type="text" id="input-title"
           bind:value={title} placeholder={titlePlaceholder}>
  </div>
  <div class="form-group">
    {#if !editNotes}
      <div class="form-label-row">
        <label class="form-label" for="input-description">Description</label>
        <button type="button" class="btn btn-link" on:click|preventDefault={toggleNotes}>Edit notes</button>
      </div>
      <textarea class="form-input" id="input-description"
                bind:value={description}
                placeholder={descriptionPlaceholder}></textarea>
    {/if}
    {#if editNotes}
      <div class="form-label-row">
        <label class="form-label" for="input-notes">Notes</label>
        <button type="button" class="btn btn-link" on:click|preventDefault={toggleNotes}>Edit description
        </button>
      </div>
      <textarea class="form-input" id="input-notes" rows="5"
                bind:value={notes}></textarea>
    {/if}
  </div>
  <div class="form-group d-flex">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={unread}>
      <i class="form-icon"></i>
      <span>Mark as unread</span>
    </label>
    {#if profile?.enable_sharing }
      <label class="form-checkbox ml-4">
        <input type="checkbox" bind:checked={shared}>
        <i class="form-icon"></i>
        <span>Share</span>
      </label>
    {/if}
  </div>
  <div class="footer">
    {#if saveState === 'success'}
      <div class="result-row text-success">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M5 12l5 5l10 -10"/>
        </svg>
        <span>Bookmark saved</span>
      </div>
    {/if}
    {#if saveState === 'error'}
      <div class="result-row text-error">
        Error saving bookmark: {errorMessage}
      </div>
    {/if}
    {#if saveState !== 'success'}
      <div class="button-row">
        <button type="submit" class="btn btn-primary btn-wide" class:loading={saveState === 'loading'}>Save</button>
      </div>
    {/if}
  </div>
</form>

<style>
    form {
        width: 100%;
        max-width: 400px;
    }

    .form-group {
        margin-bottom: var(--unit-3) !important;
    }

    .form-group .form-label {
        margin-bottom: var(--unit-1) !important;
    }

    .title-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding-bottom: var(--unit-2);
        border-bottom: solid 1px var(--secondary-border-color);
    }

    .form-label-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    .footer {
        padding-top: var(--unit-4);
        border-top: solid 1px var(--secondary-border-color);
    }

    .button-row {
        display: flex;
        justify-content: flex-end;
    }

    .result-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--unit-2);
    }
</style>
