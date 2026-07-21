const express = require("express");
const { authRequired } = require("../middleware/auth");
const { profileSummary } = require("../controllers/profile.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { dbRequired } = require("../middleware/dbRequired");

const router = express.Router();

router.get("/summary", authRequired, asyncHandler(profileSummary));

module.exports = router;
