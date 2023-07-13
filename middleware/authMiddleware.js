const express = require("express");
const router = express.Router();

router.use(async function (req, res, next) {
  const { authorization } = req.headers;
  if (!authorization) {
    const response = {
      code: -1,
      msg: "No token.",
      data: null,
    };
    res.status(401).json(response);
    return;
  }
  // Check token, use Bearer token
  if (!authorization.startsWith("Bearer ")) {
    const response = {
      code: -1,
      msg: "Invalid token.",
      data: null,
    };
    res.status(401).json(response);
    return;
  }
  const token = authorization.slice(7, authorization.length);
  const allowedTokens = process.env.APP_SECRET_KEY.split(",");

  if (!allowedTokens.includes(token)) {
    const response = {
      code: -1,
      msg: "Invalid token.",
      data: null,
    };
    res.status(401).json(response);
    return;
  }
  
  next();
});

module.exports = router;
