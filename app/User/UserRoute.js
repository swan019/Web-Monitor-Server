const express = require("express");

const { signupUser, generateNewAccessToken } = require("./UserServices");
const { loginUser } = require("./UserServices");

const router = express.Router();

router.post("/user/signup", signupUser);
router.post("/user/login", loginUser);
router.post("/user/new-token", generateNewAccessToken);

module.exports = router;
