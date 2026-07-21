const axios = require("axios");
const env = require("../config/env");

const COIN_NAME_MAP = {
  btc: "Bitcoin",
  eth: "Ethereum",
  bnb: "BNB",
  xrp: "XRP",
  sol: "Solana",
  ada: "Cardano",
  doge: "Dogecoin",
  trx: "TRON",
  avax: "Avalanche",
  dot: "Polkadot",
  link: "Chainlink",
  matic: "Polygon",
  ltc: "Litecoin",
  atom: "Cosmos",
  near: "NEAR Protocol",
  uni: "Uniswap",
  shib: "Shiba Inu",
  etc: "Ethereum Classic",
  xlm: "Stellar",
  apt: "Aptos",
};

const TRACKED_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "SOLUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "TRXUSDT",
  "AVAXUSDT",
  "DOTUSDT",
  "LINKUSDT",
  "LTCUSDT",
  "ATOMUSDT",
  "NEARUSDT",
  "MATICUSDT",
];

const binanceClient = axios.create({
  baseURL: env.binanceApi,
  timeout: 15000,
  proxy: false,
  headers: env.binanceApiKey ? { "X-MBX-APIKEY": env.binanceApiKey } : {},
});

function coinIcon(symbol) {
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${symbol.toLowerCase()}.png`;
}

function normalizeTicker(ticker, rank) {
  const symbol = ticker.symbol.replace(/USDT$/, "").toLowerCase();
  const name = COIN_NAME_MAP[symbol] || symbol.toUpperCase();
  return {
    id: ticker.symbol.toLowerCase(),
    name,
    symbol,
    image: coinIcon(symbol),
    current_price: Number(ticker.lastPrice),
    high_24h: Number(ticker.highPrice),
    low_24h: Number(ticker.lowPrice),
    price_change_percentage_24h: Number(ticker.priceChangePercent),
    market_cap_rank: rank,
    total_volume: Number(ticker.quoteVolume),
    market_cap: Number(ticker.quoteVolume) * Number(ticker.lastPrice),
  };
}

async function getTopCoins({ query = "" } = {}) {
  const { data } = await binanceClient.get("/api/v3/ticker/24hr");
  const trackedSet = new Set(TRACKED_SYMBOLS);
  const usdtPairs = data
    .filter((item) => trackedSet.has(item.symbol))
    .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))
    .slice(0, env.topCoinLimit)
    .map((item, index) => normalizeTicker(item, index + 1));

  if (!query) return usdtPairs;
  const q = query.toLowerCase();
  return usdtPairs.filter(
    (coin) =>
      coin.name.toLowerCase().includes(q) ||
      coin.symbol.toLowerCase().includes(q) ||
      coin.id.toLowerCase().includes(q)
  );
}

async function getCoinDetails(coinId) {
  const symbol = coinId.toUpperCase();
  const { data } = await binanceClient.get("/api/v3/ticker/24hr", {
    params: { symbol },
  });

  const normalized = normalizeTicker(data, 0);
  return {
    id: normalized.id,
    name: normalized.name,
    symbol: normalized.symbol,
    image: { large: normalized.image },
    market_cap_rank: "-",
    market_data: {
      current_price: { usd: normalized.current_price },
      high_24h: { usd: normalized.high_24h },
      low_24h: { usd: normalized.low_24h },
    },
    description: {
      en: `Live market data from Binance (${symbol}). Values update based on 24h ticker statistics.`,
    },
  };
}

async function getLatestPrices(symbols) {
  if (!symbols.length) return {};
  const { data } = await binanceClient.get("/api/v3/ticker/price");
  const needed = new Set(symbols.map((s) => s.toUpperCase()));
  const out = {};
  for (const row of data) {
    if (!needed.has(row.symbol)) continue;
    out[row.symbol.toLowerCase()] = Number(row.price);
  }
  return out;
}

module.exports = {
  getTopCoins,
  getCoinDetails,
  getLatestPrices,
};
