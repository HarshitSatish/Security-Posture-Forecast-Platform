import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/mockDynamo.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.log("Error loading data:", err));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Security Posture Forecast Platform</h1>

      <p>
        Live dashboard showing security health scores, risk classification, and forecast output.
      </p>

      <h3>Scan Results (DynamoDB Simulation)</h3>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Application</th>
            <th>Score</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td>{item.appId}</td>
              <td>{item.score}</td>
              <td>{item.riskLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: "20px", color: "darkred" }}>
        Forecast: Risk trend analysis running (14-day projection)
      </h3>
    </div>
  );
}

export default App;
