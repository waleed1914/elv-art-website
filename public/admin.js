const admin = {
  token: localStorage.getItem("elvAdminToken") || "",
  db: null,
  active: "superCategories",
  selectedSuperCategoryId: "",
  selectedCategoryId: "",
  selectedProductId: "",
  selectedModelId: ""
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

function stripHtml(value) {
  const div = document.createElement("div");
  div.innerHTML = value || "";
  return div.textContent || div.innerText || "";
}

function initials(text) {
  return String(text || "ELV").split(/\s+/).map(part => part[0]).join("").slice(0, 3).toUpperCase();
}

function objectFromForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function fileData(file) {
  if (!file || !file.size) return "";
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function filesData(files) {
  const selected = Array.from(files || []);
  const encoded = [];
  for (const file of selected) encoded.push(await fileData(file));
  return encoded.filter(Boolean);
}

async function documentFiles(files) {
  const selected = Array.from(files || []);
  const encoded = [];
  for (const file of selected) {
    const url = await fileData(file);
    if (url) encoded.push({ name: file.name, url });
  }
  return encoded;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      Authorization: admin.token ? `Bearer ${admin.token}` : "",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function field(name, label, value = "", type = "text", cls = "", attrs = "") {
  return `<label class="${cls}">${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${attrs}></label>`;
}

function hidden(name, value = "") {
  return `<input name="${name}" type="hidden" value="${escapeHtml(value)}">`;
}

function textarea(name, label, value = "", cls = "full", attrs = "") {
  return `<label class="${cls}">${label}<textarea name="${name}" rows="4" ${attrs}>${escapeHtml(value)}</textarea></label>`;
}

function linesFromText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function select(name, label, options, value = "", cls = "") {
  return `<label class="${cls}">${label}<select name="${name}">${options.map(option => {
    const optionValue = typeof option === "string" ? option : option.value;
    const optionLabel = typeof option === "string" ? option : option.label;
    return `<option value="${escapeHtml(optionValue)}" ${optionValue === value ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`;
  }).join("")}</select></label>`;
}

function openModal(title, html, onSubmit) {
  $("#adminModalTitle").textContent = title;
  $("#adminModalBody").innerHTML = html;
  $("#adminModal").classList.remove("hidden");
  $("#adminModal").setAttribute("aria-hidden", "false");
  const form = $("#adminModalBody form");
  if (form) form.onsubmit = onSubmit;
}

function requireFile(input, message) {
  if (!input || input.files.length) return true;
  input.setCustomValidity(message);
  input.reportValidity();
  input.addEventListener("change", () => input.setCustomValidity(""), { once: true });
  return false;
}

function requireRichText(editor, message) {
  if (stripHtml(editor.innerHTML).trim().length >= 10) return true;
  editor.focus();
  editor.classList.add("invalid-editor");
  alert(message);
  editor.addEventListener("input", () => editor.classList.remove("invalid-editor"), { once: true });
  return false;
}

function cleanPrice(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? String(number) : "";
}

function closeModal() {
  $("#adminModal").classList.add("hidden");
  $("#adminModal").setAttribute("aria-hidden", "true");
  $("#adminModalBody").innerHTML = "";
}

function switchPanel(name) {
  admin.active = name;
  $$(".admin-tabs button").forEach(item => item.classList.toggle("active", item.dataset.tab === name));
  $$(".admin-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === name));
  const tab = $(`.admin-tabs button[data-tab="${name}"]`);
  const fallback = { models: "Models", parts: "Accessories", products: "Model Groups", categories: "Product Categories", superCategories: "Products", projects: "Case Study" };
  $("#adminTitle").textContent = tab ? tab.textContent : (fallback[name] || name);
  hideSearchResults();
}

function categoryById(id) {
  return (admin.db.categories || []).find(category => category.id === id);
}

function superCategoryById(id) {
  return (admin.db.superCategories || []).find(item => item.id === id);
}

function productById(id) {
  return (admin.db.products || []).find(product => product.id === id);
}

function modelById(id) {
  return (admin.db.models || []).find(model => model.id === id);
}

function thumb(item) {
  return item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name || item.title)}">` : escapeHtml(initials(item.name || item.title));
}

function renderCard(item, actions, meta = []) {
  return `
    <article class="catalog-card">
      <div class="catalog-thumb">${thumb(item)}</div>
      <div class="catalog-body">
        <h3>${escapeHtml(item.name || item.title)}</h3>
        <p>${escapeHtml(stripHtml(item.summaryHtml || item.summary || "").slice(0, 170))}</p>
        <div class="catalog-meta">${meta.map(value => `<span>${escapeHtml(value)}</span>`).join("")}</div>
      </div>
      <div class="catalog-actions">${actions}</div>
    </article>
  `;
}

function priceMeta(item) {
  const prices = item.prices || {};
  return [
    `Public ${prices.l1 || "Missing"}`,
    `Account ${prices.l2 || "Missing"}`,
    `Admin ${prices.l3 || "Missing"}`
  ];
}

function catalogTargetOptions(value = "") {
  const groups = [
    ["Model Groups", admin.db.products || [], "product"],
    ["Models", admin.db.models || [], "model"],
    ["Accessories", admin.db.parts || [], "part"]
  ];
  return `<option value="">Select linked catalog item</option>${groups.map(([label, items, type]) => `
    <optgroup label="${escapeHtml(label)}">
      ${items.map(item => {
        const optionValue = `${type}:${item.id}`;
        return `<option value="${escapeHtml(optionValue)}" ${optionValue === value ? "selected" : ""}>${escapeHtml(item.name)}</option>`;
      }).join("")}
    </optgroup>
  `).join("")}`;
}

function hideSearchResults() {
  const box = $("#catalogSearchResults");
  if (box) box.classList.add("hidden");
}

function buildSearchIndex() {
  const rows = [];
  (admin.db.superCategories || []).forEach(item => rows.push({
    type: "Product",
    title: item.name,
    summary: item.summary,
    id: item.id,
    action: () => {
      admin.selectedSuperCategoryId = item.id;
      admin.selectedCategoryId = "";
      admin.selectedProductId = "";
      admin.selectedModelId = "";
      switchPanel("categories");
      renderCategories();
      bindCatalogActions();
    }
  }));
  (admin.db.categories || []).forEach(item => rows.push({
    type: "Product Category",
    title: item.name,
    summary: item.summary,
    id: item.id,
    action: () => {
      admin.selectedSuperCategoryId = item.superCategoryId;
      admin.selectedCategoryId = item.id;
      admin.selectedProductId = "";
      admin.selectedModelId = "";
      switchPanel("products");
      renderCategories();
      renderProducts();
      bindCatalogActions();
    }
  }));
  (admin.db.products || []).forEach(item => rows.push({
    type: "Model Group",
    title: item.name,
    summary: item.summary,
    id: item.id,
    action: () => {
      const category = categoryById(item.categoryId);
      admin.selectedSuperCategoryId = category?.superCategoryId || "";
      admin.selectedCategoryId = item.categoryId;
      admin.selectedProductId = item.id;
      admin.selectedModelId = "";
      switchPanel("models");
      renderProducts();
      renderModels();
      bindCatalogActions();
    }
  }));
  (admin.db.models || []).forEach(item => rows.push({
    type: "Model",
    title: item.name,
    summary: item.summary,
    id: item.id,
    action: () => {
      const product = productById(item.productId);
      const category = categoryById(item.categoryId || product?.categoryId);
      admin.selectedSuperCategoryId = category?.superCategoryId || "";
      admin.selectedCategoryId = item.categoryId || product?.categoryId || "";
      admin.selectedProductId = item.productId;
      admin.selectedModelId = item.id;
      switchPanel("parts");
      renderModels();
      renderParts();
      bindCatalogActions();
    }
  }));
  (admin.db.parts || []).forEach(item => rows.push({
    type: "Accessory",
    title: item.name,
    summary: item.summary,
    id: item.id,
    action: () => {
      const model = modelById(item.modelId);
      const product = productById(item.productId || model?.productId);
      const category = categoryById(item.categoryId || model?.categoryId || product?.categoryId);
      admin.selectedSuperCategoryId = category?.superCategoryId || "";
      admin.selectedCategoryId = category?.id || "";
      admin.selectedProductId = product?.id || "";
      admin.selectedModelId = model?.id || "";
      switchPanel("parts");
      renderParts();
      bindCatalogActions();
      setTimeout(() => {
        const target = document.querySelector(`[data-part-edit="${CSS.escape(item.id)}"]`)?.closest(".catalog-card");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  }));
  return rows;
}

function renderSearchResults(query) {
  const box = $("#catalogSearchResults");
  const q = query.trim().toLowerCase();
  if (!q) {
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }
  const results = buildSearchIndex()
    .filter(item => [item.type, item.title, item.summary, item.id].join(" ").toLowerCase().includes(q))
    .slice(0, 12);
  box.innerHTML = results.map((item, index) => `
    <button type="button" data-search-index="${index}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.type)} - ${escapeHtml(stripHtml(item.summary || "").slice(0, 90))}</span>
    </button>
  `).join("") || `<p>No matching catalog items.</p>`;
  box.classList.remove("hidden");
  $$("[data-search-index]").forEach(button => {
    button.onclick = () => {
      results[Number(button.dataset.searchIndex)].action();
      $("#catalogSearch").value = "";
      hideSearchResults();
    };
  });
}

function renderSettings() {
  const form = $("#settingsForm");
  const s = admin.db.settings;
  form.innerHTML = [
    field("brand", "Brand", s.brand),
    field("tagline", "Tagline", s.tagline),
    field("phone", "Phone", s.phone),
    field("email", "Email", s.email, "email"),
    field("location", "Location", s.location),
    field("whatsapp", "WhatsApp Number", s.whatsapp || s.phone),
    `<button class="button primary full" type="submit">Save Settings</button>`
  ].join("");
  form.onsubmit = async event => {
    event.preventDefault();
    const data = objectFromForm(form);
    if (!String(data.whatsapp || "").trim()) data.whatsapp = data.phone;
    await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(data) });
    await loadAdmin(false);
  };
}

function renderSuperCategories() {
  const superCategories = admin.db.superCategories || [];
  $("#superCategoryList").innerHTML = superCategories.map(superCategory => {
    const count = (admin.db.categories || []).filter(category => category.superCategoryId === superCategory.id).length;
    return renderCard(superCategory, `
      <button class="button secondary mini" data-super-edit="${escapeHtml(superCategory.id)}" type="button">Edit</button>
      <button class="button primary mini" data-super-view="${escapeHtml(superCategory.id)}" type="button">View</button>
      <button class="button secondary mini danger" data-delete="superCategories" data-id="${escapeHtml(superCategory.id)}" type="button">Delete</button>
    `, [`${count} product categories`]);
  }).join("") || `<p>No products yet. Add your first product.</p>`;
}

function superCategoryForm(item = {}) {
  openModal(item.id ? "Edit Product" : "Add Product", `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${field("name", "Product Name", item.name || "", "text", "", "required minlength=\"2\"")}
      <label>Picture<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Required for new product."}</span></label>
      ${textarea("summary", "Small Summary", item.summary || "", "full", "required minlength=\"10\"")}
      <button class="button primary full" type="submit">Save Product</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload a product picture.")) return;
    const data = objectFromForm(form);
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    delete data.imageFile;
    await api("/api/admin/superCategories", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
}

function renderCategories() {
  const superCategory = superCategoryById(admin.selectedSuperCategoryId);
  $("#categoryPanelTitle").textContent = superCategory ? `${superCategory.name} Product Categories` : "Select a product";
  $("#categoryCrumb").textContent = superCategory ? `Catalog / ${superCategory.name}` : "Categories";
  $("#addCategoryButton").disabled = !superCategory;
  $("#backToSuperCategoriesButton").classList.toggle("hidden", !superCategory);

  if (!superCategory) {
    $("#categoryList").innerHTML = `<p>Open Products and press View to manage product categories.</p>`;
    return;
  }

  const categories = (admin.db.categories || []).filter(category => category.superCategoryId === superCategory.id);
  $("#categoryList").innerHTML = categories.map(category => {
    const count = (admin.db.products || []).filter(product => product.categoryId === category.id).length;
    return renderCard(category, `
      <button class="button secondary mini" data-category-edit="${escapeHtml(category.id)}" type="button">Edit</button>
      <button class="button primary mini" data-category-view="${escapeHtml(category.id)}" type="button">View</button>
      <button class="button secondary mini danger" data-delete="categories" data-id="${escapeHtml(category.id)}" type="button">Delete</button>
    `, [`${count} products`]);
  }).join("") || `<p>No product categories yet. Add your first product category.</p>`;
}

function categoryForm(item = {}) {
  const superCategory = superCategoryById(admin.selectedSuperCategoryId) || superCategoryById(item.superCategoryId);
  if (!superCategory) {
    alert("Please view a product first, then add a product category inside it.");
    return;
  }
  openModal(item.id ? "Edit Product Category" : "Add Product Category", `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${hidden("superCategoryId", item.superCategoryId || admin.selectedSuperCategoryId || "")}
      ${field("name", "Product Category Name", item.name || "", "text", "", "required minlength=\"2\"")}
      <label>Picture<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Required for new product category."}</span></label>
      ${textarea("summary", "Small Summary", item.summary || "", "full", "required minlength=\"10\"")}
      <button class="button primary full" type="submit">Save Product Category</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload a product category picture.")) return;
    const data = objectFromForm(form);
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    delete data.imageFile;
    await api("/api/admin/categories", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
}

function renderProducts() {
  const category = categoryById(admin.selectedCategoryId);
  $("#productPanelTitle").textContent = category ? `${category.name} Model Groups` : "Select a product category";
  $("#productCrumb").textContent = category ? `Catalog / ${category.name}` : "Products";
  $("#addProductButton").disabled = !category;
  $("#backToCategoriesButton").classList.toggle("hidden", !category);

  if (!category) {
    $("#productList").innerHTML = `<p>Open Product Categories and press View to manage model groups.</p>`;
    return;
  }

  const categoryProducts = (admin.db.products || []).filter(product => product.categoryId === category.id);
  $("#productList").innerHTML = categoryProducts.map(product => {
    const modelCount = (admin.db.models || []).filter(model => model.productId === product.id).length;
    return renderCard(product, `
    <button class="button secondary mini" data-product-edit="${escapeHtml(product.id)}" type="button">Edit</button>
    <button class="button primary mini" data-product-view="${escapeHtml(product.id)}" type="button">Models</button>
    <button class="button secondary mini danger" data-delete="products" data-id="${escapeHtml(product.id)}" type="button">Delete</button>
  `, [product.segment || "Product family", product.status || "Badge", product.homeFeatured ? "Home page" : "", ...priceMeta(product), `${modelCount} models`].filter(Boolean));
  }).join("") || `<p>No model groups in this product category yet.</p>`;
}

function productForm(item = {}) {
  const category = categoryById(admin.selectedCategoryId) || categoryById(item.categoryId);
  if (!category) {
    alert("Please view a product category first, then add a model group inside it.");
    return;
  }
  openModal(item.id ? "Edit Model Group" : `Add Model Group${category ? ` in ${category.name}` : ""}`, `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${hidden("categoryId", item.categoryId || admin.selectedCategoryId || "")}
      ${field("name", "Model Group Name", item.name || "", "text", "", "required minlength=\"2\"")}
      ${field("segment", "Group Segment / Family", item.segment || "", "text", "", "required placeholder=\"Network Cameras / Access Control\"")}
      ${field("status", "Badge", item.status || "", "text", "", "required placeholder=\"Featured / New\"")}
      <label class="check-row full"><input name="homeFeatured" type="checkbox" ${item.homeFeatured ? "checked" : ""}> Show this model group on home page</label>
      <label>Model Group Picture<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Required for new model group."}</span></label>
      ${field("l1", "Public Price", item.prices?.l1 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Visible to all visitors\"")}
      ${field("l2", "Account Price", item.prices?.l2 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Visible after admin gives account access\"")}
      ${field("l3", "Admin Only Price", item.prices?.l3 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Only admin can see this\"")}
      <label class="full">Summary Editor
        <div id="summaryEditor" class="rich-editor" contenteditable="true" data-placeholder="Write model group summary...">${item.summaryHtml || item.summary || ""}</div>
      </label>
      ${textarea("featuresText", "Key Features (one per line)", (item.features || []).join("\n"), "full", "placeholder=\"Smart detection\nPoE installation\nMobile viewing\"")}
      ${textarea("specsText", "Product Specifications (one per line)", (item.specs || []).join("\n"), "full", "placeholder=\"IP67 outdoor housing\nH.265 compression\nONVIF compatible\"")}
      <button class="button primary full" type="submit">Save Model Group</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload a model group picture.")) return;
    if (!requireRichText($("#summaryEditor"), "Please add a model group summary with at least 10 characters.")) return;
    const formData = new FormData(form);
    const data = objectFromForm(form);
    data.summaryHtml = $("#summaryEditor").innerHTML.trim();
    data.summary = stripHtml(data.summaryHtml).trim();
    data.features = linesFromText(data.featuresText);
    data.specs = linesFromText(data.specsText);
    data.prices = { l1: cleanPrice(data.l1), l2: cleanPrice(data.l2), l3: cleanPrice(data.l3) };
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    data.homeFeatured = form.homeFeatured.checked;
    delete data.l1; delete data.l2; delete data.l3;
    delete data.featuresText; delete data.specsText; delete data.imageFile;
    await api("/api/admin/products", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
}

function renderModels() {
  const product = productById(admin.selectedProductId);
  $("#modelPanelTitle").textContent = product ? `${product.name} Models` : "Select a product";
  $("#modelCrumb").textContent = product ? `Catalog / Model Groups / ${product.name}` : "Models";
  $("#addModelButton").disabled = !product;

  if (!product) {
    $("#modelList").innerHTML = `<p>Open a model group and press Models to manage models.</p>`;
    return;
  }

  const models = (admin.db.models || []).filter(model => model.productId === product.id);
  $("#modelList").innerHTML = models.map(model => {
    const partCount = (admin.db.parts || []).filter(part => part.modelId === model.id).length;
    return renderCard(model, `
      <button class="button secondary mini" data-model-edit="${escapeHtml(model.id)}" type="button">Edit</button>
      <button class="button primary mini" data-model-view="${escapeHtml(model.id)}" type="button">Accessories</button>
      <button class="button secondary mini danger" data-delete="models" data-id="${escapeHtml(model.id)}" type="button">Delete</button>
    `, [model.segment || product.segment || "Model", model.status || "Badge", ...priceMeta(model), `${partCount} parts`]);
  }).join("") || `
    <div class="admin-empty-state">
      <h3>No models added yet</h3>
      <p>Click the <strong>+</strong> button at the top right to add the first model for ${escapeHtml(product.name)}.</p>
      <p>After saving a model, it will appear here and on the public product page.</p>
    </div>
  `;
}

function modelForm(item = {}) {
  const product = productById(admin.selectedProductId) || productById(item.productId);
  if (!product) {
    alert("Please view a product first, then add models inside it.");
    return;
  }
  const models = admin.db.models || [];
  const selectedSimilar = new Set(item.similarModelIds || item.similarProductIds || []);
  openModal(item.id ? "Edit Model" : `Add Model for ${product.name}`, `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${hidden("productId", item.productId || admin.selectedProductId || "")}
      ${hidden("categoryId", item.categoryId || product.categoryId || "")}
      ${field("name", "Model Name", item.name || "", "text", "", "required minlength=\"2\"")}
      ${field("segment", "Segment / Series", item.segment || product.segment || "", "text", "", "required placeholder=\"DeepinView / Value Series\"")}
      ${field("status", "Badge", item.status || "", "text", "", "required placeholder=\"Featured / New / Popular\"")}
      <label>Model Main Picture<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Required for new model."}</span></label>
      <label>Datasheet Upload<input name="datasheetFile" type="file" accept=".pdf,application/pdf"></label>
      <label>Manual Upload<input name="manualFile" type="file" accept=".pdf,application/pdf"></label>
      <label>3D Model Upload (STL)<input name="model3dFile" type="file" accept=".stl,model/stl"></label>
      <label>CAD Drawing Upload<input name="cadFile" type="file" accept=".dwg,.dxf,.pdf,application/pdf"></label>
      ${field("l1", "Public Price", item.prices?.l1 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Visible to all visitors\"")}
      ${field("l2", "Account Price", item.prices?.l2 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Visible after admin gives account access\"")}
      ${field("l3", "Admin Only Price", item.prices?.l3 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Only admin can see this\"")}
      <label class="full">Summary Editor
        <div id="summaryEditor" class="rich-editor" contenteditable="true" data-placeholder="Write model summary with paragraphs...">${item.summaryHtml || item.summary || ""}</div>
      </label>
      <label class="full">Multiple Model Images<input name="galleryFiles" type="file" accept="image/*" multiple><span class="file-note">${(item.gallery || []).length} existing gallery image(s) will be kept.</span></label>
      <label class="full">Similar Models
        <select name="similarModelIds" multiple size="6">
          ${models.filter(model => model.id !== item.id).map(model => `<option value="${escapeHtml(model.id)}" ${selectedSimilar.has(model.id) ? "selected" : ""}>${escapeHtml(model.name)}</option>`).join("")}
        </select>
      </label>
      <button class="button primary full" type="submit">Save Model</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload a model picture.")) return;
    if (!requireRichText($("#summaryEditor"), "Please add a model summary with at least 10 characters.")) return;
    const formData = new FormData(form);
    const data = objectFromForm(form);
    data.summaryHtml = $("#summaryEditor").innerHTML.trim();
    data.summary = stripHtml(data.summaryHtml).trim();
    data.prices = { l1: cleanPrice(data.l1), l2: cleanPrice(data.l2), l3: cleanPrice(data.l3) };
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    data.datasheet = await fileData(form.datasheetFile.files[0]) || item.datasheet || "";
    data.manual = await fileData(form.manualFile.files[0]) || item.manual || "";
    data.model3d = await fileData(form.model3dFile.files[0]) || item.model3d || "";
    data.cad = await fileData(form.cadFile.files[0]) || item.cad || "";
    data.gallery = [...(item.gallery || []), ...(await filesData(form.galleryFiles.files))];
    data.similarModelIds = formData.getAll("similarModelIds");
    delete data.l1; delete data.l2; delete data.l3;
    delete data.imageFile; delete data.datasheetFile; delete data.manualFile; delete data.model3dFile; delete data.cadFile; delete data.galleryFiles;
    await api("/api/admin/models", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
}

function renderCaseStudies() {
  const cases = admin.db.projects || [];
  $("#projectList").innerHTML = cases.map(item => renderCard(item, `
    <button class="button secondary mini" data-case-edit="${escapeHtml(item.id)}" type="button">Edit</button>
    <a class="button primary mini" href="/case-study.html?id=${encodeURIComponent(item.id)}" target="_blank">View</a>
    <button class="button secondary mini danger" data-delete="projects" data-id="${escapeHtml(item.id)}" type="button">Delete</button>
  `, [item.sector || "Case Study", `${(item.gallery || []).length} pictures`])).join("") || `<p>No case studies yet.</p>`;
}

function caseStudyForm(item = {}) {
  const blocks = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: "", paragraph: item.bodyHtml || item.summaryHtml || item.summary || "", image: "" }];
  openModal(item.id ? "Edit Case Study" : "Add Case Study", `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${field("title", "Case Study Title", item.title || "", "text", "", "required minlength=\"2\"")}
      ${field("sector", "Sector / Type", item.sector || "", "text", "", "required placeholder=\"Commercial / Villa / Warehouse\"")}
      <label>Main Picture<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Required for new case study."}</span></label>
      ${textarea("summary", "Main Summary", item.summary || "", "full", "required minlength=\"10\"")}
      <div class="full case-blocks-head">
        <h3>Paragraph Blocks</h3>
        <button id="addCaseBlockButton" class="button secondary mini" type="button">+ Paragraph</button>
      </div>
      <div id="caseBlocks" class="full case-blocks">
        ${blocks.map((block, index) => `
          <fieldset class="case-block" data-case-block>
            <legend>Block ${index + 1}</legend>
            ${field("blockHeading", "Heading (optional)", block.heading || "", "text", "")}
            ${textarea("blockParagraph", "Paragraph", stripHtml(block.paragraph || ""), "", "required minlength=\"10\"")}
            <label>Picture if any<input name="blockImageFile" type="file" accept="image/*"><span class="file-note">${block.image ? "Existing picture will stay if you do not upload a new one." : "Optional"}</span></label>
            ${hidden("blockImageExisting", block.image || "")}
            <button class="button secondary mini danger" data-remove-block type="button">Remove</button>
          </fieldset>
        `).join("")}
      </div>
      <button class="button primary full" type="submit">Save Case Study</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload a main picture.")) return;
    const data = objectFromForm(form);
    data.sections = [];
    const blockEls = Array.from(form.querySelectorAll("[data-case-block]"));
    for (const blockEl of blockEls) {
      const heading = blockEl.querySelector('[name="blockHeading"]').value.trim();
      const paragraph = blockEl.querySelector('[name="blockParagraph"]').value.trim();
      const existingImage = blockEl.querySelector('[name="blockImageExisting"]').value;
      const image = await fileData(blockEl.querySelector('[name="blockImageFile"]').files[0]) || existingImage || "";
      if (paragraph) data.sections.push({ heading, paragraph, image });
    }
    data.bodyHtml = data.sections.map(section => `${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}<p>${escapeHtml(section.paragraph)}</p>`).join("");
    data.summaryHtml = `<p>${escapeHtml(data.summary)}</p>`;
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    data.gallery = data.sections.map(section => section.image).filter(Boolean);
    delete data.imageFile;
    delete data.blockHeading; delete data.blockParagraph; delete data.blockImageFile; delete data.blockImageExisting;
    await api("/api/admin/projects", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
  $("#addCaseBlockButton").onclick = () => {
    const wrapper = $("#caseBlocks");
    const count = wrapper.querySelectorAll("[data-case-block]").length + 1;
    wrapper.insertAdjacentHTML("beforeend", `
      <fieldset class="case-block" data-case-block>
        <legend>Block ${count}</legend>
        ${field("blockHeading", "Heading (optional)", "", "text", "")}
        ${textarea("blockParagraph", "Paragraph", "", "", "required minlength=\"10\"")}
        <label>Picture if any<input name="blockImageFile" type="file" accept="image/*"><span class="file-note">Optional</span></label>
        ${hidden("blockImageExisting", "")}
        <button class="button secondary mini danger" data-remove-block type="button">Remove</button>
      </fieldset>
    `);
    bindCaseBlockRemovers();
  };
  bindCaseBlockRemovers();
}

function bindCaseBlockRemovers() {
  $$("[data-remove-block]").forEach(button => {
    button.onclick = () => {
      const blocks = $$("[data-case-block]");
      if (blocks.length <= 1) {
        alert("At least one paragraph block is required.");
        return;
      }
      button.closest("[data-case-block]").remove();
    };
  });
}

function renderTrainings() {
  const trainings = admin.db.trainings || [];
  $("#trainingList").innerHTML = trainings.map(item => renderCard(item, `
    <button class="button secondary mini" data-training-edit="${escapeHtml(item.id)}" type="button">Edit</button>
    <a class="button primary mini" href="/training-detail.html?id=${encodeURIComponent(item.id)}" target="_blank">View</a>
    <button class="button secondary mini danger" data-delete="trainings" data-id="${escapeHtml(item.id)}" type="button">Delete</button>
  `, [
    item.topic || "Training",
    `${(item.videoLinks || []).length || (item.videoUrl ? 1 : 0)} videos`,
    `${(item.documents || []).length} files`
  ])).join("") || `<p>No training records yet.</p>`;
}

function trainingForm(item = {}) {
  const blocks = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: item.topic || "", paragraph: item.summary || "", image: "" }];
  const videoLinks = Array.isArray(item.videoLinks) && item.videoLinks.length
    ? item.videoLinks
    : [item.videoUrl].filter(Boolean);
  openModal(item.id ? "Edit Training" : "Add Training", `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${field("title", "Main Heading", item.title || "", "text", "", "required minlength=\"2\"")}
      ${field("topic", "Topic / Badge", item.topic || "", "text", "", "required placeholder=\"Access Control / CCTV / Networking\"")}
      <label>Main Picture<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Required for new training."}</span></label>
      ${textarea("summary", "Main Summary", item.summary || "", "full", "required minlength=\"10\"")}
      ${textarea("videoLinksText", "YouTube Video Links (one per line)", videoLinks.join("\n"), "full", "placeholder=\"https://www.youtube.com/watch?v=...\"")}
      <label class="full">Related Documents (PDF, ZIP, DOC, TXT)<input name="documentFiles" type="file" accept=".pdf,.zip,.doc,.docx,.txt,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" multiple><span class="file-note">${(item.documents || []).length} existing document(s) will be kept.</span></label>
      <div class="full case-blocks-head">
        <h3>Training Paragraphs</h3>
        <button id="addTrainingBlockButton" class="button secondary mini" type="button">+ Paragraph</button>
      </div>
      <div id="trainingBlocks" class="full case-blocks">
        ${blocks.map((block, index) => `
          <fieldset class="case-block" data-training-block>
            <legend>Block ${index + 1}</legend>
            ${field("blockHeading", "Heading (optional)", block.heading || "", "text", "")}
            ${textarea("blockParagraph", "Paragraph", stripHtml(block.paragraph || ""), "", "required minlength=\"10\"")}
            <label>Picture if any<input name="blockImageFile" type="file" accept="image/*"><span class="file-note">${block.image ? "Existing picture will stay if you do not upload a new one." : "Optional"}</span></label>
            ${hidden("blockImageExisting", block.image || "")}
            <button class="button secondary mini danger" data-training-remove-block type="button">Remove</button>
          </fieldset>
        `).join("")}
      </div>
      <button class="button primary full" type="submit">Save Training</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload a main picture.")) return;
    const data = objectFromForm(form);
    data.sections = [];
    const blockEls = Array.from(form.querySelectorAll("[data-training-block]"));
    for (const blockEl of blockEls) {
      const heading = blockEl.querySelector('[name="blockHeading"]').value.trim();
      const paragraph = blockEl.querySelector('[name="blockParagraph"]').value.trim();
      const existingImage = blockEl.querySelector('[name="blockImageExisting"]').value;
      const image = await fileData(blockEl.querySelector('[name="blockImageFile"]').files[0]) || existingImage || "";
      if (paragraph) data.sections.push({ heading, paragraph, image });
    }
    data.videoLinks = data.videoLinksText.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
    data.videoUrl = data.videoLinks[0] || "";
    data.summaryHtml = `<p>${escapeHtml(data.summary)}</p>`;
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    data.documents = [...(item.documents || []), ...(await documentFiles(form.documentFiles.files))];
    delete data.imageFile;
    delete data.documentFiles;
    delete data.videoLinksText;
    delete data.blockHeading; delete data.blockParagraph; delete data.blockImageFile; delete data.blockImageExisting;
    await api("/api/admin/trainings", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
  $("#addTrainingBlockButton").onclick = () => {
    const wrapper = $("#trainingBlocks");
    const count = wrapper.querySelectorAll("[data-training-block]").length + 1;
    wrapper.insertAdjacentHTML("beforeend", `
      <fieldset class="case-block" data-training-block>
        <legend>Block ${count}</legend>
        ${field("blockHeading", "Heading (optional)", "", "text", "")}
        ${textarea("blockParagraph", "Paragraph", "", "", "required minlength=\"10\"")}
        <label>Picture if any<input name="blockImageFile" type="file" accept="image/*"><span class="file-note">Optional</span></label>
        ${hidden("blockImageExisting", "")}
        <button class="button secondary mini danger" data-training-remove-block type="button">Remove</button>
      </fieldset>
    `);
    bindTrainingBlockRemovers();
  };
  bindTrainingBlockRemovers();
}

function bindTrainingBlockRemovers() {
  $$("[data-training-remove-block]").forEach(button => {
    button.onclick = () => {
      const blocks = $$("[data-training-block]");
      if (blocks.length <= 1) {
        alert("At least one paragraph block is required.");
        return;
      }
      button.closest("[data-training-block]").remove();
    };
  });
}

function renderDownloads() {
  const downloads = admin.db.downloads || [];
  $("#downloadList").innerHTML = downloads.map(item => renderCard(item, `
    <button class="button secondary mini" data-download-edit="${escapeHtml(item.id)}" type="button">Edit</button>
    <a class="button primary mini" href="/download-detail.html?id=${encodeURIComponent(item.id)}" target="_blank">View</a>
    <button class="button secondary mini danger" data-delete="downloads" data-id="${escapeHtml(item.id)}" type="button">Delete</button>
  `, [
    item.product || item.type || "Download",
    `${(item.sections || []).length} paragraphs`,
    `${(item.documents || []).length || (item.url ? 1 : 0)} files`
  ])).join("") || `<p>No downloads yet.</p>`;
}

function downloadForm(item = {}) {
  const blocks = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: item.product || "", paragraph: item.summary || "" }];
  const documents = Array.isArray(item.documents) && item.documents.length
    ? item.documents
    : item.url ? [{ name: item.title || "Download file", url: item.url }] : [];
  openModal(item.id ? "Edit Download" : "Add Download", `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${field("title", "Main Heading", item.title || "", "text", "", "required minlength=\"2\"")}
      ${field("product", "Type / Product", item.product || item.type || "", "text", "", "required placeholder=\"Software / Manual / Datasheet / ZIP Package\"")}
      ${textarea("summary", "Main Summary", item.summary || "", "full", "required minlength=\"10\"")}
      <label class="full">Files (PDF, ZIP, DOC, TXT)<input name="documentFiles" type="file" accept=".pdf,.zip,.doc,.docx,.txt,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" multiple ${documents.length ? "" : "required"}><span class="file-note">${documents.length ? `${documents.length} existing file(s) will be kept.` : "Upload at least one PDF or ZIP file."}</span></label>
      <div class="full case-blocks-head">
        <h3>Paragraphs</h3>
        <button id="addDownloadBlockButton" class="button secondary mini" type="button">+ Paragraph</button>
      </div>
      <div id="downloadBlocks" class="full case-blocks">
        ${blocks.map((block, index) => `
          <fieldset class="case-block" data-download-block>
            <legend>Block ${index + 1}</legend>
            ${field("blockHeading", "Heading (optional)", block.heading || "", "text", "")}
            ${textarea("blockParagraph", "Paragraph", stripHtml(block.paragraph || ""), "full", "required minlength=\"10\"")}
            <button class="button secondary mini danger" data-download-remove-block type="button">Remove</button>
          </fieldset>
        `).join("")}
      </div>
      <button class="button primary full" type="submit">Save Download</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = objectFromForm(form);
    data.sections = [];
    const blockEls = Array.from(form.querySelectorAll("[data-download-block]"));
    for (const blockEl of blockEls) {
      const heading = blockEl.querySelector('[name="blockHeading"]').value.trim();
      const paragraph = blockEl.querySelector('[name="blockParagraph"]').value.trim();
      if (paragraph) data.sections.push({ heading, paragraph });
    }
    data.summaryHtml = `<p>${escapeHtml(data.summary)}</p>`;
    data.documents = [...documents, ...(await documentFiles(form.documentFiles.files))];
    data.url = data.documents[0]?.url || "";
    delete data.documentFiles;
    delete data.blockHeading; delete data.blockParagraph;
    await api("/api/admin/downloads", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
  $("#addDownloadBlockButton").onclick = () => {
    const wrapper = $("#downloadBlocks");
    const count = wrapper.querySelectorAll("[data-download-block]").length + 1;
    wrapper.insertAdjacentHTML("beforeend", `
      <fieldset class="case-block" data-download-block>
        <legend>Block ${count}</legend>
        ${field("blockHeading", "Heading (optional)", "", "text", "")}
        ${textarea("blockParagraph", "Paragraph", "", "full", "required minlength=\"10\"")}
        <button class="button secondary mini danger" data-download-remove-block type="button">Remove</button>
      </fieldset>
    `);
    bindDownloadBlockRemovers();
  };
  bindDownloadBlockRemovers();
}

function bindDownloadBlockRemovers() {
  $$("[data-download-remove-block]").forEach(button => {
    button.onclick = () => {
      const blocks = $$("[data-download-block]");
      if (blocks.length <= 1) {
        alert("At least one paragraph block is required.");
        return;
      }
      button.closest("[data-download-block]").remove();
    };
  });
}

function renderBlogs() {
  const blogs = admin.db.blogs || [];
  $("#blogList").innerHTML = blogs.map(item => renderCard(item, `
    <button class="button secondary mini" data-blog-edit="${escapeHtml(item.id)}" type="button">Edit</button>
    <a class="button primary mini" href="/blog-detail.html?id=${encodeURIComponent(item.id)}" target="_blank">View</a>
    <button class="button secondary mini danger" data-delete="blogs" data-id="${escapeHtml(item.id)}" type="button">Delete</button>
  `, [
    item.date || "Blog",
    `${(item.sections || []).length} paragraphs`,
    `${(item.videoLinks || []).length || (item.videoUrl ? 1 : 0)} videos`
  ])).join("") || `<p>No blog articles yet.</p>`;
}

function blogForm(item = {}) {
  const blocks = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: "", paragraph: item.body || item.summary || "", image: "" }];
  const videoLinks = Array.isArray(item.videoLinks) && item.videoLinks.length
    ? item.videoLinks
    : [item.videoUrl].filter(Boolean);
  openModal(item.id ? "Edit Blog" : "Add Blog", `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${field("title", "Main Heading", item.title || "", "text", "", "required minlength=\"2\"")}
      ${field("date", "Date / Badge", item.date || new Date().toISOString().slice(0, 10), "text", "", "required")}
      <label>Top Picture<input name="imageFile" type="file" accept="image/*"><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Optional. If no video is added, this becomes the top media."}</span></label>
      ${textarea("summary", "Main Summary", item.summary || "", "full", "required minlength=\"10\"")}
      ${textarea("videoLinksText", "YouTube Video Links (one per line)", videoLinks.join("\n"), "full", "placeholder=\"https://www.youtube.com/watch?v=...\"")}
      <div class="full case-blocks-head">
        <h3>Paragraphs</h3>
        <button id="addBlogBlockButton" class="button secondary mini" type="button">+ Paragraph</button>
      </div>
      <div id="blogBlocks" class="full case-blocks">
        ${blocks.map((block, index) => `
          <fieldset class="case-block" data-blog-block>
            <legend>Block ${index + 1}</legend>
            ${field("blockHeading", "Heading (optional)", block.heading || "", "text", "")}
            ${textarea("blockParagraph", "Paragraph", stripHtml(block.paragraph || ""), "", "required minlength=\"10\"")}
            <label>Picture if any<input name="blockImageFile" type="file" accept="image/*"><span class="file-note">${block.image ? "Existing picture will stay if you do not upload a new one." : "Optional"}</span></label>
            ${hidden("blockImageExisting", block.image || "")}
            <button class="button secondary mini danger" data-blog-remove-block type="button">Remove</button>
          </fieldset>
        `).join("")}
      </div>
      <button class="button primary full" type="submit">Save Blog</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = objectFromForm(form);
    data.sections = [];
    const blockEls = Array.from(form.querySelectorAll("[data-blog-block]"));
    for (const blockEl of blockEls) {
      const heading = blockEl.querySelector('[name="blockHeading"]').value.trim();
      const paragraph = blockEl.querySelector('[name="blockParagraph"]').value.trim();
      const existingImage = blockEl.querySelector('[name="blockImageExisting"]').value;
      const image = await fileData(blockEl.querySelector('[name="blockImageFile"]').files[0]) || existingImage || "";
      if (paragraph) data.sections.push({ heading, paragraph, image });
    }
    data.videoLinks = data.videoLinksText.split(/\r?\n/).map(link => link.trim()).filter(Boolean);
    data.videoUrl = data.videoLinks[0] || "";
    data.summaryHtml = `<p>${escapeHtml(data.summary)}</p>`;
    data.body = data.sections.map(section => `${section.heading ? `${section.heading}\n` : ""}${section.paragraph}`).join("\n\n");
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    delete data.imageFile;
    delete data.videoLinksText;
    delete data.blockHeading; delete data.blockParagraph; delete data.blockImageFile; delete data.blockImageExisting;
    await api("/api/admin/blogs", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
  $("#addBlogBlockButton").onclick = () => {
    const wrapper = $("#blogBlocks");
    const count = wrapper.querySelectorAll("[data-blog-block]").length + 1;
    wrapper.insertAdjacentHTML("beforeend", `
      <fieldset class="case-block" data-blog-block>
        <legend>Block ${count}</legend>
        ${field("blockHeading", "Heading (optional)", "", "text", "")}
        ${textarea("blockParagraph", "Paragraph", "", "", "required minlength=\"10\"")}
        <label>Picture if any<input name="blockImageFile" type="file" accept="image/*"><span class="file-note">Optional</span></label>
        ${hidden("blockImageExisting", "")}
        <button class="button secondary mini danger" data-blog-remove-block type="button">Remove</button>
      </fieldset>
    `);
    bindBlogBlockRemovers();
  };
  bindBlogBlockRemovers();
}

function bindBlogBlockRemovers() {
  $$("[data-blog-remove-block]").forEach(button => {
    button.onclick = () => {
      const blocks = $$("[data-blog-block]");
      if (blocks.length <= 1) {
        alert("At least one paragraph block is required.");
        return;
      }
      button.closest("[data-blog-block]").remove();
    };
  });
}

function renderParts() {
  const model = modelById(admin.selectedModelId);
  $("#partPanelTitle").textContent = model ? `${model.name} Accessories` : "Select a model";
  $("#partCrumb").textContent = model ? `Catalog / Models / ${model.name}` : "Accessories";
  $("#addPartButton").disabled = !model;

  if (!model) {
    $("#partList").innerHTML = `<p>Open a model and press Accessories to manage accessories.</p>`;
    return;
  }

  const parts = (admin.db.parts || []).filter(part => part.modelId === model.id);
  $("#partList").innerHTML = parts.map(part => renderCard(part, `
    <button class="button secondary mini" data-part-edit="${escapeHtml(part.id)}" type="button">Edit</button>
    <button class="button primary mini" data-part-view="${escapeHtml(part.id)}" type="button">View</button>
    <button class="button secondary mini danger" data-delete="parts" data-id="${escapeHtml(part.id)}" type="button">Delete</button>
  `, [part.segment || model.segment || "Accessory", ...priceMeta(part)])).join("") || `<p>No accessories added for this model yet.</p>`;
}

function partForm(item = {}) {
  const model = modelById(admin.selectedModelId) || modelById(item.modelId);
  if (!model) {
    alert("Please view a model first, then add accessories inside it.");
    return;
  }
  openModal(item.id ? "Edit Accessory" : `Add Accessory for ${model.name}`, `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${hidden("modelId", item.modelId || admin.selectedModelId || "")}
      ${hidden("productId", item.productId || model.productId || "")}
      ${hidden("categoryId", item.categoryId || model.categoryId || "")}
      ${field("name", "Accessory Name", item.name || "", "text", "", "required minlength=\"2\"")}
      ${field("segment", "Segment", item.segment || model.segment || "", "text", "", "required")}
      ${field("status", "Badge", item.status || "Accessory", "text", "", "required")}
      <label>Accessory Picture<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current picture will stay if you do not upload a new one." : "Required for new accessory."}</span></label>
      <label>Datasheet Upload<input name="datasheetFile" type="file" accept=".pdf,application/pdf"></label>
      <label>Manual Upload<input name="manualFile" type="file" accept=".pdf,application/pdf"></label>
      <label>3D Model Upload (STL)<input name="model3dFile" type="file" accept=".stl,model/stl"></label>
      <label>CAD Drawing Upload<input name="cadFile" type="file" accept=".dwg,.dxf,.pdf,application/pdf"></label>
      ${field("l1", "Public Price", item.prices?.l1 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Visible to all visitors\"")}
      ${field("l2", "Account Price", item.prices?.l2 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Visible after admin gives account access\"")}
      ${field("l3", "Admin Only Price", item.prices?.l3 || "", "number", "", "required min=\"0\" step=\"0.01\" placeholder=\"Only admin can see this\"")}
      <label class="full">Summary Editor
        <div id="summaryEditor" class="rich-editor" contenteditable="true" data-placeholder="Write accessory summary with paragraphs...">${item.summaryHtml || item.summary || ""}</div>
      </label>
      <label class="full">Multiple Accessory Images<input name="galleryFiles" type="file" accept="image/*" multiple><span class="file-note">${(item.gallery || []).length} existing gallery image(s) will be kept.</span></label>
      <button class="button primary full" type="submit">Save Accessory</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload an accessory picture.")) return;
    if (!requireRichText($("#summaryEditor"), "Please add an accessory summary with at least 10 characters.")) return;
    const data = objectFromForm(form);
    data.summaryHtml = $("#summaryEditor").innerHTML.trim();
    data.summary = stripHtml(data.summaryHtml).trim();
    data.prices = { l1: cleanPrice(data.l1), l2: cleanPrice(data.l2), l3: cleanPrice(data.l3) };
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    data.datasheet = await fileData(form.datasheetFile.files[0]) || item.datasheet || "";
    data.manual = await fileData(form.manualFile.files[0]) || item.manual || "";
    data.model3d = await fileData(form.model3dFile.files[0]) || item.model3d || "";
    data.cad = await fileData(form.cadFile.files[0]) || item.cad || "";
    data.gallery = [...(item.gallery || []), ...(await filesData(form.galleryFiles.files))];
    delete data.l1; delete data.l2; delete data.l3;
    delete data.imageFile; delete data.datasheetFile; delete data.manualFile; delete data.model3dFile; delete data.cadFile; delete data.galleryFiles;
    await api("/api/admin/parts", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
}

function renderSimpleList(collection, containerId, endpoint, titleKey = "name") {
  const items = admin.db[collection] || [];
  $(`#${containerId}`).innerHTML = items.map(item => `
    <article class="admin-row">
      <div>
        <h3>${escapeHtml(item[titleKey] || item.title)}</h3>
        <p>${escapeHtml(item.summary || item.body || item.email || "")}</p>
        <small>${escapeHtml(item.status || item.sector || item.topic || item.product || item.accessLevel || "")}</small>
      </div>
      <div class="row-actions">
        <button class="button secondary mini" data-simple-edit="${collection}" data-id="${escapeHtml(item.id)}" type="button">Edit</button>
        <button class="button secondary mini danger" data-delete="${endpoint}" data-id="${escapeHtml(item.id)}" type="button">Delete</button>
      </div>
    </article>
  `).join("") || `<p>No records yet.</p>`;
}

function renderSolutionsAdmin() {
  const solutions = admin.db.solutions || [];
  $("#solutionListAdmin").innerHTML = solutions.map(solution => renderCard(solution, `
    <button class="button secondary mini" data-solution-edit="${escapeHtml(solution.id)}" type="button">Edit</button>
    <a class="button primary mini" href="/solution.html?id=${encodeURIComponent(solution.id)}" target="_blank">View</a>
    <button class="button secondary mini danger" data-delete="solutions" data-id="${escapeHtml(solution.id)}" type="button">Delete</button>
  `, [solution.status || "Solution", `${(solution.hotspots || []).length} hotspots`])).join("") || `<p>No solutions yet. Press + to add an interactive solution scene.</p>`;
}

function hotspotRow(hotspot = {}, index = 0) {
  return `
    <article class="hotspot-admin-row" data-hotspot-row data-hotspot-index="${index}">
      <div class="hotspot-admin-head">
        <strong>Hotspot ${index + 1}</strong>
        <button class="button secondary mini danger" data-remove-hotspot type="button">Remove</button>
      </div>
      <label>Popup Title<input name="hotspotTitle" value="${escapeHtml(hotspot.title || "")}" required placeholder="RFID Reader"></label>
      <label>Small Detail<input name="hotspotMessage" value="${escapeHtml(hotspot.message || "")}" required placeholder="Reads registered vehicle tags before gate opens"></label>
      <label>Position X %<input name="hotspotX" type="number" min="0" max="100" step="0.1" value="${escapeHtml(hotspot.x ?? 50)}" required></label>
      <label>Position Y %<input name="hotspotY" type="number" min="0" max="100" step="0.1" value="${escapeHtml(hotspot.y ?? 50)}" required></label>
      <label class="full">Linked Product / Model / Accessory
        <select name="hotspotTarget" required>${catalogTargetOptions(hotspot.target || "")}</select>
      </label>
    </article>
  `;
}

function bindHotspotEditor() {
  const list = $("#hotspotRows");
  const add = $("#addHotspotRow");
  if (!list || !add) return;
  const preview = $("#solutionHotspotPreview");
  let activeIndex = Number(list.dataset.activeHotspot || 0);
  let draggingIndex = -1;
  const refreshNumbers = () => {
    $$("[data-hotspot-row]").forEach((row, index) => {
      row.dataset.hotspotIndex = String(index);
      const title = row.querySelector(".hotspot-admin-head strong");
      if (title) title.textContent = `Hotspot ${index + 1}`;
    });
    if (activeIndex >= $$("[data-hotspot-row]").length) activeIndex = Math.max(0, $$("[data-hotspot-row]").length - 1);
    list.dataset.activeHotspot = String(activeIndex);
  };
  const setActive = index => {
    activeIndex = Math.max(0, Math.min(index, $$("[data-hotspot-row]").length - 1));
    list.dataset.activeHotspot = String(activeIndex);
    $$("[data-hotspot-row]").forEach((row, rowIndex) => row.classList.toggle("active", rowIndex === activeIndex));
    $$(".solution-preview-dot").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === activeIndex));
  };
  const placeHotspot = (event, index = activeIndex) => {
    const image = preview?.querySelector("img");
    const row = $$("[data-hotspot-row]")[index];
    if (!image || !row) return;
    const rect = image.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    row.querySelector("[name='hotspotX']").value = Math.max(0, Math.min(100, x)).toFixed(1);
    row.querySelector("[name='hotspotY']").value = Math.max(0, Math.min(100, y)).toFixed(1);
    updatePreview();
  };
  const updatePreview = () => {
    const previewMap = $("#solutionHotspotMap");
    if (!previewMap) return;
    previewMap.innerHTML = $$("[data-hotspot-row]").map((row, index) => {
      const x = Math.max(0, Math.min(100, Number(row.querySelector("[name='hotspotX']")?.value || 0)));
      const y = Math.max(0, Math.min(100, Number(row.querySelector("[name='hotspotY']")?.value || 0)));
      const title = row.querySelector("[name='hotspotTitle']")?.value.trim() || `Hotspot ${index + 1}`;
      return `<button class="solution-preview-dot ${index === activeIndex ? "active" : ""}" type="button" data-preview-dot="${index}" style="left:${x}%;top:${y}%" title="${escapeHtml(title)}"><span>${index + 1}</span></button>`;
    }).join("");
    $$("[data-preview-dot]").forEach(button => {
      button.onpointerdown = event => {
        event.preventDefault();
        event.stopPropagation();
        draggingIndex = Number(button.dataset.previewDot);
        setActive(draggingIndex);
      };
      button.onclick = event => event.stopPropagation();
    });
  };
  if (!list.dataset.hotspotEditorBound) {
    list.dataset.hotspotEditorBound = "true";
    add.onclick = () => {
      list.insertAdjacentHTML("beforeend", hotspotRow({}, $$("[data-hotspot-row]").length));
      refreshNumbers();
      setActive($$("[data-hotspot-row]").length - 1);
      updatePreview();
    };
    list.addEventListener("click", event => {
      const remove = event.target.closest("[data-remove-hotspot]");
      const row = event.target.closest("[data-hotspot-row]");
      if (!row) return;
      if (remove) {
        row.remove();
        refreshNumbers();
        setActive(activeIndex);
        updatePreview();
        return;
      }
      setActive(Number(row.dataset.hotspotIndex || 0));
    });
    list.addEventListener("input", event => {
      if (event.target.matches("[name='hotspotX'], [name='hotspotY'], [name='hotspotTitle']")) updatePreview();
    });
  }
  if (preview && !preview.dataset.hotspotPreviewBound) {
    preview.dataset.hotspotPreviewBound = "true";
    preview.addEventListener("pointermove", event => {
      if (draggingIndex < 0) return;
      event.preventDefault();
      placeHotspot(event, draggingIndex);
    });
    preview.addEventListener("pointerup", event => {
      if (draggingIndex < 0) return;
      event.preventDefault();
      placeHotspot(event, draggingIndex);
      draggingIndex = -1;
    });
    preview.addEventListener("pointercancel", () => {
      draggingIndex = -1;
    });
    preview.addEventListener("click", event => {
      if (event.target.closest("[data-preview-dot]")) return;
      placeHotspot(event, activeIndex);
    });
  }
  const imageInput = document.querySelector("[name='imageFile']");
  if (imageInput && preview && !imageInput.dataset.hotspotPreviewBound) {
    imageInput.dataset.hotspotPreviewBound = "true";
    imageInput.addEventListener("change", async () => {
      const src = await fileData(imageInput.files[0]);
      if (!src) return;
      preview.innerHTML = `
        <div class="solution-admin-map">
          <img src="${src}" alt="Solution preview">
          <div id="solutionHotspotMap"></div>
        </div>
        <p>Click a hotspot row, then click on the image to place it. X/Y inputs also move dots live.</p>
      `;
      bindHotspotEditor();
    });
  }
  refreshNumbers();
  setActive(activeIndex);
  updatePreview();
}

function collectHotspots(form) {
  return $$("[data-hotspot-row]").map(row => ({
    title: row.querySelector("[name='hotspotTitle']")?.value.trim() || "",
    message: row.querySelector("[name='hotspotMessage']")?.value.trim() || "",
    x: Math.max(0, Math.min(100, Number(row.querySelector("[name='hotspotX']")?.value || 0))),
    y: Math.max(0, Math.min(100, Number(row.querySelector("[name='hotspotY']")?.value || 0))),
    target: row.querySelector("[name='hotspotTarget']")?.value || ""
  })).filter(hotspot => hotspot.title && hotspot.message && hotspot.target);
}

function solutionParagraphRow(section = {}, index = 0) {
  return `
    <article class="hotspot-admin-row" data-solution-section>
      <div class="hotspot-admin-head">
        <strong>Detail Paragraph ${index + 1}</strong>
        <button class="button secondary mini danger" data-remove-solution-section type="button">Remove</button>
      </div>
      ${field("solutionSectionHeading", "Heading (optional)", section.heading || "", "text", "full", "placeholder=\"How the lane works\"")}
      ${textarea("solutionSectionParagraph", "Paragraph", section.paragraph || "", "full", "required minlength=\"10\"")}
    </article>
  `;
}

function bindSolutionSectionEditor() {
  const list = $("#solutionSectionRows");
  const add = $("#addSolutionSectionRow");
  if (!list || !add) return;
  const refreshNumbers = () => {
    $$("[data-solution-section]").forEach((row, index) => {
      const title = row.querySelector(".hotspot-admin-head strong");
      if (title) title.textContent = `Detail Paragraph ${index + 1}`;
    });
  };
  add.onclick = () => {
    list.insertAdjacentHTML("beforeend", solutionParagraphRow({}, $$("[data-solution-section]").length));
    bindSolutionSectionEditor();
  };
  $$("[data-remove-solution-section]").forEach(button => {
    button.onclick = () => {
      const rows = $$("[data-solution-section]");
      if (rows.length <= 1) {
        alert("At least one detail paragraph is required.");
        return;
      }
      button.closest("[data-solution-section]")?.remove();
      refreshNumbers();
    };
  });
}

function collectSolutionSections() {
  return $$("[data-solution-section]").map(row => ({
    heading: row.querySelector("[name='solutionSectionHeading']")?.value.trim() || "",
    paragraph: row.querySelector("[name='solutionSectionParagraph']")?.value.trim() || ""
  })).filter(section => section.paragraph);
}

function solutionForm(item = {}) {
  const hotspots = Array.isArray(item.hotspots) ? item.hotspots : [];
  const sections = Array.isArray(item.sections) && item.sections.length
    ? item.sections
    : [{ heading: "System Overview", paragraph: item.summary || "" }];
  openModal(item.id ? "Edit Solution Scene" : "Add Solution Scene", `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${field("title", "Solution Title", item.title || "", "text", "", "required minlength=\"2\"")}
      ${field("status", "Badge / Type", item.status || "Solution", "text", "", "required")}
      <label>Main Scene Image<input name="imageFile" type="file" accept="image/*" ${item.image ? "" : "required"}><span class="file-note">${item.image ? "Current image will stay if you do not upload a new one." : "Required for new solution scene."}</span></label>
      ${textarea("summary", "Short Summary", item.summary || "", "full", "required minlength=\"10\"")}
      ${textarea("outcomesText", "Outcomes (one per line)", (item.outcomes || []).join("\n"), "full", "placeholder=\"Fast entry\nSafer lanes\nCentral monitoring\"")}
      <div class="solution-admin-preview full" id="solutionHotspotPreview">
        ${item.image ? `
          <div class="solution-admin-map">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || "Solution image")}">
            <div id="solutionHotspotMap"></div>
          </div>
          <p>Click a hotspot row, then click on the image to place it. X/Y inputs also move dots live.</p>
        ` : `<span>Upload the scene image, save once, then edit again to place hotspots on the live preview.</span>`}
      </div>
      <div class="case-blocks-head full">
        <div><p class="eyebrow">Hotspots</p><h3>Clickable products in this solution</h3></div>
        <button class="button secondary mini" id="addHotspotRow" type="button">+ Hotspot</button>
      </div>
      <div id="hotspotRows" class="hotspot-admin-list full">
        ${(hotspots.length ? hotspots : [{}]).map((hotspot, index) => hotspotRow(hotspot, index)).join("")}
      </div>
      <div class="case-blocks-head full">
        <div><p class="eyebrow">Details</p><h3>Paragraphs under the interactive diagram</h3></div>
        <button class="button secondary mini" id="addSolutionSectionRow" type="button">+ Paragraph</button>
      </div>
      <div id="solutionSectionRows" class="hotspot-admin-list full">
        ${sections.map((section, index) => solutionParagraphRow(section, index)).join("")}
      </div>
      <button class="button primary full" type="submit">Save Solution</button>
    </form>
  `, async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!item.image && !requireFile(form.imageFile, "Please upload a main solution image.")) return;
    const data = objectFromForm(form);
    data.image = await fileData(form.imageFile.files[0]) || item.image || "";
    data.outcomes = linesFromText(data.outcomesText);
    data.hotspots = collectHotspots(form);
    data.sections = collectSolutionSections();
    delete data.imageFile; delete data.outcomesText;
    delete data.hotspotTitle; delete data.hotspotMessage; delete data.hotspotX; delete data.hotspotY; delete data.hotspotTarget;
    delete data.solutionSectionHeading; delete data.solutionSectionParagraph;
    await api("/api/admin/solutions", { method: "POST", body: JSON.stringify(data) });
    closeModal();
    await loadAdmin(false);
  });
  bindHotspotEditor();
  bindSolutionSectionEditor();
}

function simpleForm(collection, endpoint, title, item = {}) {
  const titleField = collection === "solutions" || collection === "projects" || collection === "trainings" || collection === "downloads" || collection === "blogs" ? "title" : "name";
  openModal(item.id ? `Edit ${title}` : `Add ${title}`, `
    <form class="admin-form two-col">
      ${hidden("id", item.id || "")}
      ${field(titleField, "Title", item[titleField] || "")}
      ${field("status", "Badge / Type", item.status || item.sector || item.topic || item.product || "")}
      ${textarea("summary", "Summary", item.summary || item.body || "")}
      <button class="button primary full" type="submit">Save</button>
    </form>
  `, async event => {
    event.preventDefault();
    await api(endpoint, { method: "POST", body: JSON.stringify(objectFromForm(event.currentTarget)) });
    closeModal();
    await loadAdmin(false);
  });
}

function renderUsers() {
  const term = ($("#userSearch")?.value || "").toLowerCase();
  const users = (admin.db.users || []).filter(user => [user.company, user.city, user.domain, user.accessLevel, user.status, user.email].join(" ").toLowerCase().includes(term));
  $("#userList").innerHTML = users.map(user => `
    <article class="admin-row">
      <div>
        <h3>${escapeHtml(user.fullName)} - ${escapeHtml(user.company)}</h3>
        <p>${escapeHtml(user.city)}, ${escapeHtml(user.country)} | ${escapeHtml(user.domain)} | ${escapeHtml(user.experience)} years</p>
        <small>${escapeHtml(user.email)} | ${escapeHtml(user.mobile)} | ${user.emailVerified ? "Email verified" : "Email not verified"}</small>
      </div>
      <form class="row-actions" data-user-form="${escapeHtml(user.id)}">
        <select name="status"><option ${user.status === "Pending" ? "selected" : ""}>Pending</option><option ${user.status === "Approved" ? "selected" : ""}>Approved</option><option ${user.status === "Rejected" ? "selected" : ""}>Rejected</option></select>
        <select name="accessLevel"><option ${user.accessLevel === "L1" ? "selected" : ""}>L1</option><option ${user.accessLevel === "L2" ? "selected" : ""}>L2</option></select>
        <button class="button primary mini" type="submit">Update</button>
        <button class="button secondary danger mini" type="button" data-delete-user="${escapeHtml(user.id)}">Delete</button>
      </form>
    </article>
  `).join("") || `<p>No users found.</p>`;

  $$("[data-user-form]").forEach(form => {
    form.onsubmit = async event => {
      event.preventDefault();
      const user = (admin.db.users || []).find(entry => entry.id === form.dataset.userForm);
      await api("/api/admin/users", { method: "POST", body: JSON.stringify({ ...user, ...objectFromForm(form) }) });
      await loadAdmin(false);
    };
  });
}

async function deleteUser(userId) {
  const user = (admin.db.users || []).find(entry => entry.id === userId);
  const label = user ? `${user.fullName} (${user.email})` : "this user";
  if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
  try {
    await api(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
    await loadAdmin(false);
  } catch (error) {
    alert(error.message || "User could not be deleted.");
  }
}

function renderLeads() {
  $("#leadList").innerHTML = (admin.db.leads || []).map(lead => `
    <article class="admin-row">
      <div>
        <h3>${escapeHtml(lead.name)} - ${escapeHtml(lead.service)}</h3>
        <p>${escapeHtml(lead.message)}</p>
        <small>${escapeHtml(lead.phone)} | ${escapeHtml(lead.email)} | ${escapeHtml(lead.createdAt)}</small>
      </div>
    </article>
  `).join("") || `<p>No enquiries yet.</p>`;
}

function bindCatalogActions() {
  $$("[data-super-edit]").forEach(button => button.onclick = () => superCategoryForm(superCategoryById(button.dataset.superEdit)));
  $$("[data-super-view]").forEach(button => button.onclick = () => {
    admin.selectedSuperCategoryId = button.dataset.superView;
    admin.selectedCategoryId = "";
    admin.selectedProductId = "";
    admin.selectedModelId = "";
    switchPanel("categories");
    renderCategories();
    bindCatalogActions();
  });
  $$("[data-category-edit]").forEach(button => button.onclick = () => categoryForm(categoryById(button.dataset.categoryEdit)));
  $$("[data-category-view]").forEach(button => button.onclick = () => {
    admin.selectedCategoryId = button.dataset.categoryView;
    admin.selectedProductId = "";
    admin.selectedModelId = "";
    switchPanel("products");
    renderProducts();
    bindCatalogActions();
  });
  $$("[data-product-edit]").forEach(button => button.onclick = () => productForm(productById(button.dataset.productEdit)));
  $$("[data-product-view]").forEach(button => button.onclick = () => {
    admin.selectedProductId = button.dataset.productView;
    admin.selectedModelId = "";
    switchPanel("models");
    renderModels();
    bindCatalogActions();
  });
  $$("[data-model-edit]").forEach(button => button.onclick = () => modelForm(modelById(button.dataset.modelEdit)));
  $$("[data-model-view]").forEach(button => button.onclick = () => {
    admin.selectedModelId = button.dataset.modelView;
    switchPanel("parts");
    renderParts();
    bindCatalogActions();
  });
  $$("[data-part-edit]").forEach(button => button.onclick = () => partForm((admin.db.parts || []).find(part => part.id === button.dataset.partEdit)));
  $$("[data-part-view]").forEach(button => button.onclick = () => partForm((admin.db.parts || []).find(part => part.id === button.dataset.partView)));
  $$("[data-case-edit]").forEach(button => button.onclick = () => caseStudyForm((admin.db.projects || []).find(item => item.id === button.dataset.caseEdit)));
  $$("[data-training-edit]").forEach(button => button.onclick = () => trainingForm((admin.db.trainings || []).find(item => item.id === button.dataset.trainingEdit)));
  $$("[data-download-edit]").forEach(button => button.onclick = () => downloadForm((admin.db.downloads || []).find(item => item.id === button.dataset.downloadEdit)));
  $$("[data-blog-edit]").forEach(button => button.onclick = () => blogForm((admin.db.blogs || []).find(item => item.id === button.dataset.blogEdit)));
  $$("[data-solution-edit]").forEach(button => button.onclick = () => solutionForm((admin.db.solutions || []).find(item => item.id === button.dataset.solutionEdit)));
  $$("[data-delete]").forEach(button => button.onclick = async () => {
    if (!confirm("Delete this item?")) return;
    await api(`/api/admin/${button.dataset.delete}/${encodeURIComponent(button.dataset.id)}`, { method: "DELETE" });
    await loadAdmin(false);
  });
  $$("[data-simple-edit]").forEach(button => button.onclick = () => {
    const item = (admin.db[button.dataset.simpleEdit] || []).find(entry => entry.id === button.dataset.id) || {};
    const endpoint = `/api/admin/${button.dataset.simpleEdit}`;
    simpleForm(button.dataset.simpleEdit, endpoint, button.dataset.simpleEdit, item);
  });
}

async function loadAdmin(reset = true) {
  admin.db = await api("/api/admin/content");
  $("#loginPanel").classList.add("hidden");
  $("#adminPanel").classList.remove("hidden");
  renderSettings();
  renderSuperCategories();
  renderCategories();
  renderProducts();
  renderModels();
  renderParts();
  renderCaseStudies();
  renderTrainings();
  renderDownloads();
  renderBlogs();
  renderSolutionsAdmin();
  renderUsers();
  renderLeads();
  bindCatalogActions();
  if (reset) switchPanel(admin.active);
}

function setupEvents() {
  $$(".admin-tabs button").forEach(button => button.addEventListener("click", () => switchPanel(button.dataset.tab)));
  $("#addSuperCategoryButton").onclick = () => superCategoryForm();
  $("#addCategoryButton").onclick = () => categoryForm();
  $("#addProductButton").onclick = () => productForm();
  $("#addModelButton").onclick = () => modelForm();
  $("#addPartButton").onclick = () => partForm();
  $("#addSolutionButton").onclick = () => solutionForm();
  $("#addCaseStudyButton").onclick = () => caseStudyForm();
  $("#addTrainingButton").onclick = () => trainingForm();
  $("#addDownloadButton").onclick = () => downloadForm();
  $("#addBlogButton").onclick = () => blogForm();
  $("#backToSuperCategoriesButton").onclick = () => switchPanel("superCategories");
  $("#backToCategoriesButton").onclick = () => switchPanel("categories");
  $("#backToProductFamiliesButton").onclick = () => switchPanel("products");
  $("#backToModelsButton").onclick = () => switchPanel("models");
  $("#closeAdminModal").onclick = closeModal;
  $("#adminModal").addEventListener("click", event => {
    if (event.target.id === "adminModal") closeModal();
  });
  $("#catalogSearch").addEventListener("input", event => renderSearchResults(event.target.value));
  $("#catalogSearch").addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.currentTarget.value = "";
      hideSearchResults();
    }
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".admin-search")) hideSearchResults();
  });
  $("#userSearch").addEventListener("input", renderUsers);
  $("#userList").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-user]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    deleteUser(button.dataset.deleteUser);
  });
  $("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem("elvAdminToken");
    location.reload();
  });
  $("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    $("#loginStatus").textContent = "Checking...";
    try {
      const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify(objectFromForm(event.currentTarget)) });
      admin.token = data.token;
      localStorage.setItem("elvAdminToken", admin.token);
      await loadAdmin();
    } catch (error) {
      $("#loginStatus").textContent = error.message;
    }
  });
}

setupEvents();
if (admin.token) {
  loadAdmin().catch(() => {
    localStorage.removeItem("elvAdminToken");
    admin.token = "";
  });
}
