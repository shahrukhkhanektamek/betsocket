// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);

// 🟢 Create WebSocket Server
const wss = new WebSocket.Server({ server });

// 🌀 Store wheel states (per connection)
let wheelState = new Map();

wss.on("connection", (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log("✅ Client connected:", clientIP);

  // Initialize this client's wheel state
  wheelState.set(ws, { spinning: false, stopNumber: null, angle: 0 });

  // 🔹 Send a welcome message
  ws.send(JSON.stringify({ msg: "Connected to Node WebSocket server ✅" }));

  // 🔹 Handle incoming messages
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("📩 Received:", data);

      // 🧩 Handle startWheel
      if (data.action === "startWheel") {
        const state = wheelState.get(ws) || {};
        state.spinning = true;
        state.stopNumber = null;
        wheelState.set(ws, state);

        broadcast({ status: 1 });
      }

      // 🧩 Handle manualStop
      if (data.action === "manualStop" && data.stopNumber != null) {
        const state = wheelState.get(ws) || {};
        state.spinning = false;
        state.stopNumber = data.stopNumber;
        wheelState.set(ws, state);

        broadcast({ status: 2,number: data.stopNumber});
        // broadcast({ finalNumber: data.stopNumber });
      }

    } catch (err) {
      console.error("❌ Invalid JSON:", message.toString());
    }
  });

  // 🔹 Fake rotation (just for animation)
  const spinInterval = setInterval(() => {
    const state = wheelState.get(ws);
    if (state && state.spinning) {
      state.angle = (state.angle || 0) + 0.3;
      wheelState.set(ws, state);
      broadcast({ rotate: { angle: state.angle } });
    }
  }, 30);

  ws.on("close", () => {
    console.log("❌ Client disconnected:", clientIP);
    clearInterval(spinInterval);
    wheelState.delete(ws);
  });
});

// 🔹 Broadcast message to all clients
function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// 🟢 Start the HTTP + WebSocket server
const PORT = 3006;
server.listen(PORT, () => {
  console.log(`🚀 Server running at ws://localhost:${PORT}`);
});
