const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
// Load User model
const User = require("../../models/User");

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }
    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

const validUrl = require('valid-url');
const Url = require("../../models/Urls");

router.post("/teener", (req, res) => {

  const { fullurl, email } = req.body;

  if (!validUrl.isUri(fullurl)) {
    return res.status(400).json({ err: 'Invalid URL' })
  }

  var shortlist = []
  let alpha = "abcdefghijklmnopqrstuvwxyzABCDEF"
  "GHIJKLMNOPQRSTUVWXYZ0123456789";
  var dateRandom = Date.now().toString() + "" + Math.floor(Math.random() * 1000000000).toString()
  var hash = dateRandom

  while (hash > 0) {
    let remainder = (hash % 62)
    shortlist.push(alpha[remainder])
    hash = Math.floor(hash / 62);
  }
  shortlist.reverse()
  shortlist = shortlist.join("")

  Url.findOne({ email: email })
    .then(data => {
      if (data) {
        if (data.listofUrls.fullurl === fullurl) {
          return res.status(400).json({ error: "Url already exists" });
        }
        else {
          Url.updateOne({ email: email },
            {
              $push: {
                listofUrls: {
                  fullurl: fullurl,
                  shorturl: shortlist,
                  //clicked: ++data.listofUrls.clicked
                }
              }
            })
            .then((data) => {
              res.json({ updated: data })
            })
            .catch(err => res.status(400).json({ error: err }))
        }
      }
      else {

        const newUrl = new Url({
          email: email,
          listofUrls: [{
            fullurl: fullurl,
            shorturl: shortlist,
          }]
        });

        newUrl
          .save()
          .then((data) => {
            res.json({ outcome: "Saved Your Link", data: data })
          })
          .catch((err) => res.status(400).json({ err: err }))
      }
    })
    .catch(err => {
      res.status(400).json({ error: err })
    });
})

module.exports = router;

