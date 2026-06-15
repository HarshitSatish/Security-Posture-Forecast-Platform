import React, { useEffect, useState } from "react";

// Pick a weather condition (good -> deteriorating) from the forecast text,
// falling back to the actual risk values in the report below.
// Tune the keyword lists / thresholds to match what /api/forecast returns.
const getCondition = (forecast, scores) => {
  const text = `${forecast?.prediction || ""} ${forecast?.message || ""}`.toLowerCase();
  if (/(storm|thunder|severe|critical|danger|deteriorat|breach)/.test(text)) return "storm";
  if (/(rain|shower|elevated|warning|wet|rising)/.test(text)) return "rainy";
  if (/(cloud|overcast|fair|moderate|caution|partly|mixed)/.test(text)) return "cloudy";
  if (/(sun|clear|good|calm|safe|healthy|secure|stable|bright)/.test(text)) return "sunny";

  const list = Array.isArray(scores) ? scores : [];
  const has = (kw) => list.some((it) => (it.riskLevel || "").toLowerCase().includes(kw));
  if (has("high")) return "storm";
  if (has("medium")) return "rainy";
  if (list.length && list.every((it) => (it.riskLevel || "").toLowerCase().includes("safe"))) return "sunny";
  if (list.length) return "cloudy";
  return "cloudy";
};

const conditionCaption = {
  sunny: "Clear · healthy posture",
  cloudy: "Fair · a few items to watch",
  rainy: "Elevated · risk rising",
  storm: "Severe · posture deteriorating",
};

const spin = { transformBox: "fill-box", transformOrigin: "center" };

function WeatherIcon({ condition, size = 104 }) {
  const c = { width: size, height: size, viewBox: "0 0 120 120", "aria-hidden": "true" };

  if (condition === "sunny") {
    return (
      <svg {...c}>
        <defs>
          <radialGradient id="wxSun" cx="50%" cy="45%" r="62%">
            <stop offset="0%" stopColor="#FFE7A3" />
            <stop offset="58%" stopColor="#FFC23C" />
            <stop offset="100%" stopColor="#FF9F0A" />
          </radialGradient>
        </defs>
        <g className="wx-rays" style={spin}>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="57.5" y="5" width="5" height="16" rx="2.5" fill="#FFD15C" transform={`rotate(${i * 45} 60 60)`} />
          ))}
        </g>
        <circle className="wx-pulse" style={spin} cx="60" cy="60" r="27" fill="url(#wxSun)" />
      </svg>
    );
  }

  if (condition === "cloudy") {
    return (
      <svg {...c}>
        <defs>
          <linearGradient id="wxCloudA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CFE0F2" />
          </linearGradient>
        </defs>
        <circle cx="46" cy="46" r="15" fill="#FFD15C" opacity="0.9" />
        <g className="wx-drift" style={spin}>
          <rect x="38" y="64" width="54" height="24" rx="12" fill="url(#wxCloudA)" />
          <circle cx="48" cy="64" r="17" fill="url(#wxCloudA)" />
          <circle cx="72" cy="58" r="21" fill="url(#wxCloudA)" />
          <circle cx="88" cy="68" r="14" fill="url(#wxCloudA)" />
        </g>
      </svg>
    );
  }

  if (condition === "rainy") {
    return (
      <svg {...c}>
        <defs>
          <linearGradient id="wxCloudB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E7EEF6" />
            <stop offset="100%" stopColor="#AEC2D8" />
          </linearGradient>
        </defs>
        <g>
          <rect x="36" y="50" width="56" height="24" rx="12" fill="url(#wxCloudB)" />
          <circle cx="46" cy="50" r="17" fill="url(#wxCloudB)" />
          <circle cx="72" cy="44" r="21" fill="url(#wxCloudB)" />
          <circle cx="88" cy="54" r="14" fill="url(#wxCloudB)" />
        </g>
        <g stroke="#5AA9E6" strokeWidth="4.5" strokeLinecap="round">
          <line className="wx-drop d1" x1="50" y1="80" x2="46" y2="92" />
          <line className="wx-drop d2" x1="64" y1="80" x2="60" y2="92" />
          <line className="wx-drop d3" x1="78" y1="80" x2="74" y2="92" />
        </g>
      </svg>
    );
  }

  // storm
  return (
    <svg {...c}>
      <defs>
        <linearGradient id="wxCloudC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8A93A8" />
          <stop offset="100%" stopColor="#5A6172" />
        </linearGradient>
      </defs>
      <g>
        <rect x="36" y="48" width="56" height="24" rx="12" fill="url(#wxCloudC)" />
        <circle cx="46" cy="48" r="17" fill="url(#wxCloudC)" />
        <circle cx="72" cy="42" r="21" fill="url(#wxCloudC)" />
        <circle cx="88" cy="52" r="14" fill="url(#wxCloudC)" />
      </g>
      <polygon className="wx-bolt" style={spin} points="64,72 51,97 62,97 56,116 82,86 69,86 75,72" fill="#FFD60A" />
    </svg>
  );
}

