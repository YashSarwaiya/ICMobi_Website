const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class ImageCache {
  constructor(cacheDir = "./cache/images", maxAge = 3600000) {
    // maxAge in milliseconds (default 1 hour)
    this.cacheDir = cacheDir;
    this.maxAge = maxAge;
    this.memoryCache = new Map(); // In-memory cache for faster access

    // Ensure cache directory exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  // Generate cache key from filename
  getCacheKey(filename) {
    return crypto.createHash("md5").update(filename).digest("hex");
  }

  // Get cached image path
  getCachePath(filename) {
    const key = this.getCacheKey(filename);
    return path.join(this.cacheDir, `${key}.jpg`);
  }

  // Check if cached image exists and is still valid
  isCached(filename) {
    const cachePath = this.getCachePath(filename);

    // Check memory cache first
    if (this.memoryCache.has(filename)) {
      const cached = this.memoryCache.get(filename);
      if (Date.now() - cached.timestamp < this.maxAge) {
        return true;
      }
      this.memoryCache.delete(filename);
    }

    // Check disk cache
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      const age = Date.now() - stats.mtimeMs;

      if (age < this.maxAge) {
        return true;
      }

      // Cache expired, delete it
      fs.unlinkSync(cachePath);
    }

    return false;
  }

  // Get cached image
  getCached(filename) {
    // Try memory cache first
    if (this.memoryCache.has(filename)) {
      const cached = this.memoryCache.get(filename);
      if (Date.now() - cached.timestamp < this.maxAge) {
        return cached.data;
      }
      this.memoryCache.delete(filename);
    }

    // Try disk cache
    const cachePath = this.getCachePath(filename);
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath);

      // Store in memory cache for next time
      this.memoryCache.set(filename, {
        data: data,
        timestamp: Date.now(),
      });

      return data;
    }

    return null;
  }

  // Save image to cache
  saveToCache(filename, imageBuffer) {
    const cachePath = this.getCachePath(filename);

    // Save to disk
    fs.writeFileSync(cachePath, imageBuffer);

    // Save to memory cache
    this.memoryCache.set(filename, {
      data: imageBuffer,
      timestamp: Date.now(),
    });
  }

  // Clear old cache entries
  clearOldCache() {
    const files = fs.readdirSync(this.cacheDir);
    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(this.cacheDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > this.maxAge) {
        fs.unlinkSync(filePath);
      }
    });

    // Clear memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const files = fs.readdirSync(this.cacheDir);
    const totalSize = files.reduce((sum, file) => {
      const filePath = path.join(this.cacheDir, file);
      return sum + fs.statSync(filePath).size;
    }, 0);

    return {
      diskCacheFiles: files.length,
      diskCacheSize: totalSize,
      memoryCacheEntries: this.memoryCache.size,
    };
  }
}

module.exports = ImageCache;
