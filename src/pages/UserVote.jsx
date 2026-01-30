import { useState } from "react";
import { useAuth } from "react-oidc-context";
import "../ui.css";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function UserVote() {
    const auth = useAuth();
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const pollId = (urlParams && urlParams.get("poll")) || "poll-1";

    const [option, setOption] = useState("A");
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    const options = ["A", "B", "C"];
    const email = auth.user?.profile?.email || auth.user?.profile?.["cognito:username"] || "unknown";

    async function submitVote() {
        setSubmitting(true);
        setError("");
        setMsg("");

        try {
            const token = auth.user?.id_token?.trim();
            if (!token) throw new Error("Please log in again.");

            const res = await fetch(`${API_BASE}/votes`, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ pollId, option }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // אם המשתמש כבר הצביע, נציג את השגיאה באדום
                if (res.status === 409) {
                    setError("כבר הצבעת בסקר הזה!");
                    return;
                }
                throw new Error(data?.error || data?.message || `Error ${res.status}`);
            }

            // הודעת הצלחה (בדרך כלל מוצגת בירוק לפי ה-CSS שלך)
            setMsg("הצבעתך נקלטה בהצלחה! 🙌");
        } catch (e) {
            console.error("Submit Error:", e);
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    }
    return (
        <div className="app-page vote-page">
            <div className="app-shell">
                <div className="vote-shell">
                    <section className="card vote-card">
                        <div className="vote-header">
                            <div className="vote-badge">Verified Voter</div>
                            <h1 className="vote-title">Cast Your Vote</h1>
                            <p className="vote-subtitle">Signed in as <b>{email}</b></p>
                        </div>
                        <div className="vote-form">
                            <div className="field">
                                <div className="option-grid">
                                    {options.map((o) => (
                                        <button key={o} onClick={() => setOption(o)} className={`option-btn ${option === o ? "active" : ""}`}>
                                            {o}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={submitVote} disabled={submitting} className="cta-btn">
                                {submitting ? "Submitting…" : "Submit vote"}
                            </button>
            {msg && <div className="alert success">{msg}</div>}
            {error && <div className="alert error">{error}</div>}
            {msg && (
              <a href="/" style={{ width: "100%" }}>
                <button type="button" className="cta-btn" style={{ marginTop: 10 }}>
                  View live results
                </button>
              </a>
            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
