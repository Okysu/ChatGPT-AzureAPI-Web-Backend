const express = require("express");
const router = express.Router();

/* GET prompts.json in public folder. */
router.get("/prompts", function (req, res, next) {
  res.sendFile("prompts.json", { root: "public" });
});

/* GET root */
router.get("/", function (req, res, next) {
  const model = process.env.MODEL_NAME.split(",");
  res.json({
    code: 0,
    message: "Success.",
    data: {
      model: model,
    },
  });
});

module.exports = router;
