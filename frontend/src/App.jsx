import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';
import { EmergencyModal } from './components/ui/EmergencyModal';

// Pages
import { LandingPage } from './pages/landing/LandingPage';
import { AuthPages } from './pages/auth/AuthPages';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { BookAppointment } from './pages/patient/BookAppointment';
import { DoctorDetails } from './pages/patient/DoctorDetails';
import { HospitalPage } from './pages/hospital/HospitalPage';
import { AppointmentsPage } from './pages/patient/AppointmentsPage';
import { MedicalReports } from './pages/patient/MedicalReports';
import { AISymptomChecker } from './pages/patient/AISymptomChecker';
import { AIMedicalChatbot } from './pages/patient/AIMedicalChatbot';
import { SmartDoctorRecommendation } from './pages/patient/SmartDoctorRecommendation';
import { QueuePrediction } from './pages/patient/QueuePrediction';
import { HealthDashboard } from './pages/patient/HealthDashboard';
import { MedicineReminder } from './pages/patient/MedicineReminder';
import { EmergencyPage } from './pages/patient/EmergencyPage';
import { NotificationsPage } from './pages/patient/NotificationsPage';
import { ProfilePage } from './pages/patient/ProfilePage';
import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorLoginPage } from './pages/doctor/DoctorLoginPage';

const MainLayout = () => {
  const { activeView, isAuthenticated, currentUser } = useApp();

  const renderContent = () => {
    const publicViews = ['landing', 'login', 'register', 'forgot-password', 'doctor-login'];

    // Dedicated Doctor Login route
    if (activeView === 'doctor-login') {
      return <DoctorLoginPage />;
    }

    // PRODUCTION AUTH GUARD: Unauthenticated users targeting doctor portal redirect to Doctor Login
    if (!isAuthenticated && activeView.startsWith('doctor-')) {
      return <DoctorLoginPage />;
    }

    // PRODUCTION AUTH GUARD: Unauthenticated users are redirected to Login Page
    if (!isAuthenticated && !publicViews.includes(activeView)) {
      return <AuthPages />;
    }

    // Role-based Doctor Dashboard redirection
    if (currentUser?.role === 'doctor' && (activeView === 'dashboard' || activeView.startsWith('doctor-'))) {
      return <DoctorDashboard />;
    }

    switch (activeView) {
      case 'landing':
        return <LandingPage />;

      case 'doctor-login':
        return <DoctorLoginPage />;

      case 'login':
      case 'register':
      case 'forgot-password':
      case 'otp-verification':
      case 'role-selection':
        return <AuthPages />;

      case 'dashboard':
        return <PatientDashboard />;

      case 'doctors':
        return <BookAppointment />;

      case 'doctor-details':
        return <DoctorDetails />;

      case 'hospitals':
      case 'hospital-details':
        return <HospitalPage />;

      case 'appointments':
        return <AppointmentsPage />;

      case 'medical-reports':
        return <MedicalReports />;

      case 'ai-symptom-checker':
        return <AISymptomChecker />;

      case 'ai-chatbot':
        return <AIMedicalChatbot />;

      case 'smart-recommendation':
        return <SmartDoctorRecommendation />;

      case 'queue-prediction':
        return <QueuePrediction />;

      case 'health-dashboard':
        return <HealthDashboard />;

      case 'medicine-reminder':
        return <MedicineReminder />;

      case 'emergency':
        return <EmergencyPage />;

      case 'notifications':
        return <NotificationsPage />;

      case 'profile':
        return <ProfilePage />;

      case 'doctor-dashboard':
      case 'doctor-overview':
      case 'doctor-appointments':
      case 'doctor-patients':
      case 'doctor-reports':
      case 'doctor-prescriptions':
      case 'doctor-profile':
        return <DoctorDashboard />;

      case 'hospital-overview':
      case 'manage-doctors':
      case 'hospital-appointments':
      case 'hospital-analytics':
        return <HospitalDashboard />;

      case 'admin-overview':
      case 'pending-approvals':
      case 'admin-analytics':
        return <AdminDashboard />;

      default:
        return <LandingPage />;
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-brand-600 selection:text-white">
      <Header />

      <div className="flex-1 flex w-full">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 min-w-0 w-full">
          {renderContent()}
        </main>
      </div>

      <Footer />
      <EmergencyModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
