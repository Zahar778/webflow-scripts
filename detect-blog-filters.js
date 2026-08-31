/*
 * Detect blog: category filter + search + View More + category archive routing.
 *
 * Main /blog:
 * - category tabs filter articles in-place;
 * - the bottom "View all" CTA points to the archive page of the currently selected category.
 *
 * /category/<slug>:
 * - search and View More keep working;
 * - category tabs navigate between category archive pages;
 * - the active tab is detected from the current URL.
 */

(() => {
  "use strict";

  const CONFIG = {
    list: ".blog-list",
    item: ".blog-list > .blog-item",
    title: ".blog-item-title",
    categoryButton: ".tab-btn[data-attributes]",
    search: "#Search",
    pagination: ".blog-pagination",
    pageSize: 12,
    allLabel: "View all",
    activeClass: "active",
    viewMoreLabel: "View More",
    noResultsText: "No articles found.",

    // Best option: add data-blog-view-all to the intended CTA in Webflow.
    // Fallback below also finds a "View all" link/button in the same section.
    viewAllSelector: "[data-blog-view-all], .blog-view-all"
  };

  const CATEGORY_ROUTES = {
    "View all": "/blog",
    "Asset Inspection & Management": "/category/asset-inspection-management",
    "Grid Reliability": "/category/grid-reliability",
    "Drone Operations": "/category/drone-operations",
    "Case Studies": "/category/case-studies",
    "Newsroom": "/category/newsroom",
    "Product & Platform": "/category/product-platform"
  };

  // Slug -> category, based on the supplied CSV plus the newer posts.
  const CATEGORY_BY_SLUG = {
    "2026-trends-for-drone-service-providers": "Drone Operations",
    "35-mules": "Newsroom",
    "5-data-quality-failures": "Drone Operations",
    "ai-asset-inspection-platforms-improve-grid-reliability": "Grid Reliability",
    "ai-asset-inspection-roi-for-utilities": "Asset Inspection & Management",
    "ai-inspection-software-helps-prevent-grid-outages": "Grid Reliability",
    "asset-performance-management": "Asset Inspection & Management",
    "detect-achieves-soc-2-type-ii-compliance-2026": "Newsroom",
    "detect-finalist-for-growfl-companies-to-watch": "Newsroom",
    "detect-nextera-energy-transmission-ai-hackathon": "Newsroom",
    "detect-nominated-for-reuters-energy-industry-awards": "Newsroom",
    "drone-mapping": "Drone Operations",
    "drone-pilot-training-for-utility-inspection": "Drone Operations",
    "drone-utility-inspection": "Drone Operations",
    "guide-cutting-rework-on-infrastructure-inspections-in-2026": "Asset Inspection & Management",
    "guide-the-dji-ban-and-utility-drone-inspection": "Drone Operations",
    "how-ai-asset-inspection-platforms-guide-utility-planning": "Asset Inspection & Management",
    "how-same-day-ai-triage-prioritizes-grid-defects": "Grid Reliability",
    "how-to-evaluate-ai-grid-inspection-platforms": "Asset Inspection & Management",
    "how-to-inspect-a-construction-site": "Asset Inspection & Management",
    "hvdc-transmission-inspection": "Case Studies",
    "inspect-10x-more-utility-assets": "Asset Inspection & Management",
    "ndaa-compliance-guide-for-drone-operators-what-to-know-in-2026": "Drone Operations",
    "power-grid-failure-causes": "Grid Reliability",
    "remote-utility-inspection": "Case Studies",
    "the-true-cost-of-reactive-maintenance": "Grid Reliability",
    "top-asset-management-provider-2025": "Newsroom",
    "transmission-line-inspection": "Grid Reliability",
    "transmission-structure-types": "Asset Inspection & Management",
    "utility-asset-management": "Asset Inspection & Management",
    "utility-drone-inspection-workflow": "Drone Operations",
    "utility-drone-vendor-evaluation": "Drone Operations",
    "utility-inspections-data-capture-methods": "Asset Inspection & Management",
    "utility-poles": "Asset Inspection & Management",
    "visual-predictive-maintenance-for-grid-assets-in-2026": "Grid Reliability",
    "what-happens": "Asset Inspection & Management",
    "what-is-a-wildfire-mitigation-plan-a-2026": "Grid Reliability",
    "why-ai-inspections-miss-defects": "Asset Inspection & Management",
    "why-utilities-struggle-with-ai-visual-inspection-platforms": "Asset Inspection & Management",
    "wooden-h-frame-transmission": "Case Studies",
    "the-new-detectos": "Product & Platform",

    // Newer posts that are not present in the supplied CSV.
    "partner-network-any-pilot-any-drone": "Newsroom",
    "new-345kv-transmission-line": "Case Studies",
    "how-to-verify-ai-inspection-results": "Asset Inspection & Management",
    "inspection-to-maintenance-orchestration": "Asset Inspection & Management",
    "best-ai-inspection-software-for-utilities": "Asset Inspection & Management"
  };

  const normalize = (value) => (value || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const cleanPath = (value) => {
    const path = (value || "/").split("?")[0].replace(/\/+$/, "");
    return path || "/";
  };

  const categoryUrl = (category) => {
    const normalizedCategory = normalize(category);
    const entry = Object.entries(CATEGORY_ROUTES)
      .find(([label]) => normalize(label) === normalizedCategory);
    return entry?.[1] || "/blog";
  };

  const categoryFromPath = () => {
    const currentPath = cleanPath(window.location.pathname);
    const entry = Object.entries(CATEGORY_ROUTES)
      .find(([, route]) => cleanPath(route) === currentPath);
    return entry?.[0] || null;
  };

  const slugFromItem = (item) => {
    const href = item.querySelector("a[href*='/blog/']")?.getAttribute("href") || "";
    return href.split("?")[0].replace(/\/$/, "").split("/").pop() || "";
  };

  const init = async () => {
    const list = document.querySelector(CONFIG.list);
    const buttons = [...document.querySelectorAll(CONFIG.categoryButton)];
    if (!list || !buttons.length) return;

    const pageCategory = categoryFromPath();
    const isCategoryPage = cleanPath(window.location.pathname).startsWith("/category/");

    // Replacing the search input removes Finsweet's old input listener so both
    // engines cannot fight over display styles. Search is optional on archive pages.
    const originalInput = document.querySelector(CONFIG.search);
    let searchInput = null;

    if (originalInput) {
      searchInput = originalInput.cloneNode(true);
      originalInput.replaceWith(searchInput);
      searchInput.removeAttribute("fs-cmsfilter-field");

      document.querySelector("[fs-cmsfilter-element='filters']")
        ?.removeAttribute("fs-cmsfilter-element");
      list.removeAttribute("fs-cmsfilter-element");
    }

    let activeCategory =
      pageCategory ||
      buttons.find((button) => button.classList.contains(CONFIG.activeClass))
        ?.getAttribute("data-attributes") ||
      CONFIG.allLabel;

    let visibleLimit = CONFIG.pageSize;
    let query = "";

    const pagination = document.querySelector(CONFIG.pagination);
    const initialNext = pagination
      ?.querySelector(".w-pagination-next")
      ?.getAttribute("href");

    let viewMore = null;
    let noResults = null;
    let viewAllControls = [];

    const setActiveButton = (category) => {
      const target = normalize(category);

      buttons.forEach((button) => {
        const selected =
          normalize(button.getAttribute("data-attributes")) === target;

        button.classList.toggle(CONFIG.activeClass, selected);
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    };

    const findViewAllControls = () => {
      const explicit = [
        ...document.querySelectorAll(CONFIG.viewAllSelector)
      ].filter((element) => !element.matches(CONFIG.categoryButton));

      if (explicit.length) return explicit;

      // Fallback: find a "View all" CTA near the blog list, but never the filter tab.
      const section = list.closest("section") || list.parentElement || document;
      const local = [...section.querySelectorAll("a, button")].filter((element) => {
        return !element.matches(CONFIG.categoryButton) &&
          normalize(element.textContent) === normalize(CONFIG.allLabel);
      });

      if (local.length) return local;

      return [...document.querySelectorAll("a, button")].filter((element) => {
        return !element.matches(CONFIG.categoryButton) &&
          normalize(element.textContent) === normalize(CONFIG.allLabel);
      });
    };

    const syncViewAllControls = () => {
      const targetUrl = categoryUrl(activeCategory);

      viewAllControls.forEach((control) => {
        if (control.tagName === "A") {
          control.setAttribute("href", targetUrl);
        } else {
          control.dataset.detectViewAllUrl = targetUrl;
        }

        if (control.dataset.detectViewAllBound === "true") return;
        control.dataset.detectViewAllBound = "true";

        if (control.tagName !== "A") {
          control.addEventListener("click", () => {
            window.location.assign(control.dataset.detectViewAllUrl || targetUrl);
          });
        }
      });
    };

    const ensureControls = () => {
      if (pagination) {
        pagination.innerHTML = "";

        viewMore = document.createElement("button");
        viewMore.type = "button";
        viewMore.className =
          "btn-nregular blue-type pagination-btn detect-view-more";
        viewMore.textContent = CONFIG.viewMoreLabel;
        pagination.appendChild(viewMore);
      }

      noResults = list.parentElement?.querySelector(":scope > .detect-blog-empty") || null;

      if (!noResults) {
        noResults = document.createElement("p");
        noResults.className = "detect-blog-empty";
        noResults.textContent = CONFIG.noResultsText;
        noResults.hidden = true;
        list.insertAdjacentElement("afterend", noResults);
      }

      viewAllControls = findViewAllControls();
      syncViewAllControls();
    };

    const assignCategory = (item) => {
      const slug = slugFromItem(item);
      const mapped = CATEGORY_BY_SLUG[slug];
      const embedded = item.querySelector("[data-blog-category]")
        ?.getAttribute("data-blog-category");

      // On a category archive, every CMS item belongs to that archive by definition.
      // This fallback keeps future/new posts working even before the hard-coded map
      // is updated.
      item.dataset.blogCategory =
        mapped || embedded || pageCategory || "Uncategorized";

      item.dataset.blogTitle = normalize(
        item.querySelector(CONFIG.title)?.textContent
      );
    };

    const currentItems = () =>
      [...list.querySelectorAll(":scope > .blog-item")];

    const applyFilters = () => {
      const normalizedCategory = normalize(activeCategory);
      const allSelected =
        normalizedCategory === normalize(CONFIG.allLabel);

      let matchingIndex = 0;
      let matchingTotal = 0;

      currentItems().forEach((item) => {
        const categoryMatch =
          allSelected ||
          normalize(item.dataset.blogCategory) === normalizedCategory;

        const searchMatch =
          !query || item.dataset.blogTitle.includes(query);

        const matches = categoryMatch && searchMatch;

        if (matches) {
          matchingTotal += 1;
          matchingIndex += 1;
        }

        item.hidden = !matches || matchingIndex > visibleLimit;
        item.style.display = item.hidden ? "none" : "";
        item.setAttribute(
          "aria-hidden",
          item.hidden ? "true" : "false"
        );
      });

      if (viewMore) {
        viewMore.hidden = matchingTotal <= visibleLimit;
      }

      if (pagination) {
        pagination.hidden = matchingTotal <= visibleLimit;
      }

      if (noResults) {
        noResults.hidden = matchingTotal !== 0;
      }
    };

    const resetLimitAndFilter = () => {
      visibleLimit = CONFIG.pageSize;
      applyFilters();
    };

    ensureControls();
    currentItems().forEach(assignCategory);
    setActiveButton(activeCategory);

    buttons.forEach((button) => {
      button.setAttribute("role", "button");
      button.setAttribute("tabindex", "0");

      const selectCategory = () => {
        const nextCategory =
          button.getAttribute("data-attributes") || CONFIG.allLabel;

        // On category archive pages the category tabs are navigation.
        // This is intentional: the CMS archive only contains that category's items.
        if (isCategoryPage) {
          const targetUrl = categoryUrl(nextCategory);

          if (cleanPath(targetUrl) !== cleanPath(window.location.pathname)) {
            window.location.assign(targetUrl);
            return;
          }
        }

        // On /blog the tabs stay instant client-side filters.
        activeCategory = nextCategory;
        setActiveButton(activeCategory);
        resetLimitAndFilter();
        syncViewAllControls();
      };

      button.addEventListener("click", selectCategory);

      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectCategory();
        }
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = normalize(searchInput.value);
        resetLimitAndFilter();
      });

      searchInput.closest("form")?.addEventListener("submit", (event) => {
        event.preventDefault();
      });
    }

    viewMore?.addEventListener("click", () => {
      visibleLimit += CONFIG.pageSize;
      applyFilters();
    });

    applyFilters();

    // Load every remaining native Webflow CMS pagination page into one list.
    const seenPages = new Set();
    const seenSlugs = new Set(currentItems().map(slugFromItem));
    let nextUrl = initialNext
      ? new URL(initialNext, window.location.href).href
      : "";

    if (viewMore && nextUrl) {
      viewMore.disabled = true;
      viewMore.textContent = "Loading...";
      pagination.hidden = false;
    }

    try {
      while (nextUrl && !seenPages.has(nextUrl)) {
        seenPages.add(nextUrl);

        const response = await fetch(nextUrl, {
          credentials: "same-origin"
        });

        if (!response.ok) {
          throw new Error(`CMS page failed: ${response.status}`);
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        [...doc.querySelectorAll(CONFIG.item)].forEach((sourceItem) => {
          const slug = slugFromItem(sourceItem);

          if (!slug || seenSlugs.has(slug)) return;

          seenSlugs.add(slug);

          const item = document.importNode(sourceItem, true);
          assignCategory(item);
          list.appendChild(item);
        });

        const rawNext = doc
          .querySelector(`${CONFIG.pagination} .w-pagination-next`)
          ?.getAttribute("href");

        nextUrl = rawNext
          ? new URL(rawNext, window.location.href).href
          : "";
      }
    } catch (error) {
      console.error("Detect blog filters:", error);
    } finally {
      if (viewMore) {
        viewMore.disabled = false;
        viewMore.textContent = CONFIG.viewMoreLabel;
      }

      applyFilters();
      syncViewAllControls();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
