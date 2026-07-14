const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "elv-admin-2026";
const root = __dirname;
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const uploadsDir = path.join(publicDir, "uploads");
const dbPath = path.join(dataDir, "db.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain; charset=utf-8",
  ".stl": "model/stl",
  ".dwg": "application/octet-stream",
  ".dxf": "application/octet-stream"
};

function ensureStore() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  if (!fs.existsSync(dbPath)) {
    const now = new Date().toISOString();
    const db = {
      settings: {
        brand: "ELV.art",
        tagline: "Integrated low-voltage systems for secure, intelligent spaces.",
        phone: "+971 50 000 0000",
        email: "hello@elv.art",
        location: "Dubai, UAE",
        whatsapp: "+971500000000"
      },
      categories: [
        {
          id: "cat-cctv",
          name: "CCTV & Video Surveillance",
          summary: "IP cameras, NVRs, analytics, storage, monitoring, and remote viewing.",
          icon: "Camera"
        },
        {
          id: "cat-access",
          name: "Access Control",
          summary: "Door controllers, readers, credentials, time attendance, and visitor flow.",
          icon: "KeyRound"
        },
        {
          id: "cat-network",
          name: "Structured Cabling & Networks",
          summary: "Fiber, copper, racks, switching, Wi-Fi, and resilient site connectivity.",
          icon: "Network"
        },
        {
          id: "cat-fire",
          name: "Fire Alarm & Life Safety",
          summary: "Detection, evacuation, emergency lighting, and compliant safety integration.",
          icon: "Flame"
        },
        {
          id: "cat-av",
          name: "Audio Visual & Automation",
          summary: "Meeting rooms, digital signage, background music, and smart controls.",
          icon: "MonitorSpeaker"
        },
        {
          id: "cat-intercom",
          name: "Intercom & Gate Automation",
          summary: "Video intercom, barriers, turnstiles, gate motors, and entry automation.",
          icon: "RadioTower"
        }
      ],
      products: [
        {
          id: "prod-ai-camera",
          categoryId: "cat-cctv",
          name: "AI IP Camera Series",
          summary: "Weather-ready cameras with smart detection, night vision, and mobile access.",
          features: ["4MP to 8MP options", "Human and vehicle analytics", "PoE installation", "Edge recording support"],
          specs: ["IP67 outdoor housing", "H.265 compression", "Smart IR", "ONVIF compatible"],
          datasheet: "",
          manual: "",
          model3d: "",
          cad: "",
          prices: { l1: "420", l2: "360", l3: "315" },
          image: "",
          status: "Featured"
        },
        {
          id: "prod-door-access",
          categoryId: "cat-access",
          name: "Smart Door Access Kit",
          summary: "A complete access package for offices, clinics, schools, and apartments.",
          features: ["RFID, PIN, mobile credential", "Fail-safe and fail-secure locks", "Attendance-ready logs", "Cloud or local control"],
          specs: ["2-door expandable controller", "Wiegand/OSDP reader support", "TCP/IP connection", "Battery backup ready"],
          datasheet: "",
          manual: "",
          model3d: "",
          cad: "",
          prices: { l1: "780", l2: "690", l3: "610" },
          image: "",
          status: "Popular"
        },
        {
          id: "prod-network-rack",
          categoryId: "cat-network",
          name: "Managed Network Rack",
          summary: "Clean rack build with switching, patching, power protection, and labeling.",
          features: ["CAT6/CAT6A patch panels", "Managed PoE switches", "UPS-ready design", "Documentation included"],
          specs: ["Wall or floor rack", "PoE budget planning", "Fiber uplink option", "Labeled patching"],
          datasheet: "",
          manual: "",
          model3d: "",
          cad: "",
          prices: { l1: "1200", l2: "1050", l3: "940" },
          image: "",
          status: "Project"
        },
        {
          id: "prod-road-blocker",
          categoryId: "cat-access",
          segment: "Vehicle Access Control",
          name: "Hydraulic Road Blocker",
          summary: "Heavy-duty vehicle access control for critical entrances and high-security gates.",
          features: ["Anti-ram structure", "Manual release option", "Traffic light integration", "Loop detector compatible"],
          specs: ["Rising height 500-900 mm", "Hydraulic drive", "IP-rated control panel", "Remote and access control input"],
          datasheet: "",
          manual: "",
          model3d: "",
          cad: "",
          prices: { l1: "8500", l2: "7900", l3: "7200" },
          image: "",
          status: "Vehicle Access"
        },
        {
          id: "prod-loop-detector",
          categoryId: "cat-access",
          segment: "Vehicle Access Control",
          name: "Loop Detector",
          summary: "Vehicle detection module for barriers, gates, road blockers, and parking automation.",
          features: ["Single and dual loop options", "Adjustable sensitivity", "Relay output", "DIN rail mounting"],
          specs: ["12-24V AC/DC options", "Presence detection", "Pulse output", "Fail-safe configuration"],
          datasheet: "",
          manual: "",
          model3d: "",
          cad: "",
          prices: { l1: "95", l2: "82", l3: "70" },
          image: "",
          status: "Model"
        }
      ],
      solutions: [
        {
          id: "sol-villa",
          title: "Smart Villas",
          summary: "Security cameras, gate automation, video intercom, Wi-Fi, lighting control, and discreet AV.",
          outcomes: ["Elegant installation", "Remote monitoring", "Room-by-room control"]
        },
        {
          id: "sol-retail",
          title: "Retail & Warehouses",
          summary: "Loss prevention, access zones, inventory visibility, people flow, and reliable network coverage.",
          outcomes: ["Fewer blind spots", "Operational reporting", "Scalable storage"]
        },
        {
          id: "sol-office",
          title: "Corporate Offices",
          summary: "Access control, meeting room AV, structured cabling, visitor entry, and maintenance support.",
          outcomes: ["Professional user experience", "Secure departments", "Simple admin control"]
        }
      ],
      projects: [
        {
          id: "project-1",
          title: "Office Security Upgrade",
          sector: "Commercial",
          summary: "Access control, CCTV coverage planning, PoE switching, and rack cleanup for a growing office.",
          image: ""
        },
        {
          id: "project-2",
          title: "Villa Automation Package",
          sector: "Residential",
          summary: "Video intercom, gate automation, perimeter cameras, indoor Wi-Fi, and family mobile access.",
          image: ""
        }
      ],
      trainings: [
        {
          id: "training-wiring",
          title: "Access Control Wiring Details",
          topic: "Access Control",
          summary: "Controller power, lock wiring, request-to-exit, emergency release, and reader connection basics.",
          videoUrl: "https://www.youtube.com/results?search_query=access+control+wiring+details"
        },
        {
          id: "training-loop",
          title: "Loop Detector Installation",
          topic: "Vehicle Access",
          summary: "Loop cutting, cable turns, detector tuning, and barrier integration.",
          videoUrl: "https://www.youtube.com/results?search_query=loop+detector+installation+barrier"
        }
      ],
      downloads: [
        {
          id: "download-access-client",
          title: "Access Control Client Software",
          product: "Smart Door Access Kit",
          summary: "Client software for user management, attendance reports, and controller configuration.",
          url: "#"
        },
        {
          id: "download-camera-tool",
          title: "IP Camera Configuration Tool",
          product: "AI IP Camera Series",
          summary: "Discovery and configuration utility for camera IP, password, and stream setup.",
          url: "#"
        }
      ],
      blogs: [
        {
          id: "blog-elv-design",
          title: "How to Plan an ELV System Before Construction",
          summary: "A practical checklist for containment, power, rack space, device locations, and future expansion.",
          body: "Early ELV planning reduces rework, improves cable routes, and creates cleaner maintenance access after handover.",
          date: "2026-07-13"
        }
      ],
      users: [],
      leads: [],
      updatedAt: now
    };
    writeDb(db);
  }
}

