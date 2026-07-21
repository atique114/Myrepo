const {
  fetchTopCoins,
  fetchCoinDetails,
} = require("../services/marketData.service");

async function listMarketCoins(req, res) {
  const query = req.query.query || "";

  const coins = await fetchTopCoins({ query });

  return res.json({ coins });
}

async function getMarketCoinDetails(req, res) {
  const coin = await fetchCoinDetails(req.params.coinId);
  return res.json({ coin });
}

async function topMovers(req, res) {
  const limit = Number(req.query.limit || 6);
  const coins = await fetchTopCoins({ query: "" });
  const sorted = [...coins]
    .sort(
      (a, b) =>
        Math.abs(b.price_change_percentage_24h || 0) -
        Math.abs(a.price_change_percentage_24h || 0)
    )
    .slice(0, Math.min(Math.max(limit, 1), 20));

  return res.json({ movers: sorted });
}

module.exports = { listMarketCoins, getMarketCoinDetails, topMovers };
