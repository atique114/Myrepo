const express = require("express");
const {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/auth.controller");
const { authRequired } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { dbRequired } = require("../middleware/dbRequired");

const router = express.Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.post("/change-password", dbRequired, authRequired, asyncHandler(changePassword));
router.get("/me", authRequired, asyncHandler(me));

module.exports = router;
