<script>

  import TagAutocomplete from './TagAutocomplete.svelte'
  import { getCurrentTabInfo, openOptions } from "./browser";
  import { getTags, saveBookmark, lookForCurrentBookmark } from "./linkding";

  let url = "";
  let title = "";
  let titlePlaceholder = "";
  let description = "";
  let tags = "";
  let saveState = "";
  let errorMessage = "";
  let availableTagNames = []
  let formTitle = "";

  async function init() {
    const tabInfo = await getCurrentTabInfo();
    url = tabInfo.url;
    titlePlaceholder = tabInfo.title;
    const availableTags = await getTags().catch(() => [])
    availableTagNames = availableTags.map(tag => tag.name)

   initCurrentBookmarkData();
  }

  async function initCurrentBookmarkData() {
    formTitle = 'Searching for existing Bookmarks';

     var bookmarkSearch = await lookForCurrentBookmark(url)
        .catch(() => []);

    if ( bookmarkSearch && bookmarkSearch.length > 0 ) {
        var temp = bookmarkSearch[0];
        formTitle = 'Edit Bookmark';
        title = temp.title;
        tags = (temp.tag_names ? temp.tag_names.join(' ') : "");
        description = temp.description;
      } else {
        formTitle = 'Add Bookmark';
        title = "";
        tags = "";
        description = "";
      }    
  }

  init();

  async function handleSubmit() {
    const tagNames = tags.split(" ").map(tag => tag.trim()).filter(tag => !!tag);
    const bookmark = {
      url,
      title,
      description,
      tag_names: tagNames
    };

    try {
      saveState = "loading";
      await saveBookmark(bookmark);
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
  <h6 id="bookmark-title">{formTitle} </h6>
  <a href="#" on:click|preventDefault={handleOptions}>Options</a>
</div>
<div class="divider"></div>
<form class="form" on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
    <label class="form-label label-sm" for="input-url">URL</label>
    <input class="form-input input-sm" type="text" id="input-url" placeholder="URL"
           bind:value={url}>
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
</style>
