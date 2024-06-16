<script>
  import TagAutocomplete from './TagAutocomplete.svelte'
  import {getCurrentTabInfo, openOptions, showBadge} from "./browser";
  import {loadTabMetadata, clearCachedTabMetadata} from "./cache";
  import {getProfile, updateProfile} from "./profile";
  import {getConfiguration} from "./configuration";

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

    const tabMetadata = await loadTabMetadata(url);
    if (!tabMetadata) {
      return;
    }

    titlePlaceholder = tabMetadata.metadata.title;
    descriptionPlaceholder = tabMetadata.metadata.description;
    shared = configuration.shareSelected;
    unread = configuration.unreadSelected;

    const existingBookmark = tabMetadata.bookmark;
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
      const autoTagsList = tabMetadata.auto_tags;
      if (autoTagsList) {
        autoTags = autoTagsList.join(" ");
      }
    }
  }

  async function handleSubmit() {
    const tagNames = tags.split(" ").map(tag => tag.trim()).filter(tag => !!tag);
    const bookmark = {
      url,
      title,
      description,
      notes,
      tag_names: tagNames,
      unread,
      shared,
    };

    try {
      saveState = "loading";
      await api.saveBookmark(bookmark);
      await clearCachedTabMetadata();
      saveState = "success";
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
<div class="divider"></div>
<form class="form" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label class="form-label label-sm" for="input-url">URL</label>
    <input class="form-input input-sm" type="text" id="input-url" placeholder="URL"
           bind:value={url}>
    {#if bookmarkExists}
      <div class="form-input-hint bookmark-exists">
        This URL is already bookmarked. The form has been prefilled from the existing bookmark, and saving the form will
        update the existing bookmark.
      </div>
    {/if}
  </div>
  <div class="form-group">
    <label class="form-label label-sm" for="input-tags">Tags</label>
    <TagAutocomplete id="input-tags" name="tags" bind:value={tags} tags={availableTagNames}/>
    {#if autoTags}
      <div class="form-input-hint text-success">
        Auto tags: {autoTags}
      </div>
    {/if}
  </div>
  <div class="form-group">
    <label class="form-label label-sm" for="input-title">Title</label>
    <input class="form-input input-sm" type="text" id="input-title"
           bind:value={title} placeholder={titlePlaceholder}>
  </div>
  <div class="form-group">
    {#if !editNotes}
      <div class="form-label-row">
        <label class="form-label label-sm" for="input-description">Description</label>
        <button type="button" class="btn btn-link btn-sm" on:click|preventDefault={toggleNotes}>Edit notes</button>
      </div>
      <textarea class="form-input input-sm" id="input-description"
                bind:value={description}
                placeholder={descriptionPlaceholder}></textarea>
    {/if}
    {#if editNotes}
      <div class="form-label-row">
        <label class="form-label label-sm" for="input-notes">Notes</label>
        <button type="button" class="btn btn-link btn-sm" on:click|preventDefault={toggleNotes}>Edit description
        </button>
      </div>
      <textarea class="form-input input-sm" id="input-notes" rows="5"
                bind:value={notes}></textarea>
    {/if}
  </div>
  <div class="form-group d-flex">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={unread}>
      <i class="form-icon"></i>
      <span class="text-small">Mark as unread</span>
    </label>
    {#if profile?.enable_sharing }
      <label class="form-checkbox ml-2">
        <input type="checkbox" bind:checked={shared}>
        <i class="form-icon"></i>
        <span class="text-small">Share</span>
      </label>
    {/if}
  </div>
  <div class="divider"></div>
  {#if saveState === 'success'}
    <div class="form-group has-success result-row">
      <div class="form-input-hint"><i class="icon icon-check"></i> Bookmark saved</div>
    </div>
  {/if}
  {#if saveState === 'error'}
    <div class="form-group has-error result-row">
      <div class="form-input-hint">Error saving bookmark: {errorMessage}</div>
    </div>
  {/if}
  {#if saveState !== 'success'}
    <div class="button-row">
      <button type="submit" class="btn btn-primary" class:loading={saveState === 'loading'}>Save</button>
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
        align-items: baseline;
    }

    .form-label-row {
        display: flex;
        justify-content: space-between;
    }

    .button-row {
        display: flex;
        justify-content: flex-end;
    }

    .button-row button {
        padding-left: 32px;
        padding-right: 32px;
    }

    .result-row {
        display: flex;
        justify-content: center;
    }

    .bookmark-exists {
        color: #ffb700;
    }
</style>
