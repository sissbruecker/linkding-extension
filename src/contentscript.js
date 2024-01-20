import { getBrowser } from "./browser";
import { LinkdingApi } from "./linkding";

const browser = getBrowser()
const HN = 'https://news.ycombinator.com'
let api = null
let description = ""
let unread = false
let shared = false


const saveBookmark = async (url, title, tag_names, notes) => {
  let bookmark = {
    url,
    title,
    description,
    notes,
    tag_names,
    unread,
    shared,
  }

  try {
    await api.saveBookmark(bookmark);
  } catch (e) {
    saveState = "error";
    errorMessage = e.toString();
    console.error(errorMessage);
  }
}

const voteHN = async (e) => {
  let vote = e.target.closest(".votelinks")
  if (!vote) {
    return
  }
  let link = vote.nextSibling.querySelector("a")
  let url = link.getAttribute("href")
  let meta = vote.parentElement.nextSibling
  if (url.startsWith("item")) {
    url = `${HN}/${url}`
  }
  let internal_a = meta.querySelector(".clicky.hider").nextElementSibling
  let internal_url = `${HN}/${internal_a.getAttribute("href")}`
  let notes = `[Comments on Hacker News](${internal_url})`
  let title = link.innerHTML
  let tag = ["hackernews"]
  await saveBookmark(url, title, tag, notes)
}

const handleUrl = (response) => {
  var activeTabUrl = response.url;
  if (activeTabUrl.startsWith(HN)) {
    let vote_els = document.querySelectorAll('td a[href^="vote"]')
    for (let el of vote_els) {
      el.addEventListener("click", voteHN)
    }
  }
}

const domReady = async () => {
  browser.runtime.sendMessage({method: "getConfiguration"}).then(async (response) => {
    api = new LinkdingApi(response.data)
    browser.runtime.sendMessage({method: "currentTabUrl"}).then(handleUrl)
  });
}

document.addEventListener("DOMContentLoaded", domReady);
