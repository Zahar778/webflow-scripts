/* Detect blog filters — dynamic Primary + Secondary CMS filters
 *
 * Logic:
 * - /blog:
 *   Primary Categories = in-page filters
 *   Secondary Categories = in-page filters
 *   Search = in-page filter
 *   View More = 12 items at a time
 *
 * - every other page that contains this filter/list (including
 *   /categories/<item-slug> and /category/view-all):
 *   Primary Categories are NOT touched by JS at all. Webflow links handle them.
 *   Secondary Categories filter the articles already present on that page.
 *   Search filters in place.
 *   Secondary buttons with zero matching articles are hidden after all CMS
 *   pagination pages have been loaded. If none are available, the whole
 *   .s-categories_box is hidden.
 */
(() => {
  "use strict";

  const CONFIG = {
    categoryList: ".categories",
    secondaryList: ".secondary-categories",
    secondaryBox: ".s-categories_box",
    list: ".blog-list",
    item: ".blog-list > .blog-item",
    title: ".blog-item-title",
    primaryPill: ".blog-item-content-tag-text",
    hiddenMeta: ".filter-hiden",
    search: "#Search",
    pagination: ".blog-pagination",
    pageSize: 12,
    allLabel: "View all",
    activeClass: "active",
    noResultsText: "No articles found.",
    externalViewAll: "[data-blog-view-all='true'], [data-blog-view-all], .blog-view-all",
    categoryBasePath: "/categories/"
  };

  const normalize = (value) => (value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const cleanText = (value) => (value || "")
    .replace(/\s+/g, " ")
    .trim();

  const cleanPath = (value) => {
    const path = (value || "/").split("?")[0].replace(/\/+$/, "");
    return path || "/";
  };

  const slugify = (value) => normalize(value)
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const labelOf = (button) => cleanText(button?.textContent);

  const makeInteractive = (button) => {
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
  };

  const setActivePrimary = (buttons, activeLabel) => {
    const active = normalize(activeLabel);

    buttons.forEach((button) => {
      const selected = normalize(labelOf(button)) === active;
      makeInteractive(button);
      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const setActiveSecondary = (buttons, activeLabel) => {
    const active = normalize(activeLabel);

    buttons.forEach((button) => {
      const selected = !!active && normalize(labelOf(button)) === active;
      makeInteractive(button);
      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const init = async () => {
    const categoryList = document.querySelector(CONFIG.categoryList);
    const secondaryList = document.querySelector(CONFIG.secondaryList);
    const list = document.querySelector(CONFIG.list);

    // The secondary CMS filter is optional.
    // The Blog page may contain only the primary .categories collection.
    if (!categoryList || !list) return;

    // IMPORTANT:
    // There are multiple .blog-page-container elements on the page.
    // The first one is the featured article. We scope controls to the container
    // that ACTUALLY contains .categories.
    const controlsRoot =
      categoryList.closest(".blog-page-container") ||
      categoryList.parentElement ||
      document;

    const currentPath = cleanPath(window.location.pathname);
    const isBlogPage = currentPath === "/blog";
    const isSecondaryOnlyPage = !isBlogPage;

    const dynamicPrimaryButtons = [
      ...categoryList.querySelectorAll(".tab-btn")
    ];

    // Static View all in the PRIMARY filter only.
    // On non-/blog pages this element is never changed or bound by this script.
    const primaryViewAllButton = [
      ...controlsRoot.querySelectorAll(".tab-btn")
    ].find((button) =>
      !button.closest(CONFIG.categoryList) &&
      !button.closest(CONFIG.secondaryList) &&
      normalize(labelOf(button)) === normalize(CONFIG.allLabel)
    ) || null;

    const primaryButtons = [
      ...(primaryViewAllButton ? [primaryViewAllButton] : []),
      ...dynamicPrimaryButtons
    ];

    const secondaryButtons = secondaryList
      ? [...secondaryList.querySelectorAll(".tab-btn")]
      : [];

    const primaryLabels = dynamicPrimaryButtons
      .map(labelOf)
      .filter(Boolean);

    const secondaryLabels = secondaryButtons
      .map(labelOf)
      .filter(Boolean);

    const primaryByNormalized = new Map(
      primaryLabels.map((label) => [normalize(label), label])
    );

    const secondaryByNormalized = new Map(
      secondaryLabels.map((label) => [normalize(label), label])
    );

    let activeCategory = CONFIG.allLabel;
    let activeSecondary = "";
    let query = "";
    let visibleLimit = isBlogPage ? CONFIG.pageSize : Infinity;

    // On category/view-all pages do not show secondary controls until we know
    // which ones actually exist in ALL CMS pagination pages.
    const secondaryBox =
      controlsRoot.querySelector(CONFIG.secondaryBox) ||
      document.querySelector(CONFIG.secondaryBox);

    if (isSecondaryOnlyPage && secondaryBox) {
      secondaryBox.style.visibility = "hidden";
    }

    const currentItems = () => [
      ...list.querySelectorAll(":scope > .blog-item")
    ];

    const slugFromItem = (item) => {
      const href =
        item.querySelector("a[href*='/blog/']")?.getAttribute("href") || "";

      return cleanPath(href).split("/").pop() || "";
    };

    const readItemCategories = (item) => {
      const values = new Set();

      const addCategory = (value) => {
        const raw = cleanText(value);
        const normalized = normalize(raw);

        if (!raw || !primaryByNormalized.has(normalized)) {
          return;
        }

        values.add(primaryByNormalized.get(normalized));
      };

      // Visible category pill.
      addCategory(
        item.querySelector(CONFIG.primaryPill)?.textContent
      );

      // Optional explicit category attribute.
      const attr = cleanText(item.getAttribute("data-blog-category"));

      if (attr && normalize(attr) !== "true") {
        attr.split(",").forEach(addCategory);
      }

      // Current Webflow structure:
      // .blog-item > .filter-hiden > nested CMS list(s)
      // This contains every category connected to the article, including
      // secondary categories such as Construction & Commissioning.
      const hidden = item.querySelector(CONFIG.hiddenMeta);

      if (hidden) {
        hidden.querySelectorAll("p, span, a").forEach((node) => {
          addCategory(node.textContent);
        });
      }

      return values;
    };

    const readSecondaryCategories = (item) => {
      const values = new Set();

      // Explicit custom attribute support.
      item.querySelectorAll("[data-blog-secondary-category]").forEach((node) => {
        const attr = cleanText(
          node.getAttribute("data-blog-secondary-category")
        );

        const raw =
          attr && normalize(attr) !== "true"
            ? attr
            : cleanText(node.textContent);

        const match = secondaryByNormalized.get(normalize(raw));

        if (match) {
          values.add(normalize(match));
        }
      });

      // Current Webflow structure:
      // .blog-item > .filter-hiden > two nested CMS lists
      // We do not rely on list order. We match the rendered CMS text against
      // the currently rendered Secondary Category filter labels.
      const hidden = item.querySelector(CONFIG.hiddenMeta);

      if (hidden) {
        hidden.querySelectorAll("p, span, a").forEach((node) => {
          const raw = cleanText(node.textContent);
          const normalized = normalize(raw);

          if (secondaryByNormalized.has(normalized)) {
            values.add(normalized);
          }
        });
      }

      return values;
    };

    const assignItemMeta = (item) => {
      const categories = readItemCategories(item);

      item._detectBlogCategories = categories;
      item.dataset.blogCategory =
        [...categories][0] || "Uncategorized";

      item.dataset.blogTitle = normalize(
        item.querySelector(CONFIG.title)?.textContent
      );

      item._detectSecondaryCategories = readSecondaryCategories(item);
    };

    currentItems().forEach(assignItemMeta);

    // Search: clone the input so any previous CMS/Finsweet listeners cannot
    // fight with this filter.
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

    let noResults =
      list.parentElement?.querySelector(":scope > .detect-blog-empty") || null;

    if (!noResults) {
      noResults = document.createElement("p");
      noResults.className = "detect-blog-empty";
      noResults.textContent = CONFIG.noResultsText;
      noResults.hidden = true;
      list.insertAdjacentElement("afterend", noResults);
    }

    let viewMore = null;

    if (isBlogPage && pagination) {
      viewMore = pagination.querySelector(".detect-view-more");

      if (!viewMore) {
        viewMore = document.createElement("button");
        viewMore.type = "button";
        viewMore.className =
          "btn-nregular blue-type pagination-btn detect-view-more";
        viewMore.textContent = "View More";
        pagination.appendChild(viewMore);
      }
    }

    const apply = () => {
      const activePrimaryNormalized = normalize(activeCategory);
      const allPrimarySelected =
        activePrimaryNormalized === normalize(CONFIG.allLabel);

      let matchIndex = 0;
      let matchTotal = 0;

      currentItems().forEach((item) => {
        // Primary filtering exists ONLY on /blog.
        const primaryMatch =
          !isBlogPage ||
          allPrimarySelected ||
          item._detectBlogCategories?.has(activePrimaryNormalized);

        const secondaryMatch =
          !activeSecondary ||
          item._detectSecondaryCategories?.has(
            normalize(activeSecondary)
          );

        const searchMatch =
          !query ||
          (item.dataset.blogTitle || "").includes(query);

        const matches =
          primaryMatch &&
          secondaryMatch &&
          searchMatch;

        if (matches) {
          matchTotal += 1;
          matchIndex += 1;
        }

        const overLimit =
          isBlogPage && matchIndex > visibleLimit;

        item.hidden = !matches || overLimit;
        item.style.display = item.hidden ? "none" : "";
        item.setAttribute(
          "aria-hidden",
          item.hidden ? "true" : "false"
        );
      });

      if (viewMore) {
        viewMore.hidden = matchTotal <= visibleLimit;
      }

      if (noResults) {
        noResults.hidden = matchTotal !== 0;
      }
    };

    // ------------------------------------------------------------
    // PRIMARY CATEGORY FILTER
    // ------------------------------------------------------------
    // ONLY /blog gets JS filtering.
    // Everywhere else the category controls remain COMPLETELY untouched:
    // no preventDefault, no href change, no active-state mutation.
    if (isBlogPage) {
      setActivePrimary(primaryButtons, activeCategory);

      primaryButtons.forEach((button) => {
        const selectPrimary = (event) => {
          event?.preventDefault?.();

          activeCategory =
            labelOf(button) || CONFIG.allLabel;

          visibleLimit = CONFIG.pageSize;

          setActivePrimary(primaryButtons, activeCategory);
          apply();
        };

        button.addEventListener("click", selectPrimary);

        button.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectPrimary(event);
          }
        });
      });
    }

    // ------------------------------------------------------------
    // SECONDARY CATEGORY FILTER
    // ------------------------------------------------------------
    // Works in place on /blog AND on every category/view-all page.
    setActiveSecondary(secondaryButtons, activeSecondary);

    secondaryButtons.forEach((button) => {
      const selectSecondary = (event) => {
        event?.preventDefault?.();

        const label = labelOf(button);

        activeSecondary =
          normalize(activeSecondary) === normalize(label)
            ? ""
            : label;

        if (isBlogPage) {
          visibleLimit = CONFIG.pageSize;
        }

        setActiveSecondary(secondaryButtons, activeSecondary);
        apply();
      };

      button.addEventListener("click", selectSecondary);

      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectSecondary(event);
        }
      });
    });

    // ------------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------------
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = normalize(searchInput.value);

        if (isBlogPage) {
          visibleLimit = CONFIG.pageSize;
        }

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

    // External "View all" CTA below the /blog list.
    // This is NOT the static "View all" button inside the primary filter.
    // It keeps the old behavior: selected category -> /categories/<slug>.
    if (isBlogPage) {
      const externalViewAllControls = [
        ...document.querySelectorAll(CONFIG.externalViewAll)
      ];

      const syncExternalViewAll = () => {
        const href =
          normalize(activeCategory) === normalize(CONFIG.allLabel)
            ? "/category/view-all"
            : `${CONFIG.categoryBasePath}${slugify(activeCategory)}`;

        externalViewAllControls.forEach((control) => {
          if (control.tagName === "A") {
            control.setAttribute("href", href);
          }
        });
      };

      syncExternalViewAll();

      primaryButtons.forEach((button) => {
        button.addEventListener("click", syncExternalViewAll);
      });
    }

    apply();

    // ------------------------------------------------------------
    // LOAD ALL NATIVE WEBFLOW CMS PAGINATION
    // ------------------------------------------------------------
    const seenPages = new Set();
    const seenSlugs = new Set(
      currentItems().map(slugFromItem).filter(Boolean)
    );

    let nextUrl = initialNext
      ? new URL(initialNext, window.location.href).href
      : "";

    try {
      while (nextUrl && !seenPages.has(nextUrl)) {
        seenPages.add(nextUrl);

        const response = await fetch(nextUrl, {
          credentials: "same-origin"
        });

        if (!response.ok) {
          throw new Error(
            `CMS page failed: ${response.status}`
          );
        }

        const html = await response.text();

        const doc = new DOMParser().parseFromString(
          html,
          "text/html"
        );

        [
          ...doc.querySelectorAll(CONFIG.item)
        ].forEach((sourceItem) => {
          const slug = slugFromItem(sourceItem);

          if (slug && seenSlugs.has(slug)) return;
          if (slug) seenSlugs.add(slug);

          const item = document.importNode(sourceItem, true);
          assignItemMeta(item);
          list.appendChild(item);
        });

        const rawNext =
          doc.querySelector(
            `${CONFIG.pagination} .w-pagination-next`
          )?.getAttribute("href") || "";

        nextUrl = rawNext
          ? new URL(rawNext, window.location.href).href
          : "";
      }
    } catch (error) {
      console.error(
        "Detect dynamic blog filters:",
        error
      );
    } finally {
      // On category/view-all pages, hide every Secondary filter that does not
      // exist in ANY article on that page (including all fetched CMS pages).
      if (isSecondaryOnlyPage) {
        const availableSecondary = new Set();

        currentItems().forEach((item) => {
          item._detectSecondaryCategories?.forEach((value) => {
            availableSecondary.add(value);
          });
        });

        let availableCount = 0;

        secondaryButtons.forEach((button) => {
          const normalized = normalize(labelOf(button));
          const available = availableSecondary.has(normalized);

          const wrapper =
            button.closest(".w-dyn-item") || button;

          wrapper.hidden = !available;
          wrapper.style.display = available ? "" : "none";

          if (available) {
            availableCount += 1;
          } else if (
            normalize(activeSecondary) === normalized
          ) {
            activeSecondary = "";
          }
        });

        if (secondaryBox) {
          const hasAny = availableCount > 0;

          secondaryBox.hidden = !hasAny;
          secondaryBox.style.display = hasAny ? "" : "none";
          secondaryBox.style.visibility = "";
        }
      }

      setActiveSecondary(secondaryButtons, activeSecondary);
      apply();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();