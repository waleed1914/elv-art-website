const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { optimizeImageBuffer } = require("./lib/imageOptimizer");

loadEnvFile();

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "elv-admin-2026";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "";
const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || "development";
const MAINTENANCE_MODE = String(process.env.MAINTENANCE_MODE || "false").toLowerCase() === "true";
const MAINTENANCE_PASSWORD = process.env.MAINTENANCE_PASSWORD || ADMIN_TOKEN;
const MAINTENANCE_COOKIE = "elv_maintenance_access";
const root = __dirname;
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");
const uploadsDir = path.join(publicDir, "uploads");
const defaultDbFile = APP_ENV === "production" ? path.join("data", "db.production.json") : path.join("data", "db.local.json");
const dbFile = process.env.DB_FILE || defaultDbFile;
const dbPath = path.isAbsolute(dbFile) ? dbFile : path.join(root, dbFile);
const seedDbPath = path.join(dataDir, "db.seed.json");
const legacyDbPath = path.join(dataDir, "db.json");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

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

  const dbDirectory = path.dirname(dbPath);
  fs.mkdirSync(dbDirectory, { recursive: true });

  if (!fs.existsSync(dbPath)) {
    const seedSource = fs.existsSync(seedDbPath) ? seedDbPath : legacyDbPath;
    if (fs.existsSync(seedSource)) {
      fs.copyFileSync(seedSource, dbPath);
      return;
    }

    const now = new Date().toISOString();
    const db = {
      settings: {
        brand: "ELV.art",
        tagline: "Integrated low-voltage systems for secure, intelligent spaces.",
        phone: "+92 332 4816433",
        email: "hello@elv.art",
        location: "Pakistan - Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Sialkot",
        whatsapp: "+923324816433"
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
  const removedServiceAreas = ["Quetta", "Balochistan", "Baluchistan", "Gwadar", "Turbat", "Khuzdar", "Sibi", "Zhob", "Chaman"];
  if (db.settings?.location) {
    let location = String(db.settings.location);
    removedServiceAreas.forEach(area => {
      location = location.replace(new RegExp(`,?\\s*${area}`, "gi"), "");
    });
    location = location.replace(/\s+,/g, ",").replace(/,\s*,/g, ",").replace(/-\s*,/, "-").trim();
    db.settings.location = location;
  }
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
    homeFeatured: Boolean(product.homeFeatured || String(product.status || "").toLowerCase().includes("featured")),
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
  db.users = (db.users || []).map(user => ({
    emailVerified: user.status === "Approved",
    ...user
  }));
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

function parseCookies(req) {
  return String(req.headers.cookie || "").split(";").reduce((cookies, pair) => {
    const index = pair.indexOf("=");
    if (index < 0) return cookies;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function maintenanceCookieValue() {
  return crypto
    .createHmac("sha256", String(MAINTENANCE_PASSWORD || ADMIN_TOKEN))
    .update("elv-art-maintenance")
    .digest("hex");
}

function hasMaintenanceAccess(req) {
  if (!MAINTENANCE_MODE) return true;
  if (isAdmin(req)) return true;
  return parseCookies(req)[MAINTENANCE_COOKIE] === maintenanceCookieValue();
}

function isMaintenanceAllowedPath(url) {
  if (!MAINTENANCE_MODE) return true;
  if (url.pathname === "/maintenance.html") return true;
  if (url.pathname === "/api/maintenance-login") return true;
  if (url.pathname === "/verify.html" || url.pathname === "/reset-password.html") return true;
  if (url.pathname === "/api/verify-email" || url.pathname === "/api/reset-password") return true;
  if (url.pathname === "/api/admin/login") return true;
  if (url.pathname.startsWith("/api/admin/")) return true;
  if (url.pathname === "/admin.html" || url.pathname === "/admin.css" || url.pathname === "/admin.js") return true;
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/uploads/")) return true;
  if (url.pathname === "/styles.css") return true;
  return false;
}

function serveMaintenance(res) {
  const filePath = path.join(publicDir, "maintenance.html");
  if (fs.existsSync(filePath)) {
    return send(res, 503, fs.readFileSync(filePath, "utf8"), "text/html; charset=utf-8");
  }
  return send(res, 503, "ELV.art is under maintenance.", "text/plain; charset=utf-8");
}

function setMaintenanceCookie(res) {
  const cookie = `${MAINTENANCE_COOKIE}=${encodeURIComponent(maintenanceCookieValue())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Set-Cookie": cookie
  });
  res.end(JSON.stringify({ ok: true }));
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

function isLocalHost(hostname) {
  const host = String(hostname || "").split(":")[0].toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.") || host.endsWith(".local");
}

function requestOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${req.headers.host}`;
}

function publicSiteUrl(req) {
  const requestHost = String(req.headers.host || "");
  if (isLocalHost(requestHost)) return requestOrigin(req);
  if (PUBLIC_SITE_URL) return PUBLIC_SITE_URL.replace(/\/$/, "");
  return requestOrigin(req);
}

function showLocalVerificationLink(req) {
  return isLocalHost(req.headers.host);
}

function verificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function verifyEmailToken(token) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken) return { statusCode: 400, error: "Verification token is required" };
  const db = readDb();
  const tokenHash = hashToken(cleanToken);
  const index = db.users.findIndex(user => user.emailVerificationTokenHash === tokenHash);
  if (index < 0) return { statusCode: 400, error: "This verification link is invalid or has already been used" };
  const user = db.users[index];
  if (user.emailVerificationExpiresAt && Date.parse(user.emailVerificationExpiresAt) < Date.now()) {
    return { statusCode: 400, error: "This verification link has expired. Please register again or ask ELV.art support to resend it" };
  }
  db.users[index] = {
    ...user,
    status: "Approved",
    emailVerified: true,
    emailVerifiedAt: new Date().toISOString()
  };
  delete db.users[index].emailVerificationTokenHash;
  delete db.users[index].emailVerificationExpiresAt;
  writeDb(db);
  return { ok: true, message: "Email verified. You can now login to your ELV.art account." };
}

function passwordResetToken() {
  return verificationToken();
}

function resetEmailToken(token, password) {
  const cleanToken = String(token || "").trim();
  const cleanPassword = String(password || "");
  if (!cleanToken) return { statusCode: 400, error: "Reset token is required" };
  if (cleanPassword.length < 8) return { statusCode: 400, error: "Password must be at least 8 characters" };
  const db = readDb();
  const tokenHash = hashToken(cleanToken);
  const index = db.users.findIndex(user => user.passwordResetTokenHash === tokenHash);
  if (index < 0) return { statusCode: 400, error: "This password reset link is invalid or has already been used" };
  const user = db.users[index];
  if (user.passwordResetExpiresAt && Date.parse(user.passwordResetExpiresAt) < Date.now()) {
    return { statusCode: 400, error: "This password reset link has expired. Please request a new password reset email." };
  }
  db.users[index] = {
    ...user,
    passwordHash: crypto.createHash("sha256").update(cleanPassword).digest("hex"),
    passwordUpdatedAt: new Date().toISOString()
  };
  delete db.users[index].passwordResetTokenHash;
  delete db.users[index].passwordResetExpiresAt;
  writeDb(db);
  return { ok: true, message: "Your password has been changed. You can now login with your new password." };
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function mailTransport() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || "true") === "true" || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendVerificationEmail(req, user, token) {
  const baseUrl = publicSiteUrl(req);
  const verifyUrl = `${baseUrl}/verify.html?token=${encodeURIComponent(token)}`;
  const from = process.env.MAIL_FROM || `ELV.art <${process.env.SMTP_USER || "info@elv.art"}>`;
  const subject = "Verify your ELV.art account";
  const safeName = escapeEmailHtml(user.fullName || user.email);
  const safeUrl = escapeEmailHtml(verifyUrl);
  const text = [
    `Hello ${user.fullName || user.email},`,
    "",
    "Welcome to ELV.art. Please verify your email address to activate your account.",
    "",
    verifyUrl,
    "",
    "This link expires in 24 hours. If you did not create this account, please ignore this email.",
    "",
    "ELV.art - Integrated ELV, security, automation, and low-voltage solutions"
  ].join("\n");
  const html = `
    <div style="margin:0;padding:0;background:#f2f6fb;font-family:Arial,Helvetica,sans-serif;color:#17253a">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f2f6fb;padding:28px 0">
        <tr>
          <td align="center" style="padding:28px 14px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #c7d7ea;border-radius:14px;overflow:hidden">
              <tr>
                <td style="padding:26px 30px;background:#ffffff;border-bottom:1px solid #e4edf7">
                  <div style="font-size:28px;font-weight:800;letter-spacing:.4px;color:#15469b">ELV<span style="color:#20a73f">.art</span></div>
                  <div style="margin-top:6px;font-size:13px;color:#65758b">Security, automation, and low-voltage systems</div>
                </td>
              </tr>
              <tr>
                <td style="padding:34px 30px 10px">
                  <div style="display:inline-block;background:#e8f8ec;color:#168334;border:1px solid #bde9c8;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.7px">Account Verification</div>
                  <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2;color:#10213a">Verify your ELV.art account</h1>
                  <p style="margin:0;font-size:16px;line-height:1.7;color:#53647a">Hello ${safeName}, welcome to ELV.art. Please confirm your email address so you can login and continue using your project account.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:24px 30px">
                  <a href="${safeUrl}" style="display:inline-block;background:#1f4ca3;color:#ffffff;text-decoration:none;padding:15px 24px;border-radius:10px;font-weight:800;font-size:15px;box-shadow:0 12px 24px rgba(31,76,163,.22)">Verify Email Address</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 30px 26px">
                  <div style="background:#f6f9fd;border:1px solid #d9e5f3;border-radius:10px;padding:16px">
                    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#65758b">If the button does not work, copy and paste this link into your browser:</p>
                    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;color:#16499a">${safeUrl}</p>
                  </div>
                  <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#65758b">This verification link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 30px;background:#10213a;color:#dce8f7;font-size:12px;line-height:1.6">
                  ELV.art<br>
                  Integrated ELV, CCTV, access control, automation, and low-voltage solutions across Pakistan.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
  if (!smtpConfigured()) {
    console.log(`Email verification link for ${user.email}: ${verifyUrl}`);
    return { sent: false, verifyUrl };
  }
  await mailTransport().sendMail({ from, to: user.email, subject, text, html });
  return { sent: true, verifyUrl };
}

async function sendPasswordResetEmail(req, user, token) {
  const baseUrl = publicSiteUrl(req);
  const resetUrl = `${baseUrl}/reset-password.html?token=${encodeURIComponent(token)}`;
  const from = process.env.MAIL_FROM || `ELV.art <${process.env.SMTP_USER || "info@elv.art"}>`;
  const subject = "Reset your ELV.art password";
  const safeName = escapeEmailHtml(user.fullName || user.email);
  const safeUrl = escapeEmailHtml(resetUrl);
  const text = [
    `Hello ${user.fullName || user.email},`,
    "",
    "We received a request to reset your ELV.art account password.",
    "",
    resetUrl,
    "",
    "This link expires in 1 hour. If you did not request this, please ignore this email.",
    "",
    "ELV.art"
  ].join("\n");
  const html = `
    <div style="margin:0;padding:0;background:#f2f6fb;font-family:Arial,Helvetica,sans-serif;color:#17253a">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f2f6fb;padding:28px 0">
        <tr>
          <td align="center" style="padding:28px 14px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #c7d7ea;border-radius:14px;overflow:hidden">
              <tr>
                <td style="padding:26px 30px;background:#ffffff;border-bottom:1px solid #e4edf7">
                  <div style="font-size:28px;font-weight:800;letter-spacing:.4px;color:#15469b">ELV<span style="color:#20a73f">.art</span></div>
                  <div style="margin-top:6px;font-size:13px;color:#65758b">Project account security</div>
                </td>
              </tr>
              <tr>
                <td style="padding:34px 30px 10px">
                  <div style="display:inline-block;background:#edf4ff;color:#16499a;border:1px solid #c7d7ea;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.7px">Password Reset</div>
                  <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2;color:#10213a">Create a new password</h1>
                  <p style="margin:0;font-size:16px;line-height:1.7;color:#53647a">Hello ${safeName}, use the secure button below to reset your ELV.art account password.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:24px 30px">
                  <a href="${safeUrl}" style="display:inline-block;background:#1f4ca3;color:#ffffff;text-decoration:none;padding:15px 24px;border-radius:10px;font-weight:800;font-size:15px;box-shadow:0 12px 24px rgba(31,76,163,.22)">Reset Password</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 30px 26px">
                  <div style="background:#f6f9fd;border:1px solid #d9e5f3;border-radius:10px;padding:16px">
                    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#65758b">If the button does not work, copy and paste this link into your browser:</p>
                    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;color:#16499a">${safeUrl}</p>
                  </div>
                  <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#65758b">This reset link expires in 1 hour. If you did not request it, you can safely ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 30px;background:#10213a;color:#dce8f7;font-size:12px;line-height:1.6">
                  ELV.art<br>
                  Integrated ELV, CCTV, access control, automation, and low-voltage solutions across Pakistan.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
  if (!smtpConfigured()) {
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    return { sent: false, resetUrl };
  }
  await mailTransport().sendMail({ from, to: user.email, subject, text, html });
  return { sent: true, resetUrl };
}

function escapeEmailHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeItem(item) {
  const clone = { ...item };
  delete clone.createdAt;
  delete clone.updatedAt;
  return clone;
}

async function saveImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return "";
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,(.+)$/);
  if (!match) return "";
  const isSvg = match[1] === "svg+xml";
  const ext = isSvg ? "svg" : "webp";
  const fileName = `${cleanId("upload")}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  const input = Buffer.from(match[2], "base64");
  fs.writeFileSync(filePath, isSvg ? input : await optimizeImageBuffer(input));
  return `/uploads/${fileName}`;
}

async function saveUpload(dataUrl, field = "") {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return "";
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return "";
  const mime = match[1].toLowerCase();
  if (mime.startsWith("image/")) return saveImage(dataUrl);
  const extByMime = {
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
  const ext = field === "model3d" && mime === "application/octet-stream" ? "stl" : extByMime[mime] || "file";
  const fileName = `${cleanId("upload")}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir, fileName), Buffer.from(match[2], "base64"));
  return `/uploads/${fileName}`;
}