function App() {
  const [scores, setScores] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scoresRes, forecastRes, statusRes] = await Promise.all([
          fetch("/api/results"),
          fetch("/api/forecast"),
          fetch("/api/status"),
        ]);

        setScores(await scoresRes.json());
        setForecast(await forecastRes.json());
        setStatus(await statusRes.json());
        const scoresData = await scoresRes.json();
        const forecastData = await forecastRes.json();
        const statusData = await statusRes.json();
        setScores(scoresData);
        setForecast(forecastData);
        setStatus(statusData);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRiskColor = (risk) => {
    if (!risk) return "#8E8E93";
    if (risk.toLowerCase().includes("high")) return "#FF453A";
    if (risk.toLowerCase().includes("medium")) return "#FF9F0A";
    if (risk.toLowerCase().includes("safe")) return "#30D158";
    return "#A0AEC0";
  };

  if (loading) {
    return (
      <>
        <style>{globalCss}</style>
        <div style={styles.loadingPage}>
          <div style={styles.loadingGlyph}>☁️</div>
          <div style={styles.loadingText}>Loading Security Weather</div>
        </div>
      </>
    );
  if (loading) {
    return <div style={{ padding: "20px" }}>Loading dashboard...</div>;
  }

  const condition = getCondition(forecast, scores);

  return (
    <>
      <style>{globalCss}</style>
      <div style={styles.page}>
        <div style={styles.shell}>

          {/* HEADER */}
          <div style={styles.header}>
            <h1 style={styles.title}>☁️ Security Weather Forecast Platform</h1>
            <p style={styles.subtitle}>Real-time cloud security posture monitoring</p>
          </div>

          {/* STATUS CARDS */}
          <div style={styles.cardRow}>
            <div className="sw-tile" style={styles.card}>
              <h3 style={styles.tileLabel}>Pipeline</h3>
              <p style={styles.tileValue}>{status?.pipeline}</p>
            </div>
            <div className="sw-tile" style={styles.card}>
              <h3 style={styles.tileLabel}>Last Run</h3>
              <p style={styles.tileValue}>{status?.lastRun}</p>
            </div>
            <div className="sw-tile" style={styles.card}>
              <h3 style={styles.tileLabel}>ECS</h3>
              <p style={styles.tileValue}>{status?.ecs}</p>
            </div>
          </div>

          {/* FORECAST */}
          <div className="sw-hero" style={styles.forecastBox}>
            <div style={styles.heroLabel}>Security Forecast</div>
            <div style={styles.heroIcon}>
              <WeatherIcon condition={condition} />
            </div>
            <p style={styles.heroCondition}>{conditionCaption[condition]}</p>
            <p style={styles.heroMessage}>{forecast?.message}</p>
            <h3 style={styles.heroPrediction}>{forecast?.prediction}</h3>
          </div>

          {/* TABLE */}
          <div style={styles.tableContainer}>
            <h2 style={styles.sectionTitle}>📊 Security Weather Report</h2>

            <div className="sw-scroll" style={styles.scrollArea}>
              <table className="sw-table" style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>App</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Risk</th>
                    <th style={styles.th}>Findings</th>
                    <th style={styles.th}>Weather</th>
                    <th style={styles.th}>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {scores.map((item, i) => (
                    <tr key={i} className="sw-row" style={styles.row}>
                      <td style={styles.tdStrong}>{item.appId}</td>
                      <td style={styles.td}>{item.scan_type}</td>
                      <td style={styles.tdScore}>{item.score}</td>
                      <td style={{ ...styles.td, color: getRiskColor(item.riskLevel), fontWeight: 600 }}>
                        {item.riskLevel}
                      </td>
                      <td style={styles.td}>
                        🔴 {item.high} | 🟡 {item.medium} | 🟢 {item.low}
                      </td>
                      <td style={styles.td}>{item.totalFindings}</td>
                      <td style={styles.tdMuted}>{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Security Posture Forecast Platform</h1>
      <p>Live dashboard connected to AWS DynamoDB + API layer</p>

      <h3>Status</h3>
      <p>Pipeline: {status?.pipeline}</p>
      <p>Last Run: {status?.lastRun}</p>
      <p>ECS: {status?.ecs}</p>

      <h3>Scan Results (Live DynamoDB Data)</h3>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Application</th>
            <th>Score</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((item, i) => (
            <tr key={i}>
              <td>{item.appId}</td>
              <td>{item.score}</td>
              <td>{item.riskLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: "20px", color: "darkred" }}>Forecast</h3>
      <p>{forecast?.message}</p>
      <h4 style={{ color: "red" }}>{forecast?.prediction}</h4>
    </div>
  );
}

const fontStack =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, sans-serif';

const skyBackground =
  "radial-gradient(125% 85% at 50% -15%, rgba(140,185,255,0.40) 0%, rgba(140,185,255,0) 52%)," +
  "linear-gradient(180deg, #2c5e9e 0%, #356099 22%, #3c5a93 48%, #344a86 68%, #2a2f64 86%, #1c1f4c 100%)";

const frostedCard = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 24,
  boxShadow: "0 10px 36px rgba(8,15,40,0.28)",
};

const styles = {
  page: {
    fontFamily: fontStack,
    background: skyBackground,
    backgroundAttachment: "fixed",
    color: "rgba(255,255,255,0.95)",
    minHeight: "100vh",
    padding: "clamp(20px, 5vw, 56px) clamp(16px, 4vw, 40px)",
    WebkitFontSmoothing: "antialiased",
  },
  shell: {
    maxWidth: 980,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 22,
    animation: "swFadeUp 0.7s ease both",
  },

  header: {
    textAlign: "center",
    padding: "8px 0 4px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(1.5rem, 4vw, 2.4rem)",
    fontWeight: 300,
    letterSpacing: "-0.01em",
    textShadow: "0 2px 14px rgba(0,0,0,0.22)",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
    fontWeight: 400,
    color: "rgba(255,255,255,0.66)",
    letterSpacing: "0.01em",
  },

  forecastBox: {
    ...frostedCard,
    padding: "clamp(22px, 4vw, 38px)",
    textAlign: "center",
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
    borderBottom: "1px solid rgba(255,255,255,0.14)",
    paddingBottom: 12,
    marginBottom: 16,
  },
  heroIcon: {
    display: "flex",
    justifyContent: "center",
    margin: "4px 0 6px",
    filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.25))",
  },
  heroCondition: {
    margin: "0 0 10px",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  heroMessage: {
    margin: "0 0 10px",
    fontSize: "clamp(0.95rem, 2.2vw, 1.15rem)",
    fontWeight: 400,
    color: "rgba(255,255,255,0.78)",
  },
  heroPrediction: {
    margin: "2px auto 0",
    maxWidth: 600,
    fontSize: "clamp(1.15rem, 2.4vw, 1.6rem)",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1.3,
    textShadow: "0 2px 14px rgba(0,0,0,0.22)",
  },

  cardRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
  },
  card: {
    ...frostedCard,
    flex: "1 1 160px",
    padding: "18px 20px",
    borderRadius: 20,
  },
  tileLabel: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.58)",
  },
  tileValue: {
    margin: "10px 0 0",
    fontSize: "1.35rem",
    fontWeight: 500,
    letterSpacing: "-0.01em",
  },

  tableContainer: {
    ...frostedCard,
    padding: "clamp(18px, 3vw, 26px)",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "1.15rem",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    color: "rgba(255,255,255,0.92)",
  },
  scrollArea: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 640,
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    borderBottom: "1px solid rgba(255,255,255,0.14)",
    whiteSpace: "nowrap",
  },
  row: {
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  td: {
    padding: "15px 14px",
    fontSize: "0.95rem",
    color: "rgba(255,255,255,0.9)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  tdStrong: {
    padding: "15px 14px",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#fff",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  tdScore: {
    padding: "15px 14px",
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#fff",
    verticalAlign: "middle",
  },
  tdMuted: {
    padding: "15px 14px",
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.55)",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },

  loadingPage: {
    fontFamily: fontStack,
    background: skyBackground,
    backgroundAttachment: "fixed",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    color: "#fff",
  },
  loadingGlyph: {
    fontSize: 56,
    animation: "swPulse 1.8s ease-in-out infinite",
  },
  loadingText: {
    fontSize: "1.05rem",
    fontWeight: 300,
    letterSpacing: "0.04em",
    color: "rgba(255,255,255,0.8)",
  },
};

