require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

// 1. MySQL Connection (Optimized for TiDB Cloud)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 4000, // Explicitly parsed as integer
  ssl: {
    minVersion: "TLSv1.2", // Required for TiDB Cloud security
    rejectUnauthorized: true,
  },
});

db.connect((err) => {
  if (err) {
    console.error("Cloud Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to TiDB Cloud Database.");
});

// 2. PUBLIC ROUTES (Contact, Signup, Login)

app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;
  const sql =
    "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";
  db.query(sql, [name, email, message], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json({ message: "Success" });
  });
});

app.post("/api/signup", async (req, res) => {
  const { full_name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [full_name, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ error: "Email already exists" });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "User created successfully!" });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    res
      .status(200)
      .json({ message: "Login successful", full_name: user.full_name });
  });
});

// 3. ADMIN ROUTES

app.get("/api/admin/users", (req, res) => {
  db.query(
    "SELECT id, full_name, email, created_at FROM users",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.get("/api/admin/messages", (req, res) => {
  db.query(
    "SELECT * FROM contact_messages ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

app.delete("/api/admin/users/:id", (req, res) => {
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.status(200).json({ message: "Deleted" });
  });
});

app.put("/api/admin/messages/:id/resolve", (req, res) => {
  const sql = "UPDATE contact_messages SET status = 'resolved' WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Update failed" });
    res.status(200).json({ message: "Status updated" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
