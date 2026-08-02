const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Check if Express + PostgreSQL Backend Server is online
 */
export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (!res.ok) return { isOnline: false, dbConnected: false };
    const data = await res.json();
    return {
      isOnline: true,
      dbConnected: data.database?.connected || false,
      message: data.message,
    };
  } catch (error) {
    return { isOnline: false, dbConnected: false };
  }
};

/**
 * Real Backend Auth Calls
 */
export const loginApi = async (email, password, role) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Authentication failed');
  return data;
};

export const registerApi = async (userData) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
};

/**
 * Real Backend Doctors & Hospitals
 */
export const fetchDoctorsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctors`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctors');
  return data.doctors;
};

export const createDoctorApi = async (doctorData) => {
  const res = await fetch(`${API_BASE_URL}/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doctorData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create doctor');
  return data.doctor;
};

export const deleteDoctorApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/doctors/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete doctor');
  return data;
};

export const fetchHospitalsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/hospitals`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch hospitals');
  return data.hospitals;
};

export const approveHospitalApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/hospitals/${id}/approve`, { method: 'PATCH' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve hospital');
  return data;
};

/**
 * Hospital Schemes & RAG Knowledge Base API Calls
 */
export const fetchHospitalSchemesApi = async (hospitalName) => {
  const url = hospitalName ? `${API_BASE_URL}/schemes?hospitalName=${encodeURIComponent(hospitalName)}` : `${API_BASE_URL}/schemes`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch hospital schemes');
  return data.schemes || [];
};

export const createHospitalSchemeApi = async (schemeData) => {
  const res = await fetch(`${API_BASE_URL}/schemes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schemeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create scheme policy');
  return data.scheme;
};

export const deleteHospitalSchemeApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/schemes/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete scheme policy');
  return data;
};

export const askHospitalRagApi = async (hospitalName, query) => {
  const res = await fetch(`${API_BASE_URL}/ai/hospital-rag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospitalName, query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Hospital RAG inquiry failed');
  return data.ragResponse;
};

/**
 * Real Backend Appointments (Filtered by User ID & Real Queue Status)
 */
export const fetchAppointmentsApi = async (userId) => {
  const url = userId ? `${API_BASE_URL}/appointments?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/appointments`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch appointments');
  return data.appointments || [];
};

export const createAppointmentApi = async (appointmentData) => {
  const res = await fetch(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to book appointment');
  return data.appointment;
};

export const cancelAppointmentApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, { method: 'PATCH' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to cancel appointment');
  return data;
};

export const fetchQueueStatusApi = async (doctorId, doctorName) => {
  const url = `${API_BASE_URL}/appointments/queue-status?doctorId=${encodeURIComponent(doctorId || '')}&doctorName=${encodeURIComponent(doctorName || '')}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch queue status');
  return data.queueStatus;
};

/**
 * Real Backend Medical Reports (Filtered by User ID)
 */
export const fetchReportsApi = async (userId) => {
  const url = userId ? `${API_BASE_URL}/reports?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/reports`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch reports');
  return data.reports || [];
};

export const createReportApi = async (reportData) => {
  const res = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create report');
  return data.report;
};

export const deleteReportApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/reports/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete report');
  return data;
};

/**
 * Real Backend Medicines (Filtered by User ID)
 */
export const fetchMedicinesApi = async (userId) => {
  const url = userId ? `${API_BASE_URL}/medicines?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/medicines`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch medicines');
  return data.medicines || [];
};

export const createMedicineApi = async (medicineData) => {
  const res = await fetch(`${API_BASE_URL}/medicines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medicineData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create medicine');
  return data.medicine;
};

export const toggleMedicineApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/medicines/${id}/toggle`, { method: 'PATCH' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to toggle medicine');
  return data.medicine;
};

export const deleteMedicineApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/medicines/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete medicine');
  return data;
};

/**
 * Real Backend Notifications (Filtered by User ID)
 */
export const fetchNotificationsApi = async (userId) => {
  const url = userId ? `${API_BASE_URL}/notifications?userId=${encodeURIComponent(userId)}` : `${API_BASE_URL}/notifications`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return data.notifications || [];
};

export const markNotificationReadApi = async (id) => {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark notification read');
  return data;
};

/**
 * Real Backend AI Triage & Gemini Chat
 */
export const checkSymptomsApi = async (symptoms, duration, severity) => {
  const res = await fetch(`${API_BASE_URL}/ai/symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms, duration, severity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'AI Triage service failed');
  return data.triageResult;
};

export const chatWithAiApi = async (message, chatHistory = []) => {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, chatHistory }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'AI Chat failed');
  return data.response;
};

/**
 * Real Backend Analytics
 */
export const fetchHospitalAnalyticsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/analytics/hospital`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch analytics');
  return data.analytics;
};

export const fetchAdminAnalyticsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/analytics/admin`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch admin analytics');
  return data.analytics;
};
