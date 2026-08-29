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
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone: email, loginIdentifier: email, password, role }),
    });

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');
      return data;
    }
    throw new Error('Authentication service returned invalid response.');
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error('Network connection error.');
    }
    throw err;
  }
};

export const loginDoctorApi = async (identifier, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: identifier, loginIdentifier: identifier, password }),
    });

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Doctor authentication failed');
      return data;
    }
    throw new Error('Doctor authentication service returned invalid response.');
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error('Network connection error.');
    }
    throw err;
  }
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



export const sendOtpApi = async (phone) => {
  const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
  return data;
};

export const otpLoginApi = async (phone, otp, role) => {
  const res = await fetch(`${API_BASE_URL}/auth/otp-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'OTP verification failed');
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
  const res = await fetch(url, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch appointments');
  return data.appointments || [];
};

export const createAppointmentApi = async (appointmentData) => {
  const res = await fetch(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
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

export const fetchQueueStatusApi = async (doctorId, doctorName, date = '', timeSlot = '', appointmentId = '') => {
  const params = new URLSearchParams();
  if (doctorId) params.append('doctorId', doctorId);
  if (doctorName) params.append('doctorName', doctorName);
  if (date) params.append('date', date);
  if (timeSlot) params.append('timeSlot', timeSlot);
  if (appointmentId) params.append('appointmentId', appointmentId);

  const url = `${API_BASE_URL}/appointments/queue-status?${params.toString()}`;
  const res = await fetch(url, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch queue status');
  return data;
};

export const updateQueueStatusApi = async (appointmentId, status, notes = '') => {
  const res = await fetch(`${API_BASE_URL}/doctor/update-queue-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ appointmentId, status, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update queue status');
  return data;
};

export const addDoctorByHospitalApi = async (doctorData) => {
  const res = await fetch(`${API_BASE_URL}/doctor/hospital/add-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(doctorData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add doctor account');
  return data;
};

export const fetchSlotCountsApi = async (doctorId, doctorName, date) => {
  const url = `${API_BASE_URL}/appointments/slot-counts?doctorId=${encodeURIComponent(doctorId || '')}&doctorName=${encodeURIComponent(doctorName || '')}&date=${encodeURIComponent(date || '')}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch slot counts');
  return data;
};

export const fetchLiveQueueApi = async (doctorId, doctorName, date) => {
  const url = `${API_BASE_URL}/appointments/live-queue?doctorId=${encodeURIComponent(doctorId || '')}&doctorName=${encodeURIComponent(doctorName || '')}&date=${encodeURIComponent(date || '')}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch live queue');
  return data.queue || [];
};


/**
 * Real Backend Medical Reports Pipeline
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

export const analyzeReportApi = async (formDataOrFile) => {
  let body;
  let headers = {};

  if (formDataOrFile instanceof FormData) {
    body = formDataOrFile;
  } else if (formDataOrFile instanceof File) {
    const fd = new FormData();
    fd.append('file', formDataOrFile);
    body = fd;
  } else {
    body = JSON.stringify(formDataOrFile);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}/reports/analyze`, {
    method: 'POST',
    headers,
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Report analysis pipeline failed');
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

/**
 * Real Backend Doctor Dashboard APIs (JWT Isolated)
 */
const getAuthHeader = () => {
  try {
    const rawToken = localStorage.getItem('medconnect_token');
    if (rawToken) return { 'Authorization': `Bearer ${rawToken}` };

    const authUserStr = localStorage.getItem('medconnect_auth_user') || localStorage.getItem('medconnect_user');
    if (authUserStr) {
      const user = JSON.parse(authUserStr);
      if (user.token) return { 'Authorization': `Bearer ${user.token}` };
    }
  } catch (e) {}
  return {};
};

export const createDoctorByHospitalApi = async (docData) => {
  const res = await fetch(`${API_BASE_URL}/doctor/hospital/add-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(docData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create doctor account');
  return data.doctor;
};

export const fetchDoctorMeApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/me`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to authenticate doctor profile');
  return data;
};

export const fetchDoctorAppointmentsTodayApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/appointments/today`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch today doctor appointments');
  return data.appointments || [];
};

export const fetchDoctorOverviewApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/overview`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor overview');
  return data.stats;
};

export const fetchDoctorAppointmentsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/appointments`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor appointments');
  return data.appointments || [];
};

export const fetchDoctorPatientsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/patients`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor patients');
  return data.patients || [];
};

export const fetchDoctorReportsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/reports`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor reports');
  return data.reports || [];
};

export const fetchDoctorPrescriptionsApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/prescriptions`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor prescriptions');
  return data.prescriptions || [];
};

export const createDoctorPrescriptionApi = async (rxData) => {
  const res = await fetch(`${API_BASE_URL}/doctor/prescriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(rxData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create prescription');
  return data.prescription;
};

export const fetchDoctorProfileApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/profile`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor profile');
  return data.profile;
};

export const fetchDoctorQueueDashboardApi = async () => {
  const res = await fetch(`${API_BASE_URL}/doctor/queue-dashboard`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch doctor queue dashboard');
  return data;
};

export const updateAppointmentStatusApi = async (id, status) => {
  const res = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update appointment status');
  return data;
};