function readDb() {
  ensureStore();
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(db.superCategories)) {
    db.superCategories = [
      { id: "super-camera-products", name: "Camera Products", summary: "Network cameras, PTZ cameras, AI cameras, and low-light surveillance products.", image: "/assets/generated/product-cctv-system.png" },
      { id: "super-recorders", name: "Video Recorders and Servers", summary: "NVR, PoE recorder, storage, server, and video management product families.", image: "/assets/generated/hero-elv-control-room.png" },
      { id: "super-access-control", name: "Access Control", summary: "Door access, readers, credentials, locks, attendance, and entry management.", image: "/assets/generated/product-access-control.png" },
      { id: "super-vehicle-access", name: "Parking Management", summary: "Traffic barriers, road blockers, bollards, loop detectors, and ANPR systems.", image: "/assets/generated/product-vehicle-access.png" },
      { id: "super-video-intercom", name: "Video Intercom", summary: "Villa, apartment, office, and multi-tenant video intercom systems.", image: "/assets/generated/product-access-control.png" },
      { id: "super-networking", name: "Networking", summary: "Switching, PoE, racks, structured cabling, and connectivity products.", image: "/assets/generated/hero-elv-control-room.png" }
    ];
  }
  if (!Array.isArray(db.models)) {
    db.models = (db.products || []).map(product => ({
      ...product,
      id: `model-${String(product.id).replace(/^prod-/, "")}`,
      productId: product.id
    }));
  }
  if (!Array.isArray(db.parts)) db.parts = [];
  db.superCategories = (db.superCategories || []).map(item => ({ image: "", ...item }));
  db.categories = (db.categories || []).map(category => {
    const name = String(category.name || "").toLowerCase();
    const fallbackSuper = name.includes("camera") || name.includes("cctv") ? "super-camera-products"
      : name.includes("record") || name.includes("storage") ? "super-recorders"
      : name.includes("vehicle") || name.includes("parking") || name.includes("barrier") ? "super-vehicle-access"
      : name.includes("intercom") ? "super-video-intercom"
      : name.includes("network") || name.includes("cabling") ? "super-networking"
      : "super-access-control";
    return { image: "", superCategoryId: fallbackSuper, ...category };
  });
  db.products = (db.products || []).map(product => ({
    summaryHtml: product.summaryHtml || product.summary || "",
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
    datasheet: product.datasheet || "",
    manual: product.manual || "",
    model3d: product.model3d || "",
    cad: product.cad || "",
    ...product
  }));
  db.models = db.models.map(model => ({
    summaryHtml: model.summaryHtml || model.summary || "",
    gallery: Array.isArray(model.gallery) ? model.gallery : [],
    datasheet: model.datasheet || "",
    manual: model.manual || "",
    model3d: model.model3d || "",
    cad: model.cad || "",
    ...model
  }));
  db.parts = db.parts.map(part => ({
    summaryHtml: part.summaryHtml || part.summary || "",
    gallery: Array.isArray(part.gallery) ? part.gallery : [],
    datasheet: part.datasheet || "",
    manual: part.manual || "",
    model3d: part.model3d || "",
    cad: part.cad || "",
    ...part
  })).map(part => {
    if (!part.modelId && part.productId) {
      const model = db.models.find(entry => entry.productId === part.productId);
      if (model) part.modelId = model.id;
    }
    return part;
  });
  db.projects = (db.projects || []).map(project => ({
    bodyHtml: project.bodyHtml || project.summaryHtml || project.summary || "",
    summaryHtml: project.summaryHtml || `<p>${project.summary || ""}</p>`,
    gallery: Array.isArray(project.gallery) ? project.gallery : [],
    sections: Array.isArray(project.sections) && project.sections.length
      ? project.sections
      : [{ heading: project.sector || "Project Overview", paragraph: project.summary || "", image: project.image || "" }],
    ...project
  }));
  db.trainings = (db.trainings || []).map(training => ({
    image: training.image || "",
    summaryHtml: training.summaryHtml || `<p>${training.summary || ""}</p>`,
    videoLinks: Array.isArray(training.videoLinks) && training.videoLinks.length
      ? training.videoLinks
      : [training.videoUrl].filter(Boolean),
    documents: Array.isArray(training.documents) ? training.documents : [],
    sections: Array.isArray(training.sections) && training.sections.length
      ? training.sections
      : [{ heading: training.topic || "", paragraph: training.summary || "", image: training.image || "" }],
    ...training
  }));
  db.downloads = (db.downloads || []).map(download => ({
    summaryHtml: download.summaryHtml || `<p>${download.summary || ""}</p>`,
    documents: Array.isArray(download.documents) && download.documents.length
      ? download.documents
      : download.url ? [{ name: download.title || "Download file", url: download.url }] : [],
    sections: Array.isArray(download.sections) && download.sections.length
      ? download.sections
      : [{ heading: download.product || "", paragraph: download.summary || "" }],
    ...download
  }));
  db.blogs = (db.blogs || []).map(blog => ({
    image: blog.image || "",
    summaryHtml: blog.summaryHtml || `<p>${blog.summary || ""}</p>`,
    videoLinks: Array.isArray(blog.videoLinks) && blog.videoLinks.length
      ? blog.videoLinks
      : [blog.videoUrl].filter(Boolean),
    sections: Array.isArray(blog.sections) && blog.sections.length
      ? blog.sections
      : [{ heading: "", paragraph: blog.body || blog.summary || "", image: "" }],
    ...blog
  }));
  return db;
}

