/* Detect blog filters — fully dynamic CMS categories + secondary categories */
(() => {
  "use strict";

  const CONFIG = {
    root: ".blog-page-container",
    list: ".blog-list",
    item: ".blog-list > .blog-item",
    title: ".blog-item-title",
    categoryList: ".categories",
    secondaryList: ".secondary-categories",
    secondaryBox: ".s-categories_box",
    search: "#Search",
    pagination: ".blog-pagination",
    pageSize: 12,
    allLabel: "View all",
    activeClass: "active",
    noResultsText: "No articles found.",
    viewAllSelector: "[data-blog-view-all='true'], [data-blog-view-all], .blog-view-all",
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

  const slugFromHref = (href, basePath) => {
    if (!href) return "";
    try {
      const url = new URL(href, window.location.href);
      const path = cleanPath(url.pathname);
      if (!path.startsWith(basePath)) return "";
      return path.slice(basePath.length).split("/")[0] || "";
    } catch {
      return "";
    }
  };

  const buttonLabel = (button) => cleanText(button?.textContent);

  const makeInteractive = (button) => {
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
  };

  const buttonSlug = (button) => {
    const label = buttonLabel(button);
    if (normalize(label) === normalize(CONFIG.allLabel)) return "";

    const explicit =
      cleanText(button.getAttribute("data-category-slug")) ||
      cleanText(button.getAttribute("data-slug"));

    if (explicit) return explicit.replace(/^\/+|\/+$/g, "");

    const explicitUrl = button.getAttribute("data-category-url");
    const explicitUrlSlug = slugFromHref(explicitUrl, CONFIG.categoryBasePath);
    if (explicitUrlSlug) return explicitUrlSlug;

    const anchor =
      (button.matches("a[href]") ? button : null) ||
      button.closest("a[href]") ||
      button.querySelector("a[href]");

    const anchorSlug = slugFromHref(
      anchor?.getAttribute("href") || "",
      CONFIG.categoryBasePath
    );
    if (anchorSlug) return anchorSlug;

    return slugify(label);
  };

  const categoryUrl = (buttonOrLabel) => {
    const label =
      typeof buttonOrLabel === "string"
        ? cleanText(buttonOrLabel)
        : buttonLabel(buttonOrLabel);

    if (!label || normalize(label) === normalize(CONFIG.allLabel)) {
      return "/blog";
    }

    const slug =
      typeof buttonOrLabel === "string"
        ? slugify(label)
        : buttonSlug(buttonOrLabel);

    return `${CONFIG.categoryBasePath}${slug}`;
  };

  const setActivePrimary = (buttons, label) => {
    const target = normalize(label);

    buttons.forEach((button) => {
      makeInteractive(button);

      const currentLabel = buttonLabel(button);
      const selected = normalize(currentLabel) === target;

      button.setAttribute("data-attributes", currentLabel);

      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const setActiveSecondary = (buttons, label) => {
    const target = normalize(label);

    buttons.forEach((button) => {
      makeInteractive(button);

      const currentLabel = buttonLabel(button);
      const selected = !!target && normalize(currentLabel) === target;

      button.setAttribute("data-secondary-attributes", currentLabel);

      button.classList.toggle(CONFIG.activeClass, selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  };

  const init = async () => {
    const root = document.querySelector(CONFIG.root) || document;
    const currentPath = cleanPath(window.location.pathname);
    const isBlogPage = currentPath === "/blog";
    const isCategoryPage = currentPath.startsWith(CONFIG.categoryBasePath);

    if (!isBlogPage && !isCategoryPage) return;

    const allTabButtons = [...root.querySelectorAll(".tab-btn")];

    const secondaryButtons = allTabButtons.filter((button) =>
      button.closest(CONFIG.secondaryList)
    );

    const primaryButtons = allTabButtons.filter((button) => {
      if (button.closest(CONFIG.secondaryList)) return false;

      return (
        !!button.closest(CONFIG.categoryList) ||
        normalize(buttonLabel(button)) === normalize(CONFIG.allLabel)
      );
    });

    primaryButtons.forEach((button) => {
      button.setAttribute("data-attributes", buttonLabel(button));
    });

    secondaryButtons.forEach((button) => {
      button.setAttribute("data-secondary-attributes", buttonLabel(button));
    });

    const primaryLabels = primaryButtons
      .map(buttonLabel)
      .filter((label) => label && normalize(label) !== normalize(CONFIG.allLabel));

    const primaryByNormalized = new Map(
      primaryLabels.map((label) => [normalize(label), label])
    );

    const primaryBySlug = new Map(
      primaryButtons
        .filter((button) => normalize(buttonLabel(button)) !== normalize(CONFIG.allLabel))
        .map((button) => [buttonSlug(button), buttonLabel(button)])
        .filter(([slug]) => !!slug)
    );

    const secondaryLabels = secondaryButtons
      .map(buttonLabel)
      .filter(Boolean);

    const secondaryByNormalized = new Map(
      secondaryLabels.map((label) => [normalize(label), label])
    );

    const currentCategorySlug = isCategoryPage
      ? currentPath.slice(CONFIG.categoryBasePath.length).split("/")[0]
      : "";

    const pageCategory =
      primaryBySlug.get(currentCategorySlug) ||
      primaryByNormalized.get(normalize(
        document.querySelector("[data-current-category]")?.textContent
      )) ||
      "";

    let activeCategory = isCategoryPage
      ? (pageCategory || CONFIG.allLabel)
      : CONFIG.allLabel;

    let activeSecondary = "";

    setActivePrimary(primaryButtons, activeCategory);
    setActiveSecondary(secondaryButtons, activeSecondary);

    const list = root.querySelector(CONFIG.list) || document.querySelector(CONFIG.list);
    if (!list) return;

    document.querySelector("[fs-cmsfilter-element='filters']")
      ?.removeAttribute("fs-cmsfilter-element");
    list.removeAttribute("fs-cmsfilter-element");

    const originalInput = root.querySelector(CONFIG.search) || document.querySelector(CONFIG.search);
    let searchInput = null;

    if (originalInput) {
      searchInput = originalInput.cloneNode(true);
      originalInput.replaceWith(searchInput);
      searchInput.removeAttribute("fs-cmsfilter-field");
    }

    const pagination =
      root.querySelector(CONFIG.pagination) ||
      document.querySelector(CONFIG.pagination);

    const nativeNext = pagination?.querySelector(".w-pagination-next");
    const nativePrevious = pagination?.querySelector(".w-pagination-previous");
    const initialNext = nativeNext?.getAttribute("href") || "";

    nativeNext?.setAttribute("hidden", "hidden");
    nativePrevious?.setAttribute("hidden", "hidden");

    let visibleLimit = isCategoryPage ? Infinity : CONFIG.pageSize;
    let query = "";

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

    const viewAllControls = isBlogPage
      ? [...root.querySelectorAll(CONFIG.viewAllSelector)]
      : [];

    const currentItems = () => [
      ...list.querySelectorAll(":scope > .blog-item")
    ];

    const slugFromItem = (item) => {
      const href =
        item.querySelector("a[href*='/blog/']")?.getAttribute("href") || "";

      return cleanPath(href).split("/").pop() || "";
    };

    const readPrimaryCategory = (item) => {
      const ownAttr = cleanText(item.getAttribute("data-blog-category"));
      if (ownAttr && normalize(ownAttr) !== "true") {
        return primaryByNormalized.get(normalize(ownAttr)) || ownAttr;
      }

      const explicit = item.querySelector("[data-blog-category]");
      if (explicit) {
        const attr = cleanText(explicit.getAttribute("data-blog-category"));
        const raw =
          attr && normalize(attr) !== "true"
            ? attr
            : cleanText(explicit.textContent);

        if (raw) return primaryByNormalized.get(normalize(raw)) || raw;
      }

      const visiblePill = cleanText(
        item.querySelector(".blog-item-content-tag-text")?.textContent
      );

      if (visiblePill) {
        return primaryByNormalized.get(normalize(visiblePill)) || visiblePill;
      }

      for (const directChild of [...item.children]) {
        if (!directChild.classList.contains("w-dyn-list")) continue;

        for (const node of directChild.querySelectorAll("p, span, a")) {
          const raw = cleanText(node.textContent);
          const match = primaryByNormalized.get(normalize(raw));
          if (match) return match;
        }
      }

      if (isCategoryPage && pageCategory) return pageCategory;

      return "Uncategorized";
    };

    const readSecondaryCategories = (item, primaryCategory) => {
      const values = new Set();

      item.querySelectorAll("[data-blog-secondary-category]").forEach((node) => {
        const attr = cleanText(
          node.getAttribute("data-blog-secondary-category")
        );

        const raw =
          attr && normalize(attr) !== "true"
            ? attr
            : cleanText(node.textContent);

        if (raw) values.add(normalize(raw));
      });

      for (const directChild of [...item.children]) {
        if (!directChild.classList.contains("w-dyn-list")) continue;

        directChild.querySelectorAll("p, span, a").forEach((node) => {
          const raw = cleanText(node.textContent);
          const normalized = normalize(raw);

          if (
            normalized &&
            normalized !== normalize(primaryCategory) &&
            secondaryByNormalized.has(normalized)
          ) {
            values.add(normalized);
          }
        });
      }

      return values;
    };

    const assignItemMeta = (item) => {
      const primaryCategory = readPrimaryCategory(item);

      item.dataset.blogCategory = primaryCategory;
      item.dataset.blogTitle = normalize(
        item.querySelector(CONFIG.title)?.textContent
      );

      item._detectSecondaryCategories =
        readSecondaryCategories(item, primaryCategory);
    };

    const syncViewAll = () => {
      if (!isBlogPage) return;

      const matchingButton = primaryButtons.find(
        (button) => normalize(buttonLabel(button)) === normalize(activeCategory)
      );

      const href =
        normalize(activeCategory) === normalize(CONFIG.allLabel)
          ? "/blog"
          : categoryUrl(matchingButton || activeCategory);

      viewAllControls.forEach((control) => {
        if (control.tagName === "A") {
          control.setAttribute("href", href);
          return;
        }

        control.dataset.detectViewAllUrl = href;

        if (control.dataset.detectViewAllBound !== "true") {
          control.dataset.detectViewAllBound = "true";
          control.addEventListener("click", () => {
            window.location.assign(control.dataset.detectViewAllUrl || "/blog");
          });
        }
      });
    };

    const apply = () => {
      const normalizedCategory = normalize(activeCategory);
      const allSelected =
        normalizedCategory === normalize(CONFIG.allLabel);

      let matchIndex = 0;
      let matchTotal = 0;

      currentItems().forEach((item) => {
        const categoryMatch =
          allSelected ||
          normalize(item.dataset.blogCategory) === normalizedCategory;

        const secondaryMatch =
          !activeSecondary ||
          item._detectSecondaryCategories?.has(
            normalize(activeSecondary)
          );

        const searchMatch =
          !query || item.dataset.blogTitle.includes(query);

        const matches =
          categoryMatch && secondaryMatch && searchMatch;

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

    const secondaryBox =
      root.querySelector(CONFIG.secondaryBox) ||
      document.querySelector(CONFIG.secondaryBox);

    if (isCategoryPage && secondaryBox) {
      secondaryBox.style.visibility = "hidden";
    }

    const syncSecondaryAvailability = () => {
      if (!isCategoryPage) return;

      const available = new Set();
      const currentPrimary = normalize(pageCategory || activeCategory);

      currentItems().forEach((item) => {
        if (
          currentPrimary &&
          normalize(item.dataset.blogCategory) !== currentPrimary
        ) {
          return;
        }

        item._detectSecondaryCategories?.forEach((value) => {
          available.add(value);
        });
      });

      let visibleSecondaryCount = 0;

      secondaryButtons.forEach((button) => {
        const label = buttonLabel(button);
        const normalized = normalize(label);
        const isAvailable = available.has(normalized);

        const wrapper =
          button.closest(".w-dyn-item") || button;

        wrapper.hidden = !isAvailable;
        wrapper.style.display = isAvailable ? "" : "none";
        button.setAttribute(
          "aria-hidden",
          isAvailable ? "false" : "true"
        );

        if (isAvailable) {
          visibleSecondaryCount += 1;
        } else if (normalize(activeSecondary) === normalized) {
          activeSecondary = "";
        }
      });

      if (secondaryBox) {
        const hasAny = visibleSecondaryCount > 0;
        secondaryBox.hidden = !hasAny;
        secondaryBox.style.display = hasAny ? "" : "none";
        secondaryBox.style.visibility = "";
      }

      setActiveSecondary(secondaryButtons, activeSecondary);
    };

    currentItems().forEach(assignItemMeta);

    if (isBlogPage) {
      setActivePrimary(primaryButtons, activeCategory);

      primaryButtons.forEach((button) => {
        const selectCategory = (event) => {
          event?.preventDefault?.();

          activeCategory = buttonLabel(button) || CONFIG.allLabel;
          visibleLimit = CONFIG.pageSize;

          setActivePrimary(primaryButtons, activeCategory);
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
      setActivePrimary(primaryButtons, activeCategory);

      primaryButtons.forEach((button) => {
        const goToCategory = (event) => {
          event?.preventDefault?.();

          const href = categoryUrl(button);

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

    secondaryButtons.forEach((button) => {
      const selectSecondary = (event) => {
        event?.preventDefault?.();

        if (
          isCategoryPage &&
          (button.closest(".w-dyn-item") || button).hidden
        ) {
          return;
        }

        const label = buttonLabel(button);

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

    apply();
    syncViewAll();

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

        [...doc.querySelectorAll(CONFIG.item)].forEach((sourceItem) => {
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
      console.error("Detect dynamic blog filters:", error);
    } finally {
      if (isCategoryPage) {
        visibleLimit = Infinity;
      }

      syncSecondaryAvailability();
      apply();
      syncViewAll();
      setActivePrimary(primaryButtons, activeCategory);
      setActiveSecondary(secondaryButtons, activeSecondary);
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