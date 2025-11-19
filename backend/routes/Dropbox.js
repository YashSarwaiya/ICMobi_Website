const express = require("express");
const axios = require("axios");
const router = express.Router();
const fs = require("fs");
const db = require("../models");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Component = db.component;
const User = db.user;

///////////////////
///// DROPBOX /////
///////////////////

const dropboxV2Api = require("dropbox-v2-api");
const { FULLY_LABELED_THRESHOLD } = require("../constants/constants");
let dropbox = null;
const folderpath = "/IC_images";

// ========== CACHING MECHANISM ==========
let cachedFileList = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Function to check if cache is valid
const isCacheValid = () => {
  if (!cachedFileList || !cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < CACHE_DURATION;
};

// Function to get file list (cached or fresh)
const getFileList = async () => {
  if (isCacheValid()) {
    console.log(
      "✓ Using cached file list (" + cachedFileList.length + " files)"
    );
    return cachedFileList;
  }

  console.log("✗ Cache expired or empty, fetching from Dropbox...");

  return new Promise((resolve, reject) => {
    dropbox(
      {
        resource: "files/list_folder",
        parameters: { path: folderpath },
      },
      async (err, result, response) => {
        if (err) {
          console.log("Error fetching file list:", err);
          return reject(err);
        }

        let dropboxlist = result.entries;
        let has_more = result.has_more;
        let cursor = result.cursor;

        // Continue getting filenames until all retrieved
        while (has_more) {
          const listContinueObject = await getFilenamesContinue(cursor);
          dropboxlist = dropboxlist.concat(listContinueObject.entries);
          has_more = listContinueObject.has_more;
          cursor = listContinueObject.cursor;
        }

        // Filter out only files (not folders)
        dropboxlist = dropboxlist.filter((entry) => entry[".tag"] === "file");

        // Extract file names
        dropboxlist = dropboxlist.map((file) => file["name"]);

        // Extract only .jpg images
        dropboxlist = dropboxlist.filter((file) => {
          const extIndex = file.lastIndexOf(".");
          return file.substring(extIndex) === ".jpg";
        });

        // Update cache
        cachedFileList = dropboxlist;
        cacheTimestamp = Date.now();

        console.log("✓ Cached " + dropboxlist.length + " files from Dropbox");
        resolve(dropboxlist);
      }
    );
  });
};

// Function to invalidate cache (call this when you know files changed)
const invalidateCache = () => {
  cachedFileList = null;
  cacheTimestamp = null;
  console.log("Cache invalidated");
};
// ========================================

//Get new short live token every 3 hours
generateDBXAuth = () => {
  axios
    .post(
      "https://api.dropbox.com/oauth2/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: process.env.DROPBOX_RTOKEN,
      }),
      {
        auth: {
          username: process.env.DROPBOX_APPKEY,
          password: process.env.DROPBOX_APPSECRET,
        },
      }
    )
    .then((res) => {
      dropbox = dropboxV2Api.authenticate({
        token: res.data.access_token,
      });

      if (dropbox) {
        console.log("Dropbox successfully authenticated!");
      }
    })
    .catch((err) => {
      console.log(err);
    });

  setTimeout(generateDBXAuth, 10800000);
};

generateDBXAuth();

//////////////////////////
///// HELPER METHODS /////
//////////////////////////

getFilenamesContinue = (cursor) => {
  return new Promise((resolve, reject) => {
    dropbox(
      {
        resource: "files/list_folder/continue",
        parameters: { cursor: cursor },
      },
      (err, result, response) => {
        if (err) {
          reject(err);
        }

        let listContinue = {
          entries: result.entries,
          has_more: result.has_more,
          cursor: result.cursor,
        };

        resolve(listContinue);
      }
    );
  });
};

filterByExperiment = (complist, lastExp = false) => {
  let data = {};
  try {
    data = fs.readFileSync("./temp/experiment-weights.json", "utf8");
  } catch (err) {
    console.log(err);
    return complist;
  }

  const weighter = JSON.parse(data);
  let exp = "";

  if (lastExp) {
    exp = weighter.lastExp;
  } else {
    const drawnWeight = Math.random();
    const weights = weighter.weights;
    let currWeight = 0.0;

    for (const expNo in weights) {
      if (weights.hasOwnProperty(expNo)) {
        currWeight = currWeight + parseFloat(weights[expNo]);

        if (currWeight > drawnWeight) {
          exp = String(expNo);
          break;
        }
      }
    }

    if (exp.length === 0) {
      exp = weighter.lastExp;
    }
  }

  weighter.lastExp = exp;
  const jsonWeighter = JSON.stringify(weighter);

  try {
    fs.writeFileSync("./temp/experiment-weights.json", jsonWeighter, "utf8");
  } catch (err) {
    if (err) {
      console.log(err);
    }
  }

  return complist.filter((entry) => {
    if (typeof entry === "string") {
      return entry.slice(0, 1) === exp;
    } else if (typeof entry === "object" && "name" in entry) {
      return entry.name.slice(0, 1) === exp;
    } else {
      return true;
    }
  });
};

