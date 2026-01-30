import { useEffect, useMemo, useRef, useState } from "react";
import "./ui.css";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function App() {
  const [pollId] = useState("poll-1");
  const [question] = useState("Which programming language do you prefer?");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loadingResults, setLoadingResults] = useState(false);
  const [intervalMs] = useState(1500);

  const timerRef = useRef(null);
  const shellRef = useRef(null);

  const options = useMemo(() => ["A", "B", "C"], []);
  const optionMeta = {
    A: { className: "opt-a" },
    B: { className: "opt-b" },
    C: { className: "opt-c" },
  };
  const optionLabels = {
    A: "Python",
    B: "C++",
    C: "JavaScript",
  };

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

  function stopAutoRefresh() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    timerRef.current = setInterval(refreshResults, intervalMs);
  }

  useEffect(() => {
    refreshResults();
    startAutoRefresh();
    return () => stopAutoRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = results?.total ?? 0;
  const counts = results?.counts ?? {};
  const votes = results?.votes ?? [];

  return (
    <div className="app-page vote-page">
      <div ref={shellRef} className="app-shell">
        <section className="card results-card presenter">
          <div className="header-row">
            <div className="header-left">
              <div className="kicker">Cloud Voting Demo</div>
              <h1 className="page-title">Live Poll Results</h1>
              <div className="subline">Poll: <b>{pollId}</b></div>
              <div className="poll-question">{question}</div>
              <div className="live-pill">
                <span className="live-dot" />
                Live stream
              </div>
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
                  <div className="big-bar-label">{optionLabels[o] || o}</div>
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
                          {optionLabels[v?.option] || v?.option || "-"}
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

        </section>
      </div>
    </div>
  );
}