function writeDb(db) {
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type.includes("json") ? JSON.stringify(body) : body);
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 10 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function isAdmin(req) {
  return req.headers.authorization === `Bearer ${ADMIN_TOKEN}`;
}

function currentUser(req, db) {
  const token = req.headers["x-user-token"];
  if (!token) return null;
  try {
    const [id] = Buffer.from(String(token), "base64").toString("utf8").split(":");
    const user = db.users.find(entry => entry.id === id && entry.status === "Approved");
    return user || null;
  } catch (error) {
    return null;
  }
}

function allowedPrices(prices, level) {
  if (!prices) return {};
  if (!level) return { l1: prices.l1 };
  if (level === "L1") return { l1: prices.l1 };
  if (level === "L2") return { l1: prices.l1, l2: prices.l2 };
  return {};
}

function cleanId(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function sanitizeItem(item) {
  const clone = { ...item };
  delete clone.createdAt;
  delete clone.updatedAt;
  return clone;
}

function saveImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return "";
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,(.+)$/);
  if (!match) return "";
  const ext = match[1] === "jpeg" ? "jpg" : match[1].replace("+xml", "");
  const fileName = `${cleanId("upload")}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(match[2], "base64"));
  return `/uploads/${fileName}`;
}

function saveUpload(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return "";
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return "";
  const mime = match[1].toLowerCase();
  const extByMime = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "model/stl": "stl",
    "application/sla": "stl",
    "application/vnd.ms-pki.stl": "stl",
    "application/octet-stream": "bin",
    "application/acad": "dwg",
    "image/vnd.dwg": "dwg"
  };
  const ext = extByMime[mime] || "file";
  const fileName = `${cleanId("upload")}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.from(match[2], "base64"));
  return `/uploads/${fileName}`;
}