////////////////////////
///// ROUTER PATHS /////
////////////////////////

// OPTIMIZED: Get image file name for labeling
router.get("/imagefile", async (req, res) => {
  if (!req.query.email || req.query.email === "guest") {
    try {
      let files = [];
      const data = await Component.find({});

      if (data && data.length > 0) {
        files = data;
      } else {
        files = [
          { name: "1001001.jpg" },
          { name: "1001002.jpg" },
          { name: "1001003.jpg" },
          { name: "1001004.jpg" },
          { name: "1001005.jpg" },
          { name: "1001006.jpg" },
          { name: "1001007.jpg" },
          { name: "1001008.jpg" },
          { name: "1001009.jpg" },
          { name: "1001010.jpg" },
        ];
      }

      const randomFile = files[Math.floor(Math.random() * files.length)];
      const filename = randomFile.name || randomFile;

      console.log("Selected filename for guest:", filename);
      res.send(filename);
      return;
    } catch (err) {
      console.log("Error in guest imagefile route:", err);
      res.status(500).json({ error: "MongoDB not responding" });
      return;
    }
  }

  console.log("Getting imagefile for email:", req.query.email);

  if (!dropbox) {
    return res.status(500).json({ error: "Dropbox not authenticated." });
  }

  try {
    // ========== USE CACHED FILE LIST ==========
    let dropboxlist = await getFileList();
    console.log("Working with " + dropboxlist.length + " files");

    // Get MongoDB components
    let mongodblist = await Component.find({});
    console.log("MongoDB components found:", mongodblist.length);

    // Get user's completed components
    const user = await User.findOne({ email: req.query.email });
    let usercomplist = [];
    if (user) {
      usercomplist = user.components || [];
    }
    console.log("User completed components:", usercomplist.length);

    // Filter out components already labeled by user
    dropboxlist = dropboxlist.filter((file) => !usercomplist.includes(file));

    mongodblist = mongodblist.filter(
      (component) => !usercomplist.includes(component.name)
    );

    // Filter out components at capacity
    const cap = FULLY_LABELED_THRESHOLD;
    mongodblist = mongodblist.filter(
      (component) => component.labels.length < cap
    );

    // Experiment filtering (optional)
    // dropboxlist = filterByExperiment(dropboxlist);
    // mongodblist = filterByExperiment(mongodblist, true);

    // Select file
    let file = "";

    if (dropboxlist.length === 0) {
      file = usercomplist[Math.floor(Math.random() * usercomplist.length)];
      console.log("Selected from user history:", file);
      return res.send(file);
    }

    if (mongodblist.length === 0) {
      file = dropboxlist[Math.floor(Math.random() * dropboxlist.length)];
      console.log("Selected new component:", file);
      return res.send(file);
    }

    // Weighted selection
    let totalWeight = 0;
    for (let i = 0; i < mongodblist.length; i++) {
      totalWeight += mongodblist[i].labels.length;
    }

    const selection = Math.floor(Math.random() * totalWeight);
    let trackWeight = 0;
    for (let i = 0; i < mongodblist.length; i++) {
      trackWeight += mongodblist[i].labels.length;

      if (trackWeight >= selection) {
        file = mongodblist[i].name;
        break;
      }
    }

    if (file.length === 0) {
      const fallbackFiles = [
        "1001001.jpg",
        "1001002.jpg",
        "1001003.jpg",
        "1001004.jpg",
        "1001005.jpg",
        "1001006.jpg",
        "1001007.jpg",
        "1001008.jpg",
        "1001009.jpg",
        "1001010.jpg",
      ];
      file = fallbackFiles[Math.floor(Math.random() * fallbackFiles.length)];
      console.log("Using fallback file:", file);
    }

    console.log("Final selected file:", file);
    res.send(file);
  } catch (error) {
    console.log("Error in imagefile route:", error);
    res.status(500).json({ error: "Failed to get image file" });
  }
});

