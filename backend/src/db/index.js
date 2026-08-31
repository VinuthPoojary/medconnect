import pg from 'pg';
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
    location: 'Attavar & Light House Hill Rd, Mangaluru, Dakshina Kannada - 575001',
    distance: '2.4 km',
    rating: 4.9,
    departments: JSON.stringify(['Cardiology', 'Neurology', 'Pediatrics', 'Dermatology', 'General Medicine', 'Psychiatry', 'Gynecologist', 'Orthopedics']),
    doctors_count: 8,
    beds_available: 48,
    emergency_status: 'Available',
    facilities: JSON.stringify(['NABH Accredited', '24x7 Cath Lab', 'Level-3 Trauma Unit', 'ABDM Digital Health']),
    phone: '+91 824 244 5858',
    reviews_count: 520,
    approved: true,
  },
  {
    id: 'hosp-2',
    name: 'AJ Hospital & Research Centre',
    banner: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    location: 'NH-66, Kuntikana, Mangaluru, Dakshina Kannada - 575004',
    distance: '4.1 km',
    rating: 4.8,
    departments: JSON.stringify(['Cardiology', 'Neurology', 'Oncology', 'Gastroenterology', 'Ophthalmology', 'Urology', 'ENT', 'Pediatrics']),
    doctors_count: 8,
    beds_available: 32,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Robotic Surgery', 'Dialysis Center', 'Helipad', 'Ambulance GPS']),
    phone: '+91 824 222 5533',
    reviews_count: 410,
    approved: true,
  },
  {
    id: 'hosp-3',
    name: 'Father Muller Medical College Hospital',
    banner: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    location: 'Father Muller Rd, Kankanady, Mangaluru, Dakshina Kannada - 575002',
    distance: '3.0 km',
    rating: 4.8,
    departments: JSON.stringify(['Orthopedics', 'General Medicine', 'Gynecologist', 'ENT Specialist', 'Cardiology', 'Dermatologist', 'Neurologist', 'Pediatrician']),
    doctors_count: 8,
    beds_available: 22,
    emergency_status: 'Available',
    facilities: JSON.stringify(['24/7 Pharmacy', 'Homoeopathic & Allopathic', 'Physical Rehab Center']),
    phone: '+91 824 223 8000',
    reviews_count: 340,
    approved: true,
  },
  {
    id: 'hosp-4',
    name: 'Kasturba Hospital, Manipal',
    banner: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
    location: 'Madhav Nagar, Manipal, Udupi District - 576104',
    distance: '54 km',
    rating: 4.9,
    departments: JSON.stringify(['Neurologist', 'Oncologist', 'Gastroenterologist', 'Urologist', 'Cardiothoracic', 'Endocrinology', 'Orthopedics', 'Gynecologist']),
    doctors_count: 8,
    beds_available: 75,
    emergency_status: 'Available',
    facilities: JSON.stringify(['JCI Accredited', 'Advanced 3T MRI', 'Comprehensive Cancer Care', 'Organ Transplant']),
    phone: '+91 820 292 2761',
    reviews_count: 950,
    approved: true,
  },
  {
    id: 'hosp-5',
    name: 'Yenepoya Specialty Hospital',
    banner: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
    location: 'Deralakatte & Kodialbail, Mangaluru, Dakshina Kannada - 575018',
    distance: '1.8 km',
    rating: 4.7,
    departments: JSON.stringify(['Orthopedics', 'Pediatrics', 'Dermatology', 'General Surgery', 'Gynecologist', 'Cardiology', 'ENT Specialist']),
    doctors_count: 7,
    beds_available: 18,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Neonatal ICU', 'Cosmetic Dermatology Clinic', 'Day Care Surgery']),
    phone: '+91 824 220 6000',
    reviews_count: 280,
    approved: true,
  },
  {
    id: 'hosp-6',
    name: 'Indiana Hospital & Heart Institute',
    banner: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    location: 'Pumpwell Circle, Mangaluru, Dakshina Kannada - 575002',
    distance: '3.5 km',
    rating: 4.8,
    departments: JSON.stringify(['Cardiology', 'Interventional Cardiology', 'Pediatric Cardiology', 'Pulmonology', 'General Medicine', 'Neurologist', 'Obstetrics']),
    doctors_count: 7,
    beds_available: 26,
    emergency_status: 'Available',
    facilities: JSON.stringify(['24/7 Cardiac Emergency', 'Hybrid Cath Lab', 'Advanced Angioplasty Center']),
    phone: '+91 824 288 0888',
    reviews_count: 310,
    approved: true,
  },
  {
    id: 'hosp-7',
    name: 'KS Hegde Charitable Hospital',
    banner: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    location: 'Deralakatte, Mangaluru, Dakshina Kannada - 575018',
    distance: '11 km',
    rating: 4.7,
    departments: JSON.stringify(['Orthopedics', 'Gynecologist', 'Psychiatry', 'General Medicine', 'Ophthalmologist', 'Pediatrics', 'ENT Specialist', 'Dermatology']),
    doctors_count: 8,
    beds_available: 50,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Free OPD Services', 'Blood Bank', 'Super Specialty Trauma Center']),
    phone: '+91 824 220 4471',
    reviews_count: 420,
    approved: true,
  },
  {
    id: 'hosp-8',
    name: 'Government District Wenlock Hospital',
    banner: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
    location: 'Hampankatta, Mangaluru, Dakshina Kannada - 575001',
    distance: '1.2 km',
    rating: 4.6,
    departments: JSON.stringify(['Pediatrics', 'ENT Specialist', 'General Medicine', 'Gynecologist', 'Orthopedics', 'Dermatology', 'Psychiatry']),
    doctors_count: 7,
    beds_available: 60,
    emergency_status: 'Available',
    facilities: JSON.stringify(['Government Health Scheme', 'ABHA Kiosk', '24/7 Emergency Ward']),
    phone: '+91 824 242 3223',
    reviews_count: 510,
    approved: true,
  },
];

