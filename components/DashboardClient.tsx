"use client";
import React from "react";

type Trade = {
  id: string;
  source: string;
  symbol: string;
  direction: "buy" | "sell";
  entryPrice: number;
  amount: number;
  timeframe: string;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: string;
  status: "queued" | "mirrored" | "failed";
  log: string[];
};

type TradesResponse = {
  enabled: boolean;
  trades: Trade[];
};

export default function DashboardClient() {
  const [data, setData] = React.useState<TradesResponse>({ enabled: true, trades: [] });
  const [loading, setLoading] = React.useState(false);
  const [apiKey, setApiKey] = React.useState<string>("");

  const fetchTrades = React.useCallback(async () => {
    const res = await fetch("/api/trades", { headers: apiKey ? { "x-api-key": apiKey } : undefined });
    const json = await res.json();
    setData(json);
  }, [apiKey]);

  React.useEffect(() => {
    fetchTrades();
    const i = setInterval(fetchTrades, 5000);
    return () => clearInterval(i);
  }, [fetchTrades]);

  const toggle = async () => {
    setLoading(true);
    await fetch("/api/toggle", { method: "POST", headers: { "content-type": "application/json", ...(apiKey ? { "x-api-key": apiKey } : {}) } });
    await fetchTrades();
    setLoading(false);
  };

  const pollNow = async () => {
    setLoading(true);
    await fetch("/api/moxyai/poll", { method: "POST", headers: { ...(apiKey ? { "x-api-key": apiKey } : {}) } });
    await fetchTrades();
    setLoading(false);
  };

  const seedDemo = async () => {
    setLoading(true);
    await fetch("/api/mirror", { method: "POST", headers: { "content-type": "application/json", ...(apiKey ? { "x-api-key": apiKey } : {}) }, body: JSON.stringify({
      symbol: "EUR/USD",
      direction: "buy",
      entryPrice: 1.0825,
      amount: 1,
      timeframe: "1H",
      stopLoss: 1.0810,
      takeProfit: 1.0850
    }) });
    await fetchTrades();
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <button className={`button ${data.enabled ? "secondary" : ""}`} onClick={toggle} disabled={loading}>
            {data.enabled ? "Disable Mirroring" : "Enable Mirroring"}
          </button>
          <button className="button" onClick={pollNow} disabled={loading}>Poll MoxyAI Now</button>
          <button className="button" onClick={seedDemo} disabled={loading}>Mirror Demo Trade</button>
        </div>
        <div className="row">
          <input className="input" placeholder="Optional API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </div>
      </div>

      <div className="small" style={{ marginTop: 8 }}>Mirroring is <span className={`badge ${data.enabled ? "ok" : "fail"}`}>{data.enabled ? "ENABLED" : "DISABLED"}</span></div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Mirrored Trades</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Pair</th>
              <th>Dir</th>
              <th>Entry</th>
              <th>Amount</th>
              <th>TF</th>
              <th>SL</th>
              <th>TP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.trades.length === 0 ? (
              <tr><td colSpan={10} className="small">No trades yet.</td></tr>
            ) : (
              data.trades.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>{t.source}</td>
                  <td>{t.symbol}</td>
                  <td>{t.direction.toUpperCase()}</td>
                  <td>{t.entryPrice}</td>
                  <td>{t.amount}</td>
                  <td>{t.timeframe}</td>
                  <td>{t.stopLoss ?? "-"}</td>
                  <td>{t.takeProfit ?? "-"}</td>
                  <td><span className={`badge ${t.status === "mirrored" ? "ok" : t.status === "failed" ? "fail" : ""}`}>{t.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <details className="card">
        <summary>Info</summary>
        <p className="small">Use the API key field if you set <code>AGENT_API_KEY</code> in environment variables.</p>
      </details>
    </div>
  );
}