function normalizeUploads(item) {
  const uploadFields = ["image", "datasheet", "manual", "model3d", "cad"];
  for (const field of uploadFields) {
    if (item[field] && typeof item[field] === "string" && item[field].startsWith("data:")) {
      item[field] = saveUpload(item[field]);
    }
  }
  if (Array.isArray(item.gallery)) {
    item.gallery = item.gallery.map(file => (typeof file === "string" && file.startsWith("data:") ? saveUpload(file) : file)).filter(Boolean);
  }
  if (Array.isArray(item.sections)) {
    item.sections = item.sections.map(section => ({
      ...section,
      image: section.image && typeof section.image === "string" && section.image.startsWith("data:") ? saveUpload(section.image) : section.image
    }));
  }
  if (Array.isArray(item.documents)) {
    item.documents = item.documents.map(document => {
      const file = typeof document === "string" ? { name: path.basename(document), url: document } : { ...document };
      if (file.url && typeof file.url === "string" && file.url.startsWith("data:")) {
        file.url = saveUpload(file.url);
      }
      file.name = String(file.name || path.basename(file.url || "Training document")).slice(0, 180);
      return file;
    }).filter(document => document.url);
  }
  return item;
}

function upsert(collection, payload, prefix) {
  const db = readDb();
  const item = normalizeUploads(sanitizeItem(payload));
  if (!item.id) item.id = cleanId(prefix);
  const existing = db[collection]?.find(entry => entry.id === item.id) || {};
  const merged = { ...existing, ...item };
  const validationError = validateCatalogItem(db, collection, merged);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }
  const index = db[collection].findIndex(entry => entry.id === item.id);
  if (index >= 0) {
    db[collection][index] = merged;
  } else {
    db[collection].push(merged);
  }
  writeDb(db);
  return merged;
}

