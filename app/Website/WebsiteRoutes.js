const express = require("express");

const { authenticateUserMiddleware } = require("../User/UserMiddleware");
const {
  createWebsite,
  deleteWebsite,
  getAllWebsites,
} = require("./WebsiteServices");

const router = express.Router();

router.get("/website/", authenticateUserMiddleware, getAllWebsites);
router.post("/website", authenticateUserMiddleware, createWebsite);
router.delete("/website/:webId", authenticateUserMiddleware, deleteWebsite);

module.exports = router;
