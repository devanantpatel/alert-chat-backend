const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.get('/', (req, res) => {
  res.send('Alert Chat Server is Online');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Jab user room join kare apne naam ke sath
  socket.on('join_room', ({ roomId, userName }) => {
    socket.join(roomId);
    socket.data.userName = userName;
    socket.data.roomId = roomId;

    // Room me maujood doosre user ko batao ki ye connect ho gaya
    socket.to(roomId).emit('peer_connected', {
      peerName: userName,
      message: `${userName} is now connected!`
    });

    console.log(`${userName} joined room ${roomId}`);
  });

  // Alert forward karna
  socket.on('send_alert', (data) => {
    socket.to(data.roomId).emit('receive_alert', data);
  });

  // Chat message forward karna
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });

  // User disconnect hone par
  socket.on('disconnect', () => {
    if (socket.data.roomId && socket.data.userName) {
      socket.to(socket.data.roomId).emit('peer_disconnected', {
        peerName: socket.data.userName
      });
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