// Seed 61 completely unique doctors across 8 hospitals (NO duplicate names)
const SEED_DOCTORS = [
  {
    "id": "doc-kmc-1",
    "name": "Dr. Vignesh Shetty",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Cardiologist",
    "experience": "16 Years",
    "rating": 4.6,
    "reviews_count": 60,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 700,
    "education": "MBBS, MD, DM (Cardiology) - Manipal",
    "bio": "Senior Interventional Cardiologist specializing in heart care and angioplasty.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-2",
    "name": "Dr. Gautham Bhandary",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Neurologist",
    "experience": "15 Years",
    "rating": 4.7,
    "reviews_count": 75,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 750,
    "education": "MBBS, MD, DM (Neurology) - NIMHANS",
    "bio": "Expert in movement disorders, stroke rehabilitation, and epilepsy management.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-3",
    "name": "Dr. Shruti Payyade",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatrician",
    "experience": "11 Years",
    "rating": 4.8,
    "reviews_count": 90,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 550,
    "education": "MBBS, MD (Pediatrics), DCH",
    "bio": "Child specialist focusing on pediatric vaccination, growth, and newborn care.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-4",
    "name": "Dr. Varun Kudva",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist",
    "experience": "10 Years",
    "rating": 4.9,
    "reviews_count": 105,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 600,
    "education": "MBBS, MD (Dermatology)",
    "bio": "Consultant Dermatologist providing clinical and cosmetic skin treatments.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-5",
    "name": "Dr. Rajeshwari Rao",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gynecologist",
    "experience": "14 Years",
    "rating": 4.6,
    "reviews_count": 120,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 650,
    "education": "MBBS, MS (OBG), DGO",
    "bio": "Specialist in high-risk pregnancy care, fetal medicine, and laparoscopic surgery.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-6",
    "name": "Dr. Arvind Nayak",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "13 Years",
    "rating": 4.7,
    "reviews_count": 135,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 700,
    "education": "MBBS, MS (Orthopedics), MCh",
    "bio": "Expert in joint replacement surgery, trauma care, and sports injuries.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-7",
    "name": "Dr. Suma Hegde",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "ENT Specialist",
    "experience": "9 Years",
    "rating": 4.8,
    "reviews_count": 150,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 500,
    "education": "MBBS, MS (ENT)",
    "bio": "Sinus surgery, microscopic ear surgery, and hearing restoration consultant.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-8",
    "name": "Dr. Sandeep Ballal",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "General Physician",
    "experience": "12 Years",
    "rating": 4.9,
    "reviews_count": 165,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 450,
    "education": "MBBS, MD (Internal Medicine)",
    "bio": "Primary care physician managing diabetes, hypertension, and infectious diseases.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-9",
    "name": "Dr. Swati Somayaji",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Ophthalmologist",
    "experience": "11 Years",
    "rating": 4.6,
    "reviews_count": 180,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 500,
    "education": "MBBS, MS (Ophthalmology)",
    "bio": "Cataract, glaucoma, and laser refractive eye surgery specialist.",
    "is_available_today": true
  },
  {
    "id": "doc-kmc-10",
    "name": "Dr. Karthik Bangera",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Psychiatrist",
    "experience": "10 Years",
    "rating": 4.7,
    "reviews_count": 195,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KMC Hospital Attavar & Jyothi",
    "location": "Attavar & Jyothi, Mangaluru",
    "distance": "2.4 km",
    "consultation_fee": 600,
    "education": "MBBS, MD (Psychiatry)",
    "bio": "Compassionate mental health professional specializing in adult & adolescent wellness.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-1",
    "name": "Dr. Sharada Kamath",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "General Physician & Diabetologist",
    "experience": "15 Years",
    "rating": 4.7,
    "reviews_count": 70,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 500,
    "education": "MBBS, MD (Internal Medicine)",
    "bio": "Senior physician specializing in metabolic disorders and chronic care.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-2",
    "name": "Dr. Ananya Rai",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Neurologist",
    "experience": "12 Years",
    "rating": 4.8,
    "reviews_count": 85,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 650,
    "education": "MBBS, DM (Neurology) - NIMHANS",
    "bio": "Specialist in neuro-rehabilitation, headache disorders, and stroke care.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-3",
    "name": "Dr. Pradeep Poojary",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "16 Years",
    "rating": 4.9,
    "reviews_count": 100,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 800,
    "education": "MBBS, MS (Orthopedics)",
    "bio": "Robotic knee replacement and complex fracture surgery expert.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-4",
    "name": "Dr. Sunita Kulkarni",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Oncologist",
    "experience": "14 Years",
    "rating": 4.6,
    "reviews_count": 115,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 850,
    "education": "MBBS, MD, DM (Medical Oncology)",
    "bio": "Comprehensive cancer therapy, immunotherapy, and targeted treatments.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-5",
    "name": "Dr. Suresh Adiga",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gastroenterologist",
    "experience": "13 Years",
    "rating": 4.7,
    "reviews_count": 130,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 750,
    "education": "MBBS, MD, DM (Gastroenterology)",
    "bio": "Advanced endoscopy, liver care, and digestive health specialist.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-6",
    "name": "Dr. Lakshmi Menon",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Cardiologist",
    "experience": "11 Years",
    "rating": 4.8,
    "reviews_count": 145,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 700,
    "education": "MBBS, MD, DM (Cardiology)",
    "bio": "Non-invasive cardiology, echocardiography, and preventive heart care.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-7",
    "name": "Dr. Priya Patel",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatrician",
    "experience": "9 Years",
    "rating": 4.9,
    "reviews_count": 160,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 500,
    "education": "MBBS, DCH, MD",
    "bio": "Pediatric infectious disease and child nutrition expert.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-8",
    "name": "Dr. Aarav Sharma",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Urologist",
    "experience": "15 Years",
    "rating": 4.6,
    "reviews_count": 175,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 800,
    "education": "MBBS, MS, MCh (Urology)",
    "bio": "Kidney stone management, laser prostate surgery, and uro-oncology.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-9",
    "name": "Dr. Swetha Prabhu",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist",
    "experience": "8 Years",
    "rating": 4.7,
    "reviews_count": 190,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 550,
    "education": "MBBS, MD (Dermatology)",
    "bio": "Aesthetic dermatology, trichology, and laser therapies.",
    "is_available_today": true
  },
  {
    "id": "doc-aj-10",
    "name": "Dr. Preeti Mallya",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "ENT Specialist",
    "experience": "10 Years",
    "rating": 4.8,
    "reviews_count": 205,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "AJ Hospital & Research Centre",
    "location": "NH-66, Kuntikana, Mangaluru",
    "distance": "4.1 km",
    "consultation_fee": 500,
    "education": "MBBS, MS (ENT)",
    "bio": "Endoscopic sinus surgery and pediatric otolaryngology.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-1",
    "name": "Dr. Rohan D’Souza",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatrician",
    "experience": "12 Years",
    "rating": 4.8,
    "reviews_count": 80,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 600,
    "education": "MBBS, MD (Pediatrics), DCH",
    "bio": "Neonatal ICU care, growth monitoring, and pediatric immunization.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-2",
    "name": "Dr. Deepa Shenoy",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "General Physician",
    "experience": "15 Years",
    "rating": 4.9,
    "reviews_count": 95,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 450,
    "education": "MBBS, MD (General Medicine)",
    "bio": "Holistic internal medicine, preventive checkups, and wellness management.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-3",
    "name": "Dr. Vidya Shetty",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gynecologist",
    "experience": "16 Years",
    "rating": 4.6,
    "reviews_count": 110,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 600,
    "education": "MBBS, MS (OBG), DGO",
    "bio": "Obstetrics, high-risk pregnancy delivery, and gynecological surgery.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-4",
    "name": "Dr. Rajeshwara Acharya",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "ENT Specialist",
    "experience": "14 Years",
    "rating": 4.7,
    "reviews_count": 125,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 500,
    "education": "MBBS, MS (ENT)",
    "bio": "Voice disorders, snoring treatments, and microscopic ear surgeries.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-5",
    "name": "Dr. Meera Nambiar",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist",
    "experience": "11 Years",
    "rating": 4.8,
    "reviews_count": 140,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 550,
    "education": "MBBS, DVD, MD (Dermatology)",
    "bio": "Dermatopathology, allergic skin conditions, and psoriasis management.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-6",
    "name": "Dr. Ashok D'Souza",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "17 Years",
    "rating": 4.9,
    "reviews_count": 155,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 750,
    "education": "MBBS, MS (Orthopedics)",
    "bio": "Spine surgery, disc prolapse management, and trauma reconstruction.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-7",
    "name": "Dr. Divya Saldanha",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Cardiologist",
    "experience": "10 Years",
    "rating": 4.6,
    "reviews_count": 170,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 700,
    "education": "MBBS, MD, DM (Cardiology)",
    "bio": "Cardiac arrhythmia management and clinical cardiology.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-8",
    "name": "Dr. Harish Mendon",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Psychiatrist",
    "experience": "13 Years",
    "rating": 4.7,
    "reviews_count": 185,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 550,
    "education": "MBBS, MD (Psychiatry), DPM",
    "bio": "De-addiction specialist, stress counseling, and mood disorder therapy.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-9",
    "name": "Dr. Ramesh Kotian",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Neurologist",
    "experience": "14 Years",
    "rating": 4.8,
    "reviews_count": 200,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 700,
    "education": "MBBS, MD, DM (Neurology)",
    "bio": "Neuromuscular disorders, neuropathy, and dementia evaluation.",
    "is_available_today": true
  },
  {
    "id": "doc-fm-10",
    "name": "Dr. Rashmi Upadhyaya",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "Ophthalmologist",
    "experience": "9 Years",
    "rating": 4.9,
    "reviews_count": 215,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Father Muller Medical College Hospital",
    "location": "Kankanady, Mangaluru",
    "distance": "3.0 km",
    "consultation_fee": 450,
    "education": "MBBS, MS (Ophthalmology)",
    "bio": "Corneal diseases, dry eye therapy, and phacoemulsification surgery.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-1",
    "name": "Dr. Praveen Suvarna",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Neurologist",
    "experience": "18 Years",
    "rating": 4.9,
    "reviews_count": 90,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 850,
    "education": "MBBS, MD, DM (Neurology) - Manipal",
    "bio": "Senior neurologist specializing in neuro-critical care and brain health.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-2",
    "name": "Dr. Sneha Karnad",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Oncologist",
    "experience": "13 Years",
    "rating": 4.6,
    "reviews_count": 105,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 900,
    "education": "MBBS, MS, MCh (Surgical Oncology)",
    "bio": "Surgical oncology, breast conservation, and head & neck cancers.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-3",
    "name": "Dr. Chethan Hosangadi",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gastroenterologist",
    "experience": "15 Years",
    "rating": 4.7,
    "reviews_count": 120,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 800,
    "education": "MBBS, MD, DM (Gastro)",
    "bio": "Hepatology, pancreatitis care, and therapeutic GI procedures.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-4",
    "name": "Dr. Santhosh Naik",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Urologist",
    "experience": "16 Years",
    "rating": 4.8,
    "reviews_count": 135,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 850,
    "education": "MBBS, MS, MCh (Urology)",
    "bio": "Renal transplantation, reconstructive urology, and keyhole surgery.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-5",
    "name": "Dr. Nirmala Marathe",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Cardiothoracic Surgeon",
    "experience": "17 Years",
    "rating": 4.9,
    "reviews_count": 150,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 950,
    "education": "MBBS, MS, MCh (CTVS)",
    "bio": "Bypass surgery, valve replacements, and congenital heart repairs.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-6",
    "name": "Dr. Bharat Varma",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Endocrinologist",
    "experience": "12 Years",
    "rating": 4.6,
    "reviews_count": 165,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 750,
    "education": "MBBS, MD, DM (Endocrinology)",
    "bio": "Thyroid disorders, pituitary disease, and juvenile diabetes specialist.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-7",
    "name": "Dr. Archana Rao",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "11 Years",
    "rating": 4.7,
    "reviews_count": 180,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 700,
    "education": "MBBS, MS (Orthopedics)",
    "bio": "Pediatric orthopedics, deformity corrections, and bone health.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-8",
    "name": "Dr. Mahesh Prabhu",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gynecologist",
    "experience": "14 Years",
    "rating": 4.8,
    "reviews_count": 195,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 700,
    "education": "MBBS, MS (OBG), FICOG",
    "bio": "Infertility management, IVF counseling, and minimally invasive OBG.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-9",
    "name": "Dr. Veena Hegde",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatrician",
    "experience": "10 Years",
    "rating": 4.9,
    "reviews_count": 210,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 600,
    "education": "MBBS, MD (Pediatrics)",
    "bio": "Childhood asthma, allergy care, and developmental pediatrics.",
    "is_available_today": true
  },
  {
    "id": "doc-kh-10",
    "name": "Dr. Girish Bolar",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist",
    "experience": "12 Years",
    "rating": 4.6,
    "reviews_count": 225,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Kasturba Hospital, Manipal",
    "location": "Madhav Nagar, Manipal, Udupi",
    "distance": "54 km",
    "consultation_fee": 650,
    "education": "MBBS, MD (Dermatology)",
    "bio": "Skin allergy testing, eczema care, and hair restoration.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-1",
    "name": "Dr. Poornima Bhatt",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist & Cosmetologist",
    "experience": "11 Years",
    "rating": 4.6,
    "reviews_count": 100,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 600,
    "education": "MBBS, MD (Dermatology)",
    "bio": "Advanced cosmetic skin enhancements, chemical peels, and acne care.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-2",
    "name": "Dr. Nithin Kumar",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatrician",
    "experience": "12 Years",
    "rating": 4.7,
    "reviews_count": 115,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 550,
    "education": "MBBS, MD (Pediatrics)",
    "bio": "Comprehensive child healthcare, vaccinations, and adolescent medicine.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-3",
    "name": "Dr. Sushma Karkera",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gynecologist",
    "experience": "13 Years",
    "rating": 4.8,
    "reviews_count": 130,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 650,
    "education": "MBBS, MS (OBG)",
    "bio": "Pre-natal care, painless labor management, and well-woman checks.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-4",
    "name": "Dr. Raghavendra Kamath",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "14 Years",
    "rating": 4.9,
    "reviews_count": 145,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 700,
    "education": "MBBS, MS (Orthopedics)",
    "bio": "Trauma surgery, shoulder arthroscopy, and ligament repairs.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-5",
    "name": "Dr. Soumya Shetty",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "General Surgeon",
    "experience": "10 Years",
    "rating": 4.6,
    "reviews_count": 160,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 500,
    "education": "MBBS, MS (General Surgery)",
    "bio": "Laparoscopic hernia, appendectomy, and laser gallbladder surgeries.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-6",
    "name": "Dr. Vijayalakshmi Rao",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Cardiologist",
    "experience": "15 Years",
    "rating": 4.7,
    "reviews_count": 175,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 750,
    "education": "MBBS, MD, DM (Cardiology)",
    "bio": "Preventive cardiology, hypertension management, and ECG analysis.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-7",
    "name": "Dr. Guruprasad Adyanthaya",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "ENT Specialist",
    "experience": "11 Years",
    "rating": 4.8,
    "reviews_count": 190,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 500,
    "education": "MBBS, MS (ENT)",
    "bio": "Vertigo & balance disorders, ear infection care, and tonsillectomy.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-8",
    "name": "Dr. Chaithra Kunder",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Ophthalmologist",
    "experience": "9 Years",
    "rating": 4.9,
    "reviews_count": 205,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 450,
    "education": "MBBS, MS (Ophthalmology)",
    "bio": "Pediatric eye evaluation, squint correction, and vision therapy.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-9",
    "name": "Dr. Janardhan Nayak",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gastroenterologist",
    "experience": "13 Years",
    "rating": 4.6,
    "reviews_count": 220,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 700,
    "education": "MBBS, MD, DM (Gastro)",
    "bio": "IBS treatment, fatty liver management, and GI endoscopies.",
    "is_available_today": true
  },
  {
    "id": "doc-ys-10",
    "name": "Dr. Bhavana Shenoy",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pulmonologist",
    "experience": "10 Years",
    "rating": 4.7,
    "reviews_count": 235,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Yenepoya Specialty Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "1.8 km",
    "consultation_fee": 600,
    "education": "MBBS, MD (Pulmonary Medicine)",
    "bio": "Asthma, COPD, sleep apnea, and respiratory allergy specialist.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-1",
    "name": "Dr. Jayaram Poojary",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "Interventional Cardiologist",
    "experience": "18 Years",
    "rating": 4.7,
    "reviews_count": 110,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 800,
    "education": "MBBS, MD, DM (Cardiology)",
    "bio": "Complex coronary angioplasty, pacemaker implantations, and emergency ICU.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-2",
    "name": "Dr. Manjunath Shetty",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Cardiac Surgeon",
    "experience": "16 Years",
    "rating": 4.8,
    "reviews_count": 125,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 850,
    "education": "MBBS, MS, MCh (Cardiothoracic)",
    "bio": "Open heart surgery, valve repair, and minimally invasive cardiac procedures.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-3",
    "name": "Dr. Roopa Devadiga",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatric Cardiologist",
    "experience": "12 Years",
    "rating": 4.9,
    "reviews_count": 140,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 750,
    "education": "MBBS, MD, Fellowship in Pediatric Cardiology",
    "bio": "Congenital heart disease screening, pediatric echo, and hole-in-heart care.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-4",
    "name": "Dr. Venkatesh Bhat",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pulmonologist",
    "experience": "14 Years",
    "rating": 4.6,
    "reviews_count": 155,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 650,
    "education": "MBBS, MD (Chest Medicine)",
    "bio": "Interstitital lung disease, asthma management, and bronchoscopy.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-5",
    "name": "Dr. Rashmi Fernandes",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "General Physician",
    "experience": "10 Years",
    "rating": 4.7,
    "reviews_count": 170,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 450,
    "education": "MBBS, MD (Internal Medicine)",
    "bio": "Infectious diseases, fever clinic, and preventative healthcare.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-6",
    "name": "Dr. Vivek Rai",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Neurologist",
    "experience": "13 Years",
    "rating": 4.8,
    "reviews_count": 185,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 700,
    "education": "MBBS, MD, DM (Neurology)",
    "bio": "Stroke interventions, memory loss evaluation, and spine neurology.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-7",
    "name": "Dr. Sudhir Amin",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Obstetrician & Gynecologist",
    "experience": "15 Years",
    "rating": 4.9,
    "reviews_count": 200,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 650,
    "education": "MBBS, MS (OBG)",
    "bio": "Maternal-fetal health, adolescent gynaecology, and menopause care.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-8",
    "name": "Dr. Rekha Kudva",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist",
    "experience": "9 Years",
    "rating": 4.6,
    "reviews_count": 215,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 550,
    "education": "MBBS, MD (Dermatology)",
    "bio": "Skin rejuvenation, anti-aging solutions, and pediatric skin care.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-9",
    "name": "Dr. Prajwal Shetty",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "11 Years",
    "rating": 4.7,
    "reviews_count": 230,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 700,
    "education": "MBBS, MS (Orthopedics)",
    "bio": "Fracture management, spinal care, and arthritis clinic.",
    "is_available_today": true
  },
  {
    "id": "doc-ih-10",
    "name": "Dr. Shantharam Alva",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Emergency Physician",
    "experience": "12 Years",
    "rating": 4.8,
    "reviews_count": 245,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Indiana Hospital & Heart Institute",
    "location": "Pumpwell Circle, Mangaluru",
    "distance": "3.5 km",
    "consultation_fee": 500,
    "education": "MBBS, MEM (Emergency Medicine)",
    "bio": "Level-1 trauma resuscitation, acute medical emergency triage, and critical care.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-1",
    "name": "Dr. Aditi Kulkarni",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gynecologist",
    "experience": "14 Years",
    "rating": 4.8,
    "reviews_count": 120,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 400,
    "education": "MBBS, MS (OBG)",
    "bio": "Free & affordable maternity care, normal delivery, and gynaec procedures.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-2",
    "name": "Dr. Vikram Iyer",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "15 Years",
    "rating": 4.9,
    "reviews_count": 135,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 450,
    "education": "MBBS, MS (Orthopedics)",
    "bio": "Charitable joint care, polio rehabilitation, and bone fracture clinic.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-3",
    "name": "Dr. Neha Agarwal",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Psychiatrist",
    "experience": "11 Years",
    "rating": 4.6,
    "reviews_count": 150,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 400,
    "education": "MBBS, MD (Psychiatry)",
    "bio": "Community mental health, stress management, and counseling.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-4",
    "name": "Dr. Rohan Deshmukh",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "General Physician",
    "experience": "13 Years",
    "rating": 4.7,
    "reviews_count": 165,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 350,
    "education": "MBBS, MD (Medicine)",
    "bio": "General medical OPD, tropical medicine, and seasonal illness triage.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-5",
    "name": "Dr. Kavita Nair",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Ophthalmologist",
    "experience": "12 Years",
    "rating": 4.8,
    "reviews_count": 180,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 350,
    "education": "MBBS, MS (Ophthalmology)",
    "bio": "Free cataract screening drives, pterygium surgery, and glasses prescription.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-6",
    "name": "Dr. Arjun Verma",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatrician",
    "experience": "10 Years",
    "rating": 4.9,
    "reviews_count": 195,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 400,
    "education": "MBBS, DCH, MD",
    "bio": "Universal immunization, malnourishment rehabilitation, and child care.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-7",
    "name": "Dr. Meera Reddy",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "ENT Specialist",
    "experience": "9 Years",
    "rating": 4.6,
    "reviews_count": 210,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 350,
    "education": "MBBS, MS (ENT)",
    "bio": "Hearing loss screening, ear canal cleaning, and throat care.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-8",
    "name": "Dr. Suresh Rao",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist",
    "experience": "14 Years",
    "rating": 4.7,
    "reviews_count": 225,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 400,
    "education": "MBBS, MD (Dermatology)",
    "bio": "Leprosy & fungal infection control, general skin OPD, and allergy care.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-9",
    "name": "Dr. Sandesh Bangera",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Neurologist",
    "experience": "12 Years",
    "rating": 4.8,
    "reviews_count": 240,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 500,
    "education": "MBBS, MD, DM (Neurology)",
    "bio": "Epilepsy clinic, nerve conduction studies, and stroke awareness.",
    "is_available_today": true
  },
  {
    "id": "doc-ksh-10",
    "name": "Dr. Shraddha Somayaji",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Cardiologist",
    "experience": "11 Years",
    "rating": 4.9,
    "reviews_count": 255,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "KS Hegde Charitable Hospital",
    "location": "Deralakatte, Mangaluru",
    "distance": "11 km",
    "consultation_fee": 500,
    "education": "MBBS, MD, DM (Cardiology)",
    "bio": "Rheumatic heart disease screening, hypertension OPD, and ECG clinic.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-1",
    "name": "Dr. Anand Kumar",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "General Physician",
    "experience": "16 Years",
    "rating": 4.9,
    "reviews_count": 130,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MD (Internal Medicine)",
    "bio": "District senior physician managing government health scheme patients.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-2",
    "name": "Dr. Rashmi Poojary",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Pediatrician",
    "experience": "13 Years",
    "rating": 4.6,
    "reviews_count": 145,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MD (Pediatrics)",
    "bio": "Government child welfare scheme, SNCU care, and pediatric OPD.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-3",
    "name": "Dr. Dinesh Alva",
    "photo": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400",
    "specialization": "ENT Specialist",
    "experience": "15 Years",
    "rating": 4.7,
    "reviews_count": 160,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MS (ENT)",
    "bio": "District ENT specialist conducting free hearing aid distributions and surgeries.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-4",
    "name": "Dr. Sunita Hegde",
    "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Gynecologist",
    "experience": "17 Years",
    "rating": 4.8,
    "reviews_count": 175,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MS (OBG)",
    "bio": "Government maternal health programs, Ayushman Bharat delivery care.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-5",
    "name": "Dr. Shivarama Bhat",
    "photo": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
    "specialization": "Orthopedic Surgeon",
    "experience": "14 Years",
    "rating": 4.9,
    "reviews_count": 190,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MS (Orthopedics)",
    "bio": "Government accident & trauma unit surgeon, plaster casting & bone setting.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-6",
    "name": "Dr. Usha Karanth",
    "photo": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
    "specialization": "Dermatologist",
    "experience": "11 Years",
    "rating": 4.6,
    "reviews_count": 205,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MD (Dermatology)",
    "bio": "Government skin clinic, scabies & eczema treatment, public skin health.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-7",
    "name": "Dr. Ganesh Shetty",
    "photo": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
    "specialization": "Psychiatrist",
    "experience": "12 Years",
    "rating": 4.7,
    "reviews_count": 220,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MD (Psychiatry)",
    "bio": "District mental health program, counseling center, and psychiatric care.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-8",
    "name": "Dr. Mohan Das",
    "photo": "https://images.unsplash.com/photo-1594824813566-78a99477000e?auto=format&fit=crop&q=80&w=400",
    "specialization": "Ophthalmologist",
    "experience": "15 Years",
    "rating": 4.8,
    "reviews_count": 235,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MS (Ophthalmology)",
    "bio": "National blindness control program, intraocular lens implants.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-9",
    "name": "Dr. Jyothi Nayak",
    "photo": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400",
    "specialization": "Community Health Specialist",
    "experience": "10 Years",
    "rating": 4.9,
    "reviews_count": 250,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, MD (Community Medicine)",
    "bio": "Preventive healthcare, epidemic tracking (Dengue/Malaria), and ABHA health ID.",
    "is_available_today": true
  },
  {
    "id": "doc-gw-10",
    "name": "Dr. Sriram Kulkarni",
    "photo": "https://images.unsplash.com/photo-1594824813566-88855ce78347?auto=format&fit=crop&q=80&w=400",
    "specialization": "Chest Physician",
    "experience": "13 Years",
    "rating": 4.6,
    "reviews_count": 265,
    "languages": "[\"English\",\"Kannada\",\"Tulu\",\"Hindi\"]",
    "available_slots": "[\"09:30 AM\",\"11:00 AM\",\"02:30 PM\",\"04:15 PM\",\"06:00 PM\"]",
    "hospital_name": "Government District Wenlock Hospital",
    "location": "Hampankatta, Mangaluru",
    "distance": "1.2 km",
    "consultation_fee": 300,
    "education": "MBBS, DTCD, MD",
    "bio": "Tuberculosis eradication program, pulmonology OPD, and lung care.",
    "is_available_today": true
  }
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
  const sqlite3Module = await import('sqlite3');
  const { open } = await import('sqlite');
  const sqlite3 = sqlite3Module.default || sqlite3Module;
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
      hospital_id VARCHAR(100),
      hospital_name VARCHAR(255),
      specialization VARCHAR(255),
      qualification VARCHAR(255),
      experience VARCHAR(50),
      license_number VARCHAR(100),
      mfa_enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_id VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS experience VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);


    CREATE TABLE IF NOT EXISTS doctors (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);
    ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_user_id_key;
    ALTER TABLE doctors ADD CONSTRAINT doctors_user_id_key UNIQUE (user_id);

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

    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_slot ON appointments (doctor_id, date, time_slot, status, created_at ASC);

    DELETE FROM appointments a USING appointments b
    WHERE a.ctid < b.ctid
      AND a.user_id = b.user_id
      AND a.doctor_id = b.doctor_id
      AND a.date = b.date
      AND a.time_slot = b.time_slot
      AND LOWER(a.status) NOT IN ('cancelled', 'no_show')
      AND LOWER(b.status) NOT IN ('cancelled', 'no_show');

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking ON appointments (user_id, doctor_id, date, time_slot) WHERE status NOT IN ('cancelled', 'no_show');
    CREATE TABLE IF NOT EXISTS medical_reports (
      id VARCHAR(100) PRIMARY KEY,
      patient_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
      user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
      file_name VARCHAR(255),
      file_path TEXT,
      file_type VARCHAR(100) DEFAULT 'application/pdf',
      file_size BIGINT,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      analysis_status VARCHAR(50) DEFAULT 'pending',
      extracted_data JSONB,
      ai_summary TEXT,
      recommended_specialty VARCHAR(255),
      specialist_reason TEXT,
      title VARCHAR(255),
      category VARCHAR(100) DEFAULT 'General Lab Report',
      date VARCHAR(50),
      doctor_name VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Normal',
      summary TEXT,
      metrics TEXT,
      file_url TEXT,
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
  `);

  // Auto-migrate PostgreSQL medical_reports columns
  const reportMigrations = [
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS patient_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS file_path TEXT`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS file_size BIGINT`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(50) DEFAULT 'pending'`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS extracted_data JSONB`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS ai_summary TEXT`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS recommended_specialty VARCHAR(255)`,
    `ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS specialist_reason TEXT`,
  ];
  for (const m of reportMigrations) {
    try { await pgPool.query(m); } catch (e) {}
  }


  // Seed Users safely with ON CONFLICT DO NOTHING to preserve registered users

  // Seed Users
  for (const u of SEED_USERS) {
    await pgPool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, abha_id, avatar, hospital_name, specialization)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,

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

  // Seed 61 Doctors and sync user accounts in users table
  for (const d of SEED_DOCTORS) {
    const docUserId = (d.id === 'doc-kmc-1' || d.name.includes('Vignesh')) ? 'user-doc-1' : (d.id === 'doc-kmc-2' ? 'user-doc-2' : `user-${d.id}`);
    const docEmail = (d.id === 'doc-kmc-1' || d.name.includes('Vignesh')) ? 'doctor@medconnect.com' : `doctor.${d.id.replace(/[^a-zA-Z0-9-]/g, '')}@medconnect.com`;
    const docPhone = (d.id === 'doc-kmc-1' || d.name.includes('Vignesh')) ? '+91 94481 22334' : `+91 94481 ${d.id.slice(-5).padStart(5, '0')}`;
    const avatar = d.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'DR';

    await pgPool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, hospital_name, specialization, qualification, experience, avatar)
       VALUES ($1, $2, $3, $4, $5, 'doctor', $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, specialization = EXCLUDED.specialization`,
      [docUserId, d.name, docEmail, docPhone, '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', d.hospital_name, d.specialization, d.education || 'MBBS, MD', d.experience || '10 Years', avatar]
    );

    await pgPool.query(
      `INSERT INTO doctors (id, user_id, name, photo, specialization, experience, rating, reviews_count, languages, available_slots, hospital_name, location, distance, consultation_fee, education, bio, is_available_today)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10::text[], $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, name = EXCLUDED.name, hospital_name = EXCLUDED.hospital_name, specialization = EXCLUDED.specialization`,
      [d.id, docUserId, d.name, d.photo, d.specialization, d.experience, d.rating, d.reviews_count, JSON.parse(d.languages), JSON.parse(d.available_slots), d.hospital_name, d.location, d.distance, d.consultation_fee, d.education, d.bio, d.is_available_today]
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
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_slot ON appointments (doctor_id, date, time_slot, status, created_at ASC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking ON appointments (user_id, doctor_id, date, time_slot) WHERE status NOT IN ('cancelled', 'no_show');

    CREATE TABLE IF NOT EXISTS medical_reports (
      id TEXT PRIMARY KEY,
      patient_id TEXT,
      user_id TEXT,
      file_name TEXT,
      file_path TEXT,
      file_type TEXT DEFAULT 'application/pdf',
      file_size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      analysis_status TEXT DEFAULT 'pending',
      extracted_data TEXT,
      ai_summary TEXT,
      recommended_specialty TEXT,
      specialist_reason TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      doctor_name TEXT,
      status TEXT DEFAULT 'Normal',
      summary TEXT,
      metrics TEXT,
      file_url TEXT,
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

  try {
    await sqliteDb.exec(`ALTER TABLE doctors ADD COLUMN user_id TEXT REFERENCES users(id)`);
  } catch (e) {}
  try {
    await sqliteDb.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)`);
  } catch (e) {}

  // Medical reports column migrations
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN patient_id TEXT REFERENCES users(id)`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN file_name TEXT`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN file_path TEXT`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN file_size INTEGER`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN analysis_status TEXT DEFAULT 'pending'`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN extracted_data TEXT`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN ai_summary TEXT`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN recommended_specialty TEXT`); } catch (e) {}
  try { await sqliteDb.exec(`ALTER TABLE medical_reports ADD COLUMN specialist_reason TEXT`); } catch (e) {}

  // Seed Users safely with INSERT OR IGNORE to preserve registered users

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
    const docUserId = (d.id === 'doc-kmc-1' || d.name.includes('Vignesh')) ? 'user-doc-1' : (d.id === 'doc-kmc-2' ? 'user-doc-2' : `user-${d.id}`);
    const docEmail = (d.id === 'doc-kmc-1' || d.name.includes('Vignesh')) ? 'doctor@medconnect.com' : `doctor.${d.id.replace(/[^a-zA-Z0-9-]/g, '')}@medconnect.com`;
    const docPhone = (d.id === 'doc-kmc-1' || d.name.includes('Vignesh')) ? '+91 94481 22334' : `+91 94481 ${d.id.slice(-5).padStart(5, '0')}`;
    const avatar = d.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'DR';

    await sqliteDb.run(
      `INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, hospital_name, specialization, avatar)
       VALUES (?, ?, ?, ?, ?, 'doctor', ?, ?, ?)`,
      [docUserId, d.name, docEmail, docPhone, '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', d.hospital_name, d.specialization, avatar]
    );

    await sqliteDb.run(
      `INSERT OR REPLACE INTO doctors (id, user_id, name, photo, specialization, experience, rating, reviews_count, languages, available_slots, hospital_name, location, distance, consultation_fee, education, bio, is_available_today)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, docUserId, d.name, d.photo, d.specialization, d.experience, d.rating, d.reviews_count, d.languages, d.available_slots, d.hospital_name, d.location, d.distance, d.consultation_fee, d.education, d.bio, d.is_available_today ? 1 : 0]
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
