const express = require("express");
const {
  listMarketCoins,
  getMarketCoinDetails,
  topMovers,
} = require("../controllers/market.controller");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.get("/coins", asyncHandler(listMarketCoins));
router.get("/coins/:coinId", asyncHandler(getMarketCoinDetails));
router.get("/top-movers", asyncHandler(topMovers));

module.exports = router;
