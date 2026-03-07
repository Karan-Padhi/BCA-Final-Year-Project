require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
app.use(express.json());

// 1. SIMPLIFIED CORS (Allows your frontend to talk to the backend)
app.use(cors());

// 2. SERVE STATIC FILES (Fixed the typo here from __curdir to __dirname)
app.use(express.static(path.join(__dirname, "public")));

// 3. DATABASE CONNECTION POOL
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 4000,
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 4. API ROUTES

// Contact Form Route
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;
  const sql =
    "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";
  db.query(sql, [name, email, message], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json({ message: "Success" });
  });
});

// User Signup Route
app.post("/api/signup", async (req, res) => {
  const { full_name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [full_name, email, hashedPassword], (err, results) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ error: "Email exists" });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "User created!" });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// User Login Route
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (results.length === 0)
      return res.status(400).json({ error: "Not found" });
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    res.status(200).json({ message: "Welcome", full_name: user.full_name });
  });
});

// Admin: Get Users
app.get("/api/admin/users", (req, res) => {
  db.query(
    "SELECT id, full_name, email, created_at FROM users",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

// Admin: Get Messages
app.get("/api/admin/messages", (req, res) => {
  db.query(
    "SELECT * FROM contact_messages ORDER BY created_at DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
});

// 5. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
