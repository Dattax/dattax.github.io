/* Renders the What's selling section from trending.json. Edit that file to refresh the list. */
(function () {
  var chipsEl = document.getElementById("trending-chips");
  var listEl = document.getElementById("trending-list");
  var metaEl = document.getElementById("trending-meta");
  if (!chipsEl || !listEl || !metaEl) return;

  var preferred = ["Fitness", "Team sports", "Outdoor", "Racquet", "Golf"];
  var active = "All";
  var data = null;

  function text(el, value) {
    el.textContent = value == null ? "" : String(value);
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function safeUrl(url) {
    if (typeof url !== "string") return "";
    if (url.indexOf("https://") === 0 || url.indexOf("http://") === 0) return url;
    return "";
  }

  function categories(items) {
    var seen = {};
    items.forEach(function (item) {
      if (item.category) seen[item.category] = true;
    });
    var ordered = preferred.filter(function (name) { return seen[name]; });
    Object.keys(seen).forEach(function (name) {
      if (ordered.indexOf(name) === -1) ordered.push(name);
    });
    return ordered;
  }

  function visibleItems() {
    return data.items.filter(function (item) {
      return active === "All" || item.category === active;
    });
  }

  function renderChips() {
    chipsEl.innerHTML = "";
    ["All"].concat(categories(data.items)).forEach(function (name) {
      var button = el("button", "kb-trend-chip");
      button.type = "button";
      button.setAttribute("aria-pressed", name === active ? "true" : "false");
      text(button, name);
      button.addEventListener("click", function () {
        active = name;
        renderChips();
        renderCards();
      });
      chipsEl.appendChild(button);
    });
  }

  function renderCards() {
    var items = visibleItems();
    listEl.innerHTML = "";
    if (!items.length) {
      var empty = el("p", "kb-trend-empty");
      text(empty, "No items in this category in the current snapshot.");
      listEl.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var card = el("article", "kb-trend-card");

      var top = el("div", "kb-trend-top");
      var rankWrap = el("div", "kb-trend-rankwrap");
      var rank = el("p", "kb-trend-rank");
      text(rank, "#" + item.rank);
      var listName = el("p", "kb-trend-list");
      text(listName, item.listName);
      rankWrap.appendChild(rank);
      rankWrap.appendChild(listName);

      var cat = el("span", "kb-trend-cat");
      text(cat, item.category);
      top.appendChild(rankWrap);
      top.appendChild(cat);

      var name = el("h3", "kb-trend-name");
      text(name, item.name);

      var price = el("p", "kb-trend-price");
      var priceLabel = el("span");
      text(priceLabel, "Bestseller list price");
      price.appendChild(priceLabel);
      price.appendChild(document.createTextNode(item.price));

      var market = el("p", "kb-trend-market");
      text(market, item.marketplace);

      card.appendChild(top);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(market);
      if (item.trend) {
        var trend = el("p", "kb-trend-trend");
        text(trend, item.trend);
        card.appendChild(trend);
      }

      var why = el("p", "kb-trend-why");
      text(why, item.whyHot);
      card.appendChild(why);

      var href = safeUrl(item.listingUrl);
      if (href) {
        var link = el("a", "kb-trend-link");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        text(link, "View listing");
        card.appendChild(link);
      }

      listEl.appendChild(card);
    });
  }

  function renderMeta() {
    metaEl.innerHTML = "";
    var asOf = el("p", "kb-trend-asof");
    text(asOf, "As of " + data.asOf + ".");
    metaEl.appendChild(asOf);

    (data.notes || []).forEach(function (note) {
      var p = el("p");
      text(p, note);
      metaEl.appendChild(p);
    });

    if (data.sources && data.sources.length) {
      var heading = el("p", "kb-trend-sources-label");
      text(heading, "Sources");
      metaEl.appendChild(heading);
      var list = el("ul");
      data.sources.forEach(function (source) {
        var li = el("li");
        var href = safeUrl(source.url);
        if (href) {
          var a = document.createElement("a");
          a.href = href;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          text(a, source.name);
          li.appendChild(a);
        } else {
          text(li, source.name);
        }
        if (source.checked) {
          li.appendChild(document.createTextNode(" — checked " + source.checked));
        }
        list.appendChild(li);
      });
      metaEl.appendChild(list);
    }
  }

  fetch("trending.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Could not load trending.json");
      return response.json();
    })
    .then(function (payload) {
      data = payload;
      if (!data.items || !data.items.length) throw new Error("Empty list");
      renderChips();
      renderCards();
      renderMeta();
    })
    .catch(function () {
      var fail = el("p", "kb-trend-empty");
      text(fail, "The trend list could not be loaded.");
      listEl.appendChild(fail);
    });
})();
