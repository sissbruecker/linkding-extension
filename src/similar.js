// Helpers for finding bookmarks with a URL similar to the one being added, e.g.
// https://example.com/docs is similar to https://example.com/docs/page?id=1

function parseUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed
      : null;
  } catch (e) {
    return null;
  }
}

function normalizeHost(host) {
  return host.toLowerCase().replace(/^www\./, "");
}

function pathSegments(url) {
  return url.pathname.split("/").filter((segment) => !!segment);
}

function queryParams(url) {
  return [...url.searchParams].map(([key, value]) => `${key}=${value}`);
}

// Returns the host to search for similar bookmarks, or null for URLs that
// can not be bookmarked, such as about: or file: URLs
export function getSearchHost(url) {
  const parsed = parseUrl(url);
  return parsed ? normalizeHost(parsed.host) : null;
}

// Returns true if both URLs are on the same host, and the path and query of
// the parent URL are contained in the child URL. Path segments must match as a
// whole, so /doc is not a prefix of /docs. Identical URLs are not prefixes of
// each other.
export function isUrlPrefix(parentUrl, childUrl) {
  const parent = parseUrl(parentUrl);
  const child = parseUrl(childUrl);
  if (!parent || !child) {
    return false;
  }
  if (normalizeHost(parent.host) !== normalizeHost(child.host)) {
    return false;
  }

  const parentPath = pathSegments(parent);
  const childPath = pathSegments(child);
  const pathIsPrefix =
    parentPath.length <= childPath.length &&
    parentPath.every((segment, index) => segment === childPath[index]);

  const parentQuery = queryParams(parent);
  const childQuery = queryParams(child);
  const queryIsSubset = parentQuery.every((param) =>
    childQuery.includes(param),
  );

  const isLonger =
    childPath.length > parentPath.length ||
    childQuery.length > parentQuery.length;

  return pathIsPrefix && queryIsSubset && isLonger;
}

// Splits bookmarks on the same host as the URL into those whose URL is a
// prefix of the URL, or vice versa, and all other bookmarks on that host.
// Bookmarks on other hosts, or for the same URL, are left out.
export function findSimilarBookmarks(url, bookmarks) {
  const host = getSearchHost(url);
  const prefixMatches = [];
  const domainMatches = [];

  bookmarks.forEach((bookmark) => {
    if (!host || getSearchHost(bookmark.url) !== host) {
      return;
    }
    if (isUrlPrefix(bookmark.url, url) || isUrlPrefix(url, bookmark.url)) {
      prefixMatches.push(bookmark);
    } else if (!isSameUrl(url, bookmark.url)) {
      domainMatches.push(bookmark);
    }
  });

  return { prefixMatches, domainMatches };
}

function isSameUrl(a, b) {
  const urlA = parseUrl(a);
  const urlB = parseUrl(b);
  return (
    pathSegments(urlA).join("/") === pathSegments(urlB).join("/") &&
    queryParams(urlA).sort().join("&") === queryParams(urlB).sort().join("&")
  );
}
