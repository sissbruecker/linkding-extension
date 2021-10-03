import { getConfiguration } from "./configuration";

export async function saveBookmark(bookmark) {
  const configuration = getConfiguration();

  return fetch(`${configuration.baseUrl}/api/bookmarks/`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${configuration.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bookmark)
  }).then(response => {
    if (response.status === 201) {
      return response.json();
    } else if (response.status === 400) {
      return response.json().then(body => Promise.reject(`Validation error: ${JSON.stringify(body)}`));
    } else {
      return Promise.reject(`Request error: ${response.statusText}`);
    }
  });
}

export async function getTags() {
  const configuration = getConfiguration();

  return fetch(`${configuration.baseUrl}/api/tags/?limit=1000`, {
    headers: {
      "Authorization": `Token ${configuration.token}`
    }
  })
    .then(response => {
      if (response.status === 200) {
        return response.json().then(body => body.results);
      }
      return Promise.reject(`Error loading tags: ${response.statusText}`);
    });
}

export async function search(text, options) {
  const configuration = getConfiguration();
  const q = encodeURIComponent(text);
  const limit = options.limit || 100;

  return fetch(`${configuration.baseUrl}/api/bookmarks/?q=${q}&limit=${limit}`, {
    headers: {
      "Authorization": `Token ${configuration.token}`
    }
  })
    .then(response => {
      if (response.status === 200) {
        return response.json().then(body => body.results);
      }
      return Promise.reject(`Error searching bookmarks: ${response.statusText}`);
    });
}


export async function testConnection(configuration) {
  return fetch(`${configuration.baseUrl}/api/bookmarks/?limit=1`, {
    headers: {
      "Authorization": `Token ${configuration.token}`
    }
  })
    .then(response => response.status === 200 ? response.json() : Promise.reject(response))
    .then(body => !!body.results)
    .catch(() => false);
}