function remove(collection, id) {
  const db = readDb();
  db[collection] = db[collection].filter(item => item.id !== id);
  if (collection === "superCategories") {
    const categoryIds = (db.categories || []).filter(category => category.superCategoryId === id).map(category => category.id);
    const productIds = (db.products || []).filter(product => categoryIds.includes(product.categoryId)).map(product => product.id);
    const modelIds = (db.models || []).filter(model => productIds.includes(model.productId)).map(model => model.id);
    db.categories = (db.categories || []).filter(category => category.superCategoryId !== id);
    db.products = (db.products || []).filter(product => !categoryIds.includes(product.categoryId));
    db.models = (db.models || []).filter(model => !productIds.includes(model.productId));
    db.parts = (db.parts || []).filter(part => !modelIds.includes(part.modelId));
  }
  if (collection === "categories") {
    const productIds = (db.products || []).filter(product => product.categoryId === id).map(product => product.id);
    const modelIds = (db.models || []).filter(model => productIds.includes(model.productId)).map(model => model.id);
    db.products = (db.products || []).filter(product => product.categoryId !== id);
    db.models = (db.models || []).filter(model => !productIds.includes(model.productId));
    db.parts = (db.parts || []).filter(part => !modelIds.includes(part.modelId));
  }
  if (collection === "products") {
    const modelIds = (db.models || []).filter(model => model.productId === id).map(model => model.id);
    db.models = (db.models || []).filter(model => model.productId !== id);
    db.parts = (db.parts || []).filter(part => !modelIds.includes(part.modelId) && part.productId !== id);
  }
  if (collection === "models") {
    db.parts = (db.parts || []).filter(part => part.modelId !== id);
  }
  writeDb(db);
}

function hasText(value, min = 1) {
  return typeof value === "string" && value.trim().length >= min;
}

