import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initSocket } from './socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping Express app for WebSockets
const server = http.createServer(app);

// Initialize Socket.IO server
initSocket(server);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` 🏥 MedConnect Karavali Express & Socket.IO Server`);
  console.log(` 🚀 Listening on http://localhost:${PORT}`);
  console.log(` 🔌 WebSockets Active on ws://localhost:${PORT}`);
  console.log(` 🐘 PostgreSQL DB URL: ${process.env.DATABASE_URL || 'Localhost Default'}`);
  console.log(`====================================================`);
});
