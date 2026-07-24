const fs = require("fs");
const path = require("path");
const { optimizeImageBuffer } = require("../lib/imageOptimizer");

const root = path.join(__dirname, "..");
const imageDirs = [
  path.join(root, "public", "assets"),
  path.join(root, "public", "assets", "generated"),
  path.join(root, "public", "uploads")
];
const textTargets = [
  path.join(root, "public"),
  path.join(root, "data")
];
const imageExts = new Set([".png", ".jpg", ".jpeg"]);
const textExts = new Set([".html", ".css", ".js", ".json"]);

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function publicPath(file) {
  return `/${path.relative(path.join(root, "public"), file).replace(/\\/g, "/")}`;
}

function replaceAllLiteral(text, from, to) {
  return text.split(from).join(to);
}

async function main() {
  const conversions = [];
  for (const dir of imageDirs) {
    for (const file of walk(dir, file => imageExts.has(path.extname(file).toLowerCase()))) {
      if (/logo/i.test(path.basename(file))) continue;
      const output = file.replace(/\.(png|jpe?g)$/i, ".webp");
      const inputBuffer = fs.readFileSync(file);
      const webpBuffer = await optimizeImageBuffer(inputBuffer);
      if (fs.existsSync(output) && fs.statSync(output).size <= webpBuffer.length) {
        conversions.push([publicPath(file), publicPath(output), fs.statSync(file).size, fs.statSync(output).size]);
        continue;
      }
      fs.writeFileSync(output, webpBuffer);
      conversions.push([publicPath(file), publicPath(output), inputBuffer.length, webpBuffer.length]);
    }
  }

  const useful = conversions.filter(([, , before, after]) => after < before);
  const textFiles = textTargets.flatMap(dir => walk(dir, file => textExts.has(path.extname(file).toLowerCase())));
  for (const file of textFiles) {
    let text = fs.readFileSync(file, "utf8");
    const original = text;
    for (const [from, to, before, after] of useful) {
      if (after < before) text = replaceAllLiteral(text, from, to);
    }
    if (text !== original) fs.writeFileSync(file, text);
  }

  const saved = useful.reduce((sum, [, , before, after]) => sum + before - after, 0);
  console.log(JSON.stringify({
    converted: useful.length,
    skippedLarger: conversions.length - useful.length,
    savedBytes: saved
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
