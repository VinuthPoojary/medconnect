import pg from 'pg';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pgPool = null;
let sqliteDb = null;
let useSqlite = false;

// Seed demo users
const SEED_USERS = [
  {
    id: 'user-patient-1',
    name: 'Kavya Poojary',
    email: 'patient@medconnect.com',
    phone: '+91 98450 12345',
    password_hash: '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', // MedConnect@2026
    role: 'patient',
    abha_id: '91-4820-1928-4019',
    avatar: 'KP',
  },
  {
    id: 'user-doc-1',
    name: 'Dr. Vignesh Shetty',
    email: 'doctor@medconnect.com',
    phone: '+91 94481 22334',
    password_hash: '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k',
    role: 'doctor',
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    specialization: 'Cardiologist',
    avatar: 'VS',
  },
  {
    id: 'user-hosp-1',
    name: 'KMC Hospital Admin',
    email: 'hospital@medconnect.com',
    phone: '+91 82420 99887',
    password_hash: '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k',
    role: 'hospital',
    hospital_name: 'KMC Hospital Attavar & Jyothi, Mangaluru',
    avatar: 'KMC',
  },
  {
    id: 'user-admin-1',
    name: 'Karavali Health Admin',
    email: 'admin@medconnect.com',
    phone: '+91 82422 11000',
    password_hash: '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k',
    role: 'admin',
    avatar: 'GA',
  },
];

// Seed 8 realistic hospitals in Coastal Karnataka
const SEED_HOSPITALS = [
  {
    id: 'hosp-1',
    name: 'KMC Hospital Attavar & Jyothi',
    banner: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
    location: 'Attavar & Light House Hill Rd, Mangaluru',
    distance: '2.4 km',
    rating: 4.9,
    departments: JSON.stringify(['Cardiology', 'Neurology', 'Pediatrics', 'Dermatology', 'General Medicine', 'Psychiatry', 'Gynecologist', 'Orthopedics']),
    doctors_count: 8,
    beds_available: 48,
    emergency_status: 'Available',
    facilities: JSON.stringify(['NABH Accredited', '24x7 Cath Lab', 'Level-3 Trauma Unit', 'ABDM Digital Health']),
    phone: '+91 82420 99887',
    reviews_count: 520,
    approved: true,
  },
  {
    id: 'hosp-2',
    name: 'AJ Hospital & Research Centre',
    banner: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    location: 'NH-66, Kuntikan, Mangaluru',
    distance: '4.1 km',
    rating: 4.8,
    departments: JSON.stringify(['Cardiology', 'Neurology', 'Oncology', 'Gastroenterology', 'Ophthalmology', 'Urology', 'ENT', 'Pediatrics']),
    doctors_count: 8,
    beds_available: 32,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Robotic Surgery', 'Dialysis Center', 'Helipad', 'Ambulance GPS']),
    phone: '+91 82422 25555',
    reviews_count: 410,
    approved: true,
  },
  {
    id: 'hosp-3',
    name: 'Father Muller Medical College Hospital',
    banner: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    location: 'Father Muller Rd, Kankanady, Mangaluru',
    distance: '3.0 km',
    rating: 4.8,
    departments: JSON.stringify(['Orthopedics', 'General Medicine', 'Gynecologist', 'ENT Specialist', 'Cardiology', 'Dermatologist', 'Neurologist', 'Pediatrician']),
    doctors_count: 8,
    beds_available: 22,
    emergency_status: 'Available',
    facilities: JSON.stringify(['24/7 Pharmacy', 'Homoeopathic & Allopathic', 'Physical Rehab Center']),
    phone: '+91 82422 38000',
    reviews_count: 340,
    approved: true,
  },
  {
    id: 'hosp-4',
    name: 'Kasturba Hospital, Manipal',
    banner: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
    location: 'Madhav Nagar, Manipal, Udupi',
    distance: '54 km',
    rating: 4.9,
    departments: JSON.stringify(['Neurologist', 'Oncologist', 'Gastroenterologist', 'Urologist', 'Cardiothoracic', 'Endocrinology', 'Orthopedics', 'Gynecologist']),
    doctors_count: 8,
    beds_available: 75,
    emergency_status: 'Available',
    facilities: JSON.stringify(['JCI Accredited', 'Advanced 3T MRI', 'Comprehensive Cancer Care', 'Organ Transplant']),
    phone: '+91 82029 22444',
    reviews_count: 950,
    approved: true,
  },
  {
    id: 'hosp-5',
    name: 'Yenepoya Specialty Hospital',
    banner: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    rating: 4.7,
    departments: JSON.stringify(['Orthopedics', 'Pediatrics', 'Dermatology', 'General Surgery', 'Gynecologist', 'Cardiology', 'ENT Specialist']),
    doctors_count: 7,
    beds_available: 18,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Neonatal ICU', 'Cosmetic Dermatology Clinic', 'Day Care Surgery']),
    phone: '+91 82424 96800',
    reviews_count: 280,
    approved: true,
  },
  {
    id: 'hosp-6',
    name: 'Indiana Hospital & Heart Institute',
    banner: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    rating: 4.8,
    departments: JSON.stringify(['Cardiology', 'Interventional Cardiology', 'Pediatric Cardiology', 'Pulmonology', 'General Medicine', 'Neurologist', 'Obstetrics']),
    doctors_count: 7,
    beds_available: 26,
    emergency_status: 'Available',
    facilities: JSON.stringify(['24/7 Cardiac Emergency', 'Hybrid Cath Lab', 'Advanced Angioplasty Center']),
    phone: '+91 82428 80888',
    reviews_count: 310,
    approved: true,
  },
  {
    id: 'hosp-7',
    name: 'KS Hegde Charitable Hospital',
    banner: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    rating: 4.7,
    departments: JSON.stringify(['Orthopedics', 'Gynecologist', 'Psychiatry', 'General Medicine', 'Ophthalmologist', 'Pediatrics', 'ENT Specialist', 'Dermatology']),
    doctors_count: 8,
    beds_available: 50,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Free OPD Services', 'Blood Bank', 'Super Specialty Trauma Center']),
    phone: '+91 82422 04471',
    reviews_count: 420,
    approved: true,
  },
  {
    id: 'hosp-8',
    name: 'Government District Wenlock Hospital',
    banner: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    rating: 4.6,
    departments: JSON.stringify(['Pediatrics', 'ENT Specialist', 'General Medicine', 'Gynecologist', 'Orthopedics', 'Dermatology', 'Psychiatry']),
    doctors_count: 7,
    beds_available: 60,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Government Health Scheme', 'ABHA Kiosk', '24/7 Emergency Ward']),
    phone: '+91 82424 23223',
    reviews_count: 510,
    approved: true,
  },
];

