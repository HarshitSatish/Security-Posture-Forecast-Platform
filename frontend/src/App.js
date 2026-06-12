import React, { useEffect, useState } from "react";

function App() {
  const [scores, setScores] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // ======================
  // FETCH LIVE API DATA
  // ======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scoresRes, forecastRes, statusRes] = await Promise.all([
          fetch("http://localhost:3000/api/results"),
          fetch("http://localhost:3000/api/forecast"),
          fetch("http://localhost:3000/api/status"),
        ]);

        const scoresData = await scoresRes.json();
        const forecastData = await forecastRes.json();
        const statusData = await statusRes.json();

        setScores(scoresData);
        setForecast(forecastData);
        setStatus(statusData);

      } catch (err) {
        console.log("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ======================
  // LOADING STATE
  // ======================
  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Security Posture Forecast Platform</h1>

      <p>Live dashboard connected to AWS DynamoDB + API layer</p>

      {/* ======================
          STATUS SECTION
      ====================== */}
      <h3>Status</h3>
      <p>Pipeline: {status?.pipeline}</p>
      <p>Last Run: {status?.lastRun}</p>
      <p>ECS: {status?.ecs}</p>

      {/* ======================
          SCORES TABLE
      ====================== */}
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

      {/* ======================
          FORECAST SECTION
      ====================== */}
      <h3 style={{ marginTop: "20px", color: "darkred" }}>
        Forecast
      </h3>

      <p>{forecast?.message}</p>

      <h4 style={{ color: "red" }}>
        {forecast?.prediction}
      </h4>
    </div>
  );
}

export default App;
