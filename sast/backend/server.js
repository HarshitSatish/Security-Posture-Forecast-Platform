const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "sast-scanner",
    status: "running"
  });
});

app.listen(3000, () => {
  console.log("SAST scanner running on port 3000");
});
