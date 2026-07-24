const state = {
  content: null,
  account: JSON.parse(localStorage.getItem("elvAccount") || "null"),
  cart: JSON.parse(localStorage.getItem("elvQuoteCart") || "[]")
};

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function icon(name) {
  return `<span class="ui-icon" style="--icon-url:url('/assets/icons/${escapeHtml(name)}.svg')" aria-hidden="true"></span>`;
}

function initials(text) {
  return String(text || "ELV")
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function stripHtml(value) {
  const div = document.createElement("div");
  div.innerHTML = value || "";
  return div.textContent || div.innerText || "";
}

function absoluteUrl(path = location.pathname + location.search) {
  try {
    return new URL(path, location.origin).href;
  } catch (error) {
    return location.href;
  }
}

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

function upsertJsonLd(id, data) {
  let element = document.head.querySelector(`#${id}`);
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

function seoDescription(value) {
  const text = stripHtml(value || "").replace(/\s+/g, " ").trim();
  return text.length > 158 ? `${text.slice(0, 155).trim()}...` : text;
}

function setSeo({ title, description, image = "/assets/logo.jpeg", url = location.pathname + location.search, type = "website", schema = null }) {
  const fullTitle = title?.includes("ELV.art") ? title : `${title || "ELV.art"} | ELV.art Pakistan`;
  const desc = seoDescription(description || "ELV.art supplies and installs CCTV, access control, vehicle barriers, intercom, networking, fire alarm, AV, and ELV automation systems across Pakistan.");
  const canonical = absoluteUrl(url);
  const imageUrl = absoluteUrl(image);
  document.title = fullTitle;
  upsertMeta('meta[name="description"]', { name: "description", content: desc });
  upsertMeta('meta[name="robots"]', { name: "robots", content: "index, follow, max-image-preview:large" });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: desc });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: desc });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
  upsertLink("canonical", canonical);
  if (schema) upsertJsonLd("pageSchema", schema);
}

function organizationSchema() {
  const settings = state.content?.settings || {};
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": settings.brand || "ELV.art",
    "url": location.origin,
    "logo": absoluteUrl("/assets/logo.jpeg"),
    "image": absoluteUrl("/assets/generated/hero-elv-control-room.webp"),
    "telephone": settings.phone || "+92 332 4816433",
    "email": settings.email || "hello@elv.art",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PK"
    },
    "areaServed": [
      "Pakistan",
      "Karachi",
      "Lahore",
      "Islamabad",
      "Rawalpindi",
      "Faisalabad",
      "Multan",
      "Peshawar",
      "Quetta",
      "Sialkot",
      "Gujranwala",
      "Hyderabad"
    ],
    "serviceType": [
      "CCTV installation",
      "Access control systems",
      "Vehicle barrier installation",
      "ANPR camera systems",
      "Structured cabling",
      "Intercom systems",
      "Fire alarm systems",
      "ELV automation"
    ]
  };
}

function applyDefaultSeo() {
  const path = location.pathname;
  if (["/admin.html", "/dashboard.html", "/cart.html", "/verify.html", "/reset-password.html"].includes(path)) return;
  const defaults = {
    "/": {
      title: "ELV Systems, CCTV, Access Control & Automation in Pakistan",
      description: "ELV.art supplies, installs, and supports CCTV cameras, access control, vehicle barriers, ANPR, intercom, structured cabling, fire alarm, AV, and automation systems across Pakistan.",
      image: "/assets/generated/hero-elv-control-room.webp"
    },
    "/products.html": {
      title: "ELV Products in Pakistan - CCTV, Access Control, Barriers, Networks",
      description: "Browse ELV.art product families for CCTV, IP cameras, NVRs, access control, vehicle barriers, ANPR, PoE switches, intercom, fire alarm, and automation projects in Pakistan.",
      image: "/assets/generated/product-cctv-system.webp"
    },
    "/solutions.html": {
      title: "ELV Solutions in Pakistan - Security, Vehicle Access, Monitoring",
      description: "Explore interactive ELV solution scenes for CCTV monitoring, vehicle e-tag lanes, pedestrian access, VMS command views, access control, and automation across Pakistan.",
      image: "/assets/bick etag.webp"
    },
    "/about.html": {
      title: "About ELV.art Pakistan - ELV, Security & Automation Integrator",
      description: "ELV.art is an ELV systems company for Pakistan projects, supporting CCTV, access control, networks, intercom, fire alarm, AV, automation, installation, and maintenance.",
      image: "/assets/generated/hero-elv-control-room.webp"
    },
    "/contact.html": {
      title: "Contact ELV.art Pakistan - CCTV & ELV Project Quotations",
      description: "Contact ELV.art for CCTV installation, access control, vehicle barriers, ANPR, networking, intercom, fire alarm, and ELV automation project quotations in Pakistan.",
      image: "/assets/logo.jpeg"
    },
    "/case-studies.html": {
      title: "ELV Case Studies in Pakistan - CCTV, Access Control & Networks",
      description: "Review ELV.art case studies for CCTV, access control, vehicle access, network cabling, monitoring, and security upgrades.",
      image: "/assets/generated/case-study-hero.webp"
    },
    "/training.html": {
      title: "ELV Training Resources - CCTV, Access Control & Network Handover",
      description: "ELV.art training resources for CCTV commissioning, access control wiring, network racks, handover documents, and field installation support.",
      image: "/assets/generated/training-hero.webp"
    },
    "/downloads.html": {
      title: "ELV Downloads - Datasheets, Manuals, PDFs & Project Files",
      description: "Download ELV product datasheets, manuals, PDFs, ZIP files, checklists, and project documents for CCTV, access control, networking, and automation.",
      image: "/assets/generated/downloads-hero.webp"
    },
    "/blogs.html": {
      title: "ELV Blog Pakistan - CCTV, Access Control & Low Voltage Guides",
      description: "Read practical ELV guides about CCTV planning, access control, network cabling, fire alarm, intercom, automation, and security project planning in Pakistan.",
      image: "/assets/generated/hero-elv-control-room.webp"
    }
  };
  const meta = defaults[path] || defaults["/"];
  setSeo({ ...meta, url: path, schema: organizationSchema() });
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function saveCart() {
  localStorage.setItem("elvQuoteCart", JSON.stringify(state.cart));
}

function cartCount() {
  if (state.content) return cartRows().reduce((total, row) => total + row.qty, 0);
  return state.cart.reduce((total, item) => total + Number(item.qty || 0), 0);
}

const whatsappPrompts = [
  "Need info or quotation? Click me",
  "Ask for product support",
  "Send this page for pricing",
  "Need project advice?",
  "Talk to ELV.art now"
];

const whatsappMessages = [
  "Hello ELV.art, I need information about this page:",
  "Hello ELV.art, please send me a quotation for this page:",
  "Hello ELV.art, I want to discuss this product or service:",
  "Hello ELV.art, can you guide me about this solution?",
  "Hello ELV.art, I need support with this page:"
];

function whatsappLink(index = 0) {
  const settings = state.content?.settings || {};
  const phone = String(settings.whatsapp || settings.phone || "+971500000000").replace(/[^\d]/g, "");
  const text = `${whatsappMessages[index % whatsappMessages.length]} ${location.href}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function renderWhatsAppButton() {
  if (document.querySelector(".whatsapp-float")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <a class="whatsapp-float" href="${escapeHtml(whatsappLink())}" target="_blank" rel="noreferrer" aria-label="Contact on WhatsApp">
      <strong>${escapeHtml(whatsappPrompts[0])}</strong>
      <span>
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16.04 3.2A12.7 12.7 0 0 0 5.1 22.36L3.4 28.8l6.58-1.64A12.7 12.7 0 1 0 16.04 3.2Zm0 2.36a10.34 10.34 0 0 1 8.84 15.7 10.31 10.31 0 0 1-13.96 3.7l-.47-.28-3.9.98 1.01-3.8-.3-.49A10.34 10.34 0 0 1 16.04 5.56Zm-4.3 5.63c-.24 0-.62.09-.95.45-.33.36-1.25 1.22-1.25 2.97s1.28 3.45 1.46 3.69c.18.24 2.47 3.95 6.1 5.38 3.02 1.19 3.64.95 4.3.89.66-.06 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.69-.42-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.79-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.16-.73.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.6-.81-.61h-.69Z"/></svg>
      </span> WhatsApp
    </a>
  `);
  const button = document.querySelector(".whatsapp-float");
  const label = button.querySelector("strong");
  let index = 0;
  setInterval(() => {
    index = (index + 1) % whatsappPrompts.length;
    label.textContent = whatsappPrompts[index];
    button.href = whatsappLink(index);
  }, 4200);
}

function renderEnhancedFooter() {
  const footer = $(".site-footer");
  if (!footer || !state.content) return;
  const settings = state.content.settings || {};
  const topCategories = (state.content.superCategories || state.content.categories || []).slice(0, 5);
  footer.classList.add("site-footer-rich");
  footer.innerHTML = `
    <div class="footer-main">
      <div class="footer-brand">
        <img src="/assets/logo-nav.jpeg" alt="ELV.art">
        <p>${escapeHtml(settings.tagline || "Integrated low-voltage systems for secure, intelligent spaces.")}</p>
        <a class="button primary" href="${escapeHtml(whatsappLink(1))}" target="_blank" rel="noreferrer">${icon("message-circle")}Request Quotation</a>
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
        <div>
          <h3>Explore</h3>
          <a href="/products.html">Products</a>
          <a href="/solutions.html">Solutions</a>
          <a href="/case-studies.html">Case Study</a>
          <a href="/training.html">Training</a>
        </div>
        <div>
          <h3>Resources</h3>
          <a href="/downloads.html">Downloads</a>
          <a href="/blogs.html">Blogs</a>
          <a href="/dashboard.html">Signup / Login</a>
          <a href="/admin.html">Admin Panel</a>
        </div>
        <div>
          <h3>Contact</h3>
          <a href="tel:${escapeHtml(settings.phone || "")}">${escapeHtml(settings.phone || "Call ELV.art")}</a>
          <a href="mailto:${escapeHtml(settings.email || "")}">${escapeHtml(settings.email || "hello@elv.art")}</a>
          <span>${escapeHtml(settings.location || "Pakistan")}</span>
          <a href="/contact.html">Contact Form</a>
        </div>
      </nav>
    </div>
    <div class="footer-strip">
      <span>Product focus: ${topCategories.map(item => escapeHtml(item.name)).join(" / ") || "CCTV / Access Control / Networking"}</span>
      <span>© ${new Date().getFullYear()} ELV.art. Design, supply, training, support.</span>
    </div>
  `;
}

function renderBackButton() {
  const isHome = location.pathname === "/" || location.pathname.endsWith("/index.html");
  if (isHome || document.querySelector(".page-back-button")) return;
  const header = $(".site-header");
  if (!header) return;
  header.insertAdjacentHTML("afterend", `
    <button class="page-back-button" type="button" aria-label="Go back to previous page">
      <span aria-hidden="true">‹</span> Back
    </button>
  `);
  $(".page-back-button").addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  });
}

function itemSearchText(parts) {
  return parts
    .flat()
    .filter(Boolean)
    .map(value => stripHtml(String(value)))
    .join(" ")
    .toLowerCase();
}

function buildGlobalSearchItems() {
  if (!state.content) return [];
  const content = state.content;
  const categoryName = id => (content.categories || []).find(item => item.id === id)?.name || "";
  const productName = id => (content.products || []).find(item => item.id === id)?.name || "";
  const modelName = id => (content.models || []).find(item => item.id === id)?.name || "";
  return [
    ...(content.superCategories || []).map(item => ({
      type: "Product",
      title: item.name,
      summary: item.summary,
      url: `/products.html?super=${encodeURIComponent(item.id)}`,
      keywords: itemSearchText([item.name, item.summary])
    })),
    ...(content.categories || []).map(item => ({
      type: "Product Category",
      title: item.name,
      summary: item.summary,
      url: categoryUrl(item.id),
      keywords: itemSearchText([item.name, item.summary])
    })),
    ...(content.products || []).map(item => ({
      type: "Model Group",
      title: item.name,
      summary: item.summary || item.summaryHtml,
      url: productUrl(item.id),
      keywords: itemSearchText([item.name, item.summary, item.summaryHtml, item.segment, item.badge, item.features, item.specs, categoryName(item.categoryId)])
    })),
    ...(content.models || []).map(item => ({
      type: "Model",
      title: item.name,
      summary: item.summary || item.summaryHtml,
      url: modelUrl(item.id),
      keywords: itemSearchText([item.name, item.summary, item.summaryHtml, item.segment, item.badge, item.features, item.specs, productName(item.productId), categoryName(item.categoryId)])
    })),
    ...(content.parts || []).map(item => ({
      type: "Accessory",
      title: item.name,
      summary: item.summary || item.summaryHtml,
      url: partUrl(item.id),
      keywords: itemSearchText([item.name, item.summary, item.summaryHtml, item.segment, item.badge, item.features, item.specs, productName(item.productId), modelName(item.modelId)])
    })),
    ...(content.solutions || []).map(item => ({
      type: "Solution",
      title: item.title,
      summary: item.summary,
      url: solutionUrl(item.id || ""),
      keywords: itemSearchText([item.title, item.summary, item.outcomes, item.hotspots?.map(hotspot => [hotspot.title, hotspot.message])])
    })),
    ...(content.projects || []).map(item => ({
      type: "Case Study",
      title: item.title,
      summary: item.summary,
      url: `/case-study.html?id=${encodeURIComponent(item.id)}`,
      keywords: itemSearchText([item.title, item.summary, item.sections?.map(section => [section.heading, section.paragraph])])
    })),
    ...(content.trainings || []).map(item => ({
      type: "Training",
      title: item.title,
      summary: item.summary,
      url: trainingUrl(item.id),
      keywords: itemSearchText([item.title, item.summary, item.sections?.map(section => [section.heading, section.paragraph])])
    })),
    ...(content.downloads || []).map(item => ({
      type: "Download",
      title: item.title,
      summary: item.summary,
      url: downloadUrl(item.id),
      keywords: itemSearchText([item.title, item.summary, item.product, item.sections?.map(section => [section.heading, section.paragraph])])
    })),
    ...(content.blogs || []).map(item => ({
      type: "Blog",
      title: item.title,
      summary: item.summary,
      url: blogUrl(item.id),
      keywords: itemSearchText([item.title, item.summary, item.sections?.map(section => [section.heading, section.paragraph])])
    }))
  ];
}

function rankGlobalSearch(query, items) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return items
    .map(item => {
      const title = item.title.toLowerCase();
      let score = 0;
      terms.forEach(term => {
        if (title === term) score += 80;
        if (title.includes(term)) score += 35;
        if (item.keywords.includes(term)) score += 12;
      });
      if (title.startsWith(query.toLowerCase())) score += 30;
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 8);
}

function renderGlobalSearchResults(results, query) {
  const panel = $("#globalSearchResults");
  if (!panel) return;
  if (!query.trim()) {
    panel.innerHTML = "";
    panel.classList.remove("active");
    return;
  }
  panel.classList.add("active");
  panel.innerHTML = results.length ? `
    ${results.map(item => `
      <a class="global-search-result" href="${escapeHtml(item.url)}">
        <span>${escapeHtml(item.type)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.summary || "Open this page")}</small>
      </a>
    `).join("")}
  ` : `
    <div class="global-search-empty">
      <strong>No result found</strong>
      <small>Try product name, model, blog, download, training, or solution.</small>
    </div>
  `;
}