async function normalizeUploads(item) {
  const uploadFields = ["image", "datasheet", "manual", "model3d", "cad"];
  for (const field of uploadFields) {
    if (item[field] && typeof item[field] === "string" && item[field].startsWith("data:")) {
      item[field] = await saveUpload(item[field], field);
    }
  }
  if (Array.isArray(item.gallery)) {
    item.gallery = (await Promise.all(item.gallery.map(file => (typeof file === "string" && file.startsWith("data:") ? saveUpload(file, "gallery") : file)))).filter(Boolean);
  }
  if (Array.isArray(item.hotspots)) {
    item.hotspots = item.hotspots.map(hotspot => ({
      title: String(hotspot.title || "").slice(0, 120),
      message: String(hotspot.message || "").slice(0, 220),
      x: Math.max(0, Math.min(100, Number(hotspot.x || 0))),
      y: Math.max(0, Math.min(100, Number(hotspot.y || 0))),
      target: String(hotspot.target || "").slice(0, 160)
    })).filter(hotspot => hotspot.title && hotspot.message && hotspot.target);
  }
  if (Array.isArray(item.sections)) {
    item.sections = item.sections.map(section => ({
      ...section,
      heading: String(section.heading || "").slice(0, 160),
      paragraph: String(section.paragraph || "").slice(0, 2200),
      image: section.image
    })).filter(section => section.paragraph || section.image);
    for (const section of item.sections) {
      if (section.image && typeof section.image === "string" && section.image.startsWith("data:")) {
        section.image = await saveUpload(section.image, "image");
      }
    }
  }
  if (Array.isArray(item.documents)) {
    item.documents = (await Promise.all(item.documents.map(async document => {
      const file = typeof document === "string" ? { name: path.basename(document), url: document } : { ...document };
      if (file.url && typeof file.url === "string" && file.url.startsWith("data:")) {
        file.url = await saveUpload(file.url, "document");
      }
      file.name = String(file.name || path.basename(file.url || "Training document")).slice(0, 180);
      return file;
    }))).filter(document => document.url);
  }
  return item;
}

