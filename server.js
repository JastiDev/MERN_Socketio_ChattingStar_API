const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Allow cross-origin resource sharing
app.use(cors());
app.options("*", cors());

const InitiateMongoServer = require("./config/db");
InitiateMongoServer();

const routeUser = require("./routes/user");
const routeStar = require("./routes/star");

app.use("/api/user", routeUser);
app.use("/api/star", routeStar);

app.use(express.static(`${__dirname}/client/build`));
app.use((req, res) => res.sendFile(`${__dirname}/client/build/index.html`));

const PORT = process.env.PORT || 8080;
let server = app.listen(PORT, (req, res) => {
  console.log(`Server Started at PORT ${PORT}`);
});

const mysocketserver = require("./mysocketserver");
mysocketserver.initSocketServer(server);
