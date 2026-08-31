/* Detect blog filters + category-page filtering */
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
    noResultsText: "No articles found.",
    viewAllSelector: "[data-blog-view-all='true'], [data-blog-view-all], .blog-view-all"
  };

  // Used only for:
  // 1) determining the active category from /category/<slug>
  // 2) setting the separate View All CTA URL on /blog
  // The script DOES NOT change category-tab hrefs on /category/* pages.
  const CATEGORY_ROUTES = {
    "View all": "/category/view-all",
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

  const categoryUrl = (label) => {
    const target = normalize(label);
    const pair = Object.entries(CATEGORY_ROUTES)
      .find(([name]) => normalize(name) === target);
    return pair?.[1] || CATEGORY_ROUTES[CONFIG.allLabel];
  };

  const categoryFromPath = () => {
    const current = cleanPath(window.location.pathname);
    const pair = Object.entries(CATEGORY_ROUTES)
      .find(([, route]) => cleanPath(route) === current);
    return pair?.[0] || null;
  };

  const slugFromItem = (item) => {
    const href = item.querySelector("a[href*='/blog/']")?.getAttribute("href") || "";
    return href.split("?")[0].replace(/\/$/, "").split("/").pop() || "";
  };

  const setActiveButton = (buttons, category) => {
    const target = normalize(category);
    buttons.forEach((button) => {
      const selected = normalize(button.getAttribute("data-attributes")) === target;
      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const init = async () => {
    const currentPath = cleanPath(window.location.pathname);
    const isBlogPage = currentPath === "/blog";
    const isCategoryPage = currentPath.startsWith("/category/");
    const buttons = [...document.querySelectorAll(CONFIG.categoryButton)];
    const pageCategory = categoryFromPath();

    let activeCategory =
      pageCategory ||
      buttons.find((button) => button.classList.contains(CONFIG.activeClass))
        ?.getAttribute("data-attributes") ||
      CONFIG.allLabel;

    // On category pages we ONLY highlight the current category.
    // Existing hrefs/links added in Webflow are left completely untouched.
    if (isCategoryPage) {
      setActiveButton(buttons, activeCategory);
    }

    // Separate View All CTA exists only on /blog and follows the selected filter.
    const viewAllControls = isBlogPage
      ? [...document.querySelectorAll(CONFIG.viewAllSelector)]
      : [];

    const syncViewAll = () => {
      if (!isBlogPage) return;
      const href = categoryUrl(activeCategory);

      viewAllControls.forEach((control) => {
        if (control.tagName === "A") {
          control.setAttribute("href", href);
        } else {
          control.dataset.detectViewAllUrl = href;
          if (control.dataset.detectViewAllBound !== "true") {
            control.dataset.detectViewAllBound = "true";
            control.addEventListener("click", () => {
              window.location.assign(control.dataset.detectViewAllUrl || href);
            });
          }
        }
      });
    };

    syncViewAll();

    const list = document.querySelector(CONFIG.list);
    if (!list) return;

    // Disable old Finsweet filtering hooks so they cannot fight this script.
    document.querySelector("[fs-cmsfilter-element='filters']")
      ?.removeAttribute("fs-cmsfilter-element");
    list.removeAttribute("fs-cmsfilter-element");

    const originalInput = document.querySelector(CONFIG.search);
    let searchInput = null;

    if (originalInput) {
      searchInput = originalInput.cloneNode(true);
      originalInput.replaceWith(searchInput);
      searchInput.removeAttribute("fs-cmsfilter-field");
    }

    const pagination = document.querySelector(CONFIG.pagination);
    const nativeNext = pagination?.querySelector(".w-pagination-next");
    const nativePrevious = pagination?.querySelector(".w-pagination-previous");
    const initialNext = nativeNext?.getAttribute("href") || "";

    nativeNext?.setAttribute("hidden", "hidden");
    nativePrevious?.setAttribute("hidden", "hidden");

    let visibleLimit = isCategoryPage ? Infinity : CONFIG.pageSize;
    let query = "";
    let noResults = list.parentElement?.querySelector(":scope > .detect-blog-empty") || null;

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
        viewMore.className = "btn-nregular blue-type pagination-btn detect-view-more";
        viewMore.textContent = "View More";

        const viewAllInsidePagination = pagination.querySelector(CONFIG.viewAllSelector);
        if (viewAllInsidePagination) {
          pagination.insertBefore(viewMore, viewAllInsidePagination);
        } else {
          pagination.appendChild(viewMore);
        }
      }
    }

    const currentItems = () => [...list.querySelectorAll(":scope > .blog-item")];

    const assignCategory = (item) => {
      const slug = slugFromItem(item);
      const mapped = CATEGORY_BY_SLUG[slug];
      const embedded = item.querySelector("[data-blog-category]")
        ?.getAttribute("data-blog-category");

      // Do NOT fall back to the current page category here.
      // Every article must prove its own category via the map or data attribute.
      item.dataset.blogCategory = mapped || embedded || "Uncategorized";
      item.dataset.blogTitle = normalize(item.querySelector(CONFIG.title)?.textContent);
    };

    const apply = () => {
      const normalizedCategory = normalize(activeCategory);
      const allSelected = normalizedCategory === normalize(CONFIG.allLabel);
      let matchIndex = 0;
      let matchTotal = 0;

      currentItems().forEach((item) => {
        const categoryMatch =
          allSelected || normalize(item.dataset.blogCategory) === normalizedCategory;

        const searchMatch = !query || item.dataset.blogTitle.includes(query);
        const matches = categoryMatch && searchMatch;

        if (matches) {
          matchTotal += 1;
          matchIndex += 1;
        }

        const overLimit = isBlogPage && matchIndex > visibleLimit;
        item.hidden = !matches || overLimit;
        item.style.display = item.hidden ? "none" : "";
        item.setAttribute("aria-hidden", item.hidden ? "true" : "false");
      });

      if (viewMore) viewMore.hidden = matchTotal <= visibleLimit;
      if (noResults) noResults.hidden = matchTotal !== 0;
    };

    currentItems().forEach(assignCategory);

    // Only /blog tabs are JS filters.
    // On /category/* your manually-added links are left alone.
    if (isBlogPage) {
      setActiveButton(buttons, activeCategory);

      buttons.forEach((button) => {
        button.setAttribute("role", "button");
        button.setAttribute("tabindex", "0");

        const selectCategory = (event) => {
          event?.preventDefault?.();
          activeCategory = button.getAttribute("data-attributes") || CONFIG.allLabel;
          visibleLimit = CONFIG.pageSize;
          setActiveButton(buttons, activeCategory);
          syncViewAll();
          apply();
        };

        button.addEventListener("click", selectCategory);
        button.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectCategory(event);
          }
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = normalize(searchInput.value);
        if (isBlogPage) visibleLimit = CONFIG.pageSize;
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

    apply();

    // Load every remaining native Webflow CMS pagination page in the background.
    // /blog keeps them behind View More; /category/* shows all matching items immediately.
    const seenPages = new Set();
    const seenSlugs = new Set(currentItems().map(slugFromItem));
    let nextUrl = initialNext ? new URL(initialNext, window.location.href).href : "";

    try {
      while (nextUrl && !seenPages.has(nextUrl)) {
        seenPages.add(nextUrl);

        const response = await fetch(nextUrl, { credentials: "same-origin" });
        if (!response.ok) throw new Error(`CMS page failed: ${response.status}`);

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

        const rawNext = doc.querySelector(`${CONFIG.pagination} .w-pagination-next`)
          ?.getAttribute("href");
        nextUrl = rawNext ? new URL(rawNext, window.location.href).href : "";
      }
    } catch (error) {
      console.error("Detect blog filters:", error);
    } finally {
      if (isCategoryPage) visibleLimit = Infinity;
      apply();
      syncViewAll();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
