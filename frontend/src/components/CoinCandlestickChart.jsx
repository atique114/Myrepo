import React, { useId, useMemo, useRef, useState } from "react";

const TIMEFRAMES = [
  { label: "6H", hours: 6 },
  { label: "12H", hours: 12 },
  { label: "24H", hours: 24 },
];

function chartCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : value >= 1 ? 2 : 6,
  }).format(value);
}

function percent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatHour(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
  }).format(new Date(timestamp));
}

function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
  }).format(new Date(timestamp));
}

function toCandles(prices) {
  if (!Array.isArray(prices) || prices.length === 0) return [];

  return prices.map(([timestamp, closeValue], index) => {
    const close = Number(closeValue || 0);
    const previousClose = index === 0 ? close : Number(prices[index - 1][1] || close);
    const nextClose = index === prices.length - 1 ? close : Number(prices[index + 1][1] || close);
    const open = previousClose;
    const neighborhoodHigh = Math.max(open, close, nextClose);
    const neighborhoodLow = Math.min(open, close, nextClose);
    const wickSize = Math.max((neighborhoodHigh - neighborhoodLow) * 0.22, close * 0.0025, 0.000001);

    return {
      timestamp,
      open,
      close,
      high: neighborhoodHigh + wickSize,
      low: Math.max(neighborhoodLow - wickSize, 0),
    };
  });
}

export default function CoinCandlestickChart({ prices = [] }) {
  const [timeframe, setTimeframe] = useState(24);
  const [activeIndex, setActiveIndex] = useState(null);
  const surfaceRef = useRef(null);
  const gradientId = useId().replace(/:/g, "");

  const candles = useMemo(() => toCandles(prices), [prices]);

  const visibleCandles = useMemo(() => {
    if (!candles.length) return [];
    return candles.slice(-Math.min(timeframe, candles.length));
  }, [candles, timeframe]);

  const metrics = useMemo(() => {
    if (!visibleCandles.length) return null;

    const width = 760;
    const height = 320;
    const paddingX = 18;
    const paddingTop = 24;
    const paddingBottom = 38;
    const values = visibleCandles.flatMap((candle) => [candle.high, candle.low]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || max * 0.03 || 1;
    const drawHeight = height - paddingTop - paddingBottom;
    const plotWidth = width - paddingX * 2;
    const candleWidth = Math.max(10, Math.min(26, plotWidth / Math.max(visibleCandles.length * 1.6, 1)));
    const gap = plotWidth / Math.max(visibleCandles.length, 1);
    const baseline = height - paddingBottom;

    const yScale = (value) => baseline - ((value - min) / range) * drawHeight;
    const plotted = visibleCandles.map((candle, index) => {
      const centerX = paddingX + gap * index + gap / 2;
      const openY = yScale(candle.open);
      const closeY = yScale(candle.close);
      const highY = yScale(candle.high);
      const lowY = yScale(candle.low);
      const bodyY = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 3);
      return {
        ...candle,
        index,
        centerX,
        openY,
        closeY,
        highY,
        lowY,
        bodyY,
        bodyHeight,
        x: centerX - candleWidth / 2,
        isUp: candle.close >= candle.open,
      };
    });

    const first = visibleCandles[0];
    const last = visibleCandles[visibleCandles.length - 1];
    const change = first.open ? ((last.close - first.open) / first.open) * 100 : 0;
    const high = Math.max(...visibleCandles.map((candle) => candle.high));
    const low = Math.min(...visibleCandles.map((candle) => candle.low));
    const volumeEstimate = visibleCandles.reduce(
      (sum, candle) => sum + Math.abs(candle.close - candle.open),
      0
    ) / visibleCandles.length;

    return {
      width,
      height,
      paddingX,
      paddingTop,
      paddingBottom,
      candleWidth,
      plotted,
      min,
      max,
      change,
      high,
      low,
      volumeEstimate,
      gridLevels: Array.from({ length: 4 }, (_, index) => {
        const ratio = index / 3;
        const value = max - ratio * (max - min || 1);
        return { y: yScale(value), value };
      }),
    };
  }, [visibleCandles]);

  function updateActiveIndex(clientX) {
    if (!surfaceRef.current || !metrics?.plotted.length) return;
    const bounds = surfaceRef.current.getBoundingClientRect();
    const relativeX = Math.min(Math.max(clientX - bounds.left, 0), bounds.width);
    const ratio = bounds.width ? relativeX / bounds.width : 0;
    const index = Math.min(
      metrics.plotted.length - 1,
      Math.max(0, Math.round(ratio * (metrics.plotted.length - 1)))
    );
    setActiveIndex(index);
  }

  if (!metrics) {
    return <div className="chart-empty">Candlestick chart unavailable.</div>;
  }

  const activeCandle =
    activeIndex === null ? metrics.plotted[metrics.plotted.length - 1] : metrics.plotted[activeIndex];
  const trendUp = metrics.change >= 0;
  const tone = trendUp
    ? { stroke: "#0f766e", accent: "#14b8a6", fill: "#ccfbf1" }
    : { stroke: "#b91c1c", accent: "#fb7185", fill: "#ffe4e6" };

  return (
    <div className="chart-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Interactive Candlestick View</div>
          <div className="text-2xl font-semibold tracking-tight">{chartCurrency(activeCandle.close)}</div>
          <div className="text-xs text-slate-500 mt-1">
            {formatDateTime(activeCandle.timestamp)} | Open {chartCurrency(activeCandle.open)} | Close {chartCurrency(activeCandle.close)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TIMEFRAMES.map((option) => (
            <button
              key={option.hours}
              type="button"
              className={`chart-time-btn ${timeframe === option.hours ? "chart-time-btn-active" : ""}`}
              onClick={() => {
                setTimeframe(option.hours);
                setActiveIndex(null);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4">
        <div className="chart-mini-stat">
          <div className="chart-mini-label">Period Change</div>
          <div className={`chart-mini-value ${trendUp ? "price-up" : "price-down"}`}>{percent(metrics.change)}</div>
        </div>
        <div className="chart-mini-stat">
          <div className="chart-mini-label">High</div>
          <div className="chart-mini-value">{chartCurrency(metrics.high)}</div>
        </div>
        <div className="chart-mini-stat">
          <div className="chart-mini-label">Low</div>
          <div className="chart-mini-value">{chartCurrency(metrics.low)}</div>
        </div>
        <div className="chart-mini-stat">
          <div className="chart-mini-label">Avg Candle Move</div>
          <div className="chart-mini-value">{chartCurrency(metrics.volumeEstimate)}</div>
        </div>
      </div>

      <div
        ref={surfaceRef}
        className="chart-surface"
        onMouseLeave={() => setActiveIndex(null)}
        onMouseMove={(event) => updateActiveIndex(event.clientX)}
        onTouchStart={(event) => updateActiveIndex(event.touches[0].clientX)}
        onTouchMove={(event) => updateActiveIndex(event.touches[0].clientX)}
      >
        <svg
          viewBox={`0 0 ${metrics.width} ${metrics.height}`}
          className="w-full h-[300px]"
          role="img"
          aria-label="Interactive candlestick chart"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={tone.accent} stopOpacity="0.2" />
              <stop offset="100%" stopColor={tone.accent} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <rect
            x={metrics.paddingX}
            y={metrics.paddingTop}
            width={metrics.width - metrics.paddingX * 2}
            height={metrics.height - metrics.paddingTop - metrics.paddingBottom}
            fill={`url(#${gradientId})`}
            rx="24"
          />
          {metrics.gridLevels.map((level) => (
            <g key={level.y}>
              <line
                x1={metrics.paddingX}
                y1={level.y}
                x2={metrics.width - metrics.paddingX}
                y2={level.y}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeDasharray="5 7"
              />
              <text
                x={metrics.width - metrics.paddingX}
                y={level.y - 8}
                textAnchor="end"
                className="fill-slate-400 text-[12px]"
              >
                {chartCurrency(level.value)}
              </text>
            </g>
          ))}

          {activeCandle ? (
            <line
              x1={activeCandle.centerX}
              y1={metrics.paddingTop}
              x2={activeCandle.centerX}
              y2={metrics.height - metrics.paddingBottom}
              stroke={tone.stroke}
              strokeOpacity="0.22"
              strokeDasharray="5 7"
            />
          ) : null}

          {metrics.plotted.map((candle) => {
            const fill = candle.isUp ? "#14b8a6" : "#fb7185";
            const stroke = candle.isUp ? "#0f766e" : "#be123c";
            const isActive = activeCandle?.index === candle.index;
            return (
              <g key={candle.timestamp} opacity={isActive ? 1 : 0.92}>
                <line
                  x1={candle.centerX}
                  y1={candle.highY}
                  x2={candle.centerX}
                  y2={candle.lowY}
                  stroke={stroke}
                  strokeWidth={isActive ? 3 : 2}
                  strokeLinecap="round"
                />
                <rect
                  x={candle.x}
                  y={candle.bodyY}
                  width={metrics.candleWidth}
                  height={candle.bodyHeight}
                  rx="6"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive ? 2.4 : 1.3}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chart-axis">
        <span>{formatHour(metrics.plotted[0].timestamp)}</span>
        <span>{formatHour(metrics.plotted[Math.floor(metrics.plotted.length / 2)].timestamp)}</span>
        <span>{formatHour(metrics.plotted[metrics.plotted.length - 1].timestamp)}</span>
      </div>
      <div className="chart-footer">
        <div className="chart-footer-pill">
          <span className="chart-dot" style={{ backgroundColor: activeCandle.isUp ? "#14b8a6" : "#fb7185" }} />
          {`${activeCandle.isUp ? "Bullish" : "Bearish"} candle | High ${chartCurrency(activeCandle.high)} | Low ${chartCurrency(activeCandle.low)}`}
        </div>
      </div>
    </div>
  );
}