function renderGlobalSearch() {
  const header = $(".site-header");
  if (!header || header.querySelector(".global-search")) return;
  const nav = header.querySelector(".site-nav");
  const search = document.createElement("form");
  search.className = "global-search";
  search.setAttribute("role", "search");
  search.innerHTML = `
    ${icon("search")}
    <input id="globalSearchInput" type="search" autocomplete="off" placeholder="Search products, blogs, downloads...">
    <button class="global-search-clear" type="button" aria-label="Clear search">${icon("x")}</button>
    <div id="globalSearchResults" class="global-search-results"></div>
  `;
  header.insertBefore(search, nav);

  const items = buildGlobalSearchItems();
  const input = $("#globalSearchInput");
  const clear = $(".global-search-clear");
  search.addEventListener("submit", event => {
    event.preventDefault();
    const results = rankGlobalSearch(input.value, items);
    if (results[0]) window.location.href = results[0].url;
  });
  input.addEventListener("input", () => {
    const results = rankGlobalSearch(input.value, items);
    search.classList.toggle("has-value", Boolean(input.value.trim()));
    renderGlobalSearchResults(results, input.value);
  });
  input.addEventListener("focus", () => {
    const results = rankGlobalSearch(input.value, items);
    renderGlobalSearchResults(results, input.value);
  });
  clear.addEventListener("click", () => {
    input.value = "";
    search.classList.remove("has-value");
    renderGlobalSearchResults([], "");
    input.focus();
  });
  document.addEventListener("click", event => {
    if (!search.contains(event.target)) renderGlobalSearchResults([], "");
  });
}

