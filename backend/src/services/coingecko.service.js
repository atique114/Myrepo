const axios = require("axios");
const env = require("../config/env");

const coingeckoClient = axios.create({
  baseURL: env.coingeckoApi,
  timeout: 15000,
  proxy: false,
});

async function getMarketCoins({ page = 1, perPage = 20, query = "" }) {
  const { data } = await coingeckoClient.get("/coins/markets", {
    params: {
      vs_currency: env.priceVsCurrency,
      order: "market_cap_desc",
      per_page: perPage,
      page,
      sparkline: false,
      price_change_percentage: "24h,7d",
    },
  });

  if (!query) return data;
  const q = query.toLowerCase();
  return data.filter(
    (coin) =>
      coin.name.toLowerCase().includes(q) ||
      coin.symbol.toLowerCase().includes(q) ||
      coin.id.toLowerCase().includes(q)
  );
}

async function getCoinDetails(coinId) {
  const { data } = await coingeckoClient.get(`/coins/${coinId}`);
  return data;
}

async function getSimplePrices(coinIds) {
  if (!coinIds.length) return {};
  const { data } = await coingeckoClient.get("/simple/price", {
    params: {
      ids: coinIds.join(","),
      vs_currencies: env.priceVsCurrency,
    },
  });
  return data;
}

module.exports = { getMarketCoins, getCoinDetails, getSimplePrices };
