const mongoose = require("mongoose");
require("dotenv").config();

const db = require("./models");
const Role = db.role;

mongoose
  .connect(process.env.MONGOATLASURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Successfully connected to MongoDB.");

    // Check if roles already exist
    const count = await Role.estimatedDocumentCount();

    if (count === 0) {
      console.log("Creating roles...");

      await new Role({ name: "user" }).save();
      console.log("Added 'user' role");

      await new Role({ name: "admin" }).save();
      console.log("Added 'admin' role");

      console.log("Roles initialized successfully!");
    } else {
      console.log("Roles already exist in database");
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("Connection error.", err);
    process.exit(1);
  });
