/* Detect — normalize legacy custom blog embeds to the current Webflow blog design */
(() => {
  "use strict";

  const ROOT_SELECTOR = ".blog-article-content.w-richtext";
  const LEGACY_SELECTOR = ".detect-dqp-article";
  const STYLE_ID = "detect-blog-article-normalizer-style";

  const CSS = `
/* Only affects old Detect custom article embeds */
${ROOT_SELECTOR} .w-embed {
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  color: inherit !important;
  font: inherit !important;
  line-height: inherit !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-wrap,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-body {
  display: contents !important;
}

/* Turn the old dark hero into normal article content */
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-hero {
  position: static !important;
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 0 32px !important;
  padding: 0 !important;
  overflow: visible !important;
  background: transparent !important;
  color: inherit !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-gridmotif {
  display: none !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-kicker {
  margin: 0 0 16px !important;
  padding: 0 !important;
  color: inherit !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  font-size: inherit !important;
  line-height: inherit !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-hero h1 {
  max-width: none !important;
  color: inherit !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-standfirst {
  max-width: none !important;
  color: inherit !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-byline {
  margin-top: 20px !important;
  padding-top: 0 !important;
  border-top: 0 !important;
  color: inherit !important;
  font-size: inherit !important;
}

/* Flatten old custom cards so current Webflow Rich Text typography wins */
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-answer,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-keytakeaways,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-deftag,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-toc,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-callout,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-cta,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-related {
  width: 100% !important;
  max-width: 100% !important;
  margin: 28px 0 !important;
  padding: 0 !important;
  background: transparent !important;
  color: inherit !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-size: inherit !important;
  line-height: inherit !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-lbl,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-ct {
  display: block !important;
  margin: 0 0 10px !important;
  padding: 0 !important;
  color: inherit !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  font-size: inherit !important;
  line-height: inherit !important;
  font-weight: 600 !important;
}

/* Let the site's normal link style win instead of the old lime CTA pill */
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-cta a {
  display: inline !important;
  padding: 0 !important;
  background: transparent !important;
  color: inherit !important;
  border-radius: 0 !important;
  font-size: inherit !important;
  font-weight: inherit !important;
}

/* Images: preserve every CMS image and make it behave like normal Webflow content */
${ROOT_SELECTOR} ${LEGACY_SELECTOR} figure,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-imgfig,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-photofig {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 32px 0 !important;
  padding: 0 !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} figure img,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-imgfig img,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-photofig img {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  margin: 0 !important;
  object-fit: contain !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} figcaption {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: space-between !important;
  gap: 8px 16px !important;
  margin-top: 10px !important;
  color: inherit !important;
  font-size: 0.8em !important;
  line-height: 1.45 !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} figcaption .dri-src {
  max-width: none !important;
}

/* Keep tables inside the article width */
${ROOT_SELECTOR} ${LEGACY_SELECTOR} table {
  width: 100% !important;
  max-width: 100% !important;
  margin: 28px 0 !important;
  border-collapse: collapse !important;
  font-size: inherit !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} th,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} td {
  background: transparent !important;
  color: inherit !important;
}

/* FAQ: simple, current-site-safe accordion */
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-faq {
  width: 100% !important;
  margin: 28px 0 !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-faq details {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(28, 31, 72, 0.16) !important;
  border-radius: 0 !important;
  overflow: visible !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-faq summary {
  position: relative !important;
  padding: 18px 34px 18px 0 !important;
  color: inherit !important;
  font-size: inherit !important;
  font-weight: 600 !important;
  line-height: inherit !important;
  cursor: pointer !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-faq summary::after {
  right: 0 !important;
  color: inherit !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-faq .dri-a {
  padding: 0 0 18px !important;
  color: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
}

/* Related reading and legacy footer */
${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-related .dri-cols {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 24px !important;
}

${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-footer {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: space-between !important;
  gap: 8px 20px !important;
  width: 100% !important;
  margin: 40px 0 0 !important;
  padding: 20px 0 0 !important;
  background: transparent !important;
  color: inherit !important;
  border-top: 1px solid rgba(28, 31, 72, 0.16) !important;
  font-size: 0.8em !important;
}

/* Kill any remaining legacy color forcing */
${ROOT_SELECTOR} ${LEGACY_SELECTOR},
${ROOT_SELECTOR} ${LEGACY_SELECTOR} p,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} li,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} strong,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} h1,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} h2,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} h3,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} h4,
${ROOT_SELECTOR} ${LEGACY_SELECTOR} h5 {
  color: inherit !important;
}

@media (max-width: 767px) {
  ${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-hero {
    margin-bottom: 24px !important;
  }

  ${ROOT_SELECTOR} ${LEGACY_SELECTOR} figure,
  ${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-imgfig,
  ${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-photofig {
    margin: 24px 0 !important;
  }

  ${ROOT_SELECTOR} ${LEGACY_SELECTOR} .dri-related .dri-cols {
    grid-template-columns: 1fr !important;
  }

  ${ROOT_SELECTOR} ${LEGACY_SELECTOR} table {
    display: block !important;
    overflow-x: auto !important;
  }
}
`;

  const injectNormalizerStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  };

  const removeLegacyEmbeddedStyles = (root) => {
    root.querySelectorAll("style").forEach((style) => {
      const css = style.textContent || "";
      if (
        css.includes(".detect-dqp-article") ||
        css.includes(".dri-hero") ||
        css.includes(".dri-keytakeaways")
      ) {
        style.remove();
      }
    });
  };

  const normalize = () => {
    const root = document.querySelector(ROOT_SELECTOR);
    if (!root || !root.querySelector(LEGACY_SELECTOR)) return;

    removeLegacyEmbeddedStyles(root);
    injectNormalizerStyles();

    root.dataset.detectLegacyArticleNormalized = "true";
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", normalize, { once: true });
  } else {
    normalize();
  }
})();