function setupScrollMotion(root = document) {
  const selectors = [
    ".page-hero > *",
    ".hero-content > *",
    ".hero-live-scene",
    ".section",
    ".section-head",
    ".feature-card",
    ".product-card",
    ".project-card",
    ".resource-card",
    ".blog-card",
    ".solution-card",
    ".process-grid li",
    ".metric-grid div",
    ".case-section",
    ".detail-info",
    ".detail-media",
    ".product-showcase",
    ".product-story-main",
    ".product-story-side > div",
    ".product-value-grid article",
    ".cart-table-card",
    ".cart-summary",
    ".cart-row",
    ".auth-visual-card",
    ".auth-card",
    ".video-frame",
    ".download-links a",
    ".model-spec-grid span",
    ".technical-download-panel",
    ".viewer3d-panel",
    ".live-file-viewer"
  ];
  const sections = Array.from(new Set(selectors.flatMap(selector => $$(selector).filter(item => root === document || root.contains(item)))));
  if (!sections.length || !("IntersectionObserver" in window)) {
    sections.forEach(item => item.classList.add("motion-visible"));
    return;
  }
  sections.forEach((item, index) => {
    if (item.classList.contains("motion-visible")) return;
    item.classList.add("motion-ready");
    item.style.setProperty("--motion-delay", `${Math.min(index % 6, 5) * 55}ms`);
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("motion-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  sections.forEach(item => observer.observe(item));
}

async function api(path, options = {}) {
  const userHeaders = (path === "/api/content" || path === "/api/account") && state.account?.token ? { "X-User-Token": state.account.token } : {};
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...userHeaders, ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    Object.assign(error, data, { status: response.status });
    throw error;
  }
  return data;
}

function setFormStatus(element, message, type = "") {
  if (!element) return;
  element.classList.remove("success", "error", "info");
  if (type) element.classList.add(type);
  element.innerHTML = message;
}

function showResendVerification(email = "") {
  const form = $("#resendVerificationForm");
  if (!form) return;
  form.classList.remove("hidden");
  const input = form.querySelector("input[name='email']");
  if (input && email) input.value = email;
}

function setAuthTab(tab) {
  const showRegister = tab === "register";
  const loginForm = $("#loginUserForm");
  const registerForm = $("#registerForm");
  if (loginForm) loginForm.classList.toggle("hidden", showRegister);
  if (registerForm) registerForm.classList.toggle("hidden", !showRegister);
  $$("[data-auth-tab]").forEach(button => {
    const active = button.dataset.authTab === tab;
    button.classList.toggle("primary", active);
    button.classList.toggle("secondary", !active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function syncAccountFromContent() {
  if (!state.account || !state.content?.account) return;
  state.account = {
    ...state.account,
    user: {
      ...(state.account.user || {}),
      ...state.content.account
    }
  };
  localStorage.setItem("elvAccount", JSON.stringify(state.account));
}

function parsePriceNumber(value) {
  const numericText = String(value || "").replace(/[^\d.]/g, "");
  const number = numericText ? Number(numericText) : NaN;
  return Number.isFinite(number) ? number : NaN;
}

function rupee(value, minimumFractionDigits = 0) {
  return `Rs ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits: 2
  })}`;
}

function priceLabel(value) {
  const raw = String(value || "").trim();
  if (!raw || /^ask$/i.test(raw)) return "Ask";
  const number = parsePriceNumber(raw);
  if (!Number.isFinite(number)) return raw;
  return rupee(number);
}

function visiblePrices(product) {
  const prices = product.prices || {};
  const regular = prices.l1 || "Ask";
  const account = prices.l2;
  if (account) {
    return `
      <div class="price-list price-list-discount">
        <span class="regular-price"><small>Price</small>${escapeHtml(priceLabel(regular))}</span>
        <span class="account-price"><small>Your Price</small>${escapeHtml(priceLabel(account))}</span>
      </div>
    `;
  }
  return `
    <div class="price-list">
      <span class="simple-price">Price ${escapeHtml(priceLabel(regular))}</span>
    </div>
  `;
}

function activePrice(item) {
  const prices = item?.prices || {};
  const value = prices.l2 || prices.l1;
  const number = parsePriceNumber(value);
  return {
    label: priceLabel(value),
    amount: Number.isFinite(number) ? number : 0,
    quoteOnly: !Number.isFinite(number) || !value
  };
}

function money(value) {
  return rupee(value, 2);
}

function allSellableItems() {
  if (!state.content) return [];
  return [
    ...(state.content.products || []).map(item => ({ ...item, cartType: "product", cartLabel: "Model Group", url: productUrl(item.id) })),
    ...(state.content.models || []).map(item => ({ ...item, cartType: "model", cartLabel: "Model", url: modelUrl(item.id) })),
    ...(state.content.parts || []).map(item => ({ ...item, cartType: "part", cartLabel: "Accessory", url: partUrl(item.id) }))
  ];
}

function findSellableItem(type, id) {
  return allSellableItems().find(item => item.cartType === type && item.id === id);
}

function addToCart(type, id, qty = 1) {
  const item = findSellableItem(type, id);
  if (!item) return;
  const existing = state.cart.find(entry => entry.type === type && entry.id === id);
  if (existing) {
    existing.qty = Math.max(1, Number(existing.qty || 1) + qty);
  } else {
    state.cart.push({ type, id, qty: Math.max(1, qty) });
  }
  saveCart();
  renderCartNav();
  const button = document.querySelector(`[data-add-cart="${type}:${id}"]`);
  if (button) {
    button.innerHTML = `${icon("shopping-cart")}Added to Cart`;
    setTimeout(() => { button.innerHTML = `${icon("shopping-cart")}Add to Cart`; }, 1400);
  }
}

function cartRows() {
  return state.cart
    .map(entry => {
      const item = findSellableItem(entry.type, entry.id);
      if (!item) return null;
      const price = activePrice(item);
      const qty = Math.max(1, Number(entry.qty || 1));
      return { entry, item, price, qty, lineTotal: price.amount * qty };
    })
    .filter(Boolean);
}

function pricingLabelForRows(rows) {
  return rows.some(row => row.item?.prices?.l2) ? "Account pricing" : "Public pricing";
}

function quoteText(rows) {
  const settings = state.content?.settings || {};
  const customer = quoteCustomerDetails();
  const total = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  return [
    `${settings.brand || "ELV.art"} Quotation`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Customer: ${customer.name}`,
    customer.company ? `Company: ${customer.company}` : "",
    customer.email ? `Email: ${customer.email}` : "",
    customer.mobile ? `Mobile: ${customer.mobile}` : "",
    "",
    ...rows.map((row, index) => `${index + 1}. ${row.item.name} (${row.item.cartLabel}) - Qty ${row.qty} x ${row.price.label} = ${row.price.quoteOnly ? "Ask" : money(row.lineTotal)}`),
    "",
    `Total: ${money(total)}`,
    "",
    "Taxes are not included.",
    `Prices can go up or down because of inflation, exchange rates, stock, and project scope. For an accurate estimate, contact us on WhatsApp: ${settings.whatsapp || settings.phone || ""}`
  ].filter(Boolean).join("\n");
}

function quoteHtml(rows) {
  const settings = state.content?.settings || {};
  const customer = quoteCustomerDetails();
  const total = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(settings.brand || "ELV.art")} Quotation</title>
  <style>
    body{font-family:Arial,sans-serif;color:#102238;margin:40px}
    header{display:flex;justify-content:space-between;border-bottom:2px solid #0a3f98;padding-bottom:18px;margin-bottom:24px}
    h1{margin:0;color:#0a3f98}.muted{color:#637083}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th,td{border-bottom:1px solid #d7e1ed;padding:12px;text-align:left}
    th{background:#f5f8fb}.right{text-align:right}.total{font-size:20px;font-weight:700;color:#0a3f98}
    footer{margin-top:28px;color:#637083;font-size:13px}
  </style>
</head>
<body>
  <header>
    <div><h1>${escapeHtml(settings.brand || "ELV.art")} Quotation</h1><p><strong>Customer:</strong> ${escapeHtml(customer.name)}${customer.company ? `, ${escapeHtml(customer.company)}` : ""}</p></div>
    <div class="right"><strong>${new Date().toLocaleDateString()}</strong><br>${escapeHtml(settings.phone || "")}<br>${escapeHtml(settings.email || "")}</div>
  </header>
  <table>
    <thead><tr><th>#</th><th>Item</th><th>Type</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Line Total</th></tr></thead>
    <tbody>
      ${rows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.item.name)}</td><td>${escapeHtml(row.item.cartLabel)}</td><td class="right">${row.qty}</td><td class="right">${escapeHtml(row.price.label)}</td><td class="right">${row.price.quoteOnly ? "Ask" : money(row.lineTotal)}</td></tr>`).join("")}
    </tbody>
    <tfoot><tr><td colspan="5" class="right total">Total</td><td class="right total">${money(total)}</td></tr></tfoot>
  </table>
  <footer>Taxes are not included. Prices can go up or down because of inflation, exchange rates, stock availability, and project scope. For an accurate estimate, contact ELV.art on WhatsApp: ${escapeHtml(settings.whatsapp || settings.phone || "")}</footer>
</body>
</html>`;
}

function pdfSafe(value) {
  return String(value ?? "")
    .replace(/[\\()]/g, "\\$&")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrapPdfLine(value, max = 86) {
  const words = String(value ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach(word => {
    if (!current) {
      current = word;
      return;
    }
    if (`${current} ${word}`.length <= max) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function quoteCustomerDetails() {
  const account = state.content?.account || state.account?.user || {};
  return {
    name: account.fullName || "Website Customer",
    company: account.company || "",
    email: account.email || "",
    mobile: account.mobile || "",
    city: account.city || "",
    country: account.country || "",
    domain: account.domain || "",
    experience: account.experience || ""
  };
}

function pdfMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function makeQuotePdf(rows) {
  const settings = state.content?.settings || {};
  const brand = settings.brand || "ELV.art";
  const customer = quoteCustomerDetails();
  const total = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const quoteDate = new Date();
  const quoteNumber = `ELV-${quoteDate.toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
  const validUntil = new Date(quoteDate.getTime() + 15 * 24 * 60 * 60 * 1000);
  const whatsapp = settings.whatsapp || settings.phone || "+92 332 4816433";
  const itemRows = rows.map((row, index) => ({
    index: index + 1,
    name: row.item.name,
    type: row.item.cartLabel,
    qty: row.qty,
    unit: row.price.quoteOnly ? "Ask" : pdfMoney(row.price.amount),
    amount: row.price.quoteOnly ? "Ask" : pdfMoney(row.lineTotal)
  }));
  const rowsPerFirstPage = 12;
  const rowsPerNextPage = 18;
  const chunks = [];
  chunks.push(itemRows.slice(0, rowsPerFirstPage));
  for (let index = rowsPerFirstPage; index < itemRows.length; index += rowsPerNextPage) {
    chunks.push(itemRows.slice(index, index + rowsPerNextPage));
  }
  if (!chunks.length) chunks.push([]);

  const text = (value, x, y, size = 10, font = "F1") => `BT /${font} ${size} Tf ${x} ${y} Td (${pdfSafe(value)}) Tj ET`;
  const color = (r, g, b) => `${r} ${g} ${b} rg ${r} ${g} ${b} RG`;
  const rect = (x, y, w, h, mode = "S") => `${x} ${y} ${w} ${h} re ${mode}`;
  const line = (x1, y1, x2, y2) => `${x1} ${y1} m ${x2} ${y2} l S`;
  const fillText = (value, x, y, size, font, r, g, b) => `${color(r, g, b)}\n${text(value, x, y, size, font)}`;

  function drawHeader(pageNumber, totalPages) {
    const today = quoteDate.toLocaleDateString();
    const until = validUntil.toLocaleDateString();
    return [
      color(0.06, 0.21, 0.46),
      rect(32, 772, 531, 42, "f"),
      color(0.95, 0.98, 1),
      rect(32, 724, 531, 48, "f"),
      color(0.08, 0.28, 0.62),
      rect(32, 724, 531, 90, "S"),
      fillText("ELV", 50, 786, 28, "F2", 1, 1, 1),
      fillText(".art", 105, 786, 28, "F2", 0.45, 0.93, 0.52),
      fillText("Integrated ELV Solutions", 50, 744, 8, "F1", 0.36, 0.43, 0.52),
      fillText("QUOTATION", 408, 790, 21, "F2", 1, 1, 1),
      fillText("Quote #", 408, 758, 8, "F1", 0.36, 0.43, 0.52),
      fillText(quoteNumber, 468, 758, 8, "F2", 0.08, 0.13, 0.22),
      fillText("Date", 408, 744, 8, "F1", 0.36, 0.43, 0.52),
      fillText(today, 468, 744, 8, "F2", 0.08, 0.13, 0.22),
      fillText("Valid until", 408, 730, 8, "F1", 0.36, 0.43, 0.52),
      fillText(until, 468, 730, 8, "F2", 0.08, 0.13, 0.22),
      fillText(`Page ${pageNumber} of ${totalPages}`, 500, 706, 8, "F1", 0.36, 0.43, 0.52)
    ].join("\n");
  }

  function drawCustomerBlock() {
    const address = [customer.city, customer.country].filter(Boolean).join(", ");
    return [
      color(0.08, 0.28, 0.62),
      rect(32, 620, 250, 82, "S"),
      rect(32, 686, 250, 16, "f"),
      fillText("CUSTOMER", 42, 690, 9, "F2", 1, 1, 1),
      fillText(customer.name, 42, 668, 11, "F2", 0.08, 0.13, 0.22),
      customer.company ? fillText(customer.company, 42, 654, 9, "F1", 0.2, 0.28, 0.38) : "",
      address ? fillText(address, 42, 641, 9, "F1", 0.2, 0.28, 0.38) : "",
      customer.email ? fillText(customer.email, 42, 628, 9, "F1", 0.2, 0.28, 0.38) : "",
      customer.mobile ? fillText(customer.mobile, 160, 628, 9, "F1", 0.2, 0.28, 0.38) : "",
      color(0.88, 0.93, 0.99),
      rect(306, 620, 257, 82, "f"),
      color(0.7, 0.79, 0.9),
      rect(306, 620, 257, 82, "S"),
      fillText("Prepared by ELV.art", 322, 676, 12, "F2", 0.08, 0.13, 0.22),
      fillText(settings.phone ? `Phone: ${settings.phone}` : "Phone: +92 332 4816433", 322, 658, 9, "F1", 0.2, 0.28, 0.38),
      fillText(settings.email ? `Email: ${settings.email}` : "Email: info@elv.art", 322, 644, 9, "F1", 0.2, 0.28, 0.38),
      fillText("Prepared from website quotation cart", 322, 630, 9, "F1", 0.2, 0.28, 0.38)
    ].filter(Boolean).join("\n");
  }

  function drawTableHeader(y) {
    return [
      color(0.08, 0.28, 0.62),
      rect(32, y, 531, 24, "f"),
      color(0.08, 0.28, 0.62),
      line(32, y, 563, y),
      fillText("#", 42, y + 9, 8, "F2", 1, 1, 1),
      fillText("PRODUCT / DESCRIPTION", 72, y + 9, 8, "F2", 1, 1, 1),
      fillText("UNIT PRICE", 364, y + 9, 8, "F2", 1, 1, 1),
      fillText("QTY", 456, y + 9, 8, "F2", 1, 1, 1),
      fillText("AMOUNT", 508, y + 9, 8, "F2", 1, 1, 1)
    ].join("\n");
  }

  function drawItemRows(chunk, startY) {
    const ops = [];
    let y = startY;
    chunk.forEach((item, index) => {
      const fill = index % 2 === 0 ? "0.97 0.98 1 rg" : "1 1 1 rg";
      ops.push(fill, rect(32, y - 27, 531, 28, "f"));
      ops.push(color(0.75, 0.82, 0.9), line(32, y - 27, 563, y - 27));
      ops.push(fillText(String(item.index), 42, y - 9, 8, "F1", 0.08, 0.13, 0.22));
      ops.push(fillText(String(item.name).slice(0, 48), 72, y - 8, 8, "F2", 0.08, 0.13, 0.22));
      ops.push(fillText(String(item.type).slice(0, 42), 72, y - 21, 7, "F1", 0.38, 0.45, 0.55));
      ops.push(fillText(item.unit === "Ask" ? "On Request" : `Rs ${item.unit}`, 364, y - 9, 8, "F1", 0.08, 0.13, 0.22));
      ops.push(fillText(String(item.qty), 462, y - 9, 8, "F1", 0.08, 0.13, 0.22));
      ops.push(fillText(item.amount === "Ask" ? "On Request" : `Rs ${item.amount}`, 508, y - 9, 8, "F1", 0.08, 0.13, 0.22));
      y -= 28;
    });
    ops.push(color(0.75, 0.82, 0.9), line(62, startY, 62, y), line(350, startY, 350, y), line(444, startY, 444, y), line(492, startY, 492, y));
    ops.push(color(0.08, 0.28, 0.62), rect(32, y, 531, startY - y, "S"));
    return ops.join("\n");
  }

  function drawTotals(y) {
    return [
      color(0.96, 0.98, 1),
      rect(372, y - 42, 191, 42, "f"),
      color(0.08, 0.28, 0.62),
      rect(372, y - 42, 191, 42, "S"),
      fillText("Subtotal", 386, y - 16, 9, "F1", 0.2, 0.28, 0.38),
      fillText(`Rs ${pdfMoney(total)}`, 482, y - 16, 10, "F2", 0.08, 0.13, 0.22),
      fillText("Total", 386, y - 33, 12, "F2", 0.08, 0.13, 0.22),
      fillText(`Rs ${pdfMoney(total)}`, 482, y - 33, 12, "F2", 0.08, 0.28, 0.62)
    ].join("\n");
  }

  function drawTerms(y) {
    const note = "Prices can go up or down because of inflation, exchange rates, stock availability, and project scope.";
    return [
      color(0.08, 0.28, 0.62),
      rect(32, y, 531, 22, "f"),
      fillText("TERMS AND NOTES", 44, y + 8, 9, "F2", 1, 1, 1),
      color(0.96, 0.98, 1),
      rect(32, y - 64, 531, 64, "f"),
      color(0.7, 0.79, 0.9),
      rect(32, y - 64, 531, 64, "S"),
      fillText("1. Taxes are not included in this quotation.", 44, y - 17, 8, "F1", 0.08, 0.13, 0.22),
      fillText(`2. ${note}`, 44, y - 33, 8, "F1", 0.08, 0.13, 0.22),
      fillText(`3. For an accurate estimate, contact ELV.art on WhatsApp: ${whatsapp}`, 44, y - 49, 8, "F1", 0.08, 0.13, 0.22),
      fillText("Thank you for choosing ELV.art.", 224, y - 86, 9, "F2", 0.08, 0.28, 0.62)
    ].join("\n");
  }

  const pageContents = chunks.map((chunk, index) => {
    const firstPage = index === 0;
    const tableHeaderY = firstPage ? 558 : 672;
    const rowStartY = tableHeaderY;
    const rowsBottom = rowStartY - chunk.length * 28;
    const totalsY = Math.max(rowsBottom - 22, 156);
    const termsY = Math.max(totalsY - 92, 104);
    return [
      drawHeader(index + 1, chunks.length),
      firstPage ? drawCustomerBlock() : "",
      drawTableHeader(tableHeaderY),
      drawItemRows(chunk, rowStartY),
      index === chunks.length - 1 ? drawTotals(totalsY) : "",
      index === chunks.length - 1 ? drawTerms(termsY) : ""
    ].filter(Boolean).join("\n");
  });

  const objects = [];
  const addObject = value => {
    objects.push(value);
    return objects.length;
  };

  const catalogId = addObject("");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];

  pageContents.forEach(content => {
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function quotePdfFileName() {
  return `ELV-art-quotation-${new Date().toISOString().slice(0, 10)}.pdf`;
}

function downloadQuotePdf(rows) {
  const blob = makeQuotePdf(rows);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = quotePdfFileName();
  link.click();
  URL.revokeObjectURL(url);
  return blob;
}

async function shareQuoteOnWhatsApp(rows) {
  if (!rows.length) return;
  const settings = state.content?.settings || {};
  const blob = makeQuotePdf(rows);
  const file = new File([blob], quotePdfFileName(), { type: "application/pdf" });
  const total = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const message = [
    "Hello ELV.art, I want to discuss this quotation.",
    `Items: ${rows.reduce((sum, row) => sum + row.qty, 0)}`,
    `Total: ${money(total)}`,
    "Please confirm the latest price and availability."
  ].join("\n");

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({
      title: `${settings.brand || "ELV.art"} quotation`,
      text: message,
      files: [file]
    });
    return;
  }

  downloadQuotePdf(rows);
  window.open(whatsappLink(1), "_blank", "noopener,noreferrer");
  alert("Your quotation PDF has been downloaded. Attach that PDF in the WhatsApp chat that just opened.");
}

function renderCartNav() {
  $$(".site-nav").forEach(nav => {
    let link = nav.querySelector("[data-cart-link]");
    if (!link) {
      link = document.createElement("a");
      link.href = "/cart.html";
      link.dataset.cartLink = "true";
      nav.appendChild(link);
    }
    link.innerHTML = `${icon("shopping-cart")}Cart (${cartCount()})`;
  });
}

function accountDisplayName() {
  return state.account?.user?.fullName || state.account?.user?.email || "Account";
}

function accountInitials() {
  return initials(accountDisplayName()).slice(0, 2);
}

function renderAccountNav() {
  $$(".site-nav").forEach(nav => {
    const link = nav.querySelector(".nav-admin");
    if (!link) return;
    nav.querySelectorAll("[data-account-menu]").forEach(menu => menu.remove());
    link.classList.remove("account-trigger", "account-open");
    delete link.dataset.accountTrigger;
    if (!state.account) {
      link.href = "/dashboard.html";
      link.innerHTML = "Signup / Login";
      return;
    }
    link.href = "#account";
    link.dataset.accountTrigger = "true";
    link.classList.add("account-trigger");
    link.innerHTML = `<span class="account-avatar">${escapeHtml(accountInitials())}</span><span>${escapeHtml(accountDisplayName())}</span><span class="account-caret">▾</span>`;
    link.insertAdjacentHTML("afterend", `
      <div class="account-dropdown" data-account-menu>
        <strong>${escapeHtml(accountDisplayName())}</strong>
        <small>${escapeHtml(state.account.user.email || "")}</small>
        <a href="/dashboard.html#account-info">Change Info</a>
        <button type="button" data-account-logout>Logout</button>
      </div>
    `);
  });
}

function closeAccountMenus() {
  $$("[data-account-menu]").forEach(menu => menu.classList.remove("active"));
  $$("[data-account-trigger]").forEach(trigger => trigger.classList.remove("account-open"));
}

function logoutAccount() {
  localStorage.removeItem("elvAccount");
  state.account = null;
  renderAccount();
  renderProducts();
  renderCartPage();
  renderCartNav();
  renderAccountNav();
}

function categoryUrl(id) {
  return `/category.html?id=${encodeURIComponent(id)}`;
}

function productUrl(id) {
  return `/product.html?id=${encodeURIComponent(id)}`;
}

function solutionUrl(id) {
  return `/solution.html?id=${encodeURIComponent(id)}`;
}

function targetUrl(target) {
  const [type, id] = String(target || "").split(":");
  if (!id) return "#";
  if (type === "product") return productUrl(id);
  if (type === "model") return modelUrl(id);
  if (type === "part") return partUrl(id);
  return "#";
}

function modelUrl(id) {
  return `/model.html?id=${encodeURIComponent(id)}`;
}

function partUrl(id) {
  return `/part.html?id=${encodeURIComponent(id)}`;
}

function trainingUrl(id) {
  return `/training-detail.html?id=${encodeURIComponent(id)}`;
}

function downloadUrl(id) {
  return `/download-detail.html?id=${encodeURIComponent(id)}`;
}

function blogUrl(id) {
  return `/blog-detail.html?id=${encodeURIComponent(id)}`;
}

function productFlowCard(row) {
  const type = row.type || "Product";
  const title = row.title || row.name || "";
  const summary = row.summary || "";
  const image = row.image || "";
  const url = row.url || "#";
  const meta = row.meta || [];
  const specs = row.specs || [];
  const price = row.priceItem ? visiblePrices(row.priceItem) : "";
  const action = row.action || `View ${type}`;
  return `
    <article class="product-card product-flow-card">
      <a class="product-image" href="${escapeHtml(url)}">
        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : escapeHtml(initials(title))}
      </a>
      <div class="product-content">
        <div class="family-meta-row">
          <span class="badge">${escapeHtml(type)}</span>
          <span class="family-type">${escapeHtml(meta[0] || "")}</span>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(summary)}</p>
        ${specs.length ? `<div class="model-spec-strip">${specs.slice(0, 3).map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
        ${meta.slice(1).length ? `<div class="family-detail-tags">${meta.slice(1).map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
        ${price}
        <div class="product-card-actions"><a class="button secondary" href="${escapeHtml(url)}">${icon("eye")}${escapeHtml(action)}</a></div>
      </div>
    </article>
  `;
}

function youtubeEmbedUrl(url) {
  const text = String(url || "");
  try {
    const parsed = new URL(text);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    const watchId = parsed.searchParams.get("v");
    if (watchId) return `https://www.youtube.com/embed/${watchId}`;
    const shorts = parsed.pathname.match(/\/shorts\/([^/]+)/);
    if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
    const embed = parsed.pathname.match(/\/embed\/([^/]+)/);
    if (embed) return `https://www.youtube.com/embed/${embed[1]}`;
  } catch (error) {
    return "";
  }
  return "";
}

function renderCategories() {
  const grid = $("#categoryGrid");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const selectedSuper = params.get("super") || "";
  const search = ($("#productFamilySearch")?.value || "").trim().toLowerCase();
  const scope = $("#productFamilyScope")?.value || "";
  const type = $("#productFamilyType")?.value || selectedSuper;
  const fileFilter = $("#productFamilyFile")?.value || "";
  const superCategories = state.content.superCategories || [];
  const typeSelect = $("#productFamilyType");
  if (typeSelect && typeSelect.options.length <= 1) {
    typeSelect.innerHTML = `<option value="">All Products</option>${superCategories.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}`;
    if (selectedSuper) typeSelect.value = selectedSuper;
  }
  const superName = id => superCategories.find(item => item.id === id)?.name || "Product";
  const localCategory = id => state.content.categories.find(item => item.id === id);
  const localProduct = id => state.content.products.find(item => item.id === id);
  const hasFiles = item => ["datasheet", "manual", "model3d", "cad"].some(field => item[field]);
  const rows = [
    ...superCategories.map(product => {
      const categoryCount = (state.content.categories || []).filter(category => category.superCategoryId === product.id).length;
      return {
        kind: "super",
        type: "Product",
        title: product.name,
        summary: product.summary,
        image: product.image,
        url: `/products.html?super=${encodeURIComponent(product.id)}`,
        productId: product.id,
        meta: [`${categoryCount} product categories`],
        action: "View Categories",
        fileState: { image: Boolean(product.image), files: false, price: false }
      };
    }),
    ...(state.content.categories || []).map(category => {
      const modelCount = (state.content.products || []).filter(product => product.categoryId === category.id).length;
      return {
        kind: "category",
        type: "Product Category",
        title: category.name,
        summary: category.summary,
        image: category.image,
        url: categoryUrl(category.id),
        productId: category.superCategoryId,
        meta: [superName(category.superCategoryId), `${modelCount} model groups`],
        fileState: { image: Boolean(category.image), files: false, price: false }
      };
    }),
    ...(state.content.products || []).map(product => {
      const category = localCategory(product.categoryId);
      return {
        kind: "product",
        type: "Model Group",
        title: product.name,
        summary: product.summary,
        image: product.image,
        url: productUrl(product.id),
        productId: category?.superCategoryId || "",
        meta: [category?.name || "Product Category", product.segment || product.status || "Model Group"],
        fileState: { image: Boolean(product.image), files: hasFiles(product), price: Boolean(product.prices?.l1) }
      };
    }),
    ...(state.content.models || []).map(model => {
      const parent = localProduct(model.productId);
      const category = localCategory(model.categoryId || parent?.categoryId);
      return {
        kind: "model",
        type: "Model",
        title: model.name,
        summary: model.summary,
        image: model.image,
        url: modelUrl(model.id),
        productId: category?.superCategoryId || "",
        meta: [parent?.name || category?.name || "Model Group", model.segment || model.status || "Model"],
        fileState: { image: Boolean(model.image), files: hasFiles(model), price: Boolean(model.prices?.l1) }
      };
    }),
    ...(state.content.parts || []).map(part => {
      const parent = localProduct(part.productId);
      const category = localCategory(part.categoryId || parent?.categoryId);
      return {
        kind: "part",
        type: "Accessory",
        title: part.name,
        summary: part.summary || stripHtml(part.summaryHtml),
        image: part.image,
        url: partUrl(part.id),
        productId: category?.superCategoryId || "",
        meta: [parent?.name || category?.name || "Model Group", part.segment || part.status || "Accessory"],
        fileState: { image: Boolean(part.image), files: hasFiles(part), price: Boolean(part.prices?.l1) }
      };
    })
  ].filter(row => {
    const haystack = [row.type, row.title, row.summary, row.meta.join(" ")].join(" ").toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if (scope && row.kind !== scope) return false;
    if (type && row.productId !== type) return false;
    if (!search && !scope && !type && row.kind !== "super") return false;
    if (!search && !scope && type && row.kind !== "category") return false;
    if (fileFilter === "with-image" && !row.fileState.image) return false;
    if (fileFilter === "with-files" && !row.fileState.files) return false;
    if (fileFilter === "with-price" && !row.fileState.price) return false;
    return true;
  });
  const stats = $("#productFamilyStats");
  if (stats) stats.innerHTML = `<strong>${rows.length}</strong><span>shown</span>`;
  const heading = document.querySelector("[data-product-page-title]");
  if (heading) heading.textContent = type ? `${superName(type)} Categories` : "Products";
  grid.innerHTML = rows.map(row => productFlowCard(row)).join("") || `<p>No product results match your search.</p>`;

  const serviceSelect = $("#serviceSelect");
  if (serviceSelect) {
    serviceSelect.innerHTML = state.content.categories
      .map(category => `<option>${escapeHtml(category.name)}</option>`)
      .join("");
  }
}

function renderProducts() {
  const grid = $("#productGrid");
  if (!grid) return;
  const limit = Number(grid.dataset.limit || 0);
  const categoryId = grid.dataset.category || new URLSearchParams(location.search).get("category");
  let products = categoryId ? state.content.products.filter(product => product.categoryId === categoryId) : state.content.products;
  if (!categoryId && limit) {
    const homeProducts = products.filter(product => product.homeFeatured);
    if (homeProducts.length) products = homeProducts;
  }
  products = limit ? products.slice(0, limit) : products;
  grid.innerHTML = products.map(product => productFlowCard({
    type: product.segment || product.status || "Model Group",
    title: product.name,
    summary: product.summary,
    image: product.image,
    url: productUrl(product.id),
    meta: [product.status || "Available"],
    priceItem: product,
    action: "View Details"
  })).join("");

  $$("[data-product]").forEach(button => button.addEventListener("click", () => openProduct(button.dataset.product)));
}

function modelGroupRows(product) {
  const models = (state.content.models || []).filter(model => model.productId === product.id);
  const modelIds = new Set(models.map(model => model.id));
  const accessories = (state.content.parts || []).filter(part => part.productId === product.id && modelIds.has(part.modelId));
  const hasFiles = item => ["datasheet", "manual", "model3d", "cad"].some(field => item[field]);
  return [
    ...models.map(model => ({
      kind: "model",
      type: "Model",
      title: model.name,
      summary: model.summary || stripHtml(model.summaryHtml),
      image: model.image,
      url: modelUrl(model.id),
      meta: [model.segment || product.segment || "Model", model.status || "Available"],
      specs: model.specs || [],
      priceItem: model,
      fileState: { image: Boolean(model.image), files: hasFiles(model), price: Boolean(model.prices?.l1) }
    })),
    ...accessories.map(part => ({
      kind: "part",
      type: "Accessory",
      title: part.name,
      summary: part.summary || stripHtml(part.summaryHtml),
      image: part.image,
      url: partUrl(part.id),
      meta: [part.segment || "Accessory", part.status || "Compatible"],
      specs: part.specs || [],
      priceItem: part,
      fileState: { image: Boolean(part.image), files: hasFiles(part), price: Boolean(part.prices?.l1) }
    }))
  ];
}

function renderModelGroupCatalog(product) {
  const grid = $("#modelGroupGrid");
  if (!grid) return;
  const search = ($("#modelGroupSearch")?.value || "").trim().toLowerCase();
  const scope = $("#modelGroupScope")?.value || "";
  const fileFilter = $("#modelGroupFile")?.value || "";
  const status = $("#modelGroupStatus")?.value || "";
  const statusSelect = $("#modelGroupStatus");
  const allRows = modelGroupRows(product);
  if (statusSelect && statusSelect.options.length <= 1) {
    const statuses = [...new Set(allRows.flatMap(row => row.meta).filter(Boolean))].sort();
    statusSelect.innerHTML = `<option value="">Any Series or Badge</option>${statuses.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}`;
  }
  const rows = allRows.filter(row => {
    const haystack = [row.type, row.title, row.summary, row.meta.join(" "), row.specs.join(" ")].join(" ").toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if (scope && row.kind !== scope) return false;
    if (status && !row.meta.includes(status)) return false;
    if (fileFilter === "with-image" && !row.fileState.image) return false;
    if (fileFilter === "with-files" && !row.fileState.files) return false;
    if (fileFilter === "with-price" && !row.fileState.price) return false;
    return true;
  });
  const stats = $("#modelGroupStats");
  if (stats) stats.innerHTML = `<strong>${rows.length}</strong><span>shown</span>`;
  grid.innerHTML = rows.map(row => productFlowCard({
    ...row,
    action: `View ${row.type}`
  })).join("") || `
    <div class="catalog-empty-state">
      <h3>No models added yet</h3>
      <p>Accessories will appear here only after they are added under a model in the admin panel.</p>
    </div>
  `;
}

function renderCategoryDetail() {
  const detail = $("#categoryDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const category = state.content.categories.find(item => item.id === id) || state.content.categories[0];
  const products = state.content.products.filter(product => product.categoryId === category.id);
  setSeo({
    title: `${category.name} products in Pakistan`,
    description: `${category.summary} Browse related ELV model groups, prices, datasheets, manuals, and project-ready product options across Pakistan.`,
    image: category.image || "/assets/generated/product-cctv-system.webp",
    url: categoryUrl(category.id),
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${category.name} products`,
      "description": category.summary,
      "url": absoluteUrl(categoryUrl(category.id))
    }
  });
  detail.innerHTML = `
    <section class="page-hero">
      <p class="eyebrow">Product Category</p>
      <h1>${escapeHtml(category.name)}</h1>
      <p>${escapeHtml(category.summary)}</p>
    </section>
    <section class="section">
      <div class="section-head">
        <div><p class="eyebrow">Model Groups</p><h2>Products in this category</h2></div>
        <a class="button secondary" href="/products.html">All Categories</a>
      </div>
      <div class="product-grid">
        ${products.map(product => productFlowCard({
          type: product.segment || product.status || "Model Group",
          title: product.name,
          summary: product.summary,
          image: product.image,
          url: productUrl(product.id),
          meta: [product.status || "Available"],
          priceItem: product,
          action: "View Details"
        })).join("") || "<p>No products in this category yet.</p>"}
      </div>
    </section>
  `;
}

function renderSolutions() {
  const list = $("#solutionList");
  if (!list) return;
  const limit = list.classList.contains("solution-preview") ? 3 : 0;
  const solutions = limit ? state.content.solutions.slice(0, limit) : state.content.solutions;
  list.innerHTML = solutions.map(solution => `
    <article class="solution-card interactive-solution-card solution-summary-card" id="${escapeHtml(solution.id || "")}">
      ${renderSolutionScene(solution, { preview: true })}
      <div class="solution-copy">
        <strong>${escapeHtml(solution.title)}</strong>
        <p>${escapeHtml(solution.summary)}</p>
        <p>${(solution.outcomes || []).map(escapeHtml).join(" / ")}</p>
        <a class="solution-open-label" href="${escapeHtml(solutionUrl(solution.id || ""))}">Open Solution</a>
      </div>
    </article>
  `).join("");
  $$(".solution-summary-card").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("a")) return;
      const link = card.querySelector(".solution-open-label");
      if (link) location.href = link.href;
    });
  });
}

function renderSolutionScene(solution, options = {}) {
  if (!solution?.image) return "";
  const preview = Boolean(options.preview);
  return `
    <div class="solution-scene ${preview ? "solution-scene-preview" : "solution-scene-detail"}">
      <div class="solution-image-map">
        <img src="${escapeHtml(solution.image)}" alt="${escapeHtml(solution.title)}">
        ${(solution.hotspots || []).map((hotspot, index) => `
          <a class="solution-hotspot ${Number(hotspot.x || 0) > 68 ? "bubble-left" : ""} ${Number(hotspot.y || 0) < 24 ? "bubble-low" : ""}" href="${escapeHtml(preview ? solutionUrl(solution.id || "") : targetUrl(hotspot.target))}" style="left:${escapeHtml(hotspot.x ?? 50)}%;top:${escapeHtml(hotspot.y ?? 50)}%;--hotspot-delay:${(index % 6) * 0.32}s" aria-label="${escapeHtml(preview ? `Open ${solution.title}` : hotspot.title || `Open product ${index + 1}`)}">
            <span></span>
            <em><strong>${escapeHtml(hotspot.title || "Product")}</strong>${escapeHtml(hotspot.message || "View related product")}</em>
          </a>
        `).join("")}
      </div>
    </div>
  `;
}

function renderProjects() {
  const grid = $("#projectGrid");
  if (!grid) return;
  grid.innerHTML = state.content.projects.map(project => `
    <article class="project-card">
      <div class="project-image">${project.image ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}">` : escapeHtml(project.sector || "Case")}</div>
      <div class="product-content">
        <span class="badge">${escapeHtml(project.sector || "Case Study")}</span>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.summary)}</p>
        <a class="button secondary" href="/case-study.html?id=${encodeURIComponent(project.id)}">View Case Study</a>
      </div>
    </article>
  `).join("");
}

function renderSolutionDetail() {
  const detail = $("#solutionDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const solution = (state.content.solutions || []).find(item => item.id === id) || (state.content.solutions || [])[0];
  if (!solution) {
    detail.innerHTML = `<section class="page-hero"><p class="eyebrow">Solutions</p><h1>No solution found</h1><p>This solution has not been added yet.</p></section>`;
    return;
  }
  const sections = Array.isArray(solution.sections) && solution.sections.length
    ? solution.sections
    : [{ heading: "Interactive Diagram", paragraph: "Hover a product point to preview it, then click it to open the linked catalog item." }];
  setSeo({
    title: `${solution.title} solution in Pakistan`,
    description: `${solution.summary || ""} Interactive ELV solution for ${solution.status || "security and automation"} projects across Pakistan.`,
    image: solution.image || "/assets/generated/hero-elv-control-room.webp",
    url: solutionUrl(solution.id),
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": solution.title,
      "description": solution.summary,
      "provider": organizationSchema(),
      "areaServed": "Pakistan",
      "serviceType": solution.status || "ELV Solution"
    }
  });
  detail.innerHTML = `
    <section class="solution-detail-shell">
      <div class="solution-detail-top">
        <div>
          <p class="eyebrow">${escapeHtml(solution.status || "Solution")}</p>
          <h1>${escapeHtml(solution.title)}</h1>
          <p>${escapeHtml(solution.summary || "")}</p>
        </div>
        <div class="solution-detail-actions">
          <a class="button secondary" href="/solutions.html">Back to Solutions</a>
          <a class="button primary" href="${escapeHtml(whatsappLink(3))}" target="_blank" rel="noreferrer">${icon("message-circle")}Discuss This Solution</a>
        </div>
      </div>
      ${(solution.outcomes || []).length ? `
        <div class="solution-detail-outcomes">
          ${(solution.outcomes || []).map(outcome => `<span>${escapeHtml(outcome)}</span>`).join("")}
        </div>
      ` : ""}
      <div class="solution-detail-stage">
        ${renderSolutionScene(solution)}
      </div>
      <div class="solution-detail-guide">
        <div class="solution-guide-head">
          <p class="eyebrow">Interactive Diagram</p>
          <h2>Hover a product point. Click it to open the linked catalog item.</h2>
        </div>
        <div class="solution-detail-paragraphs">
          ${sections.map((section, index) => `
            <article>
              <span>${String(index + 1).padStart(2, "0")}</span>
              ${section.heading ? `<h3>${escapeHtml(section.heading)}</h3>` : ""}
              <p>${escapeHtml(section.paragraph || "")}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCaseStudyDetail() {
  const detail = $("#caseStudyDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const item = state.content.projects.find(project => project.id === id) || state.content.projects[0];
  if (!item) {
    detail.innerHTML = `<section class="page-hero"><p class="eyebrow">Case Study</p><h1>No case study found</h1></section>`;
    return;
  }
  const sections = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: item.sector || "Project Overview", paragraph: item.summary || "", image: item.image || "" }];
  setSeo({
    title: `${item.title} case study`,
    description: item.summary || sections.map(section => section.paragraph).join(" "),
    image: item.image || sections.find(section => section.image)?.image || "/assets/generated/case-study-hero.webp",
    url: `/case-study.html?id=${encodeURIComponent(item.id)}`,
    type: "article",
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": item.title,
      "description": item.summary,
      "image": absoluteUrl(item.image || "/assets/generated/case-study-hero.webp"),
      "author": { "@type": "Organization", "name": "ELV.art" },
      "publisher": organizationSchema()
    }
  });
  detail.innerHTML = `
    <section class="case-hero">
      <div class="case-hero-image">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : ""}</div>
      <div class="case-hero-content">
        <p class="eyebrow">Case Study</p>
        <h1>${escapeHtml(item.title)}</h1>
        <p>${escapeHtml(item.summary || "")}</p>
        <a class="button secondary" href="/case-studies.html">Back to Case Studies</a>
      </div>
    </section>
    <section class="section case-detail">
      ${sections.map((section, index) => `
        <article class="case-section ${section.image ? "has-image" : "text-only"} ${index % 2 ? "image-left" : "image-right"}">
          <div>
            <p class="eyebrow">${String(index + 1).padStart(2, "0")}</p>
            ${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}
            <p>${escapeHtml(section.paragraph)}</p>
          </div>
          ${section.image ? `<img src="${escapeHtml(section.image)}" alt="${escapeHtml(section.heading)}">` : ""}
        </article>
      `).join("")}
    </section>
  `;
}

function renderResources() {
  const trainingGrid = $("#trainingGrid");
  if (trainingGrid) trainingGrid.innerHTML = (state.content.trainings || []).map(item => `
    <article class="product-card">
      <a class="product-image" href="${trainingUrl(item.id)}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : escapeHtml(initials(item.title))}</a>
      <div class="product-content">
        <span class="badge">${escapeHtml(item.topic || "Training")}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <a class="button secondary" href="${trainingUrl(item.id)}">Open Training</a>
      </div>
    </article>
  `).join("");

  const downloadGrid = $("#downloadGrid");
  if (downloadGrid) downloadGrid.innerHTML = (state.content.downloads || []).map(item => `
    <article class="resource-card">
      <span class="badge">${escapeHtml(item.product || "Software")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <a class="button secondary" href="${downloadUrl(item.id)}">View Files</a>
    </article>
  `).join("");

  const blogGrid = $("#blogGrid");
  if (blogGrid) blogGrid.innerHTML = (state.content.blogs || []).map(item => `
    <article class="blog-card">
      ${item.image ? `<a class="blog-card-media" href="${blogUrl(item.id)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"></a>` : ""}
      <span class="badge">${escapeHtml(item.date || "Blog")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <a class="button secondary" href="${blogUrl(item.id)}">Read Blog</a>
    </article>
  `).join("");
}

function renderBlogDetail() {
  const detail = $("#blogDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const item = (state.content.blogs || []).find(blog => blog.id === id) || (state.content.blogs || [])[0];
  if (!item) {
    detail.innerHTML = `<section class="page-hero"><p class="eyebrow">Blogs</p><h1>No blog found</h1></section>`;
    return;
  }
  const sections = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: "", paragraph: item.body || item.summary || "", image: "" }];
  const videoLinks = Array.isArray(item.videoLinks) && item.videoLinks.length ? item.videoLinks : [item.videoUrl].filter(Boolean);
  const videos = videoLinks.map(link => ({ link, embed: youtubeEmbedUrl(link) })).filter(video => video.link);
  setSeo({
    title: `${item.title} - ELV guide Pakistan`,
    description: item.summary || sections.map(section => section.paragraph).join(" "),
    image: item.image || sections.find(section => section.image)?.image || "/assets/generated/hero-elv-control-room.webp",
    url: blogUrl(item.id),
    type: "article",
    schema: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": item.title,
      "description": item.summary,
      "image": absoluteUrl(item.image || "/assets/generated/hero-elv-control-room.webp"),
      "author": { "@type": "Organization", "name": "ELV.art" },
      "publisher": organizationSchema()
    }
  });
  detail.innerHTML = `
    <section class="page-hero">
      <p class="eyebrow">${escapeHtml(item.date || "Blog")}</p>
      <h1>${escapeHtml(item.title)}</h1>
      <p>${escapeHtml(item.summary || "")}</p>
    </section>
    <section class="section blog-top-media">
      ${videos.length ? `
        <div class="video-grid">
          ${videos.map((video, index) => `
            <article class="video-frame">
              ${video.embed ? `<iframe src="${escapeHtml(video.embed)}" title="${escapeHtml(item.title)} video ${index + 1}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : `<a class="button secondary" href="${escapeHtml(video.link)}" target="_blank" rel="noreferrer">Open Video</a>`}
            </article>
          `).join("")}
        </div>
      ` : item.image ? `<div class="blog-main-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"></div>` : ""}
    </section>
    <section class="section case-detail blog-detail-copy">
      ${sections.map((section, index) => `
        <article class="case-section ${section.image ? "has-image" : "text-only"} ${index % 2 ? "image-left" : "image-right"}">
          <div>
            <p class="eyebrow">${String(index + 1).padStart(2, "0")}</p>
            ${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}
            <p>${escapeHtml(section.paragraph)}</p>
          </div>
          ${section.image ? `<img src="${escapeHtml(section.image)}" alt="${escapeHtml(section.heading || item.title)}">` : ""}
        </article>
      `).join("")}
      <p><a class="button secondary" href="/blogs.html">Back to Blogs</a></p>
    </section>
  `;
}

function renderDownloadDetail() {
  const detail = $("#downloadDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const item = (state.content.downloads || []).find(download => download.id === id) || (state.content.downloads || [])[0];
  if (!item) {
    detail.innerHTML = `<section class="page-hero"><p class="eyebrow">Downloads</p><h1>No download found</h1></section>`;
    return;
  }
  const sections = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: item.product || "Download Overview", paragraph: item.summary || "" }];
  const documents = Array.isArray(item.documents) && item.documents.length
    ? item.documents
    : item.url ? [{ name: item.title || "Download file", url: item.url }] : [];
  setSeo({
    title: `${item.title} download`,
    description: item.summary || sections.map(section => section.paragraph).join(" "),
    image: "/assets/generated/downloads-hero.webp",
    url: downloadUrl(item.id),
    schema: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": item.title,
      "description": item.summary,
      "provider": organizationSchema()
    }
  });
  detail.innerHTML = `
    <section class="page-hero">
      <p class="eyebrow">${escapeHtml(item.product || "Downloads")}</p>
      <h1>${escapeHtml(item.title)}</h1>
      <p>${escapeHtml(item.summary || "")}</p>
    </section>
    <section class="section case-detail">
      ${sections.map((section, index) => `
        <article class="case-section text-only">
          <div>
            <p class="eyebrow">${String(index + 1).padStart(2, "0")}</p>
            ${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}
            <p>${escapeHtml(section.paragraph)}</p>
          </div>
        </article>
      `).join("")}
    </section>
    <section class="section product-band training-docs">
      <div class="section-head">
        <div><p class="eyebrow">Files</p><h2>Download package</h2></div>
        <a class="button secondary" href="/downloads.html">Back to Downloads</a>
      </div>
      <div class="document-list">
        ${documents.map(document => `<a href="${escapeHtml(document.url || "#")}" download>${escapeHtml(document.name || "Download file")}</a>`).join("") || "<p>No files have been uploaded yet.</p>"}
      </div>
    </section>
  `;
}

function renderTrainingDetail() {
  const detail = $("#trainingDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const item = (state.content.trainings || []).find(training => training.id === id) || (state.content.trainings || [])[0];
  if (!item) {
    detail.innerHTML = `<section class="page-hero"><p class="eyebrow">Training</p><h1>No training found</h1></section>`;
    return;
  }
  const sections = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: item.topic || "Training Overview", paragraph: item.summary || "", image: item.image || "" }];
  const videoLinks = Array.isArray(item.videoLinks) && item.videoLinks.length ? item.videoLinks : [item.videoUrl].filter(Boolean);
  const videos = videoLinks.map(link => ({ link, embed: youtubeEmbedUrl(link) })).filter(video => video.link);
  const documents = Array.isArray(item.documents) ? item.documents : [];
  setSeo({
    title: `${item.title} training`,
    description: item.summary || sections.map(section => section.paragraph).join(" "),
    image: item.image || "/assets/generated/training-hero.webp",
    url: trainingUrl(item.id),
    schema: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": item.title,
      "description": item.summary,
      "provider": organizationSchema()
    }
  });
  detail.innerHTML = `
    <section class="case-hero">
      <div class="case-hero-image">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : ""}</div>
      <div class="case-hero-content">
        <p class="eyebrow">${escapeHtml(item.topic || "Training")}</p>
        <h1>${escapeHtml(item.title)}</h1>
        <p>${escapeHtml(item.summary || "")}</p>
        <a class="button secondary" href="/training.html">Back to Training</a>
      </div>
    </section>
    <section class="section case-detail">
      ${sections.map((section, index) => `
        <article class="case-section ${section.image ? "has-image" : "text-only"} ${index % 2 ? "image-left" : "image-right"}">
          <div>
            <p class="eyebrow">${String(index + 1).padStart(2, "0")}</p>
            ${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}
            <p>${escapeHtml(section.paragraph)}</p>
          </div>
          ${section.image ? `<img src="${escapeHtml(section.image)}" alt="${escapeHtml(section.heading || item.title)}">` : ""}
        </article>
      `).join("")}
    </section>
    ${videos.length ? `
      <section class="section training-media">
        <div class="section-head"><div><p class="eyebrow">Videos</p><h2>Watch inside the website</h2></div></div>
        <div class="video-grid">
          ${videos.map((video, index) => `
            <article class="video-frame">
              ${video.embed ? `<iframe src="${escapeHtml(video.embed)}" title="${escapeHtml(item.title)} video ${index + 1}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` : `<a class="button secondary" href="${escapeHtml(video.link)}" target="_blank" rel="noreferrer">Open Video</a>`}
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}
    ${documents.length ? `
      <section class="section product-band training-docs">
        <div class="section-head"><div><p class="eyebrow">Files</p><h2>Related documents</h2></div></div>
        <div class="document-list">
          ${documents.map(document => `<a href="${escapeHtml(document.url || "#")}" download>${escapeHtml(document.name || "Training document")}</a>`).join("")}
        </div>
      </section>
    ` : ""}
  `;
}

function openProduct(id) {
  const product = state.content.products.find(item => item.id === id);
  if (!product || !$("#productModal")) return;
  $("#modalTitle").textContent = product.name;
  $("#modalBody").innerHTML = `
    <p>${escapeHtml(product.summary)}</p>
    <h3>Key Features</h3>
    <ul>${(product.features || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h3>Product Specifications</h3>
    <ul>${(product.specs || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h3>Pricing</h3>
    ${visiblePrices(product)}
    <h3>Technical Files</h3>
    ${renderTechnicalLinks(product)}
  `;
  $("#productModal").classList.add("active");
  $("#productModal").setAttribute("aria-hidden", "false");
}

function mediaImages(item) {
  const images = [item.image, ...(Array.isArray(item.gallery) ? item.gallery : [])].filter(Boolean);
  return [...new Set(images)];
}

function fileNameFromUrl(url, fallback) {
  const text = String(url || "");
  if (!text || text === "#") return fallback;
  try {
    return decodeURIComponent(text.split("/").pop() || fallback);
  } catch (error) {
    return fallback;
  }
}

function renderCadPreview(item) {
  const cad = item.cad || "";
  if (!cad) return "";
  const lower = cad.toLowerCase();
  const canEmbed = lower.endsWith(".pdf") || lower.startsWith("data:application/pdf") || /\.(png|jpe?g|webp|svg)$/i.test(lower);
  return `
    <div class="live-file-viewer">
      ${canEmbed ? `
        <button class="cad-load-button" type="button" data-cad-src="${escapeHtml(cad)}">
          <strong>Preview CAD Drawing</strong>
          <span>Click to load the file inside this page</span>
        </button>
      ` : `
        <div class="file-preview-empty">
          <strong>${escapeHtml(fileNameFromUrl(cad, "CAD drawing"))}</strong>
          <p>This file type is available for download. PDF and image CAD files show live inside the page.</p>
        </div>
      `}
      <a class="button secondary" href="${escapeHtml(cad)}" target="_blank" rel="noreferrer">Open CAD File</a>
    </div>
  `;
}

function renderThreeDPreview(item) {
  const model = item.model3d || "";
  if (!model) return "";
  const lower = model.toLowerCase();
  const canPreview = lower.endsWith(".stl") || lower.startsWith("data:model/stl") || lower.startsWith("data:application/sla") || lower.startsWith("data:application/vnd.ms-pki.stl");
  return `
    <div class="viewer3d-card">
      ${canPreview ? `
        <canvas class="viewer3d-canvas" data-model-name="${escapeHtml(item.name)}" data-model-src="${escapeHtml(model)}"></canvas>
        <div class="viewer3d-caption">
          <strong>Interactive 3D Preview</strong>
          <span>Drag to rotate. STL previews load only inside this panel.</span>
        </div>
      ` : `
        <div class="viewer3d-static">
          <strong>${escapeHtml(fileNameFromUrl(model, "3D model file"))}</strong>
          <span>3D file attached. Preview is available only for STL files uploaded with a proper .stl extension.</span>
        </div>
      `}
      <a class="button secondary" href="${escapeHtml(model)}" download>Download 3D Model</a>
    </div>
  `;
}

function renderTechnicalLinks(item) {
  const files = [
    ["Datasheet PDF", item.datasheet],
    ["Product Manual", item.manual],
    ["3D Model", item.model3d, true],
    ["CAD Drawings", item.cad]
  ].filter(([, url]) => Boolean(url));
  if (!files.length) return `<p class="file-preview-note">Technical files will appear here when uploaded.</p>`;
  return `
    <div class="download-links">
      ${files.map(([label, url, forceDownload]) => `<a href="${escapeHtml(url)}" ${forceDownload ? "download" : "target=\"_blank\" rel=\"noreferrer\""}>${escapeHtml(label)}</a>`).join("")}
    </div>
  `;
}

function listItems(items, fallback = []) {
  const values = (Array.isArray(items) && items.length ? items : fallback).filter(Boolean);
  return values.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderProductStory(product) {
  const richSummary = product.summaryHtml && stripHtml(product.summaryHtml).trim()
    ? product.summaryHtml
    : `<p>${escapeHtml(product.summary || "Product details will appear here when the admin adds a full product description.")}</p>`;
  const applications = product.applications || [
    "Commercial buildings and offices",
    "Retail, hospitality, and mixed-use sites",
    "Villas, compounds, warehouses, and parking areas"
  ];
  const support = [
    product.datasheet ? "Datasheet available" : "",
    product.manual ? "Manual available" : "",
    product.cad ? "CAD drawing attached" : "",
    product.model3d ? "3D model attached" : ""
  ].filter(Boolean);
  return `
    <section class="section product-story-section">
      <div class="product-story-grid">
        <article class="product-story-main">
          <p class="eyebrow">Overview</p>
          <h2>Product Details</h2>
          <div class="rich-product-copy">${richSummary}</div>
        </article>
        <aside class="product-story-side">
          <div>
            <strong>Best For</strong>
            <ul>${listItems(applications)}</ul>
          </div>
          <div>
            <strong>Support Package</strong>
            <ul>${listItems(support, ["Quotation support", "Project selection guidance", "Admin can upload technical files"])}</ul>
          </div>
        </aside>
      </div>
    </section>
    <section class="section product-band product-value-section">
      <div class="section-head"><div><p class="eyebrow">Details</p><h2>Why this product fits a project</h2></div></div>
      <div class="product-value-grid">
        <article>
          <span>01</span>
          <h3>Project Ready</h3>
          <p>Designed to sit inside a complete ELV workflow, from selection and quotation to installation support and handover documentation.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Technical Clarity</h3>
          <p>Datasheets, manuals, CAD drawings, and 3D files can be attached from admin so consultants and installers can review everything in one place.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Easy Comparison</h3>
          <p>Models and accessories below this product help customers move from a product family into exact models and compatible parts.</p>
        </article>
      </div>
    </section>
  `;
}

function renderProductShowcase(item) {
  const images = mediaImages(item);
  const primary = images[0] || "";
  const threeD = renderThreeDPreview(item);
  const cad = renderCadPreview(item);
  return `
    <div class="product-showcase">
      <div class="product-main-media">
        ${primary ? `<img id="detailMainImage" src="${escapeHtml(primary)}" alt="${escapeHtml(item.name)}">` : `<span>${escapeHtml(initials(item.name))}</span>`}
      </div>
      ${images.length > 1 ? `
        <div class="product-dots" aria-label="Product picture navigation">
          ${images.map((image, index) => `
            <button class="${index === 0 ? "active" : ""}" type="button" data-gallery-thumb="${escapeHtml(image)}" aria-label="View picture ${index + 1}">
              <span>${index + 1}</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
      ${threeD || cad ? `
        <div class="product-media-tools">
          ${threeD}
          ${cad ? `
            <div class="cad-preview-card">
              <div class="viewer3d-caption">
                <strong>Live CAD Preview</strong>
                <span>Load PDF or image drawings only when you need them.</span>
              </div>
              ${cad}
            </div>
          ` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

function productSchema(item, url, category = "ELV Product") {
  const price = activePrice(item);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": item.name,
    "description": seoDescription(item.summary || item.summaryHtml || ""),
    "image": absoluteUrl(item.image || "/assets/logo.jpeg"),
    "brand": { "@type": "Brand", "name": "ELV.art" },
    "category": category,
    "url": absoluteUrl(url),
    "areaServed": "Pakistan"
  };
  if (!price.quoteOnly && price.amount > 0) {
    schema.offers = {
      "@type": "Offer",
      "price": String(price.amount),
      "priceCurrency": "PKR",
      "availability": "https://schema.org/InStock",
      "url": absoluteUrl(url)
    };
  }
  return schema;
}

function setupDetailMedia() {
  const mainImage = $("#detailMainImage");
  const thumbs = $$("[data-gallery-thumb]");
  if (!mainImage) return;
  let activeIndex = Math.max(0, thumbs.findIndex(button => button.classList.contains("active")));
  let paused = false;
  const showImage = index => {
    if (!thumbs.length) return;
    activeIndex = (index + thumbs.length) % thumbs.length;
    const button = thumbs[activeIndex];
    mainImage.src = button.dataset.galleryThumb;
    thumbs.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
  };
  thumbs.forEach((button, index) => {
    button.addEventListener("click", () => {
      showImage(index);
    });
  });
  if (thumbs.length > 1) {
    const gallery = mainImage.closest(".product-showcase");
    if (gallery) {
      gallery.addEventListener("mouseenter", () => { paused = true; });
      gallery.addEventListener("mouseleave", () => { paused = false; });
      gallery.addEventListener("focusin", () => { paused = true; });
      gallery.addEventListener("focusout", () => { paused = false; });
    }
    setInterval(() => {
      if (!paused) showImage(activeIndex + 1);
    }, 3600);
  }
  $$(".cad-load-button").forEach(button => {
    button.addEventListener("click", () => {
      const object = document.createElement("object");
      object.className = "cad-object";
      object.data = `${button.dataset.cadSrc}#toolbar=0&navpanes=0`;
      object.type = "application/pdf";
      object.innerHTML = `<a class="button secondary" href="${button.dataset.cadSrc}" target="_blank" rel="noreferrer">Open CAD PDF</a>`;
      button.replaceWith(object);
    });
  });
}

function init3DViewers() {
  $$(".viewer3d-canvas").forEach(canvas => {
    const ctx = canvas.getContext("2d");
    let angle = 0.35;
    let pitch = 0.12;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let mesh = null;
    let meshStatus = "Loading 3D file...";

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function project(x, y, z, scale) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const px = x * cos - z * sin;
      const pz = x * sin + z * cos;
      const py = y * Math.cos(pitch) - pz * Math.sin(pitch);
      return [canvas.clientWidth / 2 + px * scale, canvas.clientHeight / 2 + py * scale, pz];
    }

    function drawBox(points, fill, stroke) {
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index) ctx.lineTo(point[0], point[1]);
        else ctx.moveTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.4;
      ctx.fill();
      ctx.stroke();
    }

    function normalizeTriangles(triangles) {
      const points = triangles.flat();
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      points.forEach(point => {
        for (let index = 0; index < 3; index += 1) {
          min[index] = Math.min(min[index], point[index]);
          max[index] = Math.max(max[index], point[index]);
        }
      });
      const center = min.map((value, index) => (value + max[index]) / 2);
      const size = Math.max(...max.map((value, index) => value - min[index])) || 1;
      return triangles.map(triangle => triangle.map(point => [
        (point[0] - center[0]) / size * 2.4,
        (point[1] - center[1]) / size * 2.4,
        (point[2] - center[2]) / size * 2.4
      ]));
    }

    function parseAsciiStl(text) {
      const vertices = [];
      text.replace(/vertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gi, (_, x, y, z) => {
        vertices.push([Number(x), Number(y), Number(z)]);
        return "";
      });
      const triangles = [];
      for (let index = 0; index + 2 < vertices.length; index += 3) {
        triangles.push([vertices[index], vertices[index + 1], vertices[index + 2]]);
      }
      return triangles.length ? normalizeTriangles(triangles) : null;
    }

    function parseBinaryStl(buffer) {
      if (buffer.byteLength < 84) return null;
      const view = new DataView(buffer);
      const count = view.getUint32(80, true);
      if (84 + count * 50 > buffer.byteLength || count > 80000) return null;
      const triangles = [];
      let offset = 84;
      for (let index = 0; index < count; index += 1) {
        offset += 12;
        const triangle = [];
        for (let vertex = 0; vertex < 3; vertex += 1) {
          triangle.push([
            view.getFloat32(offset, true),
            view.getFloat32(offset + 4, true),
            view.getFloat32(offset + 8, true)
          ]);
          offset += 12;
        }
        triangles.push(triangle);
        offset += 2;
      }
      return triangles.length ? normalizeTriangles(triangles) : null;
    }

    function drawMesh(width, height, scale) {
      const projected = mesh
        .map(triangle => triangle.map(point => project(point[0], point[1], point[2], scale)))
        .sort((a, b) => (a[0][2] + a[1][2] + a[2][2]) - (b[0][2] + b[1][2] + b[2][2]));
      projected.forEach((triangle, index) => {
        ctx.beginPath();
        ctx.moveTo(triangle[0][0], triangle[0][1]);
        ctx.lineTo(triangle[1][0], triangle[1][1]);
        ctx.lineTo(triangle[2][0], triangle[2][1]);
        ctx.closePath();
        const shade = 218 - (index % 8) * 5;
        ctx.fillStyle = `rgb(${shade}, ${Math.min(245, shade + 18)}, 255)`;
        ctx.strokeStyle = "rgba(10, 63, 152, 0.34)";
        ctx.lineWidth = 0.8;
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = "#102238";
      ctx.font = "700 13px Inter, sans-serif";
      ctx.fillText("STL preview loaded", 18, height - 20);
    }

    function draw() {
      resize();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const scale = Math.min(width, height) * 0.28;
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#eef6ff");
      gradient.addColorStop(1, "#e9fbee");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      if (mesh) {
        drawMesh(width, height, scale);
      } else {
        const vertices = [
          [-1.25, -0.45, -0.65], [1.25, -0.45, -0.65], [1.25, 0.45, -0.65], [-1.25, 0.45, -0.65],
          [-1.25, -0.45, 0.65], [1.25, -0.45, 0.65], [1.25, 0.45, 0.65], [-1.25, 0.45, 0.65]
        ].map(point => project(point[0], point[1], point[2], scale));
        drawBox([vertices[0], vertices[1], vertices[2], vertices[3]], "#d7e7fb", "#7f9fca");
        drawBox([vertices[1], vertices[5], vertices[6], vertices[2]], "#b9d4f5", "#6f90bd");
        drawBox([vertices[4], vertices[5], vertices[6], vertices[7]], "#f8fbff", "#8da9cc");

        const lens = project(-0.62, -0.05, -0.72, scale);
        ctx.beginPath();
        ctx.arc(lens[0], lens[1], scale * 0.23, 0, Math.PI * 2);
        ctx.fillStyle = "#102238";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lens[0], lens[1], scale * 0.11, 0, Math.PI * 2);
        ctx.fillStyle = "#5fa8ff";
        ctx.fill();

        const name = meshStatus || canvas.dataset.modelName || "3D Model";
        ctx.fillStyle = "#102238";
        ctx.font = "700 13px Inter, sans-serif";
        ctx.fillText(name.slice(0, 42), 18, height - 20);
      }
      if (!dragging) angle += 0.006;
      requestAnimationFrame(draw);
    }

    async function loadModel() {
      const source = canvas.dataset.modelSrc;
      if (!source) return;
      try {
        const response = await fetch(source);
        const buffer = await response.arrayBuffer();
        const text = new TextDecoder().decode(buffer.slice(0, Math.min(buffer.byteLength, 2048)));
        mesh = text.trimStart().toLowerCase().startsWith("solid")
          ? parseAsciiStl(new TextDecoder().decode(buffer))
          : parseBinaryStl(buffer);
        meshStatus = mesh ? "STL preview loaded" : "3D file attached. Preview unavailable.";
      } catch (error) {
        meshStatus = "3D file attached. Preview unavailable.";
      }
    }

    canvas.addEventListener("pointerdown", event => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", event => {
      if (!dragging) return;
      angle += (event.clientX - lastX) * 0.01;
      pitch = Math.max(-0.6, Math.min(0.6, pitch + (event.clientY - lastY) * 0.006));
      lastX = event.clientX;
      lastY = event.clientY;
    });
    canvas.addEventListener("pointerup", () => {
      dragging = false;
    });
    loadModel();
    draw();
  });
}

function renderProductDetail() {
  const detail = $("#productDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const product = state.content.products.find(item => item.id === id) || state.content.products[0];
  const selectedSimilar = Array.isArray(product.similarProductIds)
    ? product.similarProductIds.map(similarId => state.content.products.find(item => item.id === similarId)).filter(Boolean)
    : [];
  const similar = (selectedSimilar.length ? selectedSimilar : state.content.products
    .filter(item => item.id !== product.id && (item.categoryId === product.categoryId || item.segment === product.segment)))
    .slice(0, 4);
  const catalogRows = modelGroupRows(product);
  setSeo({
    title: `${product.name} price and details in Pakistan`,
    description: `${product.summary || stripHtml(product.summaryHtml)} Available for CCTV, access control, network, vehicle access, and ELV projects across Pakistan.`,
    image: product.image || "/assets/generated/product-cctv-system.webp",
    url: productUrl(product.id),
    schema: productSchema(product, productUrl(product.id), product.segment || "Model Group")
  });
  detail.innerHTML = `
    <section class="page-hero product-detail-hero">
      <p class="eyebrow">${escapeHtml(product.segment || product.status || "Product")}</p>
      <h1>${escapeHtml(product.name)}</h1>
      <p>${escapeHtml(product.summary)}</p>
    </section>
    <section class="section product-detail-layout product-commerce-layout">
      ${renderProductShowcase(product)}
      <div class="detail-info product-buy-panel">
        <div class="model-title-row">
          <span class="badge">${escapeHtml(product.segment || product.status || "Product")}</span>
          <span>${escapeHtml(product.status || "Available")}</span>
        </div>
        <h2>${escapeHtml(product.name)}</h2>
        <p>${escapeHtml(product.summary)}</p>
        <div class="product-price-box">
          ${visiblePrices(product)}
          <button class="button secondary" type="button" data-add-cart="product:${escapeHtml(product.id)}">${icon("shopping-cart")}Add to Cart</button>
          <a class="button primary" href="${escapeHtml(whatsappLink(1))}" target="_blank" rel="noreferrer">${icon("message-circle")}Request Quotation</a>
        </div>
        <div class="product-detail-tabs">
          <article>
            <h3>Key Features</h3>
            <ul>${(product.features || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
          <article>
            <h3>Product Specifications</h3>
            <ul>${(product.specs || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
        </div>
        <div class="technical-download-panel">
          <h3>Technical Files</h3>
          ${renderTechnicalLinks(product)}
        </div>
      </div>
    </section>
    ${renderProductStory(product)}
    ${catalogRows.length ? `
    <section class="section">
      <div class="section-head"><div><p class="eyebrow">Models & Accessories</p><h2>Choose what you need</h2></div></div>
      <button class="filter-toggle" type="button" data-filter-toggle="modelGroupFilterPanel" aria-expanded="false">Show Search & Filters</button>
      <div id="modelGroupFilterPanel" class="catalog-toolbar model-group-toolbar">
        <label>Search<input id="modelGroupSearch" type="search" placeholder="Search models, accessories, specs"></label>
        <label>Show<select id="modelGroupScope"><option value="">Models and Accessories</option><option value="model">Models</option><option value="part">Accessories</option></select></label>
        <label>Series / Badge<select id="modelGroupStatus"><option value="">Any Series or Badge</option></select></label>
        <label>Filter<select id="modelGroupFile"><option value="">Any</option><option value="with-image">With Picture</option><option value="with-files">With Files</option><option value="with-price">With Price</option></select></label>
        <p id="modelGroupStats" class="catalog-result-count"></p>
      </div>
      <div id="modelGroupGrid" class="product-grid"></div>
    </section>
    ` : ""}
    <section class="section product-band">
      <div class="section-head"><div><p class="eyebrow">Similar Products</p><h2>Related models</h2></div></div>
      <div class="product-grid">${similar.map(item => productFlowCard({
        type: item.segment || item.status || "Model Group",
        title: item.name,
        summary: item.summary,
        image: item.image,
        url: productUrl(item.id),
        meta: [item.status || "Available"],
        priceItem: item,
        action: "View Details"
      })).join("")}</div>
    </section>
  `;
  if (catalogRows.length) renderModelGroupCatalog(product);
  setupDetailMedia();
  init3DViewers();
}

function renderModelDetail() {
  const detail = $("#modelDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const model = (state.content.models || []).find(item => item.id === id) || (state.content.models || [])[0];
  if (!model) {
    detail.innerHTML = `<section class="page-hero"><p class="eyebrow">Model</p><h1>Model not found</h1><p>This model has not been added to the catalog yet.</p></section>`;
    return;
  }
  const product = state.content.products.find(item => item.id === model.productId);
  const category = state.content.categories.find(item => item.id === (model.categoryId || product?.categoryId));
  const parts = (state.content.parts || []).filter(part => part.modelId === model.id);
  const similar = (state.content.models || [])
    .filter(item => item.id !== model.id && (item.productId === model.productId || item.segment === model.segment))
    .slice(0, 3);
  setSeo({
    title: `${model.name} model price and specifications Pakistan`,
    description: `${model.summary || stripHtml(model.summaryHtml)} Model details, pricing, datasheet, manual, CAD, and 3D files for ELV projects in Pakistan.`,
    image: model.image || product?.image || "/assets/generated/product-cctv-system.webp",
    url: modelUrl(model.id),
    schema: productSchema(model, modelUrl(model.id), category?.name || product?.name || "ELV Model")
  });
  detail.innerHTML = `
    <section class="page-hero product-detail-hero">
      <p class="eyebrow">${escapeHtml(category?.name || product?.name || "Model")}</p>
      <h1>${escapeHtml(model.name)}</h1>
      <p>${escapeHtml(model.summary || stripHtml(model.summaryHtml))}</p>
      ${product ? `<a class="button secondary light-button" href="${productUrl(product.id)}">Back to ${escapeHtml(product.name)}</a>` : `<a class="button secondary light-button" href="/products.html">Back to Products</a>`}
    </section>
    <section class="section product-detail-layout model-detail-layout">
      <div class="detail-media model-detail-media">${model.image ? `<img src="${escapeHtml(model.image)}" alt="${escapeHtml(model.name)}">` : escapeHtml(initials(model.name))}</div>
      <div class="detail-info">
        <div class="model-title-row">
          <span class="badge">${escapeHtml(model.badge || model.segment || "Model")}</span>
          <span>${escapeHtml(model.status || "Available")}</span>
        </div>
        <h2>Model Summary</h2>
        <div>${model.summaryHtml || `<p>${escapeHtml(model.summary || "")}</p>`}</div>
        <h2>Quick Specs</h2>
        <div class="model-spec-grid">${(model.specs || []).slice(0, 6).map(item => `<span>${escapeHtml(item)}</span>`).join("") || `<span>Specifications will be added soon.</span>`}</div>
        <h2>Pricing</h2>
        ${visiblePrices(model)}
        <p><button class="button secondary" type="button" data-add-cart="model:${escapeHtml(model.id)}">${icon("shopping-cart")}Add to Cart</button></p>
        <h2>Technical Files</h2>
        ${renderTechnicalLinks(model)}
      </div>
    </section>
    <section class="section">
      <div class="section-head"><div><p class="eyebrow">Accessories</p><h2>Compatible accessories</h2></div></div>
      <div class="product-grid">${parts.map(part => productFlowCard({
        type: "Accessory",
        title: part.name,
        summary: part.summary || stripHtml(part.summaryHtml),
        image: part.image,
        url: partUrl(part.id),
        meta: [part.segment || "Accessory", part.status || "Compatible"],
        specs: part.specs || [],
        priceItem: part,
        action: "View Accessory"
      })).join("") || "<p>No accessories have been added for this model yet.</p>"}</div>
    </section>
    ${similar.length ? `
      <section class="section product-band">
        <div class="section-head"><div><p class="eyebrow">More Models</p><h2>Related choices</h2></div></div>
        <div class="product-grid">${similar.map(item => productFlowCard({
          type: "Model",
          title: item.name,
          summary: item.summary || stripHtml(item.summaryHtml),
          image: item.image,
          url: modelUrl(item.id),
          meta: [item.segment || "Model", item.status || "Available"],
          specs: item.specs || [],
          priceItem: item,
          action: "View Model"
        })).join("")}</div>
      </section>
    ` : ""}
  `;
}

function renderPartDetail() {
  const detail = $("#partDetail");
  if (!detail) return;
  const id = new URLSearchParams(location.search).get("id");
  const part = (state.content.parts || []).find(item => item.id === id);
  if (!part) {
    detail.innerHTML = `<section class="page-hero"><p class="eyebrow">Part</p><h1>Part not found</h1><p>This product does not have that part in the catalog yet.</p></section>`;
    return;
  }
  const product = state.content.products.find(item => item.id === part.productId);
  const model = (state.content.models || []).find(item => item.id === part.modelId);
  setSeo({
    title: `${part.name} accessory price Pakistan`,
    description: `${part.summary || stripHtml(part.summaryHtml)} Accessory details, pricing, datasheets, and technical files for ELV installations across Pakistan.`,
    image: part.image || model?.image || product?.image || "/assets/generated/product-cctv-system.webp",
    url: partUrl(part.id),
    schema: productSchema(part, partUrl(part.id), "ELV Accessory")
  });
  detail.innerHTML = `
    <section class="page-hero">
      <p class="eyebrow">${escapeHtml(model?.name || product?.name || "Product Accessory")}</p>
      <h1>${escapeHtml(part.name)}</h1>
      <p>${escapeHtml(part.summary || stripHtml(part.summaryHtml))}</p>
    </section>
    <section class="section product-detail-layout">
      <div class="detail-media">${part.image ? `<img src="${escapeHtml(part.image)}" alt="${escapeHtml(part.name)}">` : escapeHtml(initials(part.name))}</div>
      <div class="detail-info">
        <h2>Summary</h2>
        <div>${part.summaryHtml || `<p>${escapeHtml(part.summary || "")}</p>`}</div>
        <h2>Pricing</h2>
        ${visiblePrices(part)}
        <p><button class="button secondary" type="button" data-add-cart="part:${escapeHtml(part.id)}">${icon("shopping-cart")}Add to Cart</button></p>
        <h2>Technical Files</h2>
        ${renderTechnicalLinks(part)}
        ${model ? `<p><a class="button secondary" href="${modelUrl(model.id)}">Back to ${escapeHtml(model.name)}</a></p>` : product ? `<p><a class="button secondary" href="${productUrl(product.id)}">Back to ${escapeHtml(product.name)}</a></p>` : ""}
      </div>
    </section>
  `;
}

function renderCartPage() {
  const cartRoot = $("#cartPage");
  if (!cartRoot) return;
  const rows = cartRows();
  const total = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const access = pricingLabelForRows(rows);
  document.title = "Quotation Cart | ELV.art";
  cartRoot.innerHTML = `
    <section class="page-hero cart-hero">
      <p class="eyebrow">Quotation Cart</p>
      <h1>Build your quotation.</h1>
      <p>Add products, models, and accessories, adjust quantities, then download a quotation based on your available price level.</p>
    </section>
    <section class="section cart-layout">
      <div class="cart-table-card">
        ${rows.length ? `
          <div class="cart-table">
            ${rows.map(row => `
              <article class="cart-row" data-cart-row="${escapeHtml(row.entry.type)}:${escapeHtml(row.entry.id)}">
                <a class="cart-row-media" href="${escapeHtml(row.item.url)}">${row.item.image ? `<img src="${escapeHtml(row.item.image)}" alt="${escapeHtml(row.item.name)}">` : escapeHtml(initials(row.item.name))}</a>
                <div>
                  <span class="badge">${escapeHtml(row.item.cartLabel)}</span>
                  <h3><a href="${escapeHtml(row.item.url)}">${escapeHtml(row.item.name)}</a></h3>
                  <p>${escapeHtml(row.item.summary || stripHtml(row.item.summaryHtml))}</p>
                </div>
                <div class="cart-price">
                  <strong>${escapeHtml(row.price.label)}</strong>
                  <span>${escapeHtml(access)}</span>
                </div>
                <div class="cart-qty">
                  <span>Qty</span>
                  <div class="cart-qty-control">
                    <button type="button" data-cart-step="${escapeHtml(row.entry.type)}:${escapeHtml(row.entry.id)}:-1" aria-label="Decrease quantity">${icon("minus")}</button>
                    <input type="number" min="1" step="1" value="${row.qty}" data-cart-qty="${escapeHtml(row.entry.type)}:${escapeHtml(row.entry.id)}" aria-label="Quantity for ${escapeHtml(row.item.name)}">
                    <button type="button" data-cart-step="${escapeHtml(row.entry.type)}:${escapeHtml(row.entry.id)}:1" aria-label="Increase quantity">${icon("plus")}</button>
                  </div>
                </div>
                <div class="cart-line-total">${row.price.quoteOnly ? "Ask" : money(row.lineTotal)}</div>
                <button class="button secondary mini danger" type="button" data-cart-remove="${escapeHtml(row.entry.type)}:${escapeHtml(row.entry.id)}">${icon("trash-2")}Delete</button>
              </article>
            `).join("")}
          </div>
        ` : `
          <div class="cart-empty">
            <h2>Your quotation cart is empty</h2>
            <p>Open a product detail page and click Add to Cart to start building a quotation.</p>
            <a class="button primary" href="/products.html">${icon("shopping-cart")}Browse Products</a>
          </div>
        `}
      </div>
      <aside class="cart-summary">
        <h2>Quotation Summary</h2>
        <p>${escapeHtml(access)}</p>
        <div class="cart-summary-line"><span>Items</span><strong>${cartCount()}</strong></div>
        <div class="cart-summary-line total"><span>Total</span><strong>${money(total)}</strong></div>
        <button class="button primary" id="downloadQuoteButton" type="button" ${rows.length ? "" : "disabled"}>${icon("file-down")}Download Quotation</button>
        <button class="button secondary" id="whatsappQuoteButton" type="button" ${rows.length ? "" : "disabled"}>${icon("message-circle")}WhatsApp Quotation PDF</button>
      </aside>
    </section>
  `;
}

function renderAccount() {
  const box = $("#accountBox");
  if (!box) return;
  if (!state.account) {
    box.innerHTML = `<strong>No active login</strong><p>Create an account or login to save your project activity and quotation cart.</p>`;
    renderAccountInfoForm();
    return;
  }
  box.innerHTML = `
    <strong>${escapeHtml(state.account.user.fullName)}</strong>
    <p>${escapeHtml(state.account.user.company)} account is active.</p>
    <button class="button secondary" id="logoutUser" type="button">Logout</button>
  `;
  $("#logoutUser").addEventListener("click", logoutAccount);
  renderAccountInfoForm();
}

function accountInput(name, label, value = "", type = "text", attrs = "") {
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${attrs}></label>`;
}

function renderAccountInfoForm() {
  const form = $("#accountInfoForm");
  if (!form) return;
  if (!state.account) {
    form.innerHTML = `
      <div class="account-info-empty">
        <strong>Please login first.</strong>
        <p>Your editable company information will appear here after login.</p>
      </div>
    `;
    return;
  }
  const user = state.account.user || {};
  form.innerHTML = `
    ${accountInput("fullName", "Full Name", user.fullName || "", "text", "required autocomplete=\"name\"")}
    ${accountInput("company", "Company Name", user.company || "", "text", "required autocomplete=\"organization\"")}
    ${accountInput("city", "City", user.city || "", "text", "autocomplete=\"address-level2\"")}
    ${accountInput("country", "Country", user.country || "", "text", "autocomplete=\"country-name\"")}
    ${accountInput("domain", "Business Domain / Industry", user.domain || "", "text")}
    ${accountInput("experience", "Years of Experience", user.experience || "", "text")}
    ${accountInput("email", "Login Email", user.email || "", "email", "readonly")}
    ${accountInput("mobile", "Mobile Number", user.mobile || "", "tel", "required autocomplete=\"tel\"")}
    <button class="button primary full" type="submit">Save Changes</button>
    <p id="accountInfoStatus" class="form-status" role="status"></p>
  `;
}

function setupForms() {
  if (!document.body.dataset.accountMenuBound) {
    document.body.dataset.accountMenuBound = "true";
    document.addEventListener("click", event => {
      const trigger = event.target.closest("[data-account-trigger]");
      const logout = event.target.closest("[data-account-logout]");
      if (logout) {
        event.preventDefault();
        logoutAccount();
        return;
      }
      if (trigger) {
        event.preventDefault();
        const menu = trigger.parentElement.querySelector("[data-account-menu]");
        const isOpen = menu?.classList.contains("active");
        closeAccountMenus();
        if (menu && !isOpen) {
          menu.classList.add("active");
          trigger.classList.add("account-open");
        }
        return;
      }
      if (!event.target.closest("[data-account-menu]")) closeAccountMenus();
    });
  }

  const navToggle = $(".nav-toggle");
  if (navToggle) navToggle.addEventListener("click", event => {
    const nav = $(".site-nav");
    nav.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(nav.classList.contains("open")));
  });

  $$("[data-filter-toggle]").forEach(button => {
    const panel = document.getElementById(button.dataset.filterToggle);
    if (!panel) return;
    button.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("filters-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.textContent = isOpen ? "Hide Search & Filters" : "Show Search & Filters";
    });
  });

  const modal = $("#productModal");
  const modalClose = $(".modal-close");
  if (modalClose) modalClose.addEventListener("click", () => modal.classList.remove("active"));
  if (modal) modal.addEventListener("click", event => {
    if (event.target.id === "productModal") modal.classList.remove("active");
  });

  $$("[data-add-cart]").forEach(button => {
    button.addEventListener("click", () => {
      const [type, id] = button.dataset.addCart.split(":");
      addToCart(type, id, 1);
    });
  });

  $$("[data-cart-qty]").forEach(input => {
    input.addEventListener("input", () => {
      const [type, id] = input.dataset.cartQty.split(":");
      const entry = state.cart.find(item => item.type === type && item.id === id);
      if (entry) {
        entry.qty = Math.max(1, Number(input.value || 1));
        saveCart();
        renderCartPage();
        setupForms();
        renderCartNav();
      }
    });
  });

  $$("[data-cart-step]").forEach(button => {
    button.addEventListener("click", () => {
      const [type, id, delta] = button.dataset.cartStep.split(":");
      const entry = state.cart.find(item => item.type === type && item.id === id);
      if (entry) {
        entry.qty = Math.max(1, Number(entry.qty || 1) + Number(delta || 0));
        saveCart();
        renderCartPage();
        setupForms();
        renderCartNav();
      }
    });
  });

  $$("[data-cart-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const [type, id] = button.dataset.cartRemove.split(":");
      state.cart = state.cart.filter(item => !(item.type === type && item.id === id));
      saveCart();
      renderCartPage();
      setupForms();
      renderCartNav();
    });
  });

  const downloadQuoteButton = $("#downloadQuoteButton");
  if (downloadQuoteButton) downloadQuoteButton.addEventListener("click", () => {
    const rows = cartRows();
    if (!rows.length) return;
    downloadQuotePdf(rows);
  });

  const whatsappQuoteButton = $("#whatsappQuoteButton");
  if (whatsappQuoteButton) whatsappQuoteButton.addEventListener("click", async () => {
    const rows = cartRows();
    if (!rows.length) return;
    whatsappQuoteButton.disabled = true;
    const original = whatsappQuoteButton.innerHTML;
    whatsappQuoteButton.innerHTML = `${icon("message-circle")}Preparing PDF...`;
    try {
      await shareQuoteOnWhatsApp(rows);
    } catch (error) {
      alert(error.message || "Could not share quotation. Please download the PDF and attach it on WhatsApp.");
    } finally {
      whatsappQuoteButton.disabled = false;
      whatsappQuoteButton.innerHTML = original;
    }
  });

  ["#productFamilySearch", "#productFamilyScope", "#productFamilyType", "#productFamilyFile"].forEach(selector => {
    const control = $(selector);
    if (control) {
      control.addEventListener("input", renderCategories);
      control.addEventListener("change", renderCategories);
    }
  });
  ["#modelGroupSearch", "#modelGroupScope", "#modelGroupStatus", "#modelGroupFile"].forEach(selector => {
    const control = $(selector);
    if (control) {
      const id = new URLSearchParams(location.search).get("id");
      const product = state.content.products.find(item => item.id === id) || state.content.products[0];
      const rerender = () => renderModelGroupCatalog(product);
      control.addEventListener("input", rerender);
      control.addEventListener("change", rerender);
    }
  });

  $$("[data-auth-tab]").forEach(button => {
    button.addEventListener("click", () => {
      setAuthTab(button.dataset.authTab);
    });
  });
  if ($("#loginUserForm") && $("#registerForm")) setAuthTab(location.hash === "#register" ? "register" : "login");

  const leadForm = $("#leadForm");
  if (leadForm) leadForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#formStatus");
    if (status) status.textContent = "Sending...";
    try {
      await api("/api/leads", { method: "POST", body: JSON.stringify(formData(form)) });
      if (form && typeof form.reset === "function") form.reset();
      if (status) status.textContent = "Thank you. Your enquiry has been received.";
    } catch (error) {
      if (status) status.textContent = error.message;
    }
  });

  const registerForm = $("#registerForm");
  if (registerForm) registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#registerStatus");
    setFormStatus(status, "Submitting...", "info");
    try {
      const result = await api("/api/register", { method: "POST", body: JSON.stringify(formData(form)) });
      const email = form.email?.value || "";
      if (form && typeof form.reset === "function") form.reset();
      setFormStatus(status, result.emailSent
        ? "Thank you for registering with ELV.art. Please check your email and click the verification link. After verification, you can login."
        : "Thank you for registering with ELV.art. Email sending is not configured on this server. Please contact ELV.art support.",
        "success");
      showResendVerification(email);
    } catch (error) {
      setFormStatus(status, escapeHtml(error.message), "error");
    }
  });

  const loginUserForm = $("#loginUserForm");
  if (loginUserForm) loginUserForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#loginUserStatus");
    setFormStatus(status, "Checking...", "info");
    try {
      state.account = await api("/api/login", { method: "POST", body: JSON.stringify(formData(form)) });
      localStorage.setItem("elvAccount", JSON.stringify(state.account));
      setFormStatus(status, "Logged in.", "success");
      state.content = await api("/api/content");
      syncAccountFromContent();
      renderAccount();
      renderProducts();
      renderCartPage();
      renderCartNav();
      renderAccountNav();
    } catch (error) {
      setFormStatus(status, escapeHtml(error.message), "error");
      if (error.code === "EMAIL_NOT_VERIFIED") showResendVerification(error.email || form.email?.value || "");
    }
  });

  const resendVerificationForm = $("#resendVerificationForm");
  if (resendVerificationForm) resendVerificationForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#resendVerificationStatus");
    setFormStatus(status, "Sending verification email...", "info");
    try {
      const result = await api("/api/resend-verification", { method: "POST", body: JSON.stringify(formData(form)) });
      setFormStatus(status, result.emailSent
        ? "Verification email sent. Please check your inbox."
        : "Email sending is not configured on this server. Please contact ELV.art support.",
        "success");
    } catch (error) {
      setFormStatus(status, escapeHtml(error.message), "error");
    }
  });

  const showForgotPassword = $("#showForgotPassword");
  if (showForgotPassword) showForgotPassword.addEventListener("click", () => {
    $("#loginUserForm")?.classList.add("hidden");
    $("#forgotPasswordForm")?.classList.remove("hidden");
    $("#forgotPasswordForm input[name='email']")?.focus();
  });

  const backToLoginFromForgot = $("#backToLoginFromForgot");
  if (backToLoginFromForgot) backToLoginFromForgot.addEventListener("click", () => {
    $("#forgotPasswordForm")?.classList.add("hidden");
    $("#loginUserForm")?.classList.remove("hidden");
  });

  const forgotPasswordForm = $("#forgotPasswordForm");
  if (forgotPasswordForm) forgotPasswordForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#forgotPasswordStatus");
    setFormStatus(status, "Sending reset link...", "info");
    try {
      const result = await api("/api/request-password-reset", { method: "POST", body: JSON.stringify(formData(form)) });
      setFormStatus(status, result.message || "If this email is registered, a password reset link will be sent.", "success");
    } catch (error) {
      setFormStatus(status, escapeHtml(error.message), "error");
    }
  });

  const resetPasswordForm = $("#resetPasswordForm");
  if (resetPasswordForm) resetPasswordForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#resetPasswordStatus");
    const password = form.password?.value || "";
    const confirmPassword = form.confirmPassword?.value || "";
    if (password !== confirmPassword) {
      setFormStatus(status, "Passwords do not match.", "error");
      return;
    }
    setFormStatus(status, "Saving new password...", "info");
    try {
      const result = await api("/api/reset-password", { method: "POST", body: JSON.stringify({ token: form.token.value, password }) });
      form.reset();
      $("#resetTitle").textContent = "Password changed";
      $("#resetIntro").textContent = "Your password has been updated. You can now login with the new password.";
      setFormStatus(status, result.message || "Password changed successfully.", "success");
    } catch (error) {
      setFormStatus(status, escapeHtml(error.message), "error");
    }
  });

  const accountInfoForm = $("#accountInfoForm");
  if (accountInfoForm) accountInfoForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!state.account) return;
    const form = event.currentTarget;
    const status = $("#accountInfoStatus");
    setFormStatus(status, "Saving...", "info");
    try {
      const updatedUser = await api("/api/account", {
        method: "PUT",
        body: JSON.stringify(formData(form))
      });
      state.account.user = { ...(state.account.user || {}), ...updatedUser };
      localStorage.setItem("elvAccount", JSON.stringify(state.account));
      if (state.content?.account) state.content.account = { ...state.content.account, ...updatedUser };
      renderAccount();
      renderAccountNav();
      const freshStatus = $("#accountInfoStatus");
      setFormStatus(freshStatus, "Your information has been updated.", "success");
    } catch (error) {
      setFormStatus(status, escapeHtml(error.message), "error");
    }
  });

  setupEmailVerificationPage();
}

async function setupEmailVerificationPage() {
  const title = $("#verifyTitle");
  const status = $("#verifyStatus");
  if (!title || !status) return;
  const params = new URLSearchParams(location.search);
  if (params.get("verified") === "1") {
    title.textContent = "Email verified";
    status.textContent = "Your email has been verified. You can now login to your ELV.art account.";
    return;
  }
  if (params.get("error")) {
    title.textContent = "Verification failed";
    status.textContent = params.get("error");
    return;
  }
  const token = params.get("token");
  if (!token) {
    title.textContent = "Verification link missing";
    status.textContent = "Please open the full verification link from your ELV.art email.";
    return;
  }
  try {
    const result = await api("/api/verify-email", { method: "POST", body: JSON.stringify({ token }) });
    title.textContent = "Email verified";
    status.textContent = result.message || "Your email has been verified. You can now login.";
  } catch (error) {
    title.textContent = "Verification failed";
    status.textContent = error.message;
  }
}

function setupResetPasswordPage() {
  const form = $("#resetPasswordForm");
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const token = params.get("token") || "";
  form.token.value = token;
  if (!token) {
    $("#resetTitle").textContent = "Reset link missing";
    $("#resetIntro").textContent = "Please open the full password reset link from your ELV.art email.";
    form.querySelector("button[type='submit']").disabled = true;
  }
}

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function injectFonts() {
  if (document.getElementById("elvFonts")) return;
  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "anonymous";
  const font = document.createElement("link");
  font.id = "elvFonts";
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
  document.head.append(preconnect1, preconnect2, font);
}

function setupScrollProgress() {
  if (document.querySelector(".scroll-progress")) return;
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;
    bar.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function setupMetricCountUp() {
  const numbers = $$(".metric-grid strong");
  if (!numbers.length) return;
  const animate = el => {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\d[\d,]*)(.*)$/);
    if (!match) return;
    const target = Number(match[1].replace(/,/g, ""));
    const suffix = match[2] || "";
    if (!Number.isFinite(target) || prefersReducedMotion()) return;
    const duration = 1400;
    let start = null;
    const step = now => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(target * eased).toLocaleString()}${suffix}`;
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };
  if (!("IntersectionObserver" in window)) {
    numbers.forEach(animate);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  numbers.forEach(el => observer.observe(el));
}

function setupHeroSlider() {
  const hero = document.querySelector("[data-hero-slider]");
  if (!hero) return;
  const title = hero.querySelector("[data-hero-title]");
  const copy = hero.querySelector("[data-hero-copy]");
  const kicker = hero.querySelector("[data-hero-kicker]");
  if (!title || !copy || !kicker) return;

  const slides = [
    {
      image: "/assets/generated/hero-elv-control-room.webp",
      kicker: "Security - Networks - Automation",
      title: "Integrated ELV systems for secure, intelligent buildings in Pakistan.",
      copy: "ELV.art delivers CCTV, access control, vehicle barriers, ANPR, structured cabling, fire alarm, intercom, AV, and automation solutions across Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Quetta, Sialkot, and other major Pakistan cities."
    },
    {
      image: "/assets/generated/hero-elv-lobby-command.webp",
      kicker: "Command Rooms - Access Control - CCTV",
      title: "One connected command view for every entrance, camera, and network point.",
      copy: "Bring lobby access, surveillance walls, turnstiles, barriers, racks, and site monitoring into a single dependable ELV environment designed for commercial buildings and campuses."
    },
    {
      image: "/assets/generated/hero-elv-anpr-gate.webp",
      kicker: "ANPR - Barriers - Vehicle Access",
      title: "Smarter gates that identify vehicles, control lanes, and protect sites.",
      copy: "From ANPR cameras and RFID readers to boom barriers and traffic indication, ELV.art builds controlled entry systems for societies, offices, warehouses, and industrial facilities."
    },
    {
      image: "/assets/generated/hero-elv-network-automation.webp",
      kicker: "Networks - Fire Safety - Automation",
      title: "Clean infrastructure for buildings that need security, safety, and uptime.",
      copy: "Structured cabling, PoE switching, fire alarm interfaces, access readers, CCTV, and automation panels are planned together so your site is easier to maintain and expand."
    }
  ];

  const fader = document.createElement("div");
  fader.className = "hero-bg-fader";
  hero.prepend(fader);
  const dots = document.createElement("div");
  dots.className = "hero-slide-dots";
  dots.setAttribute("aria-label", "Hero slides");
  dots.innerHTML = slides.map((slide, index) => `<button type="button" aria-label="Show slide ${index + 1}" data-hero-dot="${index}"></button>`).join("");
  hero.appendChild(dots);

  let index = 0;
  let timer = null;
  let typeTimer = null;
  const interval = 6500;
  const reduce = prefersReducedMotion();

  const setDots = () => {
    dots.querySelectorAll("[data-hero-dot]").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
  };

  const typeTitle = text => {
    if (typeTimer) window.clearTimeout(typeTimer);
    if (reduce) {
      title.textContent = text;
      return;
    }
    title.textContent = "";
    let i = 0;
    const tick = () => {
      title.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) typeTimer = window.setTimeout(tick, i < 12 ? 34 : 24);
    };
    tick();
  };

  const activate = nextIndex => {
    const next = slides[nextIndex];
    index = nextIndex;
    hero.style.setProperty("--hero-bg-next", `url("${next.image}")`);
    hero.classList.add("is-changing");
    copy.classList.add("is-swapping");
    window.setTimeout(() => {
      hero.style.setProperty("--hero-bg", `url("${next.image}")`);
      kicker.textContent = next.kicker;
      copy.textContent = next.copy;
      copy.classList.remove("is-swapping");
      typeTitle(next.title);
      setDots();
      window.setTimeout(() => hero.classList.remove("is-changing"), 60);
    }, reduce ? 0 : 420);
  };

  const play = () => {
    if (timer) window.clearInterval(timer);
    if (reduce) return;
    timer = window.setInterval(() => activate((index + 1) % slides.length), interval);
  };

  dots.querySelectorAll("[data-hero-dot]").forEach(dot => {
    dot.addEventListener("click", () => {
      activate(Number(dot.dataset.heroDot || 0));
      play();
    });
  });

  hero.style.setProperty("--hero-bg", `url("${slides[0].image}")`);
  hero.style.setProperty("--hero-bg-next", `url("${slides[0].image}")`);
  setDots();
  typeTitle(slides[0].title);
  play();
}

function setupHeroScrollCue() {
  const hero = document.querySelector(".hero");
  if (!hero || hero.querySelector(".scroll-cue")) return;
  hero.insertAdjacentHTML("beforeend", `
    <div class="scroll-cue" aria-hidden="true"><span></span>Scroll</div>
  `);
}

function setupSiteExplorer() {
  const explorer = document.querySelector("[data-explorer]");
  if (!explorer) return;
  const tabs = Array.from(explorer.querySelectorAll(".explorer-tab"));
  const images = Array.from(explorer.querySelectorAll(".explorer-stage-img"));
  if (!tabs.length) return;

  let index = 0;
  let timer = null;
  const duration = 6000;

  const activate = i => {
    index = i;
    tabs.forEach((tab, k) => {
      const on = k === i;
      tab.classList.toggle("active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    images.forEach((img, k) => img.classList.toggle("active", k === i));
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const play = () => {
    stop();
    if (prefersReducedMotion()) return;
    timer = window.setInterval(() => activate((index + 1) % tabs.length), duration);
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => { activate(i); play(); });
    tab.addEventListener("mouseenter", () => { if (!prefersReducedMotion()) activate(i); });
  });
  explorer.addEventListener("mouseenter", stop);
  explorer.addEventListener("mouseleave", play);

  activate(0);
  play();
}

function setupHeroInteractive() {
  const canvas = document.querySelector(".hero-canvas");
  if (!canvas) return;
  const scene = canvas.closest(".hero-live-scene") || canvas.parentElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const reduce = prefersReducedMotion();

  const nodes = [
    { nx: 0.50, ny: 0.50, label: "Command Core", rgb: "110,231,117", hub: true, r: 12 },
    { nx: 0.19, ny: 0.24, label: "CCTV", rgb: "74,158,255", r: 8 },
    { nx: 0.83, ny: 0.20, label: "ANPR Gate", rgb: "74,158,255", r: 8 },
    { nx: 0.87, ny: 0.66, label: "Access Door", rgb: "110,231,117", r: 8 },
    { nx: 0.15, ny: 0.70, label: "PoE Switch", rgb: "74,158,255", r: 8 },
    { nx: 0.50, ny: 0.12, label: "Fire Alarm", rgb: "110,231,117", r: 8 },
    { nx: 0.52, ny: 0.88, label: "Intercom", rgb: "74,158,255", r: 8 }
  ];
  const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 4], [2, 3], [5, 2], [6, 3]];
  const pulses = edges.map((e, i) => ({ e, t: (i * 0.17) % 1, speed: 0.0026 + (i % 4) * 0.0011 }));

  const pointer = { x: 0.5, y: 0.5, active: false };
  const view = { x: 0.5, y: 0.5 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, rings = [];

  function resize() {
    const rect = scene.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function nodePos(n) {
    const px = view.x - 0.5;
    const py = view.y - 0.5;
    const depth = n.hub ? 8 : 30;
    return { x: n.nx * W + px * depth, y: n.ny * H + py * depth };
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    const P = nodes.map(nodePos);
    const hub = P[0];
    const pxr = view.x * W;
    const pyr = view.y * H;

    // expanding radar rings from the hub
    if (!reduce && time - (rings._last || 0) > 1400) {
      rings.push({ born: time });
      rings._last = time;
    }
    rings = rings.filter(ring => time - ring.born < 2600);
    rings.forEach(ring => {
      const age = (time - ring.born) / 2600;
      const rad = 20 + age * Math.max(W, H) * 0.42;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(110,231,117,${(1 - age) * 0.22})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    // connection lines
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(P[a].x, P[a].y);
      ctx.lineTo(P[b].x, P[b].y);
      ctx.strokeStyle = "rgba(140,180,235,0.16)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // data pulses travelling the edges
    pulses.forEach(p => {
      if (!reduce) {
        p.t += p.speed;
        if (p.t > 1) p.t -= 1;
      }
      const a = P[p.e[0]];
      const b = P[p.e[1]];
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(110,231,117,0.95)";
      ctx.shadowColor = "rgba(110,231,117,0.8)";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // nodes + labels
    nodes.forEach((n, i) => {
      const { x, y } = P[i];
      const dist = Math.hypot(x - pxr, y - pyr);
      const near = pointer.active && dist < 95;
      const beat = reduce ? 1 : 1 + Math.sin(time / 500 + i) * 0.07;
      const R = n.r * beat * (near ? 1.55 : 1);

      // cursor tether to nearby nodes
      if (near) {
        ctx.beginPath();
        ctx.moveTo(pxr, pyr);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(${n.rgb},${0.5 * (1 - dist / 95)})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, R + (near ? 12 : 7), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${n.rgb},${near ? 0.24 : 0.12})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${n.rgb})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, R + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${n.rgb},0.55)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (n.hub || near) {
        ctx.font = "700 12px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(235,244,255,0.95)";
        ctx.fillText(n.label, x, y - R - 10);
      }
    });
  }

  let raf = 0;
  function loop(ts) {
    const time = ts || 0;
    const tx = pointer.active ? pointer.x : 0.5 + Math.cos(time / 2600) * 0.13;
    const ty = pointer.active ? pointer.y : 0.5 + Math.sin(time / 2200) * 0.13;
    view.x += (tx - view.x) * 0.07;
    view.y += (ty - view.y) * 0.07;
    draw(time);
    raf = window.requestAnimationFrame(loop);
  }

  scene.addEventListener("pointermove", event => {
    const rect = scene.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.active = true;
    scene.classList.add("is-scanning");
  });
  scene.addEventListener("pointerleave", () => {
    pointer.active = false;
    scene.classList.remove("is-scanning");
  });
  window.addEventListener("resize", resize);

  resize();
  if (reduce) {
    draw(0);
  } else {
    raf = window.requestAnimationFrame(loop);
  }
}

function setupDataViz() {
  const hasIO = "IntersectionObserver" in window;

  // Reveal / animate the inline SVG + CSS charts when scrolled into view
  const charts = $$("[data-animate-chart]");
  if (charts.length) {
    if (!hasIO) {
      charts.forEach(chart => chart.classList.add("chart-in"));
    } else {
      const chartObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("chart-in");
          chartObserver.unobserve(entry.target);
        });
      }, { threshold: 0.25 });
      charts.forEach(chart => chartObserver.observe(chart));
    }
  }

  // Count-up for any [data-count] number (supports data-decimals / data-suffix)
  const runCount = el => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || "";
    const format = value => (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString()) + suffix;
    if (prefersReducedMotion()) {
      el.textContent = format(target);
      return;
    }
    const duration = 1500;
    let start = null;
    const step = now => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(target * eased);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const counters = $$("[data-count]");
  if (!counters.length) return;
  if (!hasIO) {
    counters.forEach(runCount);
    return;
  }
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      runCount(entry.target);
      countObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => countObserver.observe(el));
}

async function init() {
  injectFonts();
  await setupEmailVerificationPage();
  state.content = await api("/api/content");
  syncAccountFromContent();
  applyDefaultSeo();
  renderGlobalSearch();
  renderBackButton();
  renderCategories();
  renderProducts();
  renderSolutions();
  renderSolutionDetail();
  renderProjects();
  renderResources();
  renderCaseStudyDetail();
  renderTrainingDetail();
  renderDownloadDetail();
  renderBlogDetail();
  renderCategoryDetail();
  renderProductDetail();
  renderModelDetail();
  renderPartDetail();
  renderCartPage();
  renderAccount();
  renderEnhancedFooter();
  renderWhatsAppButton();
  renderCartNav();
  renderAccountNav();
  setupForms();
  setupResetPasswordPage();
  setupScrollMotion();
  setupScrollProgress();
  setupMetricCountUp();
  setupHeroSlider();
  setupHeroScrollCue();
  setupHeroInteractive();
  setupSiteExplorer();
  setupDataViz();
}

init().catch(error => {
  document.body.insertAdjacentHTML("afterbegin", `<p class="form-status">${escapeHtml(error.message)}</p>`);
});
