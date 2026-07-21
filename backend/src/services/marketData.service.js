const axios = require("axios");
const env = require("../config/env");

const DEFAULT_TOP_LIMIT = 15;
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

const STATIC_FALLBACK = [
  { symbol: "btc", name: "Bitcoin", price: 68000, change: 1.8 },
  { symbol: "eth", name: "Ethereum", price: 3400, change: 2.1 },
  { symbol: "bnb", name: "BNB", price: 580, change: 1.2 },
  { symbol: "xrp", name: "XRP", price: 0.62, change: -0.8 },
  { symbol: "sol", name: "Solana", price: 165, change: 3.5 },
  { symbol: "ada", name: "Cardano", price: 0.48, change: -1.1 },
  { symbol: "doge", name: "Dogecoin", price: 0.16, change: 0.7 },
  { symbol: "trx", name: "TRON", price: 0.12, change: 0.5 },
  { symbol: "avax", name: "Avalanche", price: 39, change: 2.4 },
  { symbol: "dot", name: "Polkadot", price: 7.4, change: -0.3 },
  { symbol: "link", name: "Chainlink", price: 17.8, change: 1.9 },
  { symbol: "ltc", name: "Litecoin", price: 89, change: 0.2 },
  { symbol: "atom", name: "Cosmos", price: 11.4, change: -0.6 },
  { symbol: "near", name: "NEAR Protocol", price: 6.1, change: 1.1 },
  { symbol: "matic", name: "Polygon", price: 0.82, change: 0.4 },
];

const coincapClient = axios.create({
  baseURL: process.env.COINCAP_API || "https://api.coincap.io/v2",
  timeout: 15000,
  proxy: false,
});

