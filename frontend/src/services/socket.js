import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('🔌 [Socket.IO Client] Connected to real-time server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ [Socket.IO Client] Disconnected from server');
});

export const joinDoctorQueueRoom = (doctorId) => {
  if (doctorId) {
    socket.emit('join:doctor', doctorId);
  }
};

export const joinPatientRoom = (userId) => {
  if (userId) {
    socket.emit('join:patient', userId);
  }
};

export const joinAppointmentRoom = (appointmentId) => {
  if (appointmentId) {
    socket.emit('join:appointment', appointmentId);
  }
};

export const joinHospitalRoom = (hospitalId) => {
  if (hospitalId) {
    socket.emit('join:hospital', hospitalId);
  }
};

export const leaveHospitalRoom = (hospitalId) => {
  if (hospitalId) {
    socket.emit('leave:hospital', hospitalId);
  }
};

export const onHospitalDocumentUpdated = (callback) => {
  const handler = (data) => callback(data);
  socket.on('hospital:document_updated', handler);
  return () => {
    socket.off('hospital:document_updated', handler);
  };
};
