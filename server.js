const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Alert Chat Socket Server is running!");
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Join room based on user/session ID
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // 2. Initial Alert Message (Top Persistent Banner trigger)
  socket.on("send_alert", (data) => {
    // data = { roomId, senderName, message, timestamp }
    socket.to(data.roomId).emit("receive_alert", data);
  });

  // 3. Live 2-Way Chat Stream
  socket.on("send_message", (data) => {
    // data = { roomId, senderId, text, timestamp }
    socket.to(data.roomId).emit("receive_message", data);
  });

  // 4. Quick Response: "Can't Attend Right Now"
  socket.on("cant_attend", (data) => {
    socket.to(data.roomId).emit("peer_busy", {
      reason: "User is busy and cannot attend right now."
    });
  });

  // 5. Dual-Consent Save Protocol
  socket.on("request_save", (data) => {
    // Sender wants to save; ask receiver
    socket.to(data.roomId).emit("ask_save_consent", data);
  });

  socket.on("save_consent_response", (data) => {
    // data = { roomId, agreed: true/false }
    io.in(data.roomId).emit("final_save_decision", data);
  });

  socket.on("appeal_save_important", (data) => {
    // Second & final appeal: "Is it critical to save?"
    socket.to(data.roomId).emit("ask_save_appeal", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
              