function validPrice(value) {
  if (value === undefined || value === null || value === "") return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function validateCatalogItem(db, collection, item) {
  if (collection === "superCategories") {
    if (!hasText(item.name, 2)) return "Super category name is required";
    if (!hasText(item.summary, 10)) return "Super category summary must be at least 10 characters";
    if (!hasText(item.image, 1)) return "Super category picture is required";
  }

  if (collection === "categories") {
    if (!hasText(item.name, 2)) return "Category name is required";
    if (!hasText(item.summary, 10)) return "Category summary must be at least 10 characters";
    if (!hasText(item.image, 1)) return "Category picture is required";
    if (!db.superCategories.some(superCategory => superCategory.id === item.superCategoryId)) {
      return "Category must belong to an existing super category";
    }
  }

  if (collection === "products") {
    if (!hasText(item.name, 2)) return "Product name is required";
    if (!hasText(item.segment, 2)) return "Segment / series is required";
    if (!hasText(item.status, 2)) return "Badge is required";
    if (!hasText(item.summaryHtml || item.summary, 10)) return "Summary is required";
    if (!hasText(item.image, 1)) return "Main picture is required";
    if (!item.prices || !validPrice(item.prices.l1) || !validPrice(item.prices.l2) || !validPrice(item.prices.l3)) {
      return "Public Price, Account Price, and Admin Only Price are required and must be zero or higher";
    }
    if (!db.categories.some(category => category.id === item.categoryId)) {
      return "Product must belong to an existing category";
    }
  }

  if (collection === "models" || collection === "parts") {
    const label = collection === "models" ? "Model" : "Part";
    if (!hasText(item.name, 2)) return `${label} name is required`;
    if (!hasText(item.segment, 2)) return "Segment / series is required";
    if (!hasText(item.status, 2)) return "Badge is required";
    if (!hasText(item.summaryHtml || item.summary, 10)) return "Summary is required";
    if (!hasText(item.image, 1)) return "Main picture is required";
    if (!item.prices || !validPrice(item.prices.l1) || !validPrice(item.prices.l2) || !validPrice(item.prices.l3)) {
      return "Public Price, Account Price, and Admin Only Price are required and must be zero or higher";
    }
    if (collection === "models" && !db.products.some(product => product.id === item.productId)) {
      return "Model must belong to an existing product";
    }
    if (collection === "parts" && !db.models.some(model => model.id === item.modelId)) {
      return "Part must belong to an existing model";
    }
  }

  return "";
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/content") {
    const db = readDb();
    const user = currentUser(req, db);
    const { leads, users, ...publicContent } = db;
    if (user) {
      publicContent.account = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        city: user.city,
        country: user.country,
        domain: user.domain,
        experience: user.experience,
        mobile: user.mobile,
        accessLevel: user.accessLevel
      };
    }
    publicContent.products = publicContent.products.map(product => ({
      ...product,
      prices: allowedPrices(product.prices, user?.accessLevel)
    }));
    publicContent.models = (publicContent.models || []).map(model => ({
      ...model,
      prices: allowedPrices(model.prices, user?.accessLevel)
    }));
    publicContent.parts = (publicContent.parts || []).map(part => ({
      ...part,
      prices: allowedPrices(part.prices, user?.accessLevel)
    }));
    return send(res, 200, publicContent);
  }

  if (req.method === "POST" && url.pathname === "/api/leads") {
    const body = await getBody(req);
    const db = readDb();
    const lead = {
      id: cleanId("lead"),
      name: String(body.name || "").slice(0, 120),
      email: String(body.email || "").slice(0, 160),
      phone: String(body.phone || "").slice(0, 80),
      service: String(body.service || "").slice(0, 120),
      message: String(body.message || "").slice(0, 1200),
      createdAt: new Date().toISOString()
    };
    db.leads.unshift(lead);
    writeDb(db);
    return send(res, 201, { ok: true, lead });
  }

  if (url.pathname === "/api/admin/login" && req.method === "POST") {
    const body = await getBody(req);
    if (body.password === ADMIN_TOKEN) return send(res, 200, { token: ADMIN_TOKEN });
    return send(res, 401, { error: "Invalid password" });
  }

  if (url.pathname === "/api/register" && req.method === "POST") {
    const body = await getBody(req);
    const db = readDb();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !body.password || !body.fullName || !body.company) {
      return send(res, 400, { error: "Full name, company, email, and password are required" });
    }
    if (db.users.some(user => user.email === email)) {
      return send(res, 409, { error: "This email is already registered" });
    }
    const user = {
      id: cleanId("user"),
      fullName: String(body.fullName || "").slice(0, 140),
      company: String(body.company || "").slice(0, 160),
      city: String(body.city || "").slice(0, 100),
      country: String(body.country || "").slice(0, 100),
      domain: String(body.domain || "").slice(0, 140),
      experience: String(body.experience || "").slice(0, 60),
      email,
      mobile: String(body.mobile || "").slice(0, 80),
      passwordHash: crypto.createHash("sha256").update(String(body.password)).digest("hex"),
      status: "Pending",
      accessLevel: "L1",
      createdAt: new Date().toISOString()
    };
    db.users.unshift(user);
    writeDb(db);
    return send(res, 201, { ok: true, status: user.status });
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    const body = await getBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const passwordHash = crypto.createHash("sha256").update(String(body.password || "")).digest("hex");
    const db = readDb();
    const user = db.users.find(entry => entry.email === email && entry.passwordHash === passwordHash);
    if (!user) return send(res, 401, { error: "Invalid email or password" });
    if (user.status !== "Approved") return send(res, 403, { error: `Your account is ${user.status}` });
    const token = Buffer.from(`${user.id}:${user.accessLevel}:${Date.now()}`).toString("base64");
    return send(res, 200, {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        city: user.city,
        country: user.country,
        domain: user.domain,
        experience: user.experience,
        mobile: user.mobile,
        accessLevel: user.accessLevel
      }
    });
  }

  if (url.pathname === "/api/account" && req.method === "PUT") {
    const body = await getBody(req);
    const db = readDb();
    const user = currentUser(req, db);
    if (!user) return send(res, 401, { error: "Please login again to update your information" });
    const index = db.users.findIndex(entry => entry.id === user.id);
    if (index < 0) return send(res, 404, { error: "User not found" });
    db.users[index] = {
      ...db.users[index],
      fullName: String(body.fullName || "").trim().slice(0, 140),
      company: String(body.company || "").trim().slice(0, 160),
      city: String(body.city || "").trim().slice(0, 100),
      country: String(body.country || "").trim().slice(0, 100),
      domain: String(body.domain || "").trim().slice(0, 140),
      experience: String(body.experience || "").trim().slice(0, 60),
      mobile: String(body.mobile || "").trim().slice(0, 80)
    };
    if (!db.users[index].fullName || !db.users[index].company || !db.users[index].mobile) {
      return send(res, 400, { error: "Full name, company, and mobile number are required" });
    }
    writeDb(db);
    const { passwordHash, ...updatedUser } = db.users[index];
    return send(res, 200, updatedUser);
  }

  if (!url.pathname.startsWith("/api/admin/")) return send(res, 404, { error: "Not found" });
  if (!isAdmin(req)) return send(res, 401, { error: "Unauthorized" });

  if (req.method === "GET" && url.pathname === "/api/admin/content") {
    const db = readDb();
    db.users = db.users.map(({ passwordHash, ...user }) => user);
    return send(res, 200, db);
  }

  if (req.method === "POST" && url.pathname === "/api/admin/users") {
    const body = await getBody(req);
    const db = readDb();
    const index = db.users.findIndex(user => user.id === body.id);
    if (index < 0) return send(res, 404, { error: "User not found" });
    db.users[index] = {
      ...db.users[index],
      fullName: String(body.fullName || db.users[index].fullName).slice(0, 140),
      company: String(body.company || db.users[index].company).slice(0, 160),
      city: String(body.city || "").slice(0, 100),
      country: String(body.country || "").slice(0, 100),
      domain: String(body.domain || "").slice(0, 140),
      experience: String(body.experience || "").slice(0, 60),
      mobile: String(body.mobile || "").slice(0, 80),
      status: ["Pending", "Approved", "Rejected"].includes(body.status) ? body.status : db.users[index].status,
      accessLevel: ["L1", "L2", "L3"].includes(body.accessLevel) ? body.accessLevel : db.users[index].accessLevel
    };
    writeDb(db);
    const { passwordHash, ...user } = db.users[index];
    return send(res, 200, user);
  }

  const routes = {
    "/api/admin/settings": ["settings", "setting"],
    "/api/admin/superCategories": ["superCategories", "supercat"],
    "/api/admin/categories": ["categories", "cat"],
    "/api/admin/products": ["products", "prod"],
    "/api/admin/models": ["models", "model"],
    "/api/admin/parts": ["parts", "part"],
    "/api/admin/solutions": ["solutions", "sol"],
    "/api/admin/projects": ["projects", "project"],
    "/api/admin/trainings": ["trainings", "training"],
    "/api/admin/downloads": ["downloads", "download"],
    "/api/admin/blogs": ["blogs", "blog"]
  };

  if (req.method === "PUT" && url.pathname === "/api/admin/settings") {
    const body = await getBody(req);
    const db = readDb();
    db.settings = { ...db.settings, ...sanitizeItem(body) };
    writeDb(db);
    return send(res, 200, db.settings);
  }

  const matched = Object.entries(routes).find(([route]) => url.pathname === route);
  if (matched && req.method === "POST") {
    const [collection, prefix] = matched[1];
    const item = upsert(collection, await getBody(req), prefix);
    return send(res, 200, item);
  }

  const deleteMatch = url.pathname.match(/^\/api\/admin\/(superCategories|categories|products|models|parts|solutions|projects|trainings|downloads|blogs)\/([^/]+)$/);
  if (deleteMatch && req.method === "DELETE") {
    remove(deleteMatch[1], decodeURIComponent(deleteMatch[2]));
    return send(res, 200, { ok: true });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/leads/")) {
    remove("leads", decodeURIComponent(url.pathname.split("/").pop()));
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: "Not found" });
}

function serveStatic(req, res, url) {
  let filePath = decodeURIComponent(url.pathname);
  if (filePath === "/") filePath = "/index.html";
  const absolute = path.normalize(path.join(publicDir, filePath));
  if (!absolute.startsWith(publicDir)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
  fs.readFile(absolute, (error, file) => {
    if (error) {
      const fallback = path.join(publicDir, "index.html");
      if (!url.pathname.startsWith("/api/") && fs.existsSync(fallback)) {
        return send(res, 200, fs.readFileSync(fallback, "utf8"), "text/html; charset=utf-8");
      }
      return send(res, 404, "Not found", "text/plain; charset=utf-8");
    }
    const type = mimeTypes[path.extname(absolute).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(file);
  });
}

ensureStore();

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.message || "Server error" });
  }
}).listen(PORT, () => {
  console.log(`ELV.art website running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`Admin password: ${ADMIN_TOKEN}`);
});
