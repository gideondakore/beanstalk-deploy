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

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, specialization FROM users ORDER BY id",
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.get("/hello", async (req, res) => {
  try {
    res.status(200).json({ message: "Hello, World!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL
    )
  `);

  const { rows } = await pool.query(
    "SELECT id FROM users WHERE name = $1 AND specialization = $2",
    ["Gideon Dakore", "Backend"],
  );

  if (rows.length === 0) {
    await pool.query(
      "INSERT INTO users (name, specialization) VALUES ($1, $2)",
      ["Gideon Dakore", "Backend"],
    );
  }
}

async function start() {
  await initDb();
  app.listen(port, () => {
    console.log(`App running on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start app:", err);
  process.exit(1);
});
