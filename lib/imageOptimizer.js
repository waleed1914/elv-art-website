const sharp = require("sharp");

const DEFAULT_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 78,
  effort: 4
};

async function optimizeImageBuffer(buffer, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: config.maxWidth,
      height: config.maxHeight,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: config.quality, effort: config.effort })
    .toBuffer();
}

module.exports = { optimizeImageBuffer };
