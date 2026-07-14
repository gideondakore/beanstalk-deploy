const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 8080;

// Beanstalk injects these as environment variables (we set them via
// the environment's configuration, sourced from RDS connection details)
const pool = new Pool({
  host: process.env.RDS_HOSTNAME,
  port: process.env.RDS_PORT || 5432,
  database: process.env.RDS_DB_NAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

app.get("/", (req, res) => {
  res.send(
    `Deployment successful. Version: ${process.env.APP_VERSION || "dev"}`,
  );
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