async function upsert(collection, payload, prefix) {
  const db = readDb();
  const item = await normalizeUploads(sanitizeItem(payload));
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function validPrice(value) {
  if (value === undefined || value === null || value === "") return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function publicOrigin(req) {
  if (PUBLIC_SITE_URL) return PUBLIC_SITE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${req.headers.host}`;
}

function sitemapUrl(origin, pathName, lastmod, priority = "0.7") {
  return [
    "  <url>",
    `    <loc>${xmlEscape(`${origin}${pathName}`)}</loc>`,
    `    <lastmod>${xmlEscape(lastmod)}</lastmod>`,
    "    <changefreq>weekly</changefreq>",
    `    <priority>${priority}</priority>`,
    "  </url>"
  ].join("\n");
}

function buildSitemap(req) {
  const db = readDb();
  const origin = publicOrigin(req);
  const lastmod = (db.updatedAt || new Date().toISOString()).slice(0, 10);
  const urls = [
    sitemapUrl(origin, "/", lastmod, "1.0"),
    sitemapUrl(origin, "/solutions.html", lastmod, "0.9"),
    sitemapUrl(origin, "/products.html", lastmod, "0.9"),
    sitemapUrl(origin, "/case-studies.html", lastmod, "0.7"),
    sitemapUrl(origin, "/training.html", lastmod, "0.6"),
    sitemapUrl(origin, "/downloads.html", lastmod, "0.6"),
    sitemapUrl(origin, "/blogs.html", lastmod, "0.7"),
    sitemapUrl(origin, "/about.html", lastmod, "0.7"),
    sitemapUrl(origin, "/contact.html", lastmod, "0.6")
  ];
  (db.superCategories || []).forEach(item => urls.push(sitemapUrl(origin, `/products.html#${encodeURIComponent(item.id)}`, lastmod, "0.8")));
  (db.categories || []).forEach(item => urls.push(sitemapUrl(origin, `/category.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.8")));
  (db.products || []).forEach(item => urls.push(sitemapUrl(origin, `/product.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.8")));
  (db.models || []).forEach(item => urls.push(sitemapUrl(origin, `/model.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.8")));
  (db.parts || []).forEach(item => urls.push(sitemapUrl(origin, `/part.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.7")));
  (db.solutions || []).forEach(item => urls.push(sitemapUrl(origin, `/solution.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.8")));
  (db.projects || []).forEach(item => urls.push(sitemapUrl(origin, `/case-study.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.6")));
  (db.trainings || []).forEach(item => urls.push(sitemapUrl(origin, `/training-detail.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.5")));
  (db.downloads || []).forEach(item => urls.push(sitemapUrl(origin, `/download-detail.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.5")));
  (db.blogs || []).forEach(item => urls.push(sitemapUrl(origin, `/blog-detail.html?id=${encodeURIComponent(item.id)}`, lastmod, "0.6")));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function buildRobots(req) {
  const origin = publicOrigin(req);
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin.html",
    "Disallow: /dashboard.html",
    "Disallow: /cart.html",
    "Disallow: /api/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    ""
  ].join("\n");
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

  if (collection === "solutions") {
    if (!hasText(item.title, 2)) return "Solution title is required";
    if (!hasText(item.summary, 10)) return "Solution summary must be at least 10 characters";
    if (!hasText(item.image, 1)) return "Main solution image is required";
    if (Array.isArray(item.hotspots)) {
      for (const hotspot of item.hotspots) {
        const [type, id] = String(hotspot.target || "").split(":");
        const collectionName = type === "product" ? "products" : type === "model" ? "models" : type === "part" ? "parts" : "";
        if (!collectionName || !db[collectionName]?.some(entry => entry.id === id)) {
          return "Each solution hotspot must link to an existing product, model, or accessory";
        }
      }
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
    if (collection === "parts") {
      const hasNestedModel = item.modelId && db.models.some(model => model.id === item.modelId);
      const hasProductModel = item.productId && db.products.some(product => product.id === item.productId);
      if (!hasNestedModel && !hasProductModel) {
        return "Part must belong to an existing model";
      }
    }
  }

  return "";
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/maintenance-login" && req.method === "POST") {
    const body = await getBody(req);
    if (String(body.password || "") !== String(MAINTENANCE_PASSWORD)) {
      return send(res, 401, { error: "Invalid maintenance password" });
    }
    return setMaintenanceCookie(res);
  }

  if (MAINTENANCE_MODE && !hasMaintenanceAccess(req) && !isMaintenanceAllowedPath(url)) {
    return send(res, 503, { error: "Website is in maintenance mode" });
  }

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
        accessLevel: user.accessLevel,
        emailVerified: Boolean(user.emailVerified)
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
    if (!isValidEmail(email)) return send(res, 400, { error: "Please enter a valid email address" });
    if (String(body.password || "").length < 8) return send(res, 400, { error: "Password must be at least 8 characters" });
    if (!hasText(body.city, 2) || !hasText(body.domain, 2) || !hasText(body.mobile, 6)) {
      return send(res, 400, { error: "City, business domain, and mobile number are required" });
    }
    const token = verificationToken();
    const existingIndex = db.users.findIndex(user => user.email === email);
    if (existingIndex >= 0 && db.users[existingIndex].emailVerified) {
      return send(res, 409, { error: "This email is already registered. Please login or use forgot password when it is available." });
    }
    if (existingIndex >= 0) {
      db.users[existingIndex] = {
        ...db.users[existingIndex],
        fullName: String(body.fullName || "").slice(0, 140),
        company: String(body.company || "").slice(0, 160),
        city: String(body.city || "").slice(0, 100),
        country: String(body.country || "").slice(0, 100),
        domain: String(body.domain || "").slice(0, 140),
        experience: String(body.experience || "").slice(0, 60),
        mobile: String(body.mobile || "").slice(0, 80),
        passwordHash: crypto.createHash("sha256").update(String(body.password)).digest("hex"),
        status: "Pending",
        accessLevel: db.users[existingIndex].accessLevel || "L1",
        emailVerified: false,
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
      const emailResult = await sendVerificationEmail(req, db.users[existingIndex], token);
      return send(res, 200, {
        ok: true,
        status: db.users[existingIndex].status,
        emailVerificationRequired: true,
        emailSent: emailResult.sent,
        resent: true,
        message: "A fresh verification email has been sent. Please verify your email, then login.",
        devVerificationUrl: showLocalVerificationLink(req) ? emailResult.verifyUrl : undefined
      });
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
      emailVerified: false,
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    db.users.unshift(user);
    writeDb(db);
    const emailResult = await sendVerificationEmail(req, user, token);
    return send(res, 201, {
      ok: true,
      status: user.status,
      emailVerificationRequired: true,
      emailSent: emailResult.sent,
      devVerificationUrl: showLocalVerificationLink(req) ? emailResult.verifyUrl : undefined
    });
  }

  if (url.pathname === "/api/verify-email" && req.method === "POST") {
    const body = await getBody(req);
    const result = verifyEmailToken(body.token);
    if (!result.ok) return send(res, result.statusCode || 400, { error: result.error || "Verification failed" });
    return send(res, 200, result);
  }

  if (url.pathname === "/api/resend-verification" && req.method === "POST") {
    const body = await getBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!isValidEmail(email)) return send(res, 400, { error: "Please enter a valid email address" });
    const db = readDb();
    const index = db.users.findIndex(user => user.email === email);
    if (index < 0) return send(res, 404, { error: "No account found for this email" });
    if (db.users[index].emailVerified) return send(res, 200, { ok: true, message: "This email is already verified" });
    const token = verificationToken();
    db.users[index].emailVerificationTokenHash = hashToken(token);
    db.users[index].emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    writeDb(db);
    const emailResult = await sendVerificationEmail(req, db.users[index], token);
    return send(res, 200, {
      ok: true,
      emailSent: emailResult.sent,
      devVerificationUrl: showLocalVerificationLink(req) ? emailResult.verifyUrl : undefined
    });
  }

  if (url.pathname === "/api/request-password-reset" && req.method === "POST") {
    const body = await getBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!isValidEmail(email)) return send(res, 400, { error: "Please enter a valid email address" });
    const db = readDb();
    const index = db.users.findIndex(user => user.email === email);
    if (index < 0) {
      return send(res, 200, {
        ok: true,
        emailSent: true,
        message: "If this email is registered, a password reset link will be sent."
      });
    }
    const token = passwordResetToken();
    db.users[index].passwordResetTokenHash = hashToken(token);
    db.users[index].passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    writeDb(db);
    const emailResult = await sendPasswordResetEmail(req, db.users[index], token);
    return send(res, 200, {
      ok: true,
      emailSent: emailResult.sent,
      message: "If this email is registered, a password reset link will be sent.",
      devResetUrl: showLocalVerificationLink(req) ? emailResult.resetUrl : undefined
    });
  }

  if (url.pathname === "/api/reset-password" && req.method === "POST") {
    const body = await getBody(req);
    const result = resetEmailToken(body.token, body.password);
    if (!result.ok) return send(res, result.statusCode || 400, { error: result.error || "Password reset failed" });
    return send(res, 200, result);
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    const body = await getBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const passwordHash = crypto.createHash("sha256").update(String(body.password || "")).digest("hex");
    const db = readDb();
    const user = db.users.find(entry => entry.email === email && entry.passwordHash === passwordHash);
    if (!user) return send(res, 401, { error: "Invalid email or password" });
    if (!user.emailVerified) return send(res, 403, { code: "EMAIL_NOT_VERIFIED", email: user.email, error: "Please verify your email address before login. Check your inbox for the ELV.art verification email." });
    if (user.status === "Rejected") return send(res, 403, { code: "ACCOUNT_REJECTED", status: user.status, error: "This account is not active. Please contact ELV.art support." });
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
        accessLevel: user.accessLevel,
        emailVerified: Boolean(user.emailVerified)
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
    db.users = db.users.map(({ passwordHash, emailVerificationTokenHash, passwordResetTokenHash, ...user }) => user);
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

  const userDeleteMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (userDeleteMatch && req.method === "DELETE") {
    const id = decodeURIComponent(userDeleteMatch[1]);
    const db = readDb();
    const before = db.users.length;
    db.users = db.users.filter(user => user.id !== id);
    if (db.users.length === before) return send(res, 404, { error: "User not found" });
    writeDb(db);
    return send(res, 200, { ok: true });
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
    const item = await upsert(collection, await getBody(req), prefix);
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
    const ext = path.extname(absolute).toLowerCase();
    const type = mimeTypes[ext] || "application/octet-stream";
    const noCache = [".html", ".css", ".js", ".json"].includes(ext);
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": noCache ? "no-cache, must-revalidate" : "public, max-age=86400"
    });
    res.end(file);
  });
}

ensureStore();

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (MAINTENANCE_MODE && !hasMaintenanceAccess(req) && !isMaintenanceAllowedPath(url)) {
      if (url.pathname.startsWith("/api/")) {
        return send(res, 503, { error: "Website is in maintenance mode" });
      }
      return serveMaintenance(res);
    }
    if (req.method === "GET" && url.pathname === "/verify.html" && url.searchParams.get("token")) {
      const result = verifyEmailToken(url.searchParams.get("token"));
      const params = new URLSearchParams();
      if (result.ok) {
        params.set("verified", "1");
      } else {
        params.set("error", result.error || "Verification failed");
      }
      res.writeHead(302, { Location: `/verify.html?${params.toString()}` });
      return res.end();
    }
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    if (url.pathname === "/robots.txt") return send(res, 200, buildRobots(req), "text/plain; charset=utf-8");
    if (url.pathname === "/sitemap.xml") return send(res, 200, buildSitemap(req), "application/xml; charset=utf-8");
    return serveStatic(req, res, url);
  } catch (error) {
    return send(res, error.statusCode || 500, { error: error.message || "Server error" });
  }
}).listen(PORT, () => {
  console.log(`ELV.art website running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`Admin password: ${ADMIN_TOKEN}`);
  console.log(`Database: ${dbPath}`);
  console.log(`Maintenance mode: ${MAINTENANCE_MODE ? "ON" : "OFF"}`);
});