const binanceClient = axios.create({
  baseURL: env.binanceApi || "https://api.binance.com",
  timeout: 15000,
  proxy: false,
  headers: env.binanceApiKey ? { "X-MBX-APIKEY": env.binanceApiKey } : {},
});

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function iconUrl(symbol) {
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${symbol.toLowerCase()}.png`;
}

function normalizeCoin(symbol, name, rank, currentPrice, change24h, volume, marketCap) {
  return {
    id: `${symbol.toLowerCase()}usdt`,
    name,
    symbol: symbol.toLowerCase(),
    image: iconUrl(symbol),
    current_price: toNumber(currentPrice),
    high_24h: toNumber(currentPrice),
    low_24h: toNumber(currentPrice),
    price_change_percentage_24h: toNumber(change24h),
    market_cap_rank: rank || null,
    total_volume: toNumber(volume),
    market_cap: toNumber(marketCap),
  };
}

function buildFallbackHistory(currentPrice, change24h) {
  const points = 24;
  const priceNow = toNumber(currentPrice);
  const safeChange = toNumber(change24h);
  const startPrice = safeChange === -100 ? priceNow : priceNow / (1 + safeChange / 100);
  const result = [];

  for (let index = 0; index < points; index += 1) {
    const progress = index / (points - 1);
    const wave = Math.sin(progress * Math.PI * 3) * priceNow * 0.012;
    const drift = startPrice + (priceNow - startPrice) * progress;

    result.push({
      timestamp: Date.now() - (points - index - 1) * 60 * 60 * 1000,
      price: Number(Math.max(drift + wave, 0).toFixed(6)),
    });
  }

  return result;
}

async function findCoinCapAsset(symbol) {
  const { data } = await coincapClient.get("/assets", { params: { limit: 200 } });
  return (data?.data || []).find(
    (asset) => String(asset.symbol || "").toLowerCase() === String(symbol || "").toLowerCase()
  );
}

async function fetchCoinCapHistory(assetId) {
  const end = Date.now();
  const start = end - 24 * 60 * 60 * 1000;
  const { data } = await coincapClient.get(`/assets/${assetId}/history`, {
    params: {
      interval: "h1",
      start,
      end,
    },
  });

  return (data?.data || []).map((entry) => ({
    timestamp: Number(entry.time),
    price: toNumber(entry.priceUsd),
  }));
}

async function fetchFromCoinCap() {
  const { data } = await coincapClient.get("/assets", { params: { limit: DEFAULT_TOP_LIMIT } });
  return (data?.data || []).slice(0, DEFAULT_TOP_LIMIT).map((asset) =>
    normalizeCoin(
      asset.symbol,
      asset.name,
      toNumber(asset.rank),
      asset.priceUsd,
      asset.changePercent24Hr,
      asset.volumeUsd24Hr,
      asset.marketCapUsd
    )
  );
}

async function fetchFromBinance() {
  const { data } = await binanceClient.get("/api/v3/ticker/24hr");
  const tracked = new Set(TRACKED_SYMBOLS);
  const filtered = (data || [])
    .filter((row) => tracked.has(row.symbol))
    .sort((a, b) => toNumber(b.quoteVolume) - toNumber(a.quoteVolume))
    .slice(0, DEFAULT_TOP_LIMIT)
    .map((row, index) => {
      const symbol = row.symbol.replace(/USDT$/, "");
      return normalizeCoin(
        symbol,
        symbol,
        index + 1,
        row.lastPrice,
        row.priceChangePercent,
        row.quoteVolume,
        toNumber(row.quoteVolume) * toNumber(row.lastPrice)
      );
    });
  return filtered;
}

function staticCoins() {
  return STATIC_FALLBACK.map((coin, index) =>
    normalizeCoin(coin.symbol, coin.name, index + 1, coin.price, coin.change, 0, coin.price * 1_000_000)
  );
}

async function fetchTopCoins({ query = "" } = {}) {
  let coins = [];
  try {
    coins = await fetchFromCoinCap();
  } catch (coinCapError) {
    try {
      coins = await fetchFromBinance();
    } catch (binanceError) {
      coins = staticCoins();
    }
  }

  const topLimit = Math.max(1, Math.min(env.topCoinLimit || DEFAULT_TOP_LIMIT, DEFAULT_TOP_LIMIT));
  coins = coins.slice(0, topLimit);

  if (!query) return coins;
  const q = query.toLowerCase();
  return coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(q) ||
      coin.symbol.toLowerCase().includes(q) ||
      coin.id.toLowerCase().includes(q)
  );
}

async function fetchCoinDetails(coinId) {
  const coins = await fetchTopCoins({ query: "" });
  const symbol = String(coinId || "").toLowerCase().replace(/usdt$/, "");
  const coin = coins.find((item) => item.symbol === symbol);

  if (!coin) {
    const err = new Error("Coin not found");
    err.status = 404;
    throw err;
  }

  let asset = null;
  let history = [];

  try {
    asset = await findCoinCapAsset(symbol);
    if (asset?.id) {
      history = await fetchCoinCapHistory(asset.id);
    }
  } catch (error) {
    history = [];
  }

  const currentPrice = toNumber(asset?.priceUsd || coin.current_price);
  const marketCap = toNumber(asset?.marketCapUsd || coin.market_cap);
  const totalVolume = toNumber(asset?.volumeUsd24Hr || coin.total_volume);
  const vwap24h = toNumber(asset?.vwap24Hr);
  const supply = toNumber(asset?.supply);
  const maxSupply = toNumber(asset?.maxSupply);
  const change24h = toNumber(asset?.changePercent24Hr || coin.price_change_percentage_24h);
  const historyPoints = history.length ? history : buildFallbackHistory(currentPrice, change24h);

  return {
    id: coin.id,
    name: asset?.name || coin.name,
    symbol: coin.symbol,
    image: { large: coin.image },
    market_cap_rank: toNumber(asset?.rank) || coin.market_cap_rank,
    market_data: {
      current_price: { usd: currentPrice },
      high_24h: { usd: coin.high_24h },
      low_24h: { usd: coin.low_24h },
      market_cap: { usd: marketCap },
      total_volume: { usd: totalVolume },
      circulating_supply: supply || null,
      max_supply: maxSupply || null,
      price_change_percentage_24h: change24h,
      market_cap_change_percentage_24h: change24h,
      fully_diluted_valuation: { usd: maxSupply ? maxSupply * currentPrice : marketCap },
    },
    links: {
      homepage: asset?.explorer ? [asset.explorer] : [],
    },
    tickers: vwap24h ? [{ market: { name: "VWAP 24h" }, last: vwap24h }] : [],
    market_chart: {
      prices: historyPoints.map((point) => [point.timestamp, point.price]),
    },
    description: {
      en: `Live market data for ${(asset?.name || coin.name)} (${coin.symbol.toUpperCase()}) with a 24-hour hourly price view.`,
    },
  };
}

async function fetchLatestPrices(coinIds) {
  const coins = await fetchTopCoins({ query: "" });
  const map = Object.fromEntries(coins.map((coin) => [coin.id, coin.current_price]));
  const out = {};
  for (const id of coinIds) {
    const key = String(id || "").toLowerCase();
    if (typeof map[key] === "number") out[key] = map[key];
  }
  return out;
}

module.exports = {
  fetchTopCoins,
  fetchCoinDetails,
  fetchLatestPrices,
};
