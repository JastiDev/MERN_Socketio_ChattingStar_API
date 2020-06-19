const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const modelUser = require("../model/User");

const myss = require("../mysocketserver");

router.get("/map", auth, async (req, res) => {
  let arrStar = Object.values(myss.dicStar);
  return res.status(200).json({ arrStar });
});

router.post("/getXY", auth, async (req, res) => {
  let { idSocket } = req.body;
  let star = myss.dicStar[idSocket];
  return res.status(200).json({ x: star.x, y: star.y });
});

router.post("/getArrMsg", auth, async (req, res) => {
  let { idSocket } = req.body;
  let arrMsg = myss.dicChat[idSocket];

  return res.status(200).json({ arrMsg });
});

// router.get("/", auth, async (req, res) => {
//   try {
//     let messages = await modelMessage.find();
//     return res.status(200).json({ messages });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ message: "Server DB error." });
//   }
// });
// // POST a new message
// router.post("/", auth, async (req, res) => {
//   sender = req.user.username;
//   content = req.body.content;

//   try {
//     let message = await modelMessage.create({ sender, content });
//     res.status(200).json({ message });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server DB error." });
//   }
// });

module.exports = router;
