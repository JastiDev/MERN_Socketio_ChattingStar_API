const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const myss = require("../mysocketserver");

const modelUser = require("../model/User");

const router = express.Router();

router.get("/checkToken", auth, (req, res) => {
  res.status(200).json({ username: req.user.username });
});

router.post("/signup", async (req, res) => {
  let { obj } = req.body; //obj = {username, password, country, state, age,
  // gender, logo, membership, arrImage, sound, email, phone}
  console.log(obj.imgUrl);
  try {
    let arrUser = await modelUser.find({ username: obj.username });
    if (arrUser.length > 0) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    const salt = await bcrypt.genSalt(10);
    obj.password = await bcrypt.hash(obj.password, salt);

    let user = await modelUser.create({ ...obj });

    const payload = { user: { id: user._id, username: user.username } };
    let token = await jwt.sign(payload, "randomString", {
      expiresIn: "1d",
    });

    return res.status(200).json({ token });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in Saving" });
  }
});

router.post("/login", async (req, res) => {
  let { username, password } = req.body;
  let arrStar = Object.values(myss.dicStar);
  let k = arrStar.findIndex((star) => star.username == username);
  if (k > -1)
    return res
      .status(400)
      .json({ message: "Your account is using by other one now." });

  try {
    let user = await modelUser.findOne({ username });
    if (!user) return res.status(400).json({ message: "User Not Exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect Password !" });

    const payload = { user: { id: user.id, username: user.username } };

    let token = await jwt.sign(payload, "randomString", {
      expiresIn: 3600,
    });
    return res.status(200).json({ token });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});

router.get("/:id/", auth, async (req, res) => {
  try {
    let user = await modelUser.findById(req.params.id);
    if (user) {
      return res.status(200).json({ user });
    } else {
      return res.status(404).json({ message: "No user with this id." });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});

router.put("/:id/", auth, async (req, res) => {
  if (req.user.id !== req.params.id)
    return res
      .status(400)
      .json({ message: "Cannot change other user's info." });
  let { obj } = req.body;
  try {
    if (obj.password) {
      const salt = await bcrypt.genSalt(10);
      obj.password = await bcrypt.hash(obj.password, salt);
    }
    let user = await modelUser.findByIdAndUpdate(req.params.id, obj, {
      useFindAndModify: false,
    });
    return res.status(200).json({ user });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});

router.delete("/:id/", auth, async (req, res) => {
  if (req.user.id !== req.params.id)
    return res
      .status(400)
      .json({ message: "Cannot change other user's info." });
  try {
    await modelUser.findByIdAndRemove(req.params.id, {
      useFindAndModify: false,
    });
    return res.status(200).json({ message: "Successfully removed." });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});

router.post("/getOneByName", auth, async (req, res) => {
  try {
    let { username } = req.body;
    let user = await modelUser.findOne({ username });
    if (!user) return res.status(404).json({ message: "No such user" });
    return res.status(200).json({ user });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});

router.post("/getManyByName", auth, async (req, res) => {
  try {
    let { arrName } = req.body;
    let arrUser = [];
    for (let username in arrName) {
      let user = await modelUser.findOne({ username });
      if (!user) return res.status(404).json({ message: "No such user" });
      arrUser.push(user);
    }
    return res.status(200).json({ arrUser });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});

///////////////////// test purpose
router.get("/", async (req, res) => {
  try {
    let arrUser = await modelUser.find();
    return res.status(200).json({ arrUser });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});

router.delete("/", async (req, res) => {
  try {
    await modelUser.remove();
    return res.status(200).json({ message: "Successfully removed all" });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Error in server" });
  }
});
//////////////////// test purpose

module.exports = router;
