const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ExtractJwt } = require("passport-jwt");
const Sequelize = require("sequelize");

const router = express.Router();
const { User } = require("../models");

const authMiddleware = passport.authenticate("jwt", { session: false });

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

router
  // logout user
  .get("/logout", (req, res) => {
    req.logout();
    res.json({ success: true, message: "Logged out!" });
  })
  // register a new user
  .post("/register", async (req, res) => {
    const { username, displayName, password } = req.body;
    try {
      const user = await User.create({
        username,
        displayName,
        password
      });
      res.json({
        username: user.get("username"),
        displayName: user.get("displayName")
      });
    } catch (err) {
      if (err instanceof Sequelize.ValidationError) {
        return res.status(400).send({ errors: err.errors });
      }
      console.error(err);
      res.status(500).send();
    }
  })
  // login user
  .post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.scope(null).find({ where: { username } });
    if (user && (await bcrypt.compare(password, user.get("password")))) {
      const payload = { id: user.get("id") };
      const token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.json({ token, id: payload.id });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  });

module.exports = {
  authMiddleware,
  jwtOptions,
  router
};
