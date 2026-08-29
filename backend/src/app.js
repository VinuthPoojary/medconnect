import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import authDoctorRoutes from './routes/authDoctor.js';
import doctorRoutes from './routes/doctors.js';
import hospitalRoutes from './routes/hospitals.js';
import appointmentRoutes from './routes/appointments.js';
import reportRoutes from './routes/reports.js';
import medicineRoutes from './routes/medicines.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import schemeRoutes from './routes/schemes.js';
import doctorDashboardRoutes from './routes/doctor.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth/doctor', authDoctorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctor', doctorDashboardRoutes);

app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schemes', schemeRoutes);



app.get('/', (req, res) => {
  res.json({
    app: 'MedConnect Karavali REST API Server',
    version: '1.0.0',
    status: 'Operational',
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/doctors',
      '/api/hospitals',
      '/api/appointments',
      '/api/reports',
      '/api/medicines',
      '/api/notifications',
      '/api/schemes',
      '/api/ai/symptoms',
      '/api/ai/hospital-rag',
      '/api/analytics/hospital',
      '/api/analytics/admin',
    ],
  });
});

export default app;
