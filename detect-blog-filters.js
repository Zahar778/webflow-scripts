/*
 * Detect blog filters + category archive routing.
 *
 * /blog
 * - category tabs filter articles in-place;
 * - search works together with the filter;
 * - View More reveals 12 more matching posts;
 * - the separate View All CTA links to the currently selected category page.
 *
 * /category/<slug>
 * - ALL posts from that category are loaded and shown immediately;
 * - no View More / View All controls are created;
 * - search still works;
 * - category tabs navigate to the corresponding category archive.
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
    const wanted = normalize(category);
    const match = Object.entries(CATEGORY_ROUTES)
      .find(([label]) => normalize(label) === wanted);
    return match?.[1] || "/blog";
  };

  const categoryFromPath = () => {
    const currentPath = cleanPath(window.location.pathname);
    const match = Object.entries(CATEGORY_ROUTES)
      .find(([, route]) => cleanPath(route) === currentPath);
    return match?.[0] || null;
  };

  const slugFromItem = (item) => {
    const href = item.querySelector("a[href*='/blog/']")?.getAttribute("href") || "";
    return href.split("?")[0].replace(/\/$/, "").split("/").pop() || "";
  };

  const init = async () => {
    const list = document.querySelector(CONFIG.list);
    if (!list) return;

    const buttons = [...document.querySelectorAll(CONFIG.categoryButton)];
    const currentPath = cleanPath(window.location.pathname);
    const isCategoryPage = currentPath.startsWith("/category/");
    const pageCategory = categoryFromPath();

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

    let visibleLimit = isCategoryPage ? Infinity : CONFIG.pageSize;
    let query = "";

    const pagination = document.querySelector(CONFIG.pagination);
    const initialNext = pagination
      ?.querySelector(".w-pagination-next")
      ?.getAttribute("href");

    let viewMore = null;
    let noResults = null;
    let viewAllControls = [];

    const currentItems = () =>
      [...list.querySelectorAll(":scope > .blog-item")];

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
      if (isCategoryPage) return [];

      const explicit = [...document.querySelectorAll(CONFIG.viewAllSelector)]
        .filter((element) => !element.matches(CONFIG.categoryButton));

      if (explicit.length) return explicit;

      const section = list.closest("section") || list.parentElement || document;
      const local = [...section.querySelectorAll("a, button")].filter((element) =>
        !element.matches(CONFIG.categoryButton) &&
        normalize(element.textContent) === normalize(CONFIG.allLabel)
      );

      if (local.length) return local;

      return [...document.querySelectorAll("a, button")].filter((element) =>
        !element.matches(CONFIG.categoryButton) &&
        normalize(element.textContent) === normalize(CONFIG.allLabel)
      );
    };

    const syncViewAllControls = () => {
      if (isCategoryPage) return;

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
            window.location.assign(
              control.dataset.detectViewAllUrl || targetUrl
            );
          });
        }
      });
    };

    const ensureControls = () => {
      if (pagination) {
        // Keep the native pagination URL for background loading, but remove its UI.
        pagination.innerHTML = "";

        if (isCategoryPage) {
          pagination.hidden = true;
        } else {
          viewMore = document.createElement("button");
          viewMore.type = "button";
          viewMore.className =
            "btn-nregular blue-type pagination-btn detect-view-more";
          viewMore.textContent = CONFIG.viewMoreLabel;
          pagination.appendChild(viewMore);
        }
      }

      noResults = list.parentElement
        ?.querySelector(":scope > .detect-blog-empty") || null;

      if (!noResults) {
        noResults = document.createElement("p");
        noResults.className = "detect-blog-empty";
        noResults.textContent = CONFIG.noResultsText;
        noResults.hidden = true;
        list.insertAdjacentElement("afterend", noResults);
      }

      if (!isCategoryPage) {
        viewAllControls = findViewAllControls();
        syncViewAllControls();
      }
    };

    const assignCategory = (item) => {
      const slug = slugFromItem(item);
      const mapped = CATEGORY_BY_SLUG[slug];
      const embedded = item.querySelector("[data-blog-category]")
        ?.getAttribute("data-blog-category");

      // A Webflow category archive already guarantees its items belong to that
      // category. Using the URL here also makes newly published articles work
      // without updating CATEGORY_BY_SLUG first.
      item.dataset.blogCategory =
        (isCategoryPage && pageCategory) ||
        mapped ||
        embedded ||
        "Uncategorized";

      item.dataset.blogTitle = normalize(
        item.querySelector(CONFIG.title)?.textContent
      );
    };

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

        const overLimit =
          !isCategoryPage && matchingIndex > visibleLimit;

        item.hidden = !matches || overLimit;
        item.style.display = item.hidden ? "none" : "";
        item.setAttribute("aria-hidden", item.hidden ? "true" : "false");
      });

      if (!isCategoryPage && viewMore) {
        viewMore.hidden = matchingTotal <= visibleLimit;
      }

      if (!isCategoryPage && pagination) {
        pagination.hidden = matchingTotal <= visibleLimit;
      }

      if (isCategoryPage && pagination) {
        pagination.hidden = true;
      }

      if (noResults) {
        noResults.hidden = matchingTotal !== 0;
      }
    };

    const resetLimitAndFilter = () => {
      visibleLimit = isCategoryPage ? Infinity : CONFIG.pageSize;
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

        if (isCategoryPage) {
          const targetUrl = categoryUrl(nextCategory);

          if (cleanPath(targetUrl) !== currentPath) {
            window.location.assign(targetUrl);
          }

          return;
        }

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

    // Pull every remaining Webflow CMS pagination page into the current list.
    // On /blog they stay hidden behind View More.
    // On /category/* they are shown immediately after loading.
    const seenPages = new Set();
    const seenSlugs = new Set(currentItems().map(slugFromItem));

    let nextUrl = initialNext
      ? new URL(initialNext, window.location.href).href
      : "";

    if (!isCategoryPage && viewMore && nextUrl) {
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
      if (!isCategoryPage && viewMore) {
        viewMore.disabled = false;
        viewMore.textContent = CONFIG.viewMoreLabel;
      }

      if (isCategoryPage) {
        visibleLimit = Infinity;
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