const globalCss = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #1c1f4c; }

  @keyframes swFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes swPulse {
    0%, 100% { opacity: 0.55; transform: scale(0.96); }
    50%      { opacity: 1;    transform: scale(1.06); }
  }

  .sw-tile, .sw-hero {
    transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
  }
  .sw-tile:hover, .sw-hero:hover {
    transform: translateY(-3px);
    background: rgba(255,255,255,0.15);
    box-shadow: 0 16px 44px rgba(8,15,40,0.34);
  }

  .sw-row { transition: background 0.18s ease; }
  .sw-row:hover { background: rgba(255,255,255,0.07); }
  .sw-row:last-child { border-bottom: none; }

  .sw-scroll::-webkit-scrollbar { height: 8px; }
  .sw-scroll::-webkit-scrollbar-track { background: transparent; }
  .sw-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.22);
    border-radius: 8px;
  }
  .sw-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.34); }

  .wx-rays  { animation: wxSpin 22s linear infinite; }
  .wx-pulse { animation: wxPulse 3.2s ease-in-out infinite; }
  .wx-drift { animation: wxDrift 4.5s ease-in-out infinite; }
  .wx-drop  { animation: wxRain 1.15s linear infinite; }
  .wx-drop.d2 { animation-delay: 0.38s; }
  .wx-drop.d3 { animation-delay: 0.76s; }
  .wx-bolt  { animation: wxFlash 2.6s ease-in-out infinite; }

  @keyframes wxSpin  { to { transform: rotate(360deg); } }
  @keyframes wxPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
  @keyframes wxDrift { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
  @keyframes wxRain  { 0% { opacity: 0; transform: translateY(-6px); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(9px); } }
  @keyframes wxFlash { 0%,90%,100% { opacity: 0.5; } 92% { opacity: 1; } 95% { opacity: 0.35; } 97% { opacity: 1; } }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
`;

export default App;
