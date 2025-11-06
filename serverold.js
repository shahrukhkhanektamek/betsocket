// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: "http://localhost",
  methods: ["GET", "POST"]
}));

const io = new Server(server, {
  cors: {
    origin: "http://localhost",
    methods: ["GET", "POST"]
  }
});

app.use(express.static("public"));

// Store current wheel state per socket
let wheelState = {};

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // Start wheel → only notify spinning
  socket.on("startWheel", () => {
    console.log("🎡 Wheel started");
    wheelState[socket.id] = { spinning: true, stopNumber: null };
    io.emit("statusUpdate", "Wheel started...");
  });

  // Manual stop → send final number
  socket.on("manualStop", ({ stopNumber }) => {
    console.log("🛑 Manual stop received → Stop at:", stopNumber);
    wheelState[socket.id].spinning = false;
    wheelState[socket.id].stopNumber = stopNumber;

    io.emit("statusUpdate", "Wheel stopped at " + stopNumber);
    io.emit("finalNumber", stopNumber);
  });

  // Optional: you can emit fake rotation for smooth animation
  let spinInterval = setInterval(() => {
    if (wheelState[socket.id] && wheelState[socket.id].spinning) {
      // simulate rotation angle continuously
      let angle = (wheelState[socket.id].angle || 0) + 0.3;
      wheelState[socket.id].angle = angle;
      io.emit("rotate", { angle });
    }
  }, 30);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    clearInterval(spinInterval);
    delete wheelState[socket.id];
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
