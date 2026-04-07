import axios from "axios";

const STORAGE_KEY = "digicoin_auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const COINCAP_API = "https://api.coincap.io/v2";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.defaults.withCredentials = true;

export function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredAuth(auth) {
  if (!auth) {
    localStorage.removeItem(STORAGE_KEY);
    delete api.defaults.headers.common.Authorization;
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  api.defaults.headers.common.Authorization = `Bearer ${auth.token}`;
}

const existingAuth = getStoredAuth();
if (existingAuth?.token) {
  api.defaults.headers.common.Authorization = `Bearer ${existingAuth.token}`;
}

export async function signup(payload) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function forgotPassword(payload) {
  const { data } = await api.post("/auth/forgot-password", payload);
  return data;
}

export async function resetPassword(payload) {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.post("/auth/change-password", payload);
  return data;
}

export async function fetchCoins(params) {
  try {
    const { data } = await api.get("/market/coins", { params });
    return data.coins ?? data;
  } catch (backendError) {
    const { data } = await axios.get(`${COINCAP_API}/assets`, {
      params: { limit: 15 },
      timeout: 15000,
    });
    return (data?.data || []).slice(0, 15).map((asset, index) => {
      const symbol = String(asset.symbol || "").toLowerCase();
      const price = Number(asset.priceUsd || 0);
      return {
        id: `${symbol}usdt`,
        name: asset.name,
        symbol,
        image: `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${symbol}.png`,
        current_price: price,
        high_24h: price,
        low_24h: price,
        price_change_percentage_24h: Number(asset.changePercent24Hr || 0),
        market_cap_rank: Number(asset.rank || index + 1),
        total_volume: Number(asset.volumeUsd24Hr || 0),
        market_cap: Number(asset.marketCapUsd || 0),
      };
    });
  }
}

export async function fetchCoinDetails(coinId) {
  try {
    const { data } = await api.get(`/market/coins/${coinId}`);
    return data.coin ?? data;
  } catch (backendError) {
    const symbol = String(coinId || "").toLowerCase().replace(/usdt$/, "");
    const { data } = await axios.get(`${COINCAP_API}/assets`, {
      params: { limit: 200 },
      timeout: 15000,
    });
    const asset = (data?.data || []).find(
      (item) => String(item.symbol || "").toLowerCase() === symbol
    );
    if (!asset) throw backendError;

    const price = Number(asset.priceUsd || 0);
    return {
      id: `${symbol}usdt`,
      name: asset.name,
      symbol,
      image: {
        large: `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${symbol}.png`,
      },
      market_cap_rank: Number(asset.rank || 0),
      market_data: {
        current_price: { usd: price },
        high_24h: { usd: price },
        low_24h: { usd: price },
        market_cap: { usd: Number(asset.marketCapUsd || 0) },
        total_volume: { usd: Number(asset.volumeUsd24Hr || 0) },
        circulating_supply: null,
        max_supply: null,
        price_change_percentage_24h: Number(asset.changePercent24Hr || 0),
        market_cap_change_percentage_24h: Number(asset.changePercent24Hr || 0),
        fully_diluted_valuation: { usd: Number(asset.marketCapUsd || 0) },
      },
      market_chart: {
        prices: Array.from({ length: 24 }, (_, index) => {
          const ratio = index / 23;
          const drift = price * (1 - Number(asset.changePercent24Hr || 0) / 100) * (1 - ratio) + price * ratio;
          return [Date.now() - (23 - index) * 60 * 60 * 1000, Number(drift.toFixed(6))];
        }),
      },
      description: {
        en: `Live market data from CoinCap for ${asset.name}.`,
      },
    };
  }
}

export async function fetchTopMovers(limit = 6) {
  try {
    const { data } = await api.get("/market/top-movers", { params: { limit } });
    return data.movers ?? data;
  } catch (backendError) {
    const coins = await fetchCoins({ perPage: 15 });
    return [...coins]
      .sort(
        (a, b) =>
          Math.abs(b.price_change_percentage_24h || 0) -
          Math.abs(a.price_change_percentage_24h || 0)
      )
      .slice(0, Math.min(Math.max(limit, 1), 15));
  }
}

export async function fetchAlerts() {
  const { data } = await api.get("/alerts");
  return data.alerts;
}

export async function createAlert(payload) {
  const { data } = await api.post("/alerts", payload);
  return data;
}

export async function updateAlert(id, payload) {
  const { data } = await api.patch(`/alerts/${id}`, payload);
  return data;
}

export async function removeAlert(id) {
  const { data } = await api.delete(`/alerts/${id}`);
  return data;
}

export async function fetchAlertHistory() {
  const { data } = await api.get("/alerts/history/list");
  return data.history;
}

export async function fetchProfileSummary() {
  const { data } = await api.get("/profile/summary");
  return data;
}
