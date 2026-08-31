import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_DOCTORS, MOCK_HOSPITALS, MOCK_APPOINTMENTS, MOCK_REPORTS, MOCK_MEDICINES, MOCK_NOTIFICATIONS, INITIAL_PATIENT_PROFILE } from '../data/mockData';
import {
  checkBackendHealth,
  fetchDoctorsApi,
  fetchHospitalsApi,
  fetchAppointmentsApi,
  createAppointmentApi,
  cancelAppointmentApi,
  fetchReportsApi,
  createReportApi,
  deleteReportApi,
  fetchMedicinesApi,
  createMedicineApi,
  toggleMedicineApi,
  deleteMedicineApi,
  fetchNotificationsApi,
  markNotificationReadApi,
  createDoctorApi,
  deleteDoctorApi,
  approveHospitalApi,
  loginApi,
  loginDoctorApi,
  sendOtpApi,
  otpLoginApi,
  registerApi,
} from '../services/api';

export const DEMO_USERS = {
  patient: {
    id: 'user-patient-1',
    name: 'Kavya Poojary',
    email: 'patient@medconnect.com',
    phone: '+91 98450 12345',
    role: 'patient',
    abhaId: '91-4820-1928-4019',
    avatar: 'KP',
    token: 'jwt-token-patient-demo-8912',
    mfaEnabled: true,
    lastLogin: 'Today at 09:42 AM',
  },
  hospital: {
    id: 'user-hosp-1',
    name: 'KMC Health City Admin',
    email: 'hospital@medconnect.com',
    phone: '+91 82420 99887',
    role: 'hospital',
    hospitalName: 'KMC Health City, Mangaluru',
    avatar: 'KMC',
    token: 'jwt-token-hospital-demo-3341',
    mfaEnabled: true,
    lastLogin: 'Today at 08:15 AM',
  },
  doctor: {
    id: 'user-doc-1',
    name: 'Dr. Vignesh Shetty',
    email: 'doctor@medconnect.com',
    phone: '+91 94481 22334',
    role: 'doctor',
    specialization: 'Senior Cardiologist',
    hospitalName: 'KMC Health City',
    avatar: 'VS',
    token: 'jwt-token-doctor-demo-9921',
    mfaEnabled: true,
    lastLogin: 'Today at 10:30 AM',
  },
  admin: {
    id: 'user-admin-1',
    name: 'Karavali Health Admin',
    email: 'admin@medconnect.com',
    phone: '+91 82422 11000',
    role: 'admin',
    avatar: 'GA',
    token: 'jwt-token-admin-demo-7712',
    mfaEnabled: true,
    lastLogin: 'Today at 07:00 AM',
  },
};

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medconnect_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [role, setRoleState] = useState(() => {
    return currentUser ? currentUser.role : 'guest';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!currentUser;
  });

  const [dbConnected, setDbConnected] = useState(false);
  const [activeView, setActiveView] = useState(() => currentUser ? (currentUser.role === 'patient' ? 'dashboard' : currentUser.role === 'hospital' ? 'hospital-overview' : currentUser.role === 'admin' ? 'admin-overview' : 'hospital-appointments') : 'landing');
  const [doctors, setDoctors] = useState(MOCK_DOCTORS);
  const [hospitals, setHospitals] = useState(MOCK_HOSPITALS);
  
  // Isolate user personal data: database is the single source of truth
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState(() => currentUser?.id === 'user-patient-1' ? MOCK_REPORTS : []);
  const [medicines, setMedicines] = useState(() => currentUser?.id === 'user-patient-1' ? MOCK_MEDICINES : []);
  const [notifications, setNotifications] = useState(() => currentUser?.id === 'user-patient-1' ? MOCK_NOTIFICATIONS : []);
  const [patientProfile, setPatientProfile] = useState(INITIAL_PATIENT_PROFILE);
  const [selectedDoctor, setSelectedDoctor] = useState(MOCK_DOCTORS[0]);
  const [selectedHospital, setSelectedHospital] = useState(MOCK_HOSPITALS[0]);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [telehealthAppointment, setTelehealthAppointment] = useState(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const requestSignOut = () => {
    setIsSignOutModalOpen(true);
  };

  // Synchronize patientProfile & localStorage with logged in currentUser
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('medconnect_auth_user', JSON.stringify(currentUser));
      if (currentUser.token) {
        localStorage.setItem('medconnect_token', currentUser.token);
      }
      setPatientProfile(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        abhaId: currentUser.abha_id || currentUser.abhaId || prev.abhaId || '91-4820-1928-4019',
      }));
    } else {
      localStorage.removeItem('medconnect_auth_user');
      localStorage.removeItem('medconnect_token');
      localStorage.removeItem('medconnect_user');
      setAppointments([]);
      setReports([]);
      setMedicines([]);
      setNotifications([]);
    }
  }, [currentUser]);

  // Fetch live user-isolated data whenever currentUser changes or on initial app load
  useEffect(() => {
    // Fetch shared catalog
    fetchDoctorsApi().then(docs => docs && docs.length && setDoctors(docs)).catch(() => {});
    fetchHospitalsApi().then(hosps => hosps && hosps.length && setHospitals(hosps)).catch(() => {});
    
    // Check backend health
    checkBackendHealth().then(status => {
      setDbConnected(status.dbConnected);
    }).catch(() => {});

    // Fetch strictly user-isolated data directly from database
    if (currentUser?.id) {
      fetchAppointmentsApi(currentUser.id).then(apts => {
        if (Array.isArray(apts)) setAppointments(apts);
      }).catch(err => console.error('Failed to load appointments for user:', err));
      
      fetchReportsApi(currentUser.id).then(reps => {
        if (Array.isArray(reps)) setReports(reps);
      }).catch(() => {});
      
      fetchMedicinesApi(currentUser.id).then(meds => {
        if (Array.isArray(meds)) setMedicines(meds);
      }).catch(() => {});
      
      fetchNotificationsApi(currentUser.id).then(notifs => {
        if (Array.isArray(notifs)) setNotifications(notifs);
      }).catch(() => {});
    } else {
      setAppointments([]);
      setReports([]);
      setMedicines([]);
      setNotifications([]);
    }
  }, [currentUser?.id]);

  const setRole = (newRole) => {
    setRoleState(newRole);
    if (newRole === 'patient') {
      setActiveView('dashboard');
    } else if (newRole === 'hospital') {
      setActiveView('hospital-overview');
    } else if (newRole === 'admin') {
      setActiveView('admin-overview');
    } else if (newRole === 'doctor') {
      setActiveView('doctor-overview');
    } else {
      setActiveView('landing');
    }
  };

  const login = async (phoneOrEmailInput, passInput, roleInput) => {
    try {
      let res;
      if (roleInput === 'doctor') {
        res = await loginDoctorApi(phoneOrEmailInput, passInput);
      } else {
        res = await loginApi(phoneOrEmailInput, passInput, roleInput);
      }

      if (res && res.success && res.user) {
        const authenticatedUser = res.user;
        setCurrentUser(authenticatedUser);
        setIsAuthenticated(true);
        setRoleState(authenticatedUser.role);
        setRole(authenticatedUser.role);

        try {
          localStorage.setItem('medconnect_auth_user', JSON.stringify(authenticatedUser));
          if (authenticatedUser.token) {
            localStorage.setItem('medconnect_token', authenticatedUser.token);
          }
        } catch (e) {}

        // Fetch real database appointments immediately upon login
        try {
          const userApts = await fetchAppointmentsApi(authenticatedUser.id);
          if (Array.isArray(userApts)) {
            setAppointments(userApts);
          }
        } catch (aptErr) {
          console.warn('Initial appointment fetch warning:', aptErr.message);
        }

        const loginNotif = {
          id: `notif-${Date.now()}`,
          title: 'Sign In Successful',
          message: `Signed in as ${authenticatedUser.name} (${authenticatedUser.role.toUpperCase()}).`,
          category: 'appointment',
          timestamp: 'Just now',
          read: false,
        };
        setNotifications(prev => [loginNotif, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      throw err;
    }
  };

  const requestOtp = async (phone) => {
    if (dbConnected) {
      try {
        const res = await sendOtpApi(phone);
        return res;
      } catch (err) {
        console.warn('Backend send OTP error:', err.message);
      }
    }
    return { success: true, message: `SMS OTP sent to ${phone}`, otp: '4829' };
  };

  const loginWithOtp = async (phone, otp, roleInput) => {
    const cleanDigits = phone.replace(/[^0-9]/g, '');

    if (dbConnected) {
      try {
        const res = await otpLoginApi(phone, otp, roleInput);
        if (res && res.success && res.user) {
          setCurrentUser(res.user);
          setIsAuthenticated(true);
          setRoleState(res.user.role);
          setRole(res.user.role);
          const loginNotif = {
            id: `notif-${Date.now()}`,
            title: 'Mobile OTP Authentication Successful',
            message: `Signed in as ${res.user.name} (${res.user.role.toUpperCase()}) via Mobile OTP.`,
            category: 'appointment',
            timestamp: 'Just now',
            read: false,
          };
          setNotifications(prev => [loginNotif, ...prev]);
          return true;
        }
      } catch (err) {
        console.warn('Backend OTP login fallback to demo presets:', err.message);
      }
    }

    // Match preset demo user by phone number
    const preset = Object.values(DEMO_USERS).find(u => {
      const uDigits = u.phone.replace(/[^0-9]/g, '');
      return uDigits === cleanDigits || (cleanDigits.length >= 7 && uDigits.endsWith(cleanDigits.slice(-7)));
    });

    if (preset) {
      setCurrentUser(preset);
      setIsAuthenticated(true);
      setRoleState(preset.role);
      setRole(preset.role);
      const notif = {
        id: `notif-${Date.now()}`,
        title: 'Mobile OTP Sign In Successful',
        message: `Signed in as ${preset.name} (${preset.role.toUpperCase()}).`,
        category: 'appointment',
        timestamp: 'Just now',
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);
      return true;
    }

    // Generic mobile user login fallback
    const mobileUser = {
      id: `user-mob-${Date.now()}`,
      name: `Mobile User (${phone})`,
      email: `${cleanDigits || 'user'}@mobile.med`,
      phone: phone,
      role: roleInput || 'patient',
      abhaId: `91-${Math.floor(Math.random() * 8999 + 1000)}-${Math.floor(Math.random() * 8999 + 1000)}`,
      avatar: 'MU',
      token: `jwt-token-otp-${Date.now()}`,
      mfaEnabled: true,
      lastLogin: 'Just now',
    };

    setCurrentUser(mobileUser);
    setIsAuthenticated(true);
    setRoleState(mobileUser.role);
    setRole(mobileUser.role);
    return true;
  };

  const loginWithAbha = (abhaId, pin, roleInput) => {
    const user = {
      ...DEMO_USERS.patient,
      abhaId,
      name: 'Kavya Poojary (ABDM Verified)',
    };
    setCurrentUser(user);
    setIsAuthenticated(true);
    setRoleState('patient');
    setActiveView('dashboard');

    const notif = {
      id: `notif-${Date.now()}`,
      title: 'ABHA Health Identity Verified',
      message: `Linked ABHA Number: ${abhaId}. Health locker synced successfully.`,
      category: 'appointment',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
    return true;
  };

  const quickDemoLogin = async (userRole) => {
    let email = 'patient@medconnect.com';
    let password = 'Patient@2026';
    if (userRole === 'doctor') {
      email = 'doctor@medconnect.com';
      password = 'Doctor@2026';
    } else if (userRole === 'hospital') {
      email = 'hospital@medconnect.com';
      password = 'Hospital@2026';
    } else if (userRole === 'admin') {
      email = 'admin@medconnect.com';
      password = 'Admin@2026';
    }
    try {
      await login(email, password, userRole);
    } catch (e) {
      const preset = DEMO_USERS[userRole] || DEMO_USERS.patient;
      setCurrentUser(preset);
      setIsAuthenticated(true);
      setRole(preset.role);
    }
  };

  const registerUser = async (name, email, phone, abhaId, password, otp, roleInput = 'patient') => {
    try {
      const res = await registerApi({
        name,
        email,
        phone,
        password: password || 'MedConnect@2026',
        role: roleInput,
        abhaId,
        otp,
      });

      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        const assignedRole = res.user.role || roleInput;
        setRoleState(assignedRole);
        setRole(assignedRole);
        try {
          localStorage.setItem('medconnect_auth_user', JSON.stringify(res.user));
          if (res.user.token) {
            localStorage.setItem('medconnect_token', res.user.token);
          }
        } catch (e) {}
        return res.user;
      }
    } catch (err) {
      throw err;
    }
  };


  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setRoleState('guest');
    setActiveView('login');
    localStorage.removeItem('medconnect_auth_user');
    localStorage.removeItem('medconnect_token');
    localStorage.removeItem('medconnect_user');
    setAppointments([]);
    setReports([]);
    setMedicines([]);
    setNotifications([]);
  };

  const bookAppointment = async (doctorId, date, timeSlot, type) => {
    const targetDocId = typeof doctorId === 'object' ? doctorId?.id : doctorId;
    const doc = (doctors || []).find(d => d.id === targetDocId || d.name === targetDocId) || (typeof doctorId === 'object' ? doctorId : null) || selectedDoctor;
    if (!doc) throw new Error('Selected doctor not found.');

    const currentUserId = currentUser?.id || 'user-patient-1';
    const currentPatientName = currentUser?.name || patientProfile.name || 'Patient';

    const aptData = {
      userId: currentUserId,
      doctorId: doc.id,
      doctorName: doc.name,
      doctorPhoto: doc.photo,
      specialization: doc.specialization,
      hospitalName: doc.hospitalName || doc.hospital_name || 'KMC Hospital',
      date,
      timeSlot,
      type,
      patientName: currentPatientName,
    };

    // Always persist to database via API
    const res = await createAppointmentApi(aptData);
    const savedApt = res?.appointment || res;

    // Immediately reload verified appointments from database
    try {
      const freshApts = await fetchAppointmentsApi(currentUserId);
      if (Array.isArray(freshApts) && freshApts.length > 0) {
        setAppointments(freshApts);
      } else if (savedApt) {
        setAppointments(prev => [savedApt, ...prev.filter(a => a.id !== savedApt.id)]);
      }
    } catch (fetchErr) {
      if (savedApt) {
        setAppointments(prev => [savedApt, ...prev.filter(a => a.id !== savedApt.id)]);
      }
    }

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Appointment Booked!',
      message: `Your ${type === 'online' ? 'Online Video' : 'In-Person'} consultation with ${doc.name} on ${date} at ${timeSlot} has been confirmed. Token: #${savedApt?.queueNumber || 1}`,
      category: 'appointment',
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    return savedApt;
  };

  const cancelAppointment = async (id) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    try {
      if (dbConnected) {
        await cancelAppointmentApi(id);
      }
    } catch (e) {
      console.error('Failed to cancel appointment in database:', e);
    }
  };

  const toggleMedicine = async (id) => {
    try {
      if (dbConnected) {
        const updated = await toggleMedicineApi(id);
        setMedicines(prev => prev.map(m => m.id === id ? updated : m));
      } else {
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
      }
    } catch (e) {
      setMedicines(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    }
  };

  const markNotificationRead = async (id) => {
    try {
      if (dbConnected) {
        await markNotificationReadApi(id);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const addReport = async (report) => {
    try {
      if (dbConnected) {
        const saved = await createReportApi({ ...report, userId: currentUser?.id || 'user-patient-1' });
        setReports(prev => [saved, ...prev]);
      } else {
        setReports(prev => [report, ...prev]);
      }
    } catch (e) {
      setReports(prev => [report, ...prev]);
    }
  };

  const removeReport = async (id) => {
    try {
      if (dbConnected) {
        await deleteReportApi(id);
      }
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const approveHospital = async (id) => {
    try {
      if (dbConnected) {
        await approveHospitalApi(id);
      }
      setHospitals(prev => prev.map(h => h.id === id ? { ...h, approved: true } : h));
    } catch (e) {
      setHospitals(prev => prev.map(h => h.id === id ? { ...h, approved: true } : h));
    }
  };

  const rejectHospital = (id) => {
    setHospitals(hospitals.filter(h => h.id !== id));
  };

  const addDoctor = async (doctor) => {
    try {
      if (dbConnected) {
        const saved = await createDoctorApi(doctor);
        setDoctors(prev => [saved, ...prev]);
      } else {
        setDoctors(prev => [doctor, ...prev]);
      }
    } catch (e) {
      setDoctors(prev => [doctor, ...prev]);
    }
  };

  const deleteDoctor = async (id) => {
    try {
      if (dbConnected) {
        await deleteDoctorApi(id);
      }
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setDoctors(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeView,
        setActiveView,
        currentUser,
        isAuthenticated,
        dbConnected,
        login,
        loginWithOtp,
        requestOtp,
        loginWithAbha,
        quickDemoLogin,
        logout,
        registerUser,
        doctors,
        hospitals,
        appointments,
        reports,
        medicines,
        notifications,
        patientProfile,
        selectedDoctor,
        setSelectedDoctor,
        selectedHospital,
        setSelectedHospital,
        bookingDoctor,
        setBookingDoctor,
        telehealthAppointment,
        setTelehealthAppointment,
        isEmergencyModalOpen,
        setIsEmergencyModalOpen,
        isSignOutModalOpen,
        setIsSignOutModalOpen,
        requestSignOut,
        bookAppointment,
        cancelAppointment,
        toggleMedicine,
        markNotificationRead,
        addReport,
        removeReport,
        approveHospital,
        rejectHospital,
        addDoctor,
        deleteDoctor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
