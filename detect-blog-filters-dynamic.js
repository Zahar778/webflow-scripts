/* Detect blog filters — unified dynamic CMS category filter
 *
 * Current Webflow structure (Sep 2026):
 * - ONE .categories CMS list contains every category (former primary + secondary)
 * - each .blog-item has a visible primary category plus .filter-hiden containing
 *   every category connected to that article
 * - search filters by .blog-item-title
 * - native Webflow CMS pagination is fetched in the background so filtering
 *   works across every article, not only the first CMS page
 *
 * Behaviour:
 * - /blog and /category/view-all: category buttons filter in place
 * - /categories/<slug>: category buttons navigate between category pages;
 *   search still filters the articles on the current page
 * - View More reveals 12 matching articles at a time on all-articles pages
 */
(() => {
  "use strict";

  const CONFIG = {
    categoryList: ".categories",
    list: ".blog-list",
    item: ".blog-list > .blog-item",
    title: ".blog-item-title",
    visibleCategory: ".blog-item-content-tag-text",
    hiddenMeta: ".filter-hiden",
    search: "#Search",
    pagination: ".blog-pagination",
    pageSize: 12,
    allLabel: "View all",
    activeClass: "active",
    noResultsText: "No articles found.",
    categoryBasePath: "/categories/",
    viewAllPath: "/category/view-all",
    externalViewAll: "[data-blog-view-all='true'], [data-blog-view-all], .blog-view-all"
  };

  const cleanText = (value) => (value || "")
    .replace(/\s+/g, " ")
    .trim();

  const normalize = (value) => cleanText(value)
    .toLowerCase()
    .replace(/&amp;/g, "&");

  const cleanPath = (value) => {
    const path = (value || "/").split("?")[0].replace(/\/+$/, "");
    return path || "/";
  };

  const slugify = (value) => normalize(value)
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const labelOf = (button) => {
    if (!button) return "";

    const attr = cleanText(button.getAttribute("data-attributes"));
    if (attr && normalize(attr) !== "true") return attr;

    return cleanText(button.textContent);
  };

  const makeInteractive = (button) => {
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
  };

  const setActive = (buttons, activeLabel) => {
    const active = normalize(activeLabel);

    buttons.forEach((button) => {
      const selected = normalize(labelOf(button)) === active;
      makeInteractive(button);
      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const init = async () => {
    const categoryList = document.querySelector(CONFIG.categoryList);
    const list = document.querySelector(CONFIG.list);

    if (!categoryList || !list) return;

    const controlsRoot =
      categoryList.closest(".blog-page-container") ||
      categoryList.parentElement ||
      document;

    const currentPath = cleanPath(window.location.pathname);
    const isBlogPage = currentPath === "/blog";
    const isViewAllPage = currentPath === cleanPath(CONFIG.viewAllPath);
    const filtersInPlace = isBlogPage || isViewAllPage;
    const useViewMore = filtersInPlace;

    const dynamicButtons = [
      ...categoryList.querySelectorAll(".tab-btn")
    ];

    const viewAllButton = [
      ...controlsRoot.querySelectorAll(".tab-btn")
    ].find((button) =>
      !button.closest(CONFIG.categoryList) &&
      normalize(labelOf(button)) === normalize(CONFIG.allLabel)
    ) || null;

    const categoryButtons = [
      ...(viewAllButton ? [viewAllButton] : []),
      ...dynamicButtons
    ];

    let activeCategory = CONFIG.allLabel;
    let query = "";
    let visibleLimit = useViewMore ? CONFIG.pageSize : Infinity;

    const currentItems = () => [
      ...list.querySelectorAll(":scope > .blog-item")
    ];

    const slugFromItem = (item) => {
      const href = item.querySelector("a[href*='/blog/']")?.getAttribute("href") || "";
      return cleanPath(href).split("/").pop() || "";
    };

    // IMPORTANT: every value stored here is NORMALIZED.
    // The previous version stored display labels but compared them to a
    // normalized active label, so Set.has() failed for virtually every filter.
    const readItemCategories = (item) => {
      const values = new Set();

      const add = (value) => {
        const normalized = normalize(value);
        if (normalized && normalized !== "true") values.add(normalized);
      };

      add(item.querySelector(CONFIG.visibleCategory)?.textContent);

      const directAttr = cleanText(item.getAttribute("data-blog-category"));
      if (directAttr && normalize(directAttr) !== "true") {
        directAttr.split(",").forEach(add);
      }

      item.querySelectorAll("[data-blog-secondary-category]").forEach((node) => {
        const attr = cleanText(node.getAttribute("data-blog-secondary-category"));
        add(attr && normalize(attr) !== "true" ? attr : node.textContent);
      });

      const hidden = item.querySelector(CONFIG.hiddenMeta);
      if (hidden) {
        hidden.querySelectorAll("p, span, a").forEach((node) => add(node.textContent));
      }

      return values;
    };

    const assignItemMeta = (item) => {
      item._detectBlogCategories = readItemCategories(item);
      item.dataset.blogTitle = normalize(item.querySelector(CONFIG.title)?.textContent);
    };

    currentItems().forEach(assignItemMeta);

    // Keep Finsweet/Webflow listeners from competing with this filter.
    const originalInput =
      controlsRoot.querySelector(CONFIG.search) ||
      document.querySelector(CONFIG.search);

    let searchInput = null;

    if (originalInput) {
      searchInput = originalInput.cloneNode(true);
      originalInput.replaceWith(searchInput);
      searchInput.removeAttribute("fs-cmsfilter-field");
    }

    const pagination =
      controlsRoot.querySelector(CONFIG.pagination) ||
      document.querySelector(CONFIG.pagination);

    const nativeNext = pagination?.querySelector(".w-pagination-next");
    const nativePrevious = pagination?.querySelector(".w-pagination-previous");
    const initialNext = nativeNext?.getAttribute("href") || "";

    nativeNext?.setAttribute("hidden", "hidden");
    nativePrevious?.setAttribute("hidden", "hidden");

    let noResults = list.parentElement?.querySelector(":scope > .detect-blog-empty") || null;

    if (!noResults) {
      noResults = document.createElement("p");
      noResults.className = "detect-blog-empty";
      noResults.textContent = CONFIG.noResultsText;
      noResults.hidden = true;
      list.insertAdjacentElement("afterend", noResults);
    }

    let viewMore = null;

    if (useViewMore && pagination) {
      viewMore = pagination.querySelector(".detect-view-more");

      if (!viewMore) {
        viewMore = document.createElement("button");
        viewMore.type = "button";
        viewMore.className = "btn-nregular blue-type pagination-btn detect-view-more";
        viewMore.textContent = "View More";
        pagination.appendChild(viewMore);
      }
    }

    const apply = () => {
      const active = normalize(activeCategory);
      const showAll = active === normalize(CONFIG.allLabel);

      let matchIndex = 0;
      let matchTotal = 0;

      currentItems().forEach((item) => {
        const categoryMatch =
          !filtersInPlace ||
          showAll ||
          item._detectBlogCategories?.has(active);

        const searchMatch =
          !query ||
          (item.dataset.blogTitle || "").includes(query);

        const matches = categoryMatch && searchMatch;

        if (matches) {
          matchTotal += 1;
          matchIndex += 1;
        }

        const overLimit = useViewMore && matchIndex > visibleLimit;
        const hidden = !matches || overLimit;

        item.hidden = hidden;
        item.style.display = hidden ? "none" : "";
        item.setAttribute("aria-hidden", hidden ? "true" : "false");
      });

      if (viewMore) {
        viewMore.hidden = matchTotal <= visibleLimit;
      }

      if (noResults) {
        noResults.hidden = matchTotal !== 0;
      }
    };

    // On /blog and /category/view-all all categories are one local filter.
    if (filtersInPlace) {
      setActive(categoryButtons, activeCategory);

      categoryButtons.forEach((button) => {
        const select = (event) => {
          event?.preventDefault?.();
          activeCategory = labelOf(button) || CONFIG.allLabel;
          visibleLimit = CONFIG.pageSize;
          setActive(categoryButtons, activeCategory);
          apply();
        };

        button.addEventListener("click", select);
        button.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            select(event);
          }
        });
      });
    } else {
      // On category template pages the list is already CMS-filtered to that
      // category, so the merged category control acts as navigation.
      const currentSlug = currentPath.startsWith(CONFIG.categoryBasePath)
        ? currentPath.slice(CONFIG.categoryBasePath.length).split("/")[0]
        : "";

      const activeButton = dynamicButtons.find((button) => slugify(labelOf(button)) === currentSlug);
      setActive(categoryButtons, activeButton ? labelOf(activeButton) : "");

      categoryButtons.forEach((button) => {
        const navigate = (event) => {
          event?.preventDefault?.();
          const label = labelOf(button);
          const href = normalize(label) === normalize(CONFIG.allLabel)
            ? CONFIG.viewAllPath
            : `${CONFIG.categoryBasePath}${slugify(label)}`;
          window.location.href = href;
        };

        button.addEventListener("click", navigate);
        button.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate(event);
          }
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = normalize(searchInput.value);
        if (useViewMore) visibleLimit = CONFIG.pageSize;
        apply();
      });

      searchInput.closest("form")?.addEventListener("submit", (event) => {
        event.preventDefault();
      });
    }

    viewMore?.addEventListener("click", () => {
      visibleLimit += CONFIG.pageSize;
      apply();
    });

    if (filtersInPlace) {
      const externalViewAllControls = [
        ...document.querySelectorAll(CONFIG.externalViewAll)
      ];

      const syncExternalViewAll = () => {
        const href = normalize(activeCategory) === normalize(CONFIG.allLabel)
          ? CONFIG.viewAllPath
          : `${CONFIG.categoryBasePath}${slugify(activeCategory)}`;

        externalViewAllControls.forEach((control) => {
          if (control.tagName === "A") control.setAttribute("href", href);
        });
      };

      syncExternalViewAll();
      categoryButtons.forEach((button) => button.addEventListener("click", syncExternalViewAll));
    }

    apply();

    // Load all remaining Webflow CMS pages so a category can match an article
    // that did not happen to be in the first 12 rendered items.
    const seenPages = new Set();
    const seenSlugs = new Set(currentItems().map(slugFromItem).filter(Boolean));

    let nextUrl = initialNext
      ? new URL(initialNext, window.location.href).href
      : "";

    try {
      while (nextUrl && !seenPages.has(nextUrl)) {
        seenPages.add(nextUrl);

        const response = await fetch(nextUrl, { credentials: "same-origin" });
        if (!response.ok) throw new Error(`CMS page failed: ${response.status}`);

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        [...doc.querySelectorAll(CONFIG.item)].forEach((sourceItem) => {
          const slug = slugFromItem(sourceItem);

          if (slug && seenSlugs.has(slug)) return;
          if (slug) seenSlugs.add(slug);

          const item = document.importNode(sourceItem, true);
          assignItemMeta(item);
          list.appendChild(item);
        });

        const rawNext = doc.querySelector(`${CONFIG.pagination} .w-pagination-next`)?.getAttribute("href") || "";
        nextUrl = rawNext ? new URL(rawNext, window.location.href).href : "";
      }
    } catch (error) {
      console.error("Detect dynamic blog filters:", error);
    } finally {
      apply();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
