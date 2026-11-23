require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const { protect, authorize } = require("./middleware/authMiddleware");
const User = require("./models/User");
const configureChat = require("./socket/chatSocket");

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.CLIENT_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin === "*" ? true : allowedOrigin }));
app.use(express.json({ limit: "10kb" }));

const io = new Server(server, {
  cors: { origin: allowedOrigin === "*" ? true : allowedOrigin }
});

configureChat(io);

app.get("/", (req, res) => {
  res.json({ message: "Secure Connect API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// Demonstration of role-based access control.
// To promote a user for testing, update their role to "admin" in MongoDB.
app.get("/api/admin/users", protect, authorize("admin"), async (req, res) => {
  const users = await User.find().select("name email role createdAt");
  res.json({ count: users.length, users });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("Socket.IO chat is ready");
    });
  })
  .catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });
