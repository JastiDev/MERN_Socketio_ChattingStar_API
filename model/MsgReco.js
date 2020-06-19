const mongoose = require("mongoose");

// Blueprint of what a message would look like in our DB.
const MsgSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now(),
  },
});

const MsgRecoSchema = new mongoose.Schema({
  AB: [String],
  arrMsg: [MsgSchema],
});

// Exporting the model so that it can be used in server.js and/or other files.
module.exports = mongoose.model("MsgReco", MsgRecoSchema);
