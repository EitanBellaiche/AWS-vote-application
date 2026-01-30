import { useEffect, useMemo, useRef, useState } from "react";
import "./ui.css";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function App() {
  const [pollId] = useState("poll-1");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loadingResults, setLoadingResults] = useState(false);
  const [presenter, setPresenter] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs, setIntervalMs] = useState(1500);

  const timerRef = useRef(null);
  const shellRef = useRef(null);

  const options = useMemo(() => ["A", "B", "C"], []);
  const optionMeta = {
    A: { className: "opt-a" },
    B: { className: "opt-b" },
    C: { className: "opt-c" },
  };

  function stopAutoRefresh() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function fetchResults(id) {
    const res = await fetch(`${API_BASE}/polls/${encodeURIComponent(id)}/results`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    return data;
  }

  async function refreshResults() {
    setError("");
    setLoadingResults(true);
    try {
      const data = await fetchResults(pollId);
      setResults(data);
    } catch (e) {
      setError(e?.message || "Failed to load results");
    } finally {
      setLoadingResults(false);
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    timerRef.current = setInterval(refreshResults, intervalMs);
  }

  async function enterPresenter() {
    try {
      setPresenter(true);
      if (shellRef.current?.requestFullscreen) await shellRef.current.requestFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch (e) {
      console.warn("Fullscreen failed:", e);
    }
  }

  function exitPresenter() {
    setPresenter(false);
    if (document.fullscreenElement) document.exitFullscreen?.();
  }

  useEffect(() => {
    refreshResults();
    if (autoRefresh) startAutoRefresh();
    return () => stopAutoRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stopAutoRefresh();
    if (autoRefresh) startAutoRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, autoRefresh]);

  const total = results?.total ?? 0;
  const counts = results?.counts ?? {};
  const votes = results?.votes ?? [];

  return (
    <div className="app-page vote-page">
      <div ref={shellRef} className="app-shell">
        <section className={`card results-card presenter ${presenter ? "pulse" : ""}`}>
          <div className="header-row">
            <div className="header-left">
              <div className="kicker">Cloud Voting Demo</div>
              <h1 className="page-title">Live Poll Results</h1>
              <div className="subline">
                Poll: <b>{pollId}</b> — API: <code className="code-pill">{API_BASE}</code>
              </div>
              <div className="live-pill">
                <span className="live-dot" />
                Live stream
              </div>
            </div>

            <div className="controls">
              <button className="ghost-btn" onClick={() => setAutoRefresh((s) => !s)}>
                {autoRefresh ? "Auto: On" : "Auto: Off"}
              </button>

              <button
                className="ghost-btn"
                onClick={() => setIntervalMs(intervalMs === 1500 ? 5000 : 1500)}
                title="Cycle interval"
              >
                Interval: {intervalMs / 1000}s
              </button>

              {!presenter ? (
                <button className="ghost-btn" onClick={enterPresenter}>
                  Present
                </button>
              ) : (
                <button className="ghost-btn" onClick={exitPresenter}>
                  Exit
                </button>
              )}
            </div>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card kpi-total-card">
              <div className="kpi-label">Total votes</div>
              <div className="total-big">{total}</div>
              <div className="total-caption">votes</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Last update</div>
              <div className="kpi-time">{new Date().toLocaleTimeString()}</div>
              {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}
            </div>
          </div>

          <div style={{ marginTop: 18 }} className="bars">
            {options.map((o) => {
              const c = counts[o] || 0;
              const pct = total ? Math.round((c / total) * 100) : 0;
              return (
                <div key={o} className={`big-bar-row ${optionMeta[o]?.className || ""}`}>
                  <div className="big-bar-label">
                    Option <b>{o}</b>
                  </div>
                  <div className="big-bar-track">
                    <div
                      className={`big-bar-fill ${optionMeta[o]?.className || ""}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="bar-value">
                    <b className="kpi-time">{c}</b> <span className="muted">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="table-card">
            <div className="table-title">Live votes</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Name</th>
                    <th className="th">Option</th>
                    <th className="th">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.length ? (
                    [...votes].slice(-12).reverse().map((v, idx) => (
                      <tr key={`${v?.email || v?.name || "vote"}-${idx}`}>
                        <td className="td">{v?.voterId || v?.email || v?.name || "Anonymous"}</td>
                        <td className={`td option-pill ${optionMeta[v?.option]?.className || ""}`}>
                          {v?.option || "-"}
                        </td>
                        <td className="td">
                          {v?.createdAt ? new Date(v.createdAt).toLocaleTimeString() : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="td muted" colSpan={3}>
                        No votes yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="present-footer">
            Backend: API Gateway + Lambda + DynamoDB + SQS (FIFO). Frontend: React + Cognito.
          </div>
        </section>
      </div>
    </div>
  );
}