// Image data endpoint (unchanged)
router.get("/imagedata", (req, res) => {
  const imagefile = req.query.imagefile;

  if (!imagefile) {
    console.log("Error: No imagefile provided in query");
    return res.status(400).json({ error: "Missing imagefile parameter" });
  }

  const file = folderpath
    ? folderpath.endsWith("/")
      ? `${folderpath}${imagefile}`
      : `${folderpath}/${imagefile}`
    : `/${imagefile}`;

  console.log("Downloading file from Dropbox:", file);

  // ✅ CONFIGURABLE CACHE HEADERS
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isDevelopment) {
    // Development: No caching for easier testing
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Content-Type": "image/jpeg",
      "Access-Control-Allow-Origin": "*",
    });
  } else {
    // Production: Short cache for performance
    res.set({
      "Cache-Control": "public, max-age=3600", // 1 hour instead of 1 year
      "Content-Type": "image/jpeg",
      "Access-Control-Allow-Origin": "*",
    });
  }

  const dropboxStream = dropbox({
    resource: "files/download",
    parameters: { path: file },
  });

  dropboxStream.on("error", (err) => {
    console.error("Dropbox download error:", err);
    console.error("Failed path was:", file);

    if (!res.headersSent) {
      res.status(500).json({
        error: "File not found in Dropbox",
        file: imagefile,
      });
    } else {
      res.end();
    }
  });

  res.on("error", (err) => {
    console.error("Response stream error:", err);
  });

  dropboxStream.pipe(res);
});

router.get("/mat", (req, res) => {
  res.send("Sending .mat file");
});

router.post("/weights", (req, res) => {
  const weights = req.body;
  let currWeight = 0.0;

  for (const expNo in weights) {
    if (weights.hasOwnProperty(expNo)) {
      currWeight = currWeight + weights[expNo];
    }
  }

  if (currWeight > 1.0001 || currWeight < 0.9999) {
    res.send("Invalid weights were submitted");
    return;
  }

  fs.readFile("./temp/experiment-weights.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      res.send("Unable to read previous weights");
      return;
    }

    const weighter = JSON.parse(data);
    weighter.weights = weights;
    const jsonWeighter = JSON.stringify(weighter);
    fs.writeFile(
      "./temp/experiment-weights.json",
      jsonWeighter,
      "utf8",
      (err, data) => {
        if (err) {
          console.log(err);
        }
        res.send("Successfully submitted weights");
      }
    );
  });
});

// Statistics endpoint - also uses cache
router.get("/statistics", async (req, res) => {
  let weighter;
  try {
    weighter = fs.readFileSync("./temp/experiment-weights.json", "utf8");
  } catch (err) {
    console.log(err);
  }

  if (!dropbox) {
    return res.status(500).json({ error: "Dropbox not authenticated." });
  }

  try {
    // Use cached file list
    let filelist = await getFileList();

    let mongodblist = [];
    Component.find({}, (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ error: "MongoDB not responding" });
        return;
      }

      if (data) {
        mongodblist = data;
      }

      let stats = {};

      filelist.forEach((element) => {
        const exp = element.slice(0, 1);
        if (exp in stats) {
          stats[exp].total = stats[exp].total + 1;
        } else {
          stats[exp] = {
            total: 1,
            completed: 0,
            weight: 0,
          };
        }
      });

      mongodblist.forEach((element) => {
        const exp = element.name.slice(0, 1);
        if (exp in stats) {
          stats[exp].completed = stats[exp].completed + 1;
        } else {
          stats[exp] = {
            total: 0,
            completed: 1,
            weight: 0,
          };
        }
      });

      weighter = JSON.parse(weighter);
      let weights = weighter.weights;
      stats["lastExp"] = weighter.lastExp;
      for (exp in weights) {
        if (exp in stats) {
          stats[exp].weight = weights[exp];
        } else {
          stats[exp] = {
            total: 0,
            completed: 0,
            weight: weights[exp],
          };
        }
      }

      res.send(stats);
    });
  } catch (error) {
    console.log("Error in statistics route:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
});

// Filenames endpoint - also uses cache
router.get("/filenames", async (req, res) => {
  if (!dropbox) {
    return res.status(500).json({ error: "Dropbox not authenticated." });
  }

  try {
    const filelist = await getFileList();
    res.send(filelist);
  } catch (error) {
    console.log("Error in filenames route:", error);
    res.status(500).json({ error: "Failed to get filenames" });
  }
});

// Optional: Manual cache refresh endpoint (admin only)
router.post("/refresh-cache", (req, res) => {
  invalidateCache();
  res.send({ message: "Cache invalidated. Next request will refresh." });
});

module.exports = router;
