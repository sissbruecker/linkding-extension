<script>
  import TagAutocomplete from './TagAutocomplete.svelte'
  import {getCurrentTabInfo, openOptions} from "./browser";

  export let api;
  export let configuration;

  let url = "";
  let title = "";
  let titlePlaceholder = "";
  let description = "";
  let tags = "";
  let unread = false;
  let shared = false;
  let saveState = "";
  let errorMessage = "";
  let availableTagNames = []
  let bookmarkExists = false;

  $: {
    if (api && configuration) {
      init();
    }
  }

  async function init() {
    const tabInfo = await getCurrentTabInfo();
    url = tabInfo.url;
    titlePlaceholder = tabInfo.title;
    tags = configuration.default_tags;
    const availableTags = await api.getTags().catch(() => [])
    availableTagNames = availableTags.map(tag => tag.name)

    loadExistingBookmarkData();
  }

  async function loadExistingBookmarkData() {
    const existingBookmark = await api.findBookmarkByUrl(url)
      .catch(() => null);

    if (existingBookmark) {
      bookmarkExists = true;
      title = existingBookmark.title;
      tags = existingBookmark.tag_names ? existingBookmark.tag_names.join(" ") : "";
      description = existingBookmark.description;
      unread = existingBookmark.unread;
      shared = existingBookmark.shared;
    }
  }

  async function handleSubmit() {
    const tagNames = tags.split(" ").map(tag => tag.trim()).filter(tag => !!tag);
    const bookmark = {
      url,
      title,
      description,
      tag_names: tagNames,
      unread,
      shared,
    };

    try {
      saveState = "loading";
      await api.saveBookmark(bookmark);
      saveState = "success";
    } catch (e) {
      saveState = "error";
      errorMessage = e.toString();
      console.error(errorMessage);
    }
  }

  function handleOptions() {
    openOptions();
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
  </div>
  <div class="form-group">
    <label class="form-label label-sm" for="input-title">Title</label>
    <input class="form-input input-sm" type="text" id="input-title"
           bind:value={title} placeholder={titlePlaceholder}>
  </div>
  <div class="form-group">
    <label class="form-label label-sm" for="input-description">Description</label>
    <textarea class="form-input input-sm" id="input-description"
              bind:value={description}
              placeholder="Leave empty to use description from website"></textarea>
  </div>
  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={unread}>
      <i class="form-icon"></i>
      <span class="text-small">Mark as unread</span>
    </label>
  </div>
  <div class="form-group">
    <label class="form-checkbox">
      <input type="checkbox" bind:checked={shared}>
      <i class="form-icon"></i>
      <span class="text-small">Share</span>
    </label>
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
