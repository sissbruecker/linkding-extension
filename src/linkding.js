export class LinkdingApi {
  constructor(configuration) {
    this.configuration = configuration;
  }

  async getBookmark(bookmarkId) {
    const configuration = this.configuration;

    return fetch(
      `${configuration.baseUrl}/api/bookmarks/${bookmarkId}/`,
      {
        headers: {
          Authorization: `Token ${configuration.token}`,
        },
      }
    ).then((response) => {
      if (response.status === 200) {
        return response.json();
      }
      return Promise.reject(
        `Error retrieving bookmark: ${response.statusText}`
      );
    });
  }

  async saveBookmark(bookmark) {
    const configuration = this.configuration;

    return fetch(`${configuration.baseUrl}/api/bookmarks/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${configuration.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookmark),
    }).then((response) => {
      if (response.status === 201) {
        return response.json();
      } else if (response.status === 400) {
        return response
          .json()
          .then((body) =>
            Promise.reject(`Validation error: ${JSON.stringify(body)}`)
          );
      } else {
        return Promise.reject(`Request error: ${response.statusText}`);
      }
    });
  }

  async getTags() {
    const configuration = this.configuration;

    return fetch(`${configuration.baseUrl}/api/tags/?limit=1000`, {
      headers: {
        Authorization: `Token ${configuration.token}`,
      },
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((body) => body.results);
      }
      return Promise.reject(`Error loading tags: ${response.statusText}`);
    });
  }

  async search(text, options) {
    const configuration = this.configuration;
    const q = encodeURIComponent(text);
    const limit = options.limit || 100;

    return fetch(
      `${configuration.baseUrl}/api/bookmarks/?q=${q}&limit=${limit}`,
      {
        headers: {
          Authorization: `Token ${configuration.token}`,
        },
      }
    ).then((response) => {
      if (response.status === 200) {
        return response.json().then((body) => body.results);
      }
      return Promise.reject(
        `Error searching bookmarks: ${response.statusText}`
      );
    });
  }

  async check(url) {
    const configuration = this.configuration;
    url = encodeURIComponent(url);

    return fetch(
      `${configuration.baseUrl}/api/bookmarks/check/?url=${url}`,
      {
        headers: {
          Authorization: `Token ${configuration.token}`,
        },
      }
    ).then((response) => {
      if (response.status === 200) {
        return response.json();
      }
      return Promise.reject(
        `Error checking bookmark URL: ${response.statusText}`
      );
    });
  }

  async testConnection() {
    const configuration = this.configuration;
    return fetch(`${configuration.baseUrl}/api/bookmarks/?limit=1`, {
      headers: {
        Authorization: `Token ${configuration.token}`,
      },
    })
      .then((response) =>
        response.status === 200 ? response.json() : Promise.reject(response)
      )
      .then((body) => !!body.results)
      .catch(() => false);
  }

  async findBookmarkByUrl(url) {
    return this.search(url, { limit: 1 }).then((results) =>
      results && results.length > 0 ? results[0] : undefined
    );
  }
}
