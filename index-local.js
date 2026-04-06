const express = require("express");
const { LISTEN_PORT, FRONTEND_URL } = require("./src/config/env");
const router = require("./src/router");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { logger } = require("./src/utils");
const WebSocket = require('ws');
const cookieParser = require("cookie-parser");


// initial function
const app = express();

// run jobs
require('./src/utils/jobs/kpiLogs/index')

app.use(express.static(path.join("src", "storage", "public")));
app.use(express.static(path.join(__dirname, "./public/WebApp")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// global middleware --- body parser, rate limit , etc
// const allowedOrigins = ['https://cxt.co.id:5173', 'http://localhost:5173'];
app.use(cors({ origin: "*" }));
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "./public/WebApp/index.html");

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("File send error:", err);
      res.status(500).send("Error sending file");
    }
  });
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// global router
router(app);

const appPort = LISTEN_PORT ?? 5005;
const server = app.listen(appPort, () => {
  logger.info(`Server start running on port: ${appPort} (${process.env.MODE})`)
});





