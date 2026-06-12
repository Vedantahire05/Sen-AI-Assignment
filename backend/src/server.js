require("dotenv").config();

const http = require("http");
const { Server: SocketServer } = require("socket.io");
const app = require("./app");
const connectDB = require("./db/client");

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

// ── WebSocket setup ───────────────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Make io accessible to route handlers via app
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`WS client connected: ${socket.id}`);

  socket.on("subscribe", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(`WS client disconnected: ${socket.id}`);
  });
});

connectDB();

httpServer.listen(PORT, () => {
  console.log(`SenAI CRM server running on port ${PORT}`);
  console.log(`WebSocket enabled on ws://localhost:${PORT}`);
});
