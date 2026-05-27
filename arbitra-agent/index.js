const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ── Config ────────────────────────────────────────────────
const ARBITRA_ENDPOINT = process.env.ARBITRA_ENDPOINT ?? "http://localhost:3000/api/action";
const TRADING_PAIR = "SUI/USDC";
const BUY_AMOUNT = 12;
const SELL_THRESHOLD = 1.03; // sell when 3% profit
const RISK_SELL_THRESHOLD = 70; // sell to protect when risk spikes
const EXECUTION_INTERVAL_MS = 7 * 60 * 1000; // 7 minutes

// ── Simulated Market State ────────────────────────────────
let marketState = {
  currentPrice: 1.42,
  priceHistory: [1.38, 1.40, 1.39, 1.41, 1.42, 1.43, 1.42],
  riskScore: 44,
  volatility: 0.03,
  position: { units: 0, avgBuyPrice: 0, totalInvested: 0 },
  totalCycles: 0,
  totalBuys: 0,
  totalSells: 0,
  totalSkips: 0,
  totalProfit: 0,
  lastAction: null,
  lastActionTime: null,
};

// ── Price Simulation ──────────────────────────────────────
function simulatePrice() {
  const trend = Math.random() > 0.5 ? 1 : -1;
  const change = (Math.random() * marketState.volatility * trend);
  marketState.currentPrice = Math.max(0.5, marketState.currentPrice + change);
  marketState.priceHistory.push(marketState.currentPrice);
  if (marketState.priceHistory.length > 20) marketState.priceHistory.shift();

  // Simulate risk score changes
  const riskChange = (Math.random() - 0.45) * 8;
  marketState.riskScore = Math.max(10, Math.min(95, marketState.riskScore + riskChange));
  marketState.volatility = 0.02 + Math.random() * 0.04;
}

function getMovingAverage(periods = 7) {
  const recent = marketState.priceHistory.slice(-periods);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

function getSlippage() {
  return Math.min(200, Math.round(marketState.volatility * 100 * 100)); // in bps, capped at 200
}

// ── Trading Decision Engine ───────────────────────────────
function makeDecision() {
  const price = marketState.currentPrice;
  const ma = getMovingAverage();
  const risk = marketState.riskScore;
  const pos = marketState.position;
  const slippage = getSlippage();

  // Sell conditions - profit protection
  if (pos.units > 0) {
    const currentValue = pos.units * price;
    const profitPct = (currentValue - pos.totalInvested) / pos.totalInvested;

    if (profitPct >= 0.03) {
      return {
        action: "SELL",
        amount: Math.round(currentValue),
        reason: `Profit target hit: +${(profitPct * 100).toFixed(1)}%`,
        price,
        riskScore: risk,
        slippageBps: slippage,
      };
    }

    if (risk > RISK_SELL_THRESHOLD && profitPct > 0) {
      return {
        action: "SELL",
        amount: Math.round(currentValue * 0.5),
        reason: `Risk protection: score ${risk.toFixed(0)} > ${RISK_SELL_THRESHOLD}`,
        price,
        riskScore: risk,
        slippageBps: slippage,
      };
    }
  }

  // Buy conditions - price below MA
  if (price < ma * 0.995 && risk < 75) {
    return {
      action: "BUY",
      amount: BUY_AMOUNT,
      reason: `Price ${price.toFixed(4)} below MA ${ma.toFixed(4)}`,
      price,
      riskScore: risk,
      slippageBps: slippage,
    };
  }

  // Skip - no good opportunity
  return {
    action: "SKIP",
    amount: 0,
    reason: `No opportunity: price ${price.toFixed(4)}, MA ${ma.toFixed(4)}, risk ${risk.toFixed(0)}`,
    price,
    riskScore: risk,
    slippageBps: slippage,
  };
}

// ── Execute Trading Cycle ─────────────────────────────────
async function executeCycle() {
  simulatePrice();
  marketState.totalCycles++;

  const decision = makeDecision();
  console.log(`\n[Cycle ${marketState.totalCycles}] Decision: ${decision.action} | ${decision.reason}`);
  console.log(`  Price: $${decision.price.toFixed(4)} | Risk: ${decision.riskScore.toFixed(0)} | Slippage: ${decision.slippageBps}bps`);

  if (decision.action === "SKIP") {
    marketState.totalSkips++;
    marketState.lastAction = { ...decision, arbitraDecision: "skipped", timestamp: Date.now() };
    console.log(`  Skipping cycle — no action taken`);
    return;
  }

  // Send to Arbitra for policy check
  try {
    const response = await axios.post(ARBITRA_ENDPOINT, {
      action: decision.action,
      amount: decision.amount,
      token: "USDC",
      pair: TRADING_PAIR,
      riskScore: Math.round(decision.riskScore),
      slippageBps: decision.slippageBps,
      price: decision.price,
      reason: decision.reason,
      timestamp: Date.now(),
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    const approved = response.data?.approved ?? response.status === 200;

    if (approved) {
      if (decision.action === "BUY") {
        const units = decision.amount / decision.price;
        marketState.position.units += units;
        marketState.position.totalInvested += decision.amount;
        marketState.position.avgBuyPrice = marketState.position.totalInvested / marketState.position.units;
        marketState.totalBuys++;
        console.log(`  Arbitra approved BUY — bought ${units.toFixed(4)} SUI @ $${decision.price.toFixed(4)}`);
      } else if (decision.action === "SELL") {
        const profit = (decision.price - marketState.position.avgBuyPrice) * (decision.amount / decision.price);
        marketState.totalProfit += profit;
        marketState.position.units = Math.max(0, marketState.position.units - decision.amount / decision.price);
        marketState.position.totalInvested = marketState.position.units * marketState.position.avgBuyPrice;
        marketState.totalSells++;
        console.log(`  Arbitra approved SELL — profit: $${profit.toFixed(2)}`);
      }
    } else {
      console.log(`  Arbitra rejected ${decision.action}`);
    }

    marketState.lastAction = {
      ...decision,
      arbitraDecision: approved ? "approved" : "rejected",
      timestamp: Date.now(),
    };

  } catch (error) {
    console.log(`  Arbitra unreachable — action blocked: ${error.message}`);
    marketState.lastAction = {
      ...decision,
      arbitraDecision: "blocked",
      timestamp: Date.now(),
    };
  }

  if (decision.action === "BUY") marketState.totalBuys++;
  if (decision.action === "SELL") marketState.totalSells++;
}

// ── API Routes ────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({
    agent: "Arbitra Demo Trading Agent",
    strategy: "DCA with profit targeting",
    pair: TRADING_PAIR,
    status: "running",
    cycles: marketState.totalCycles,
  });
});

