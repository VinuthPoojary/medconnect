import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] New client connected: ${socket.id}`);

    // Join doctor room for queue updates
    socket.on('join:doctor', (doctorId) => {
      if (doctorId) {
        const room = `doctor:${doctorId}`;
        socket.join(room);
        console.log(`📡 Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Join patient room for personal appointment updates
    socket.on('join:patient', (userId) => {
      if (userId) {
        const room = `patient:${userId}`;
        socket.join(room);
        console.log(`📡 Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Join specific appointment room
    socket.on('join:appointment', (appointmentId) => {
      if (appointmentId) {
        const room = `appointment:${appointmentId}`;
        socket.join(room);
        console.log(`📡 Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Join specific OPD session room (doctorId + date + timeSlot)
    socket.on('join:session', ({ doctorId, date, timeSlot }) => {
      if (doctorId && date && timeSlot) {
        const room = `session:${doctorId}:${date}:${timeSlot}`;
        socket.join(room);
        console.log(`📡 Socket ${socket.id} joined session room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ [Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('⚠️ Socket.IO has not been initialized yet!');
  }
  return io;
};

/**
 * Emit queue update to all listeners (doctor, patients, hospital)
 */
export const emitQueueUpdate = (doctorId, payload) => {
  if (!io) return;
  
  // 1. Broadcast to doctor's room
  io.to(`doctor:${doctorId}`).emit('queue:updated', payload);

  // 2. Broadcast to specific patient if patientId provided
  if (payload.userId || payload.patientId) {
    io.to(`patient:${payload.userId || payload.patientId}`).emit('appointment:status_changed', payload);
  }

  // 3. Broadcast to general appointment room
  if (payload.appointmentId) {
    io.to(`appointment:${payload.appointmentId}`).emit('appointment:updated', payload);
  }

  // 4. Session specific room update
  if (payload.date && payload.timeSlot) {
    io.to(`session:${doctorId}:${payload.date}:${payload.timeSlot}`).emit('session_queue_updated', payload);
  }

  // 5. Global fallback event for public queue displays
  io.emit('global:queue_changed', payload);
  console.log(`📢 [Socket.IO Event Emitted] queue:updated for doctor ${doctorId}:`, payload.status || payload.action);
};
