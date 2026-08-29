-- =========================================================
-- MedConnect Karavali Healthcare Database Schema (PostgreSQL)
-- =========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table (Dedicated Table for Patient Users)
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  abha_id VARCHAR(100),
  avatar VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Legacy/Unified Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'patient',
  abha_id VARCHAR(100),
  avatar VARCHAR(10),
  hospital_id VARCHAR(100),
  hospital_name VARCHAR(255),
  specialization VARCHAR(255),
  qualification VARCHAR(255),
  experience VARCHAR(50),
  license_number VARCHAR(100),
  mfa_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table (Dedicated Table for Doctor Accounts)
CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  photo TEXT,
  specialization VARCHAR(255) NOT NULL,
  experience VARCHAR(50),
  qualification VARCHAR(255),
  license_number VARCHAR(100),
  hospital_id VARCHAR(100),
  hospital_name VARCHAR(255),
  rating NUMERIC(3, 2) DEFAULT 4.8,
  reviews_count INT DEFAULT 50,
  languages TEXT[],
  available_slots TEXT[],
  location VARCHAR(255),
  distance VARCHAR(50),
  consultation_fee INT DEFAULT 500,
  education TEXT,
  bio TEXT,
  is_available_today BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Hospitals Table (Dedicated Table for Hospital Admin Accounts)
CREATE TABLE IF NOT EXISTS hospitals (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  banner TEXT,
  location VARCHAR(255) NOT NULL,
  distance VARCHAR(50),
  rating NUMERIC(3, 2) DEFAULT 4.8,
  departments TEXT[],
  doctors_count INT DEFAULT 100,
  beds_available INT DEFAULT 25,
  emergency_status VARCHAR(50) DEFAULT 'Available',
  facilities TEXT[],
  reviews_count INT DEFAULT 300,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

  departments TEXT[],
  doctors_count INT DEFAULT 100,
  beds_available INT DEFAULT 25,
  emergency_status VARCHAR(50) DEFAULT 'Available',
  facilities TEXT[],
  phone VARCHAR(50),
  reviews_count INT DEFAULT 300,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  doctor_id VARCHAR(100),
  doctor_name VARCHAR(255) NOT NULL,
  doctor_photo TEXT,
  specialization VARCHAR(255),
  hospital_name VARCHAR(255),
  date VARCHAR(50) NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  queue_number INT,
  estimated_wait_time VARCHAR(50),
  status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
  type VARCHAR(50) DEFAULT 'offline', -- 'offline', 'online'
  patient_name VARCHAR(255),
  meeting_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_slot ON appointments (doctor_id, date, time_slot, status, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments (doctor_id, date, status, created_at ASC);


-- 5. Medical Reports Table
CREATE TABLE IF NOT EXISTS medical_reports (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date VARCHAR(50) NOT NULL,
  doctor_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Normal',
  summary TEXT,
  metrics TEXT,
  file_url TEXT,
  file_type VARCHAR(50) DEFAULT 'pdf',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  time VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  doctor_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  timestamp VARCHAR(100),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Symptom History Table
CREATE TABLE IF NOT EXISTS symptom_history (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  analysis_summary TEXT,
  urgency VARCHAR(50) DEFAULT 'Medium',
  recommended_specialist VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Hospital Schemes & RAG Knowledge Table
CREATE TABLE IF NOT EXISTS hospital_schemes (
  id VARCHAR(100) PRIMARY KEY,
  hospital_name VARCHAR(255) NOT NULL,
  scheme_title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Government Scheme',
  coverage_amount VARCHAR(100),
  eligibility TEXT,
  description TEXT,
  document_url TEXT,
  content_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id VARCHAR(100) PRIMARY KEY,
  doctor_id VARCHAR(100) NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  patient_id VARCHAR(100) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  medications TEXT NOT NULL,
  instructions TEXT,
  date VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Initial Seed Users
INSERT INTO users (id, name, email, phone, password_hash, role, abha_id, avatar)
VALUES
  ('user-patient-1', 'Kavya Poojary', 'patient@medconnect.com', '+91 98450 12345', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'patient', '91-4820-1928-4019', 'KP'),
  ('user-doc-1', 'Dr. Vignesh Shetty', 'doctor@medconnect.com', '+91 94481 22334', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'doctor', NULL, 'VS'),
  ('user-hosp-1', 'KMC Health City Admin', 'hospital@medconnect.com', '+91 82420 99887', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'hospital', NULL, 'KMC'),
  ('user-admin-1', 'Karavali Health Admin', 'admin@medconnect.com', '+91 82422 11000', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'admin', NULL, 'GA')
ON CONFLICT (id) DO NOTHING;