// Arbitra calls this to check agent decisions
app.post("/action", (req, res) => {
  const { type, amount, riskScore } = req.body;
  console.log(`\n[Arbitra Request] type: ${type}, amount: ${amount}, risk: ${riskScore}`);

  simulatePrice();
  const decision = makeDecision();

  res.json({
    approved: decision.action !== "SKIP",
    action: decision.action,
    amount: decision.amount,
    riskScore: Math.round(marketState.riskScore),
    slippageBps: getSlippage(),
    price: marketState.currentPrice,
    reason: decision.reason,
    pair: TRADING_PAIR,
    timestamp: Date.now(),
  });
});

// Get current market state
app.get("/state", (req, res) => {
  res.json({
    ...marketState,
    movingAverage: getMovingAverage(),
    slippage: getSlippage(),
    positionValue: marketState.position.units * marketState.currentPrice,
    unrealizedPnL: marketState.position.units > 0
      ? ((marketState.currentPrice - marketState.position.avgBuyPrice) / marketState.position.avgBuyPrice * 100).toFixed(2) + "%"
      : "0%",
  });
});

// Get trading history
app.get("/history", (req, res) => {
  res.json({
    totalCycles: marketState.totalCycles,
    totalBuys: marketState.totalBuys,
    totalSells: marketState.totalSells,
    totalSkips: marketState.totalSkips,
    totalProfit: marketState.totalProfit.toFixed(2),
    lastAction: marketState.lastAction,
    position: marketState.position,
  });
});

// Manual trigger for testing
app.post("/trigger", async (req, res) => {
  await executeCycle();
  res.json({ success: true, lastAction: marketState.lastAction, state: marketState });
});

// ── Start Server ──────────────────────────────────────────
const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("Arbitra Demo Trading Agent");
  console.log("Strategy: DCA with profit targeting");
  console.log(`Running on: http://localhost:${PORT}`);
  console.log(`Arbitra endpoint: ${ARBITRA_ENDPOINT}`);
  console.log("=".repeat(50));

  // Start autonomous trading loop
  console.log(`\nStarting trading loop — executing every 7 minutes`);
  setInterval(executeCycle, EXECUTION_INTERVAL_MS);

  // Run first cycle immediately
  setTimeout(executeCycle, 2000);
});

// Force buy for testing
app.post("/force-buy", async (req, res) => {
  marketState.currentPrice = 1.35;
  marketState.priceHistory = [1.42, 1.41, 1.43, 1.42, 1.41, 1.40, 1.39];
  marketState.riskScore = 38;
  await executeCycle();
  res.json({ success: true, lastAction: marketState.lastAction });
});

app.post("/force-approve", async (req, res) => {
  marketState.currentPrice = 1.35;
  marketState.priceHistory = [1.42, 1.41, 1.43, 1.42, 1.41, 1.40, 1.39];
  marketState.riskScore = 38;
  marketState.volatility = 0.001;
  const saved = marketState.volatility;
  await executeCycle();
  res.json({ success: true, lastAction: marketState.lastAction, state: marketState });
});
