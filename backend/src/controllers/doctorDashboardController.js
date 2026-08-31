import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { emitQueueUpdate } from '../socket.js';

/**
 * Helper function to map authenticated user.id to doctor record in `doctors` table
 * Flow: authenticated users.id -> doctors.user_id -> doctor.id
 */
export const getDoctorForUser = async (userId, userName) => {
  if (!userId && !userName) return null;

  // 1. SELECT * FROM doctors WHERE user_id = authenticatedUser.id
  if (userId) {
    let res = await query('SELECT * FROM doctors WHERE user_id = $1 LIMIT 1', [userId]);
    if (res.rows && res.rows.length > 0) return res.rows[0];

    // 2. Fallback SELECT * FROM doctors WHERE id = userId
    res = await query('SELECT * FROM doctors WHERE id = $1 LIMIT 1', [userId]);
    if (res.rows && res.rows.length > 0) return res.rows[0];

    // 3. Fallback check user's email/phone against doctors table
    const userRes = await query('SELECT email, phone, name FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (userRes.rows && userRes.rows.length > 0) {
      const u = userRes.rows[0];
      res = await query(
        `SELECT * FROM doctors 
         WHERE (email = $1 AND $1 IS NOT NULL AND $1 != '') 
            OR (phone = $2 AND $2 IS NOT NULL AND $2 != '') 
            OR LOWER(name) = LOWER($3) 
         LIMIT 1`,
        [u.email || '', u.phone || '', u.name || '']
      );
      if (res.rows && res.rows.length > 0) return res.rows[0];
    }
  }

  // 4. Fallback by userName
  if (userName) {
    const cleanName = userName.replace(/^Dr\.\s*/i, '').trim();
    const res = await query('SELECT * FROM doctors WHERE LOWER(name) LIKE LOWER($1) LIMIT 1', [`%${cleanName}%`]);
    if (res.rows && res.rows.length > 0) return res.rows[0];
  }

  return null;
};

/**
 * 0. Get Authenticated Doctor Identity
 * GET /api/doctor/me
 */
