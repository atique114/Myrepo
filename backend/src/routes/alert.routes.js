const express = require("express");
const {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  listAlertHistory,
} = require("../controllers/alert.controller");
const { authRequired } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { dbRequired } = require("../middleware/dbRequired");

const router = express.Router();

router.use(dbRequired);
router.use(authRequired);
router.get("/", asyncHandler(listAlerts));
router.post("/", asyncHandler(createAlert));
router.patch("/:id", asyncHandler(updateAlert));
router.delete("/:id", asyncHandler(deleteAlert));
router.get("/history/list", asyncHandler(listAlertHistory));

module.exports = router;
