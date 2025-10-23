const db = require("../models");
const User = db.user;
const Role = db.role;

let jwt = require("jsonwebtoken");
let bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

exports.signup = (req, res) => {
  const user = new User({
    fname: req.body.fname,
    lname: req.body.lname,
    assoc: req.body.assocSel,
    edu: req.body.edu,
    exp: req.body.exp,
    domain: req.body.domain || "user", // default domain
    weight: req.body.weight || 1.0, // default weight
    email: req.body.emailLower,
    password: bcrypt.hashSync(req.body.password, 8),
    components: req.body.components || [],
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    // ALWAYS assign "user" role by default
    Role.findOne({ name: "user" }, (err, role) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!role) {
        res.status(500).send({
          message: "Error: Default 'user' role not found in database.",
        });
        return;
      }

      user.roles = [role._id];
      user.save((err) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.send({ message: "User was registered successfully!" });
      });
    });
  });
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email.toLowerCase(),
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not Found." });
      }

      let passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      let token = jwt.sign({ id: user.id }, process.env.JSONSECRETKEY, {
        expiresIn: 86400, // 24 hours
      });

      let authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        fname: user.fname,
        domain: user.domain,
        weight: user.weight,
        email: user.email,
        roles: authorities,
        accessToken: token,
      });
    });
};