export const getDoctorMe = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found for authenticated user.' });
    }

    res.json({
      success: true,
      userId: doctor.user_id || req.user.id,
      doctorId: doctor.id,
      name: doctor.name,
      specialization: doctor.specialization,
      hospital: doctor.hospital_name || doctor.hospitalName || 'KMC Hospital',
      hospitalName: doctor.hospital_name || doctor.hospitalName || 'KMC Hospital',
      photo: doctor.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      role: 'doctor',
      experience: doctor.experience || '10 Years',
      education: doctor.education || doctor.qualification || 'MBBS, MD',
      rating: doctor.rating || 4.9,
      consultationFee: doctor.consultation_fee || 500,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 0b. Get Doctor's Today Appointments Only
 * GET /api/doctor/appointments/today
 */
export const getDoctorAppointmentsToday = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const result = await query(
      `SELECT 
        id, 
        user_id as "userId", 
        doctor_id as "doctorId", 
        doctor_name as "doctorName", 
        specialization, 
        hospital_name as "hospitalName", 
        date, 
        time_slot as "timeSlot", 
        queue_number as "queueNumber", 
        estimated_wait_time as "estimatedWaitTime", 
        status, 
        type, 
        patient_name as "patientName", 
        meeting_url as "meetingUrl", 
        created_at as "createdAt"
      FROM appointments 
      WHERE doctor_id = $1 AND (date = $2 OR date IS NULL) AND LOWER(status) != 'cancelled'
      ORDER BY queue_number ASC, created_at ASC`,
      [doctor.id, todayDate]
    );

    res.json({ success: true, appointments: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 1. Hospital / Admin adds a new Doctor
 * POST /api/hospital/doctors
 */
export const createDoctorByHospital = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      qualification,
      experience,
      licenseNumber,
      password,
      hospitalId,
      hospitalName,
      consultationFee,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and password are required.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Doctor account with this email or phone already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const docId = `doc-${Date.now()}`;
    const userId = `user-doc-${Date.now()}`;
    const hId = hospitalId || req.user?.hospitalId || 'hosp-1';
    const hName = hospitalName || req.user?.hospitalName || 'KMC Hospital Attavar & Jyothi';
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    // 1. Insert into users table with role = 'doctor'
    const insertUserSql = `
      INSERT INTO users (
        id, name, email, phone, password_hash, role, hospital_id, hospital_name, specialization, qualification, experience, license_number, avatar
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, email, phone, role, hospital_id as "hospitalId", hospital_name as "hospitalName", specialization, qualification, experience, license_number as "licenseNumber"
    `;

    const userRes = await query(insertUserSql, [
      userId, name, email, phone, passwordHash, 'doctor', hId, hName, specialization || 'General Physician', qualification || 'MBBS, MD', experience || '5 Years', licenseNumber || 'KA-MED-10023', avatar
    ]);

    // 2. Insert into doctors table linked via user_id
    const insertDocSql = `
      INSERT INTO doctors (
        id, user_id, name, email, phone, password_hash, photo, specialization, experience, qualification, license_number, hospital_id, hospital_name, available_slots, consultation_fee, education, bio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;

    const defaultSlots = ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM', '06:00 PM'];
    const photo = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400';

    await query(insertDocSql, [
      docId, userId, name, email, phone, passwordHash, photo, specialization || 'General Physician', experience || '5 Years', qualification || 'MBBS, MD', licenseNumber || 'KA-MED-10023', hId, hName, defaultSlots, consultationFee || 500, qualification || 'MBBS, MD', `Consultant ${specialization || 'General Physician'} at ${hName}.`
    ]);

    res.status(201).json({
      success: true,
      message: 'Doctor account created successfully',
      doctor: { ...userRes.rows[0], doctorId: docId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Get Logged-In Doctor Overview Stats
 * GET /api/doctor/overview
 * SECURITY: Uses authenticated doctor's ID from verified JWT (req.user.id)
 */
export const getDoctorOverview = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    const targetDocId = doctor ? doctor.id : req.user.id;
    const targetDocName = doctor ? doctor.name : req.user.name;

    // Doctor A's appointments
    const aptsRes = await query(
      `SELECT COUNT(*) as count FROM appointments WHERE (doctor_id = $1 OR doctor_name = $2) AND LOWER(status) != 'cancelled'`,
      [targetDocId, targetDocName]
    );

    // Doctor A's unique patients
    const patientRes = await query(
      `SELECT COUNT(DISTINCT user_id) as count FROM appointments WHERE (doctor_id = $1 OR doctor_name = $2)`,
      [targetDocId, targetDocName]
    );

    // Doctor A's prescriptions
    const rxRes = await query(
      `SELECT COUNT(*) as count FROM prescriptions WHERE (doctor_id = $1 OR doctor_name = $2)`,
      [targetDocId, targetDocName]
    );

    // Doctor A's medical reports
    const reportRes = await query(
      `SELECT COUNT(*) as count FROM medical_reports WHERE doctor_name = $1 OR user_id IN (SELECT DISTINCT user_id FROM appointments WHERE doctor_id = $2 OR doctor_name = $1)`,
      [targetDocName, targetDocId]
    );

    res.json({
      success: true,
      stats: {
        upcomingAppointments: parseInt(aptsRes.rows[0]?.count || '0', 10),
        totalPatients: parseInt(patientRes.rows[0]?.count || '0', 10),
        prescriptionsIssued: parseInt(rxRes.rows[0]?.count || '0', 10),
        medicalReportsCount: parseInt(reportRes.rows[0]?.count || '0', 10),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Real-Time Clinic OPD Queue Dashboard Data
 * GET /api/doctor/queue-dashboard
 * Flow: authenticated users.id -> doctors.user_id -> doctor.id -> SELECT appointments WHERE doctor_id = doctor.id
 */
export const getDoctorQueueDashboard = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Logged-in doctor profile not found in database.' });
    }

    const doctorId = doctor.id; // e.g. doc-kmc-1
    const doctorName = doctor.name;
    const specialization = doctor.specialization || 'Consultant Specialist';
    const hospitalName = doctor.hospital_name || doctor.hospitalName || 'KMC Hospital';

    // Fetch all active appointments strictly assigned to this doctor ordered by queue_number ASC
    const queueRes = await query(
      `SELECT 
        id, 
        user_id as "userId", 
        doctor_id as "doctorId", 
        doctor_name as "doctorName", 
        specialization, 
        hospital_name as "hospitalName", 
        date, 
        time_slot as "timeSlot", 
        queue_number as "queueNumber", 
        estimated_wait_time as "estimatedWaitTime", 
        status, 
        type, 
        patient_name as "patientName", 
        created_at as "createdAt"
      FROM appointments
      WHERE doctor_id = $1 AND LOWER(status) != 'cancelled'
      ORDER BY queue_number ASC, created_at ASC`,
      [doctorId]
    );

    const appointmentsList = queueRes.rows.map((a) => ({
      ...a,
      queuePosition: a.queueNumber || 1,
      displayStatus: (a.status || 'WAITING').toUpperCase(),
    }));

    const totalToday = appointmentsList.length;
    const waitingCount = appointmentsList.filter(a => ['WAITING', 'BOOKED', 'UPCOMING'].includes(a.displayStatus)).length;
    const inConsultationCount = appointmentsList.filter(a => ['IN_CONSULTATION', 'CALLED'].includes(a.displayStatus)).length;
    const completedCount = appointmentsList.filter(a => a.displayStatus === 'COMPLETED').length;

    // Find current active patient in room (IN_CONSULTATION or top WAITING)
    let currentPatient = appointmentsList.find(a => ['IN_CONSULTATION', 'CALLED'].includes(a.displayStatus));
    if (!currentPatient) {
      currentPatient = appointmentsList.find(a => ['WAITING', 'BOOKED', 'UPCOMING'].includes(a.displayStatus)) || null;
    }

    res.json({
      success: true,
      doctorId,
      doctorName,
      specialization,
      hospitalName,
      overview: {
        totalToday,
        waitingCount,
        inConsultationCount,
        completedCount,
        currentPatientName: currentPatient ? (currentPatient.patientName || 'None') : 'None',
        remainingCount: waitingCount + inConsultationCount,
      },
      currentPatient,
      queue: appointmentsList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Doctor Actions: Update Appointment OPD Queue Status
 * POST /api/doctor/update-queue-status
 * Validates State Machine: BOOKED -> WAITING -> CALLED -> IN_CONSULTATION -> COMPLETED
 */
export const updateQueueStatus = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    const doctorId = doctor ? doctor.id : req.user.id;
    const doctorName = doctor ? doctor.name : req.user.name;
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ success: false, message: 'appointmentId and status are required.' });
    }

    const nextStatus = status.toLowerCase();
    const validStatuses = ['booked', 'upcoming', 'waiting', 'called', 'in_consultation', 'completed', 'skipped', 'cancelled'];

    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status '${status}'. Must be one of ${validStatuses.join(', ')}` });
    }

    // 1. Fetch target appointment and verify existence
    const aptRes = await query('SELECT * FROM appointments WHERE id = $1', [appointmentId]);
    if (aptRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const apt = aptRes.rows[0];
    const currentStatus = (apt.status || 'upcoming').toLowerCase();

    // 2. State Machine Validation Rules
    if (['completed', 'cancelled'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition. Appointment is already '${currentStatus.toUpperCase()}' and cannot be modified.`
      });
    }

    // 3. Atomically update status in database
    await query('UPDATE appointments SET status = $1 WHERE id = $2', [nextStatus, appointmentId]);

    // If current patient finishes consultation, automatically call the next patient in queue!
    let autoNextApt = null;
    if (nextStatus === 'completed') {
      const nextInLineRes = await query(
        `SELECT * FROM appointments 
         WHERE (doctor_id = $1 OR doctor_id = $2 OR doctor_name ILIKE $3)
           AND id != $4 
           AND date = $5
           AND time_slot = $6
           AND LOWER(status) IN ('waiting', 'booked', 'upcoming', 'checked_in')
         ORDER BY queue_number ASC, created_at ASC LIMIT 1`,
        [doctorId, doctorId.replace('user-doc-', 'doc-'), doctorName, appointmentId, apt.date, apt.time_slot]
      );

      if (nextInLineRes.rows.length > 0) {
        autoNextApt = nextInLineRes.rows[0];
        await query('UPDATE appointments SET status = $1 WHERE id = $2', ['called', autoNextApt.id]);
      }
    }

    // 4. Emit Real-Time WebSockets Event to Doctor & Patient Dashboards
    const payload = {
      doctorId,
      doctorName,
      appointmentId,
      userId: apt.user_id,
      patientName: apt.patient_name,
      tokenNumber: `#0${apt.queue_number || 1}`,
      status: nextStatus,
      autoCalledNext: autoNextApt ? {
        appointmentId: autoNextApt.id,
        userId: autoNextApt.user_id,
        patientName: autoNextApt.patient_name,
        tokenNumber: `#0${autoNextApt.queue_number || 1}`,
        status: 'called'
      } : null,
      timestamp: new Date().toISOString(),
    };

    emitQueueUpdate(doctorId, payload);

    res.json({
      success: true,
      message: `Appointment status updated to ${nextStatus.toUpperCase()}`,
      appointmentId,
      status: nextStatus,
      autoCalledNext: autoNextApt ? autoNextApt.id : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Get Doctor's Appointments Only
 * GET /api/doctor/appointments
 */
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    const targetDocId = doctor ? doctor.id : req.user.id;

    const result = await query(
      `SELECT 
        id, 
        user_id as "userId", 
        doctor_id as "doctorId", 
        doctor_name as "doctorName", 
        specialization, 
        hospital_name as "hospitalName", 
        date, 
        time_slot as "timeSlot", 
        queue_number as "queueNumber", 
        estimated_wait_time as "estimatedWaitTime", 
        status, 
        type, 
        patient_name as "patientName", 
        meeting_url as "meetingUrl", 
        created_at as "createdAt"
      FROM appointments 
      WHERE doctor_id = $1
      ORDER BY created_at DESC`,
      [targetDocId]
    );

    res.json({ success: true, appointments: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. Get Doctor's Patients Only
 * GET /api/doctor/patients
 */
export const getDoctorPatients = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    const targetDocId = doctor ? doctor.id : req.user.id;

    const result = await query(
      `SELECT DISTINCT ON (a.user_id) 
        a.user_id as "userId", 
        a.patient_name as "patientName", 
        u.email as "patientEmail", 
        u.phone as "patientPhone", 
        u.abha_id as "abhaId",
        a.date as "lastVisitDate", 
        a.time_slot as "lastVisitSlot", 
        a.specialization,
        a.hospital_name as "hospitalName"
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.doctor_id = $1
      ORDER BY a.user_id, a.created_at DESC`,
      [targetDocId]
    );

    res.json({ success: true, patients: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Get Doctor's Medical Reports Only
 * GET /api/doctor/reports
 */
export const getDoctorReports = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    const targetDocId = doctor ? doctor.id : req.user.id;
    const targetDocName = doctor ? doctor.name : req.user.name;

    const result = await query(
      `SELECT 
        id, 
        user_id as "userId", 
        title, 
        category, 
        date, 
        doctor_name as "doctorName", 
        status, 
        summary, 
        metrics, 
        file_url as "fileUrl", 
        file_type as "fileType",
        created_at as "createdAt"
      FROM medical_reports 
      WHERE (doctor_name = $1 OR user_id IN (SELECT DISTINCT user_id FROM appointments WHERE doctor_id = $2))
      ORDER BY created_at DESC`,
      [targetDocName, targetDocId]
    );

    res.json({ success: true, reports: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. Get & Create Doctor's Prescriptions Only
 * GET /api/doctor/prescriptions
 * POST /api/doctor/prescriptions
 */
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    const targetDocId = doctor ? doctor.id : req.user.id;

    const result = await query(
      `SELECT 
        id, 
        doctor_id as "doctorId", 
        doctor_name as "doctorName", 
        patient_id as "patientId", 
        patient_name as "patientName", 
        medications, 
        instructions, 
        date, 
        created_at as "createdAt"
      FROM prescriptions 
      WHERE doctor_id = $1
      ORDER BY created_at DESC`,
      [targetDocId]
    );

    res.json({ success: true, prescriptions: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDoctorPrescription = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    const doctorId = doctor ? doctor.id : req.user.id;
    const doctorName = doctor ? doctor.name : req.user.name;
    const { patientId, patientName, medications, instructions, date } = req.body;

    if (!patientId || !patientName || !medications) {
      return res.status(400).json({ success: false, message: 'Patient ID, Patient Name, and Medications are required.' });
    }

    const rxId = `rx-${Date.now()}`;
    const rxDate = date || new Date().toISOString().split('T')[0];

    const insertSql = `
      INSERT INTO prescriptions (id, doctor_id, doctor_name, patient_id, patient_name, medications, instructions, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, doctor_id as "doctorId", doctor_name as "doctorName", patient_id as "patientId", patient_name as "patientName", medications, instructions, date, created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      rxId, doctorId, doctorName, patientId, patientName, typeof medications === 'object' ? JSON.stringify(medications) : medications, instructions || '', rxDate
    ]);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. Get Doctor Profile
 * GET /api/doctor/profile
 */
export const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await getDoctorForUser(req.user.id, req.user.name);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    res.json({
      success: true,
      profile: {
        id: doctor.id,
        userId: doctor.user_id || req.user.id,
        name: doctor.name,
        email: doctor.email || req.user.email,
        phone: doctor.phone || req.user.phone,
        specialization: doctor.specialization,
        qualification: doctor.qualification || doctor.education,
        experience: doctor.experience,
        licenseNumber: doctor.license_number || 'KA-MED-99012',
        hospitalId: doctor.hospital_id || 'hosp-1',
        hospitalName: doctor.hospital_name,
        photo: doctor.photo,
        availableSlots: typeof doctor.available_slots === 'string' ? JSON.parse(doctor.available_slots) : doctor.available_slots,
        consultationFee: doctor.consultation_fee,
        bio: doctor.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
