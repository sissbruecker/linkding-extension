debugger;

let port = browser.runtime.connect({ name: "port-from-cs" });

// When background script answers with results, inject them into the website
port.onMessage.addListener(function (m) {
  console.log(m);
  if (m.results.length > 0) {
    console.log("I'm in");
    console.log(m.results);

    let html = `
    <div id="bookmark-list-container">
      <div id="navbar">
        <a id="logo">  
          <img class="logo" src=${browser.runtime.getURL(
            "icons/button_32x32.png"
          )} />
          <h1>linkding</h1>
        </a>
        <div id="results_amount">
          Found <span>${m.results.length}</span> results.
        </div>
      </div>
    `;

    html += `<ul class="bookmark-list">`;

    m.results.forEach((bookmark) => {
      html += `
        <li>
          <div class="title truncate">
            <a
              href="${bookmark.url}"
              target="_blank"
              rel="noopener"
              >${bookmark.title}</a
            >
          </div>
          <div class="description truncate">
            <span>
              
                ${bookmark.tags
                  .map((tag) => {
                    return "<a>#" + tag + "</a>";
                  })
                  .join(" ")}
              </a>
            </span>
    
            |
    
            <span>
              ${bookmark.description}
            </span>
          </div>
        </li>`;
    });
    html += `</ul></div>`;

    document
      .querySelector(".sidebar-modules")
      .insertAdjacentHTML("afterbegin", html);
  }
});

// Start the search by sending a message to background.js with the search term
let queryString = location.search;
let urlParams = new URLSearchParams(queryString);
let searchTerm = urlParams.get("q");
port.postMessage({ searchTerm: searchTerm });
