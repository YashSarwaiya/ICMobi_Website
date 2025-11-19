// const path = require("path");
// const express = require("express");
// const cors = require("cors");
// const dbx = require("./routes/Dropbox.js");
// require("dotenv").config();

// const app = express();

// let corsOptions = {
//   origin:
//     process.env.NODE_ENV !== "production"
//       ? ["http://localhost:3000", "http://localhost:5001"] // Added port 3000
//       : [
//           "https://icmobi.org",
//           "https://www.icmobi.org",
//           "https://icmobi-website-1f2b4bdb1c05.herokuapp.com",
//         ],
//   credentials: true, // Add this for cookies/auth
// };

// app.use(cors(corsOptions));

// // parse requests of content-type - application/json
// app.use(express.json());

// // parse requests of content-type - application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

// app.use("/dropbox", dbx);

// const db = require("./models");

// db.mongoose
//   .connect(process.env.MONGOATLASURI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(async () => {
//     console.log("Successfully connected to MongoDB.");

//     // AUTO-INITIALIZE ROLES - ADD THIS
//     const Role = db.role;
//     const count = await Role.estimatedDocumentCount();
//     if (count === 0) {
//       await new Role({ name: "user" }).save();
//       await new Role({ name: "admin" }).save();
//       console.log("Roles initialized!");
//     }
//   })
//   .catch((err) => {
//     console.error("Connection error.", err);
//   });

// require("./routes/auth.routes")(app);
// require("./routes/user.routes")(app);
// require("./routes/component.routes")(app);
// require("./routes/mail.routes")(app);

// if (process.env.NODE_ENV === "production") {
//   const buildPath = path.join(__dirname, "..", "frontend", "build");
//   console.log("Serving static frontend from:", buildPath);

//   app.use(express.static(buildPath));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(buildPath, "index.html"), (err) => {
//       if (err) {
//         console.error("Error serving index.html:", err);
//         res.status(500).send("Internal Server Error");
//       }
//     });
//   });
// }

// const port = process.env.PORT || 8080;

// app.listen(port, () => console.log(`Server running on port ${port}`));
const path = require("path");
const express = require("express");
const cors = require("cors");
const fs = require("fs"); // Add this for directory checking
const dbx = require("./routes/Dropbox.js");
require("dotenv").config();

const app = express();

let corsOptions = {
  origin:
    process.env.NODE_ENV !== "production"
      ? [
          "http://localhost:3000",
          "http://localhost:5001",
          "http://localhost:8080",
        ]
      : [
          "https://icmobi.org",
          "https://www.icmobi.org",
          "https://icmobi-website-1f2b4bdb1c05.herokuapp.com",
        ],
  credentials: true,
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// API routes MUST come before static file serving
app.use("/dropbox", dbx);

const db = require("./models");

db.mongoose
  .connect(process.env.MONGOATLASURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Successfully connected to MongoDB.");

    // AUTO-INITIALIZE ROLES
    const Role = db.role;
    const count = await Role.estimatedDocumentCount();
    if (count === 0) {
      await new Role({ name: "user" }).save();
      await new Role({ name: "admin" }).save();
      console.log("Roles initialized!");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if database connection fails
  });

// Register all API routes BEFORE static file serving
require("./routes/auth.routes")(app);
require("./routes/user.routes")(app);
require("./routes/component.routes")(app);
require("./routes/mail.routes")(app);

// Static file serving MUST be LAST (after all API routes)
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "..", "frontend", "build");

  console.log("=== Production Mode ===");
  console.log("Attempting to serve static files from:", buildPath);

  // Check if build directory exists
  if (fs.existsSync(buildPath)) {
    console.log("✓ Build directory found!");

    // Check if index.html exists
    const indexPath = path.join(buildPath, "index.html");
    if (fs.existsSync(indexPath)) {
      console.log("✓ index.html found!");
    } else {
      console.error("✗ index.html NOT found at:", indexPath);
    }

    // List contents of build directory for debugging
    const buildContents = fs.readdirSync(buildPath);
    console.log("Build directory contents:", buildContents);
  } else {
    console.error("✗ Build directory NOT found at:", buildPath);
    console.error("Current directory:", __dirname);
    console.error("Looking for build at:", buildPath);
  }

  // Serve static files
  app.use(
    express.static(buildPath, {
      maxAge: "1d", // Cache static assets for 1 day
      etag: true,
    })
  );

  // Catch-all handler for client-side routing (MUST BE LAST!)
  app.get("*", (req, res) => {
    console.log("Serving index.html for route:", req.path);
    const indexPath = path.join(buildPath, "index.html");

    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error("Error serving index.html:", err);
        console.error("Attempted path:", indexPath);
        res
          .status(500)
          .send("Error loading application. Please contact support.");
      }
    });
  });
}

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("======================");
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("======================");
});
