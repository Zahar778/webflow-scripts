/* Detect blog filters + category-page filtering */
(() => {
  "use strict";

  const CONFIG = {
    list: ".blog-list",
    item: ".blog-list > .blog-item",
    title: ".blog-item-title",
    categoryButton: ".tab-btn[data-attributes]",
    primaryValue: "[data-blog-category]",
    secondaryButton: ".tab-btn[data-secondary-attributes]",
    secondaryValue: "[data-blog-secondary-category='true']",
    search: "#Search",
    pagination: ".blog-pagination",
    pageSize: 12,
    allLabel: "View all",
    activeClass: "active",
    noResultsText: "No articles found.",
    viewAllSelector: "[data-blog-view-all='true'], [data-blog-view-all], .blog-view-all"
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

  const categorySlug = (value) => normalize(value)
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const categoryUrl = (label) =>
    `/category/${categorySlug(label || CONFIG.allLabel)}`;

  const categoryFromPath = (buttons) => {
    const current = cleanPath(window.location.pathname);
    const slug = current.split("/").pop() || "";

    const button = buttons.find((item) =>
      categorySlug(item.getAttribute("data-attributes")) === slug
    );

    return button?.getAttribute("data-attributes") || null;
  };

  const slugFromItem = (item) => {
    const href = item.querySelector("a[href*='/blog/']")?.getAttribute("href") || "";
    return href.split("?")[0].replace(/\/$/, "").split("/").pop() || "";
  };

  const makeInteractive = (button) => {
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
  };

  const setActiveButton = (buttons, category) => {
    const target = normalize(category);
    buttons.forEach((button) => {
      makeInteractive(button);
      const selected = normalize(button.getAttribute("data-attributes")) === target;
      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const setActiveSecondaryButton = (buttons, category) => {
    const target = normalize(category);
    buttons.forEach((button) => {
      makeInteractive(button);
      const selected =
        !!target &&
        normalize(button.getAttribute("data-secondary-attributes")) === target;
      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const init = async () => {
    const currentPath = cleanPath(window.location.pathname);
    const isBlogPage = currentPath === "/blog";
    const isCategoryPage = currentPath.startsWith("/category/");
    const buttons = [...document.querySelectorAll(CONFIG.categoryButton)];
    const secondaryButtons = [...document.querySelectorAll(CONFIG.secondaryButton)];
    const pageCategory = categoryFromPath(buttons);

    let activeSecondary =
      secondaryButtons.find((button) => button.classList.contains(CONFIG.activeClass))
        ?.getAttribute("data-secondary-attributes") || "";

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

    setActiveSecondaryButton(secondaryButtons, activeSecondary);

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

    const primaryLabels = buttons
      .map((button) => button.getAttribute("data-attributes"))
      .filter((label) => label && normalize(label) !== normalize(CONFIG.allLabel));

    const primaryByNormalized = new Map(
      primaryLabels.map((label) => [normalize(label), label])
    );

    const primaryBySlug = new Map(
      primaryLabels.map((label) => [categorySlug(label), label])
    );

    const readPrimaryCategory = (item) => {
      // 1) Preferred: explicit CMS value inside the card.
      // Supports:
      //    data-blog-category="Asset Inspection & Management"
      // and:
      //    data-blog-category="true">Asset Inspection & Management
      const explicit = item.querySelector(CONFIG.primaryValue);
      if (explicit) {
        const attr = explicit.getAttribute("data-blog-category");
        const raw =
          attr && normalize(attr) !== "true"
            ? attr
            : explicit.textContent;

        const match = primaryByNormalized.get(normalize(raw));
        if (match) return match;
        if (normalize(raw)) return raw.trim();
      }

      // 2) If the category pill is a link to /category/<slug>, use the href.
      const categoryLink = item.querySelector("a[href*='/category/']");
      if (categoryLink) {
        const href = categoryLink.getAttribute("href") || "";
        const slug = cleanPath(href).split("/").pop() || "";
        const match = primaryBySlug.get(slug);
        if (match) return match;
      }

      // 3) Zero-config fallback: find an element whose text exactly matches
      // one of the current Primary Category filter labels.
      const candidates = item.querySelectorAll("p, span, a, div");
      for (const node of candidates) {
        const match = primaryByNormalized.get(normalize(node.textContent));
        if (match) return match;
      }

      // 4) Legacy fallback for old cards that predate dynamic CMS attributes.
      const slug = slugFromItem(item);
      if (CATEGORY_BY_SLUG[slug]) return CATEGORY_BY_SLUG[slug];

      // 5) On a /category/* template every item is already scoped to
      // the current Primary Category, so this is safe.
      if (isCategoryPage && pageCategory) return pageCategory;

      return "Uncategorized";
    };

    const assignCategory = (item) => {
      item.dataset.blogCategory = readPrimaryCategory(item);
      item.dataset.blogTitle = normalize(item.querySelector(CONFIG.title)?.textContent);

      // Secondary Categories are fully dynamic and come from the nested CMS list
      // inside each .blog-item. No category names are hardcoded in this script.
      item._detectSecondaryCategories = new Set(
        [...item.querySelectorAll(CONFIG.secondaryValue)]
          .map((node) => {
            const attr = node.getAttribute("data-blog-secondary-category");
            const raw =
              attr && normalize(attr) !== "true"
                ? attr
                : node.textContent;
            return normalize(raw);
          })
          .filter(Boolean)
      );
    };

    const apply = () => {
      const normalizedCategory = normalize(activeCategory);
      const allSelected = normalizedCategory === normalize(CONFIG.allLabel);
      let matchIndex = 0;
      let matchTotal = 0;

      currentItems().forEach((item) => {
        const categoryMatch =
          allSelected || normalize(item.dataset.blogCategory) === normalizedCategory;

        const secondaryMatch =
          !activeSecondary ||
          item._detectSecondaryCategories?.has(normalize(activeSecondary));

        const searchMatch = !query || item.dataset.blogTitle.includes(query);
        const matches = categoryMatch && secondaryMatch && searchMatch;

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

    // Primary Categories:
    // - /blog: filter instantly on the current page.
    // - /category/*: navigate to the corresponding primary category page,
    //   because the CMS template itself is already scoped to one primary category.
    if (isBlogPage) {
      setActiveButton(buttons, activeCategory);

      buttons.forEach((button) => {
        makeInteractive(button);

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
    } else if (isCategoryPage) {
      buttons.forEach((button) => {
        makeInteractive(button);

        const goToCategory = (event) => {
          event?.preventDefault?.();
          const category =
            button.getAttribute("data-attributes") || CONFIG.allLabel;
          const href = categoryUrl(category);

          if (cleanPath(href) !== currentPath) {
            window.location.assign(href);
          }
        };

        button.addEventListener("click", goToCategory);
        button.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            goToCategory(event);
          }
        });
      });
    }

    // Secondary Categories are always in-page filters.
    // Their names come directly from CMS-generated data-secondary-attributes values,
    // so newly-created Secondary Categories require no JS changes.
    secondaryButtons.forEach((button) => {
      makeInteractive(button);

      const selectSecondary = (event) => {
        event?.preventDefault?.();

        const category =
          button.getAttribute("data-secondary-attributes") || "";

        activeSecondary =
          normalize(activeSecondary) === normalize(category)
            ? ""
            : category;

        if (isBlogPage) visibleLimit = CONFIG.pageSize;

        setActiveSecondaryButton(secondaryButtons, activeSecondary);
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
      setActiveButton(buttons, activeCategory);
      setActiveSecondaryButton(secondaryButtons, activeSecondary);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
