const fs = require("fs");
// process env
const { config, parse } = require("dotenv");

// load env consts
config({ path: "./.env.prod" });

// if process.dev.env exists, load it
if (fs.existsSync("./.env.dev")) {
  console.log("Loading .env.dev...");
  const envConfig = parse(fs.readFileSync("./.env.dev"));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log("Loaded .env.dev.");
}

const express = require("express");
require("express-async-errors");
const logger = require("morgan");
const indexRouter = require("./routes/index");
const modelRouter = require("./routes/model");

const app = express();

// global error handler
app.use((err, req, res, next) => {
  logger.error(err.message, err);
  if (req.xhr) {
    return res.json({
      code: -1,
      msg: err.message,
      data: null,
    });
  }
  next(err);
});

// cors
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,AccessToken,X-CSRF-Token, Authorization, Token"
  );
  res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
  if (req.method.toLowerCase() == "options") res.sendStatus(204);
  else next();
});

// rate limit
const { rateLimit, MemoryStore } = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 35,
  message: {
    code: -1,
    msg: "Too many requests.",
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: true,
  store: new MemoryStore({
    checkPeriod: 60 * 1000,
  }),
});

app.use(limiter);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/model", modelRouter);

module.exports = app;