// Seed 61 completely unique doctors across 8 hospitals (NO duplicate names)
const SEED_DOCTORS = [
  // 1. KMC Hospital Attavar & Jyothi (8 Doctors)
  {
    id: 'doc-kmc-1',
    name: 'Dr. Vignesh Shetty',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Cardiologist',
    experience: '16 Years',
    rating: 4.9,
    reviews_count: 142,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 700,
    education: 'MBBS, MD (General Medicine), DM (Cardiology) - Manipal',
    bio: 'Senior Consultant Interventional Cardiologist specializing in preventive cardiology and angioplasty.',
    is_available_today: true,
  },
  {
    id: 'doc-kmc-2',
    name: 'Dr. Gautham Bhandary',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Neurologist',
    experience: '15 Years',
    rating: 4.9,
    reviews_count: 130,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['04:30 PM', '06:00 PM', '07:30 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 750,
    education: 'MBBS, MD, DM (Neurology) - NIMHANS',
    bio: 'Expert in movement disorders, stroke rehabilitation, and epilepsy management.',
    is_available_today: true,
  },
  {
    id: 'doc-kmc-3',
    name: 'Dr. Shruti Payyade',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pediatrician',
    experience: '11 Years',
    rating: 4.8,
    reviews_count: 110,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['04:30 PM', '06:00 PM', '07:00 PM', '08:00 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 550,
    education: 'MBBS, MD (Pediatrics), DCH',
    bio: 'Child specialist focusing on pediatric vaccination, growth, and newborn care.',
    is_available_today: true,
  },
  {
    id: 'doc-kmc-4',
    name: 'Dr. Varun Kudva',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Dermatologist',
    experience: '10 Years',
    rating: 4.7,
    reviews_count: 95,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['10:00 AM', '11:30 AM', '03:00 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 500,
    education: 'MBBS, DVD, MD (Dermatology)',
    bio: 'Specialist in clinical dermatology, skin allergy care, and laser treatment.',
    is_available_today: true,
  },
  {
    id: 'doc-kmc-5',
    name: 'Dr. Harish Rao',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'General Physician',
    experience: '14 Years',
    rating: 4.8,
    reviews_count: 140,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani', 'Tulu']),
    available_slots: JSON.stringify(['08:30 AM', '10:00 AM', '05:00 PM', '06:30 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 450,
    education: 'MBBS, MD (Internal Medicine)',
    bio: 'Senior physician managing diabetes, hypertension, and tropical fevers.',
    is_available_today: true,
  },
  {
    id: 'doc-kmc-6',
    name: 'Dr. Divya Naik',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Psychiatrist',
    experience: '12 Years',
    rating: 4.8,
    reviews_count: 102,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['02:00 PM', '04:00 PM', '06:00 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 600,
    education: 'MBBS, MD (Psychiatry) - NIMHANS',
    bio: 'Consultant psychiatrist specializing in stress counseling, anxiety, and depression.',
    is_available_today: true,
  },
  {
    id: 'doc-kmc-7',
    name: 'Dr. Rajeshwari Ballal',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gynecologist',
    experience: '18 Years',
    rating: 4.9,
    reviews_count: 175,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:00 AM', '11:30 AM', '03:30 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 650,
    education: 'MBBS, MS (OBG), DGO',
    bio: 'Senior Obstetrician & Gynecologist specializing in high-risk pregnancies.',
    is_available_today: true,
  },
  {
    id: 'doc-kmc-8',
    name: 'Dr. Ashlesh Karanth',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Orthopedist',
    experience: '13 Years',
    rating: 4.7,
    reviews_count: 115,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['10:30 AM', '01:00 PM', '05:30 PM']),
    hospital_name: 'KMC Hospital Attavar & Jyothi',
    location: 'Attavar & Jyothi, Mangaluru',
    distance: '2.4 km',
    consultation_fee: 600,
    education: 'MBBS, MS (Orthopedics)',
    bio: 'Specialist in arthroscopy, sports injury rehabilitation, and joint pain.',
    is_available_today: true,
  },

  // 2. AJ Hospital & Research Centre, Kuntikan, Mangaluru (8 Doctors)
  {
    id: 'doc-aj-1',
    name: 'Dr. Srinivas Nayak',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Cardiologist',
    experience: '18 Years',
    rating: 4.9,
    reviews_count: 165,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['05:00 PM', '06:30 PM', '07:30 PM', '08:30 PM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 700,
    education: 'MBBS, MD, DM (Cardiology) - Jayadeva',
    bio: 'Senior Interventional Cardiologist specializing in pacemaker implantation and stenting.',
    is_available_today: true,
  },
  {
    id: 'doc-aj-2',
    name: 'Dr. Ananya Rai',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Neurologist',
    experience: '12 Years',
    rating: 4.8,
    reviews_count: 98,
    languages: JSON.stringify(['English', 'Kannada', 'Hindi']),
    available_slots: JSON.stringify(['10:00 AM', '11:30 AM', '03:00 PM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 700,
    education: 'MBBS, DM (Neurology) - NIMHANS Bengaluru',
    bio: 'Specialist in stroke management, epilepsy, migraine, and neuro-rehabilitation.',
    is_available_today: true,
  },
  {
    id: 'doc-aj-3',
    name: 'Dr. Meenakshi Karkera',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Oncologist',
    experience: '16 Years',
    rating: 4.9,
    reviews_count: 145,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '11:00 AM', '02:00 PM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 800,
    education: 'MBBS, MD, DM (Medical Oncology)',
    bio: 'Consultant Oncologist specializing in targeted immunotherapy and cancer care.',
    is_available_today: true,
  },
  {
    id: 'doc-aj-4',
    name: 'Dr. Nitin Poojary',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gastroenterologist',
    experience: '14 Years',
    rating: 4.8,
    reviews_count: 112,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['01:30 PM', '02:30 PM', '03:30 PM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 650,
    education: 'MBBS, MD, DM (Gastroenterology)',
    bio: 'Expert in endoscopy, liver disorders, and digestive health care.',
    is_available_today: true,
  },
  {
    id: 'doc-aj-5',
    name: 'Dr. Brijesh Karanth',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Ophthalmologist',
    experience: '12 Years',
    rating: 4.8,
    reviews_count: 92,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['04:30 PM', '06:00 PM', '07:30 PM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 500,
    education: 'MBBS, MS (Ophthalmology), FICO',
    bio: 'Phaco cataract surgeon, glaucoma specialist, and LASIK refractive surgery consultant.',
    is_available_today: true,
  },
  {
    id: 'doc-aj-6',
    name: 'Dr. Sudhir Prasad',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Urologist',
    experience: '15 Years',
    rating: 4.9,
    reviews_count: 130,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:00 AM', '10:30 AM', '11:45 AM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 750,
    education: 'MBBS, MS, MCh (Urology)',
    bio: 'Specialist in kidney stone laser treatment, prostate surgery, and renal care.',
    is_available_today: true,
  },
  {
    id: 'doc-aj-7',
    name: 'Dr. Priya Alva',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'ENT Specialist',
    experience: '11 Years',
    rating: 4.7,
    reviews_count: 88,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:00 AM', '12:00 PM', '04:00 PM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 450,
    education: 'MBBS, MS (ENT)',
    bio: 'Specialist in sinus surgery, vertigo management, and ear surgery.',
    is_available_today: true,
  },
  {
    id: 'doc-aj-8',
    name: 'Dr. Santhosh Kumar',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pediatrician',
    experience: '13 Years',
    rating: 4.8,
    reviews_count: 115,
    languages: JSON.stringify(['English', 'Kannada', 'Hindi']),
    available_slots: JSON.stringify(['08:30 AM', '10:30 AM', '05:00 PM']),
    hospital_name: 'AJ Hospital & Research Centre',
    location: 'Kuntikan, Mangaluru',
    distance: '4.1 km',
    consultation_fee: 550,
    education: 'MBBS, MD (Pediatrics)',
    bio: 'Child health care consultant specializing in pediatric nutrition and infectious diseases.',
    is_available_today: true,
  },

  // 3. Father Muller Medical College Hospital, Kankanady, Mangaluru (8 Doctors)
  {
    id: 'doc-fm-1',
    name: 'Dr. Sandeep Prabhu',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Orthopedist',
    experience: '14 Years',
    rating: 4.7,
    reviews_count: 110,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['09:00 AM', '12:00 PM', '03:00 PM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 550,
    education: 'MBBS, MS (Orthopedics) - RGUHS',
    bio: 'Joint replacement specialist focusing on knee arthroplasty and sports injury treatment.',
    is_available_today: true,
  },
  {
    id: 'doc-fm-2',
    name: 'Dr. Deepa Shenoy',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'General Physician',
    experience: '15 Years',
    rating: 4.8,
    reviews_count: 140,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani', 'Tulu']),
    available_slots: JSON.stringify(['09:00 AM', '11:30 AM', '05:30 PM', '07:00 PM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 450,
    education: 'MBBS, MD (General Medicine)',
    bio: 'Senior physician specializing in chronic diabetes, hypertension, and wellness care.',
    is_available_today: true,
  },
  {
    id: 'doc-fm-3',
    name: 'Dr. Vidya Shetty',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gynecologist',
    experience: '16 Years',
    rating: 4.9,
    reviews_count: 155,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '11:00 AM', '02:30 PM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 600,
    education: 'MBBS, MS (OBG), DGO',
    bio: 'Consultant Gynecologist specializing in high-risk pregnancy and laparoscopic surgery.',
    is_available_today: true,
  },
  {
    id: 'doc-fm-4',
    name: 'Dr. Rajeshwara Acharya',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'ENT Specialist',
    experience: '14 Years',
    rating: 4.7,
    reviews_count: 105,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['08:30 AM', '10:00 AM', '11:30 AM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 450,
    education: 'MBBS, MS (ENT), DLO',
    bio: 'Specialist in sinus endoscopic surgeries and allergic rhinitis treatment.',
    is_available_today: true,
  },
  {
    id: 'doc-fm-5',
    name: 'Dr. Christopher D\'Souza',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Cardiologist',
    experience: '17 Years',
    rating: 4.9,
    reviews_count: 150,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['10:00 AM', '01:30 PM', '04:30 PM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 650,
    education: 'MBBS, MD, DM (Cardiology)',
    bio: 'Consultant Cardiologist specializing in Echo, ECG interpretation, and heart health.',
    is_available_today: true,
  },
  {
    id: 'doc-fm-6',
    name: 'Dr. Lavanya Bhat',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Dermatologist',
    experience: '9 Years',
    rating: 4.8,
    reviews_count: 90,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['02:00 PM', '03:30 PM', '05:30 PM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 500,
    education: 'MBBS, MD (Dermatology)',
    bio: 'Dermatology specialist in psoriasis, eczema, and skin rejuvenation.',
    is_available_today: true,
  },
  {
    id: 'doc-fm-7',
    name: 'Dr. Premanand Naik',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Neurologist',
    experience: '13 Years',
    rating: 4.7,
    reviews_count: 98,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '11:00 AM', '04:00 PM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 650,
    education: 'MBBS, DM (Neurology)',
    bio: 'Neurology consultant treating neuropathy, dementia, and headache disorders.',
    is_available_today: true,
  },
  {
    id: 'doc-fm-8',
    name: 'Dr. Sneha Fernandes',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pediatrician',
    experience: '10 Years',
    rating: 4.8,
    reviews_count: 105,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['08:30 AM', '10:30 AM', '02:00 PM']),
    hospital_name: 'Father Muller Medical College Hospital',
    location: 'Kankanady, Mangaluru',
    distance: '3.0 km',
    consultation_fee: 500,
    education: 'MBBS, DCH, MD (Pediatrics)',
    bio: 'Child health care consultant offering vaccination and pediatric OPD.',
    is_available_today: true,
  },

  // 4. Kasturba Hospital, Manipal, Udupi (8 Doctors)
  {
    id: 'doc-kh-1',
    name: 'Dr. Kaushik Adiga',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Neurologist',
    experience: '14 Years',
    rating: 4.7,
    reviews_count: 105,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['09:00 AM', '10:30 AM', '11:30 AM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 650,
    education: 'MBBS, M.Ch (Neuro Surgery), DM',
    bio: 'Lead consultant in neuro-trauma, spinal surgeries, and memory disorders clinic.',
    is_available_today: true,
  },
  {
    id: 'doc-kh-2',
    name: 'Dr. Praveen Kumar',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Oncologist',
    experience: '19 Years',
    rating: 4.9,
    reviews_count: 180,
    languages: JSON.stringify(['English', 'Kannada', 'Hindi']),
    available_slots: JSON.stringify(['02:00 PM', '04:00 PM', '06:00 PM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 800,
    education: 'MBBS, MD, DM (Medical Oncology) - Tata Memorial',
    bio: 'Senior Consultant Medical Oncologist specializing in immunotherapy and chemotherapy.',
    is_available_today: true,
  },
  {
    id: 'doc-kh-3',
    name: 'Dr. Shreya Ballal',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gastroenterologist',
    experience: '13 Years',
    rating: 4.8,
    reviews_count: 110,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:00 AM', '12:00 PM', '03:00 PM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 650,
    education: 'MBBS, MD, DM (Gastroenterology)',
    bio: 'Specialist in GI motility, endoscopy, and inflammatory bowel disease.',
    is_available_today: true,
  },
  {
    id: 'doc-kh-4',
    name: 'Dr. Ashok Kumar',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Urologist',
    experience: '16 Years',
    rating: 4.9,
    reviews_count: 140,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['09:30 AM', '11:30 AM', '02:30 PM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 750,
    education: 'MBBS, MS, MCh (Urology)',
    bio: 'Senior Urologist specializing in robotic prostatectomy and renal transplant.',
    is_available_today: true,
  },
  {
    id: 'doc-kh-5',
    name: 'Dr. Gurudutt Rao',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Cardiothoracic Surgeon',
    experience: '20 Years',
    rating: 4.9,
    reviews_count: 195,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['08:30 AM', '11:00 AM', '03:30 PM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 900,
    education: 'MBBS, MS, MCh (CTVS) - AIIMS',
    bio: 'Chief Cardiothoracic Surgeon specializing in bypass graft surgery and valve repair.',
    is_available_today: true,
  },
  {
    id: 'doc-kh-6',
    name: 'Dr. Manisha Hegde',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Endocrinologist',
    experience: '12 Years',
    rating: 4.8,
    reviews_count: 102,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:00 AM', '01:00 PM', '04:00 PM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 600,
    education: 'MBBS, MD, DM (Endocrinology)',
    bio: 'Endocrinologist managing diabetes, thyroid disorders, and hormonal imbalances.',
    is_available_today: true,
  },
  {
    id: 'doc-kh-7',
    name: 'Dr. Sandesh Marathe',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Orthopedist',
    experience: '15 Years',
    rating: 4.8,
    reviews_count: 128,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['09:00 AM', '12:30 PM', '05:00 PM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 700,
    education: 'MBBS, MS (Orthopedics), MCh',
    bio: 'Specialist in joint replacements, trauma care, and pediatric orthopedics.',
    is_available_today: true,
  },
  {
    id: 'doc-kh-8',
    name: 'Dr. Archana Shenoy',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gynecologist',
    experience: '14 Years',
    rating: 4.9,
    reviews_count: 135,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['10:30 AM', '02:00 PM', '04:30 PM']),
    hospital_name: 'Kasturba Hospital, Manipal',
    location: 'Manipal, Udupi',
    distance: '54 km',
    consultation_fee: 650,
    education: 'MBBS, MS (OBG)',
    bio: 'Senior Consultant in maternal fetal medicine and minimally invasive gynecology.',
    is_available_today: true,
  },

  // 5. Yenepoya Specialty Hospital, Kodialbail, Mangaluru (7 Doctors)
  {
    id: 'doc-yen-1',
    name: 'Dr. Nagesh Kamath',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Orthopedist',
    experience: '17 Years',
    rating: 4.8,
    reviews_count: 140,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['05:00 PM', '06:30 PM', '08:00 PM']),
    hospital_name: 'Yenepoya Specialty Hospital',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    consultation_fee: 600,
    education: 'MBBS, D.Ortho, MS (Orthopedics)',
    bio: 'Expert in complex fracture reconstruction, spine disorders, and orthopedics.',
    is_available_today: true,
  },
  {
    id: 'doc-yen-2',
    name: 'Dr. Rashmi Bhat',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pediatrician',
    experience: '10 Years',
    rating: 4.9,
    reviews_count: 125,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:30 AM', '02:00 PM', '04:30 PM']),
    hospital_name: 'Yenepoya Specialty Hospital',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    consultation_fee: 500,
    education: 'MBBS, MD (Pediatrics), DCH',
    bio: 'Child specialist focusing on neonatal intensive care and child growth development.',
    is_available_today: true,
  },
  {
    id: 'doc-yen-3',
    name: 'Dr. Pooja Bangera',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Dermatologist',
    experience: '9 Years',
    rating: 4.9,
    reviews_count: 110,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:00 AM', '11:30 AM', '05:00 PM', '06:30 PM']),
    hospital_name: 'Yenepoya Specialty Hospital',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    consultation_fee: 500,
    education: 'MBBS, DVD, MD (Dermatology)',
    bio: 'Specialist in clinical dermatology, laser treatments, acne care, and hair therapy.',
    is_available_today: true,
  },
  {
    id: 'doc-yen-4',
    name: 'Dr. Zaid Ahmed',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'General Surgery',
    experience: '14 Years',
    rating: 4.8,
    reviews_count: 108,
    languages: JSON.stringify(['English', 'Kannada', 'Hindi']),
    available_slots: JSON.stringify(['09:00 AM', '11:30 AM', '03:00 PM']),
    hospital_name: 'Yenepoya Specialty Hospital',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    consultation_fee: 650,
    education: 'MBBS, MS (General Surgery)',
    bio: 'General and laparoscopic surgeon specializing in hernia, gallbladder, and trauma.',
    is_available_today: true,
  },
  {
    id: 'doc-yen-5',
    name: 'Dr. Archana Rai',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gynecologist',
    experience: '15 Years',
    rating: 4.8,
    reviews_count: 120,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:00 AM', '01:30 PM', '04:00 PM']),
    hospital_name: 'Yenepoya Specialty Hospital',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    consultation_fee: 600,
    education: 'MBBS, MS (OBG)',
    bio: 'Consultant Gynecologist offering comprehensive women wellness and maternity OPD.',
    is_available_today: true,
  },
  {
    id: 'doc-yen-6',
    name: 'Dr. Mohammed Mushtaq',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Cardiologist',
    experience: '12 Years',
    rating: 4.7,
    reviews_count: 95,
    languages: JSON.stringify(['English', 'Kannada', 'Hindi']),
    available_slots: JSON.stringify(['08:30 AM', '11:00 AM', '05:30 PM']),
    hospital_name: 'Yenepoya Specialty Hospital',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    consultation_fee: 650,
    education: 'MBBS, MD, DM (Cardiology)',
    bio: 'Consultant Cardiologist specializing in preventive cardiology and hypertension control.',
    is_available_today: true,
  },
  {
    id: 'doc-yen-7',
    name: 'Dr. Suhasini Shetty',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'ENT Specialist',
    experience: '11 Years',
    rating: 4.8,
    reviews_count: 88,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '12:00 PM', '03:30 PM']),
    hospital_name: 'Yenepoya Specialty Hospital',
    location: 'Kodialbail, Mangaluru',
    distance: '1.8 km',
    consultation_fee: 450,
    education: 'MBBS, MS (ENT)',
    bio: 'ENT Consultant specializing in sinus care, ear infections, and tonsillitis.',
    is_available_today: true,
  },

  // 6. Indiana Hospital & Heart Institute, Pumpwell, Mangaluru (7 Doctors)
  {
    id: 'doc-ind-1',
    name: 'Dr. Swathi Alva',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Cardiologist',
    experience: '11 Years',
    rating: 4.8,
    reviews_count: 94,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM']),
    hospital_name: 'Indiana Hospital & Heart Institute',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    consultation_fee: 600,
    education: 'MBBS, DNB (Cardiology), FACC',
    bio: 'Specialist in echocardiography, heart defects, and hypertension management.',
    is_available_today: true,
  },
  {
    id: 'doc-ind-2',
    name: 'Dr. Yusuf Kumble',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Interventional Cardiology',
    experience: '21 Years',
    rating: 4.9,
    reviews_count: 220,
    languages: JSON.stringify(['English', 'Kannada', 'Malayalam']),
    available_slots: JSON.stringify(['10:00 AM', '01:00 PM', '04:00 PM']),
    hospital_name: 'Indiana Hospital & Heart Institute',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    consultation_fee: 850,
    education: 'MBBS, MD, DM (Cardiology), FESC',
    bio: 'Chief Interventional Cardiologist & Managing Director. Expert in complex angioplasty.',
    is_available_today: true,
  },
  {
    id: 'doc-ind-3',
    name: 'Dr. Ali Kumble',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pediatric Cardiology',
    experience: '16 Years',
    rating: 4.9,
    reviews_count: 140,
    languages: JSON.stringify(['English', 'Kannada', 'Malayalam']),
    available_slots: JSON.stringify(['09:00 AM', '11:30 AM', '03:00 PM']),
    hospital_name: 'Indiana Hospital & Heart Institute',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    consultation_fee: 750,
    education: 'MBBS, MD (Pediatrics), Fellowship in Pediatric Cardiology',
    bio: 'Specialist in congenital heart disease and pediatric heart care.',
    is_available_today: true,
  },
  {
    id: 'doc-ind-4',
    name: 'Dr. Pratiksha Shetty',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pulmonology',
    experience: '12 Years',
    rating: 4.8,
    reviews_count: 98,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:30 AM', '02:00 PM', '05:00 PM']),
    hospital_name: 'Indiana Hospital & Heart Institute',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    consultation_fee: 600,
    education: 'MBBS, DTCD, MD (Pulmonary Medicine)',
    bio: 'Pulmonology consultant specializing in asthma, COPD, and sleep apnea care.',
    is_available_today: true,
  },
  {
    id: 'doc-ind-5',
    name: 'Dr. Mahesh Chandra',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'General Medicine',
    experience: '13 Years',
    rating: 4.7,
    reviews_count: 102,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['08:30 AM', '11:00 AM', '04:30 PM']),
    hospital_name: 'Indiana Hospital & Heart Institute',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    consultation_fee: 450,
    education: 'MBBS, MD (General Medicine)',
    bio: 'Physician treating lifestyle disorders, hypertension, and infectious diseases.',
    is_available_today: true,
  },
  {
    id: 'doc-ind-6',
    name: 'Dr. Naveen Poojary',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Neurologist',
    experience: '14 Years',
    rating: 4.8,
    reviews_count: 115,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '12:00 PM', '03:30 PM']),
    hospital_name: 'Indiana Hospital & Heart Institute',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    consultation_fee: 650,
    education: 'MBBS, DM (Neurology)',
    bio: 'Consultant Neurologist specializing in stroke management and dizziness clinics.',
    is_available_today: true,
  },
  {
    id: 'doc-ind-7',
    name: 'Dr. Sunita D\'Souza',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Obstetrics',
    experience: '15 Years',
    rating: 4.8,
    reviews_count: 120,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['10:00 AM', '01:30 PM', '05:00 PM']),
    hospital_name: 'Indiana Hospital & Heart Institute',
    location: 'Pumpwell Circle, Mangaluru',
    distance: '3.5 km',
    consultation_fee: 600,
    education: 'MBBS, MS (OBG)',
    bio: 'Obstetrics consultant offering high-risk pregnancy care and prenatal counseling.',
    is_available_today: true,
  },

  // 7. KS Hegde Charitable Hospital, Deralakatte, Mangaluru (8 Doctors)
  {
    id: 'doc-ksh-1',
    name: 'Dr. Vivek Udupa',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Orthopedist',
    experience: '12 Years',
    rating: 4.7,
    reviews_count: 98,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['08:30 AM', '10:00 AM', '11:30 AM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 500,
    education: 'MBBS, MS (Orthopedics)',
    bio: 'Orthopedic specialist in joint care, bone fracture management, and spine health.',
    is_available_today: true,
  },
  {
    id: 'doc-ksh-2',
    name: 'Dr. Reshma D\'Souza',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gynecologist',
    experience: '14 Years',
    rating: 4.8,
    reviews_count: 112,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['09:30 AM', '11:30 AM', '03:00 PM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 550,
    education: 'MBBS, MS (OBG)',
    bio: 'Gynecological surgeon specializing in maternity wellness and women health.',
    is_available_today: true,
  },
  {
    id: 'doc-ksh-3',
    name: 'Dr. Sunil Kumar',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Psychiatrist',
    experience: '11 Years',
    rating: 4.8,
    reviews_count: 88,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu', 'Hindi']),
    available_slots: JSON.stringify(['02:00 PM', '04:30 PM', '06:30 PM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 550,
    education: 'MBBS, MD (Psychiatry) - NIMHANS',
    bio: 'Consultant Psychiatrist specializing in stress management and depression therapy.',
    is_available_today: true,
  },
  {
    id: 'doc-ksh-4',
    name: 'Dr. Anand Shetty',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'General Medicine',
    experience: '16 Years',
    rating: 4.7,
    reviews_count: 130,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['08:00 AM', '10:30 AM', '04:00 PM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 400,
    education: 'MBBS, MD (Internal Medicine)',
    bio: 'Senior physician managing infectious diseases, hypertension, and diabetes.',
    is_available_today: true,
  },
  {
    id: 'doc-ksh-5',
    name: 'Dr. Jayaprakash Rao',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Ophthalmologist',
    experience: '13 Years',
    rating: 4.8,
    reviews_count: 95,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['09:00 AM', '11:00 AM', '02:30 PM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 450,
    education: 'MBBS, MS (Ophthalmology)',
    bio: 'Eye specialist in cataract surgery, diabetic retinopathy, and vision correction.',
    is_available_today: true,
  },
  {
    id: 'doc-ksh-6',
    name: 'Dr. Pavithra Karkera',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pediatrician',
    experience: '10 Years',
    rating: 4.8,
    reviews_count: 90,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:00 AM', '12:00 PM', '05:00 PM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 450,
    education: 'MBBS, DCH, MD (Pediatrics)',
    bio: 'Child health care specialist managing pediatric nutrition and immunizations.',
    is_available_today: true,
  },
  {
    id: 'doc-ksh-7',
    name: 'Dr. Sathish Bhandary',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'ENT Specialist',
    experience: '18 Years',
    rating: 4.9,
    reviews_count: 160,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '11:30 AM', '03:30 PM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 500,
    education: 'MBBS, MS (ENT)',
    bio: 'Senior ENT Surgeon specializing in hearing loss rehabilitation and head-neck surgery.',
    is_available_today: true,
  },
  {
    id: 'doc-ksh-8',
    name: 'Dr. Smita Naik',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'Dermatologist',
    experience: '9 Years',
    rating: 4.7,
    reviews_count: 85,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['01:30 PM', '03:00 PM', '05:30 PM']),
    hospital_name: 'KS Hegde Charitable Hospital',
    location: 'Deralakatte, Mangaluru',
    distance: '11 km',
    consultation_fee: 450,
    education: 'MBBS, MD (Dermatology)',
    bio: 'Dermatology consultant treating skin allergies, eczema, and hair loss.',
    is_available_today: true,
  },

  // 8. Government District Wenlock Hospital, Hampankatta, Mangaluru (7 Doctors)
  {
    id: 'doc-wen-1',
    name: 'Dr. Soumya Hegde',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Pediatrician',
    experience: '13 Years',
    rating: 4.8,
    reviews_count: 115,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['08:30 AM', '09:30 AM', '11:00 AM']),
    hospital_name: 'Government District Wenlock Hospital',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    consultation_fee: 400,
    education: 'MBBS, DCH, MD (Pediatrics)',
    bio: 'Specialist in pediatric asthma, childhood infections, and adolescent medicine.',
    is_available_today: true,
  },
  {
    id: 'doc-wen-2',
    name: 'Dr. Chetana Pai',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    specialization: 'ENT Specialist',
    experience: '12 Years',
    rating: 4.7,
    reviews_count: 98,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['09:00 AM', '10:30 AM', '02:00 PM']),
    hospital_name: 'Government District Wenlock Hospital',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    consultation_fee: 400,
    education: 'MBBS, MS (ENT)',
    bio: 'District hospital ENT consultant for ear, nose, throat and sinus ailments.',
    is_available_today: true,
  },
  {
    id: 'doc-wen-3',
    name: 'Dr. Jagadish Poojary',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'General Medicine',
    experience: '17 Years',
    rating: 4.8,
    reviews_count: 150,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['08:00 AM', '10:00 AM', '03:00 PM']),
    hospital_name: 'Government District Wenlock Hospital',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    consultation_fee: 350,
    education: 'MBBS, MD (General Medicine)',
    bio: 'District Senior Physician managing fever clinic, hypertension, and wellness.',
    is_available_today: true,
  },
  {
    id: 'doc-wen-4',
    name: 'Dr. Usha Rani',
    photo: 'https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=300',
    specialization: 'Gynecologist',
    experience: '15 Years',
    rating: 4.8,
    reviews_count: 125,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:30 AM', '11:30 AM', '02:30 PM']),
    hospital_name: 'Government District Wenlock Hospital',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    consultation_fee: 400,
    education: 'MBBS, MS (OBG)',
    bio: 'Gynecologist offering maternal health, antenatal screening, and delivery care.',
    is_available_today: true,
  },
  {
    id: 'doc-wen-5',
    name: 'Dr. Dayananda Nayak',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Orthopedist',
    experience: '16 Years',
    rating: 4.7,
    reviews_count: 135,
    languages: JSON.stringify(['English', 'Kannada', 'Konkani']),
    available_slots: JSON.stringify(['10:00 AM', '01:00 PM', '04:00 PM']),
    hospital_name: 'Government District Wenlock Hospital',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    consultation_fee: 400,
    education: 'MBBS, MS (Orthopedics)',
    bio: 'Orthopedic trauma surgeon managing fracture fixation and bone care.',
    is_available_today: true,
  },
  {
    id: 'doc-wen-6',
    name: 'Dr. Shivaprasad Shetty',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    specialization: 'Dermatologist',
    experience: '11 Years',
    rating: 4.7,
    reviews_count: 90,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['09:00 AM', '11:00 AM', '03:30 PM']),
    hospital_name: 'Government District Wenlock Hospital',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    consultation_fee: 350,
    education: 'MBBS, MD (Dermatology)',
    bio: 'Dermatologist managing skin allergies, fungal infections, and eczema.',
    is_available_today: true,
  },
  {
    id: 'doc-wen-7',
    name: 'Dr. Shreedhar Bhat',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    specialization: 'Psychiatrist',
    experience: '14 Years',
    rating: 4.8,
    reviews_count: 105,
    languages: JSON.stringify(['English', 'Kannada', 'Tulu']),
    available_slots: JSON.stringify(['10:30 AM', '01:30 PM', '04:30 PM']),
    hospital_name: 'Government District Wenlock Hospital',
    location: 'Hampankatta, Mangaluru',
    distance: '1.2 km',
    consultation_fee: 400,
    education: 'MBBS, MD (Psychiatry)',
    bio: 'Consultant Psychiatrist offering mental health triage and stress counseling.',
    is_available_today: true,
  },
];

// Seed medical reports
const SEED_REPORTS = [
  {
    id: 'rep-1',
    user_id: 'user-patient-1',
    title: 'Comprehensive Blood Profile (CBC)',
    category: 'Hematology',
    date: '2026-07-28',
    doctor_name: 'Dr. Vignesh Shetty',
    status: 'Normal',
    summary: 'Hemoglobin and WBC counts are well within healthy reference ranges. Platelet count optimal.',
    metrics: JSON.stringify({ Hemoglobin: '14.2 g/dL', WBC: '6,800 /mcL', Platelets: '250,000 /mcL', RBC: '4.9 M/mcL' }),
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
  },
  {
    id: 'rep-2',
    user_id: 'user-patient-1',
    title: 'Lipid Panel Test',
    category: 'Cardiology',
    date: '2026-07-15',
    doctor_name: 'Dr. Vignesh Shetty',
    status: 'Borderline',
    summary: 'Total Cholesterol slightly elevated (205 mg/dL). Recommended dietary fiber adjustment and mild daily exercise.',
    metrics: JSON.stringify({ 'Total Cholesterol': '205 mg/dL', 'HDL Good': '55 mg/dL', 'LDL Bad': '125 mg/dL', Triglycerides: '140 mg/dL' }),
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
  },
];

// Seed medicines
const SEED_MEDICINES = [
  {
    id: 'med-1',
    user_id: 'user-patient-1',
    name: 'Metformin 500mg',
    dosage: '1 Tablet',
    frequency: 'Twice Daily',
    time: '08:00 AM & 08:00 PM',
    completed: true,
    doctor_name: 'Dr. Vignesh Shetty',
  },
  {
    id: 'med-2',
    user_id: 'user-patient-1',
    name: 'Atorvastatin 10mg',
    dosage: '1 Tablet',
    frequency: 'Once Daily at Bedtime',
    time: '09:30 PM',
    completed: false,
    doctor_name: 'Dr. Vignesh Shetty',
  },
  {
    id: 'med-3',
    user_id: 'user-patient-1',
    name: 'Vitamin D3 60,000 IU',
    dosage: '1 Capsule',
    frequency: 'Weekly (Sundays)',
    time: '10:00 AM',
    completed: false,
    doctor_name: 'Dr. Ananya Rai',
  },
];

// Seed notifications
const SEED_NOTIFICATIONS = [
  {
    id: 'notif-1',
    user_id: 'user-patient-1',
    title: 'Appointment Confirmed',
    message: 'Your OPD appointment with Dr. Vignesh Shetty at KMC Hospital Attavar & Jyothi is confirmed for tomorrow 10:30 AM.',
    category: 'appointment',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 'notif-2',
    user_id: 'user-patient-1',
    title: 'Lab Report Ready',
    message: 'Your Blood CBC Report is analyzed by AI and available in your Health Locker.',
    category: 'report',
    timestamp: 'Yesterday',
    read: true,
  },
];

async function initDb() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-password')) {
    try {
      const tempPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000,
      });
      const client = await tempPool.connect();
      await client.query('SELECT 1');
      client.release();
      pgPool = tempPool;
      console.log('✅ Connected to PostgreSQL Database successfully!');
      await initPgSchema();
      return;
    } catch (err) {
      console.warn('⚠️ Remote PostgreSQL connection unavailable, switching to local SQLite database:', err.message);
    }
  }

  useSqlite = true;
  const dbPath = path.join(__dirname, 'medconnect.db');
  sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.default?.Database || sqlite3.Database,
  });
  console.log(`📦 Connected to Local SQLite Database: ${dbPath}`);
  await initSqliteSchema();
}

async function initPgSchema() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'patient',
      abha_id VARCHAR(100),
      avatar VARCHAR(10),
      hospital_name VARCHAR(255),
      specialization VARCHAR(255),
      mfa_enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      photo TEXT,
      specialization VARCHAR(255) NOT NULL,
      experience VARCHAR(50),
      rating NUMERIC(3, 2) DEFAULT 4.8,
      reviews_count INT DEFAULT 50,
      languages TEXT[],
      available_slots TEXT[],
      hospital_name VARCHAR(255),
      location VARCHAR(255),
      distance VARCHAR(50),
      consultation_fee INT DEFAULT 500,
      education TEXT,
      bio TEXT,
      is_available_today BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      banner TEXT,
      location VARCHAR(255) NOT NULL,
      distance VARCHAR(50),
      rating NUMERIC(3, 2) DEFAULT 4.8,
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
      status VARCHAR(50) DEFAULT 'upcoming',
      type VARCHAR(50) DEFAULT 'offline',
      patient_name VARCHAR(255),
      meeting_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

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
  `);

  // Clean legacy demo doctor records to prevent duplicates
  await pgPool.query("DELETE FROM doctors WHERE id NOT LIKE 'doc-%-%'");

  // Seed Users
  for (const u of SEED_USERS) {
    await pgPool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, abha_id, avatar, hospital_name, specialization)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, hospital_name = EXCLUDED.hospital_name`,
      [u.id, u.name, u.email, u.phone, u.password_hash, u.role, u.abha_id || null, u.avatar || null, u.hospital_name || null, u.specialization || null]
    );
  }

  // Seed Hospitals
  for (const h of SEED_HOSPITALS) {
    await pgPool.query(
      `INSERT INTO hospitals (id, name, banner, location, distance, rating, departments, doctors_count, beds_available, emergency_status, facilities, phone, reviews_count, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, $9, $10, $11::text[], $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location, doctors_count = EXCLUDED.doctors_count`,
      [h.id, h.name, h.banner, h.location, h.distance, h.rating, JSON.parse(h.departments), h.doctors_count, h.beds_available, h.emergency_status, JSON.parse(h.facilities), h.phone, h.reviews_count, h.approved]
    );
  }

  // Seed 61 Doctors
  for (const d of SEED_DOCTORS) {
    await pgPool.query(
      `INSERT INTO doctors (id, name, photo, specialization, experience, rating, reviews_count, languages, available_slots, hospital_name, location, distance, consultation_fee, education, bio, is_available_today)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9::text[], $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, hospital_name = EXCLUDED.hospital_name, specialization = EXCLUDED.specialization`,
      [d.id, d.name, d.photo, d.specialization, d.experience, d.rating, d.reviews_count, JSON.parse(d.languages), JSON.parse(d.available_slots), d.hospital_name, d.location, d.distance, d.consultation_fee, d.education, d.bio, d.is_available_today]
    );
  }

  // Seed Reports
  for (const r of SEED_REPORTS) {
    await pgPool.query(
      `INSERT INTO medical_reports (id, user_id, title, category, date, doctor_name, status, summary, metrics, file_url, file_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.user_id, r.title, r.category, r.date, r.doctor_name, r.status, r.summary, r.metrics, r.file_url, r.file_type]
    );
  }

  // Seed Medicines
  for (const m of SEED_MEDICINES) {
    await pgPool.query(
      `INSERT INTO medicines (id, user_id, name, dosage, frequency, time, completed, doctor_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.user_id, m.name, m.dosage, m.frequency, m.time, m.completed, m.doctor_name]
    );
  }

  // Seed Notifications
  for (const n of SEED_NOTIFICATIONS) {
    await pgPool.query(
      `INSERT INTO notifications (id, user_id, title, message, category, timestamp, read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [n.id, n.user_id, n.title, n.message, n.category, n.timestamp, n.read]
    );
  }

  // Seed Hospital Schemes for RAG
  const seedSchemes = [
    {
      id: 'sch-kmc-1',
      hospital_name: 'KMC Hospital Attavar & Jyothi',
      scheme_title: 'Ayushman Bharat PM-JAY (100% Cashless)',
      category: 'Government Scheme',
      coverage_amount: 'Up to ₹5,00,000 / Family per Year',
      eligibility: 'BPL Card Holders, Ration Card Holders & ABHA ID Verified',
      description: 'Provides 100% cashless hospitalization for empanelled cardiac, neurological, surgical, and ICU treatments at KMC Hospital.',
      document_url: 'https://medconnect.karavali.ai/docs/kmc-ayushman-bharat-guidelines.pdf',
      content_text: 'KMC Hospital Attavar & Jyothi provides 100% cashless treatment under Ayushman Bharat PM-JAY and Arogya Karnataka. Beneficiaries with BPL card or Ayushman Card receive covered surgical packages, ICU stays, and medicines without upfront payment. Emergency admissions are approved within 2 hours.'
    },
    {
      id: 'sch-kmc-2',
      hospital_name: 'KMC Hospital Attavar & Jyothi',
      scheme_title: 'Star Health & HDFC Ergo Cashless Policy',
      category: 'Private Insurance',
      coverage_amount: 'Full Sum Insured (Up to Policy Limit)',
      eligibility: 'All Active Star Health & HDFC Ergo Policyholders',
      description: 'Instant desk approval within 30 minutes for all planned and emergency surgical hospitalizations.',
      document_url: 'https://medconnect.karavali.ai/docs/kmc-star-health-cashless.pdf',
      content_text: 'KMC Hospital is a network hospital for Star Health, HDFC Ergo, Niva Bupa, and ICICI Lombard. Pre-authorization is processed at Room #102 Insurance Desk. 0% co-payment for network claims.'
    },
    {
      id: 'sch-aj-1',
      hospital_name: 'AJ Hospital & Research Centre',
      scheme_title: 'Arogya Karnataka & Yashasvini Scheme',
      category: 'Government Scheme',
      coverage_amount: 'Up to ₹5,00,000 for Super Specialty',
      eligibility: 'Farmers, Co-operative Society Members & BPL Families',
      description: 'Complete coverage for cardiology, oncology, urology, and organ transplant procedures at AJ Hospital.',
      document_url: 'https://medconnect.karavali.ai/docs/aj-arogya-karnataka.pdf',
      content_text: 'AJ Hospital & Research Centre is empanelled under Yashasvini and Arogya Karnataka. Farmers with Yashasvini card receive 100% covered surgeries in Cardiac Surgery, Dialysis, Radiation Oncology, and Urology.'
    },
    {
      id: 'sch-fm-1',
      hospital_name: 'Father Muller Medical College Hospital',
      scheme_title: 'Father Muller Charitable Healthcare Subsidy',
      category: 'Hospital Policy',
      coverage_amount: '50% to 100% Fee Waiver on OPD & Diagnostics',
      eligibility: 'Economically Weaker Sections (EWS) & Senior Citizens',
      description: 'Special concession on OPD consultations, lab tests, MRI/CT scans, and inpatient bed charges.',
      document_url: 'https://medconnect.karavali.ai/docs/father-muller-charity-policy.pdf',
      content_text: 'Father Muller Hospital provides subsidized healthcare for senior citizens and low-income families. OPD registration fee is concessional at ₹150, with up to 50% discount on laboratory blood tests, X-ray, and MRI imaging.'
    },
    {
      id: 'sch-kh-1',
      hospital_name: 'Kasturba Hospital, Manipal',
      scheme_title: 'Manipal Health Card Scheme',
      category: 'Hospital Policy',
      coverage_amount: '50% OPD Concession & 25% IPD Discount',
      eligibility: 'Coastal Karnataka Residents (Udupi, Mangaluru, Uttara Kannada)',
      description: 'Exclusive discount card providing massive savings on OPD consultation, diagnostic investigations, and medicines across Manipal group hospitals.',
      document_url: 'https://medconnect.karavali.ai/docs/manipal-health-card-benefits.pdf',
      content_text: 'Manipal Health Card offers 50% discount on doctor consultation fees, 25% discount on MRI/CT scans and laboratory tests, and 10% discount on pharmacy medicines at Kasturba Hospital Manipal.'
    }
  ];

  for (const s of seedSchemes) {
    await pgPool.query(
      `INSERT INTO hospital_schemes (id, hospital_name, scheme_title, category, coverage_amount, eligibility, description, document_url, content_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.hospital_name, s.scheme_title, s.category, s.coverage_amount, s.eligibility, s.description, s.document_url, s.content_text]
    );
  }
}

async function initSqliteSchema() {
  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'patient',
      abha_id TEXT,
      avatar TEXT,
      hospital_name TEXT,
      specialization TEXT,
      mfa_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      photo TEXT,
      specialization TEXT NOT NULL,
      experience TEXT,
      rating REAL DEFAULT 4.8,
      reviews_count INTEGER DEFAULT 50,
      languages TEXT,
      available_slots TEXT,
      hospital_name TEXT,
      location TEXT,
      distance TEXT,
      consultation_fee INTEGER DEFAULT 500,
      education TEXT,
      bio TEXT,
      is_available_today INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      banner TEXT,
      location TEXT NOT NULL,
      distance TEXT,
      rating REAL DEFAULT 4.8,
      departments TEXT,
      doctors_count INTEGER DEFAULT 100,
      beds_available INTEGER DEFAULT 25,
      emergency_status TEXT DEFAULT 'Available',
      facilities TEXT,
      phone TEXT,
      reviews_count INTEGER DEFAULT 300,
      approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      doctor_id TEXT,
      doctor_name TEXT NOT NULL,
      doctor_photo TEXT,
      specialization TEXT,
      hospital_name TEXT,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      queue_number INTEGER,
      estimated_wait_time TEXT,
      status TEXT DEFAULT 'upcoming',
      type TEXT DEFAULT 'offline',
      patient_name TEXT,
      meeting_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medical_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      doctor_name TEXT,
      status TEXT DEFAULT 'Normal',
      summary TEXT,
      metrics TEXT,
      file_url TEXT,
      file_type TEXT DEFAULT 'pdf',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      time TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      doctor_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      timestamp TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS symptom_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      symptoms TEXT NOT NULL,
      analysis_summary TEXT,
      urgency TEXT DEFAULT 'Medium',
      recommended_specialist TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sqliteDb.run("DELETE FROM doctors WHERE id NOT LIKE 'doc-%-%'");

  for (const u of SEED_USERS) {
    await sqliteDb.run(
      `INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, abha_id, avatar, hospital_name, specialization)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.phone, u.password_hash, u.role, u.abha_id || null, u.avatar || null, u.hospital_name || null, u.specialization || null]
    );
  }

  for (const h of SEED_HOSPITALS) {
    await sqliteDb.run(
      `INSERT OR REPLACE INTO hospitals (id, name, banner, location, distance, rating, departments, doctors_count, beds_available, emergency_status, facilities, phone, reviews_count, approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [h.id, h.name, h.banner, h.location, h.distance, h.rating, h.departments, h.doctors_count, h.beds_available, h.emergency_status, h.facilities, h.phone, h.reviews_count, h.approved ? 1 : 0]
    );
  }

  for (const d of SEED_DOCTORS) {
    await sqliteDb.run(
      `INSERT OR REPLACE INTO doctors (id, name, photo, specialization, experience, rating, reviews_count, languages, available_slots, hospital_name, location, distance, consultation_fee, education, bio, is_available_today)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.name, d.photo, d.specialization, d.experience, d.rating, d.reviews_count, d.languages, d.available_slots, d.hospital_name, d.location, d.distance, d.consultation_fee, d.education, d.bio, d.is_available_today ? 1 : 0]
    );
  }

  for (const r of SEED_REPORTS) {
    await sqliteDb.run(
      `INSERT OR IGNORE INTO medical_reports (id, user_id, title, category, date, doctor_name, status, summary, metrics, file_url, file_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.user_id, r.title, r.category, r.date, r.doctor_name, r.status, r.summary, r.metrics, r.file_url, r.file_type]
    );
  }

  for (const m of SEED_MEDICINES) {
    await sqliteDb.run(
      `INSERT OR IGNORE INTO medicines (id, user_id, name, dosage, frequency, time, completed, doctor_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.user_id, m.name, m.dosage, m.frequency, m.time, m.completed ? 1 : 0, m.doctor_name]
    );
  }

  for (const n of SEED_NOTIFICATIONS) {
    await sqliteDb.run(
      `INSERT OR IGNORE INTO notifications (id, user_id, title, message, category, timestamp, read)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [n.id, n.user_id, n.title, n.message, n.category, n.timestamp, n.read ? 1 : 0]
    );
  }
}

const dbInitPromise = initDb();

export const query = async (text, params = []) => {
  await dbInitPromise;
  const start = Date.now();

  if (!useSqlite && pgPool) {
    try {
      const res = await pgPool.query(text, params);
      const duration = Date.now() - start;
      console.log(`[PostgreSQL DB] Executed query in ${duration}ms (${res.rowCount} rows)`);
      return res;
    } catch (error) {
      console.error('[PostgreSQL DB] Query Error:', error);
      throw error;
    }
  } else {
    try {
      let sqliteSql = text.replace(/\$(\d+)/g, '?');
      const isReturning = /RETURNING/i.test(sqliteSql);

      let cleanSql = sqliteSql;
      if (isReturning) {
        cleanSql = sqliteSql.replace(/\s+RETURNING\s+.*/is, '');
      }

      let rows = [];
      const trimmedSql = cleanSql.trim().toUpperCase();

      if (trimmedSql.startsWith('SELECT')) {
        rows = await sqliteDb.all(cleanSql, params);
      } else {
        await sqliteDb.run(cleanSql, params);
        rows = [];
      }

      const duration = Date.now() - start;
      console.log(`[Database] Query executed in ${duration}ms (${rows.length} rows)`);
      return {
        rows: rows || [],
        rowCount: rows ? rows.length : 0,
      };
    } catch (error) {
      console.error('[Database] Query Error:', error);
      throw error;
    }
  }
};
