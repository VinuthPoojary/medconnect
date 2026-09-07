import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db/index.js';
import {
  emitHospitalDocumentUpdate,
  emitHospitalDoctorUpdate,
  emitHospitalAppointmentUpdate,
} from '../socket.js';

/**
 * Generate a secure initial temporary password for doctors
 */
function generateInitialDoctorPassword() {
  const randomDigits = crypto.randomInt(1000, 9999);
  return `Doctor#${randomDigits}!`;
}

/**
 * Helper to resolve hospital record for authenticated hospital session
 */
async function getAuthenticatedHospital(hospitalId) {
  if (!hospitalId) return null;
  const res = await query('SELECT * FROM hospitals WHERE id = $1 LIMIT 1', [hospitalId]);
  if (res.rows && res.rows.length > 0) return res.rows[0];

  // Fallback search in users table
  const userRes = await query(
    "SELECT * FROM users WHERE (hospital_id = $1 OR id = $2) AND role = 'hospital' LIMIT 1",
    [hospitalId, `user-${hospitalId}`]
  );
  if (userRes.rows && userRes.rows.length > 0) {
    const u = userRes.rows[0];
    return {
      id: u.hospital_id || hospitalId,
      name: u.hospital_name || u.name,
      email: u.email,
      phone: u.phone,
      location: 'Mangaluru, Coastal Karnataka',
    };
  }

  return null;
}

/**
 * 1. GET /api/hospitals/dashboard-metrics
 * Overview statistics isolated strictly to req.hospitalId
 */
export const getHospitalDashboardMetrics = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const hospital = await getAuthenticatedHospital(hospitalId);

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital account not found.' });
    }

    const hospName = hospital.name;

    // 1. Total Doctors belonging to this hospital
    const doctorsCountRes = await query(
      `SELECT COUNT(*) as count FROM doctors 
       WHERE hospital_id = $1 OR hospital_name = $2`,
      [hospitalId, hospName]
    );
    const totalDoctors = parseInt(doctorsCountRes.rows[0]?.count || '0', 10);

    // 2. Today's Appointments for this hospital's doctors
    const todayDate = new Date().toISOString().split('T')[0];
    const todayApptsRes = await query(
      `SELECT COUNT(*) as count FROM appointments a
       JOIN doctors d ON (a.doctor_id = d.id OR a.doctor_id = d.user_id)
       WHERE (d.hospital_id = $1 OR d.hospital_name = $2 OR a.hospital_name = $2)
         AND a.date = $3
         AND LOWER(a.status) != 'cancelled'`,
      [hospitalId, hospName, todayDate]
    );
    const todayAppointments = parseInt(todayApptsRes.rows[0]?.count || '0', 10);

    // 3. Active waiting patients right now
    const waitingRes = await query(
      `SELECT COUNT(*) as count FROM appointments a
       JOIN doctors d ON (a.doctor_id = d.id OR a.doctor_id = d.user_id)
       WHERE (d.hospital_id = $1 OR d.hospital_name = $2 OR a.hospital_name = $2)
         AND a.date = $3
         AND LOWER(a.status) IN ('waiting', 'in_consultation', 'called')`,
      [hospitalId, hospName, todayDate]
    );
    const activeWaiting = parseInt(waitingRes.rows[0]?.count || '0', 10);

    // 4. Total Uploaded Documents
    const docsCountRes = await query(
      `SELECT COUNT(*) as count FROM hospital_documents WHERE hospital_id = $1`,
      [hospitalId]
    );
    const totalDocuments = parseInt(docsCountRes.rows[0]?.count || '0', 10);

    // 5. Total Distinct Patients served
    const patientsCountRes = await query(
      `SELECT COUNT(DISTINCT a.user_id) as count FROM appointments a
       JOIN doctors d ON (a.doctor_id = d.id OR a.doctor_id = d.user_id)
       WHERE (d.hospital_id = $1 OR d.hospital_name = $2 OR a.hospital_name = $2)`,
      [hospitalId, hospName]
    );
    const totalPatients = parseInt(patientsCountRes.rows[0]?.count || '0', 10);

    res.json({
      success: true,
      hospital: {
        id: hospital.id,
        name: hospital.name,
        email: hospital.email,
        phone: hospital.phone,
        location: hospital.location,
        rating: hospital.rating || 4.8,
        bedsAvailable: hospital.beds_available || 45,
        emergencyStatus: hospital.emergency_status || 'Available',
      },
      metrics: {
        totalDoctors,
        todayAppointments,
        activeWaiting,
        totalDocuments,
        totalPatients,
      },
    });
  } catch (error) {
    console.error('❌ Hospital dashboard metrics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. GET /api/hospitals/doctors
 * List all doctors belonging strictly to req.hospitalId
 */
export const getHospitalDoctors = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const hospital = await getAuthenticatedHospital(hospitalId);
    const hospName = hospital?.name || '';

    const result = await query(
      `SELECT 
        d.id, 
        d.user_id as "userId", 
        d.name, 
        d.email, 
        d.phone, 
        d.photo, 
        d.specialization, 
        d.experience, 
        d.qualification, 
        d.license_number as "licenseNumber", 
        d.hospital_id as "hospitalId", 
        d.hospital_name as "hospitalName", 
        d.rating, 
        d.reviews_count as "reviewsCount", 
        d.languages, 
        d.available_slots as "availableSlots", 
        d.consultation_fee as "consultationFee", 
        d.education, 
        d.bio, 
        d.is_available_today as "isAvailableToday",
        d.created_at as "createdAt"
      FROM doctors d
      WHERE d.hospital_id = $1 OR d.hospital_name = $2
      ORDER BY d.created_at DESC, d.name ASC`,
      [hospitalId, hospName]
    );

    const doctors = result.rows.map((d) => ({
      ...d,
      availableSlots:
        typeof d.availableSlots === 'string'
          ? JSON.parse(d.availableSlots || '[]')
          : d.availableSlots || ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM'],
      languages:
        typeof d.languages === 'string'
          ? JSON.parse(d.languages || '[]')
          : d.languages || ['English', 'Kannada', 'Tulu'],
    }));

    res.json({ success: true, doctors });
  } catch (error) {
    console.error('❌ Get hospital doctors error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. POST /api/hospitals/doctors
 * Hospital adds a new doctor.
 * Automatically assigns req.hospitalId and creates user + doctor accounts.
 */
export const addDoctorByHospital = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const hospital = await getAuthenticatedHospital(hospitalId);

    if (!hospital) {
      return res.status(403).json({
        success: false,
        message: 'Invalid hospital session. Unable to associate doctor.',
      });
    }

    const {
      name,
      licenseNumber,
      specialization,
      email,
      phone,
      qualification,
      experience,
      consultationFee,
      photo,
      availableDays,
      availableSlots,
      bio,
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Doctor full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Doctor professional email is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Doctor mobile number is required.' });
    }
    if (!specialization || !specialization.trim()) {
      return res.status(400).json({ success: false, message: 'Doctor specialization is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`;

    // Check unique email and phone
    const existingUser = await query(
      'SELECT id, email, phone FROM users WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1',
      [cleanEmail, cleanPhone]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address or mobile number already exists in MedConnect.',
      });
    }

    const existingDoctor = await query(
      'SELECT id FROM doctors WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1',
      [cleanEmail, cleanPhone]
    );
    if (existingDoctor.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A doctor record with this email or mobile number already exists.',
      });
    }

    // Generate secure initial password
    const initialPassword = req.body.password?.trim() || generateInitialDoctorPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);

    const docId = `doc-${hospital.id}-${Date.now().toString().slice(-6)}`;
    const userId = `user-${docId}`;
    const avatar = cleanName
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .filter((n) => !n.includes('.'))
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'DR';

    const defaultSlots =
      Array.isArray(availableSlots) && availableSlots.length > 0
        ? availableSlots
        : ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM', '06:00 PM'];

    const defaultDays =
      Array.isArray(availableDays) && availableDays.length > 0
        ? availableDays
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const doctorPhoto =
      photo ||
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400';

    // 1. Create User authentication identity (role = 'doctor', hospital_id = hospitalId)
    await query(
      `INSERT INTO users (
        id, name, email, phone, password_hash, role, hospital_id, hospital_name, specialization, qualification, experience, license_number, avatar, login_enabled
      ) VALUES ($1, $2, $3, $4, $5, 'doctor', $6, $7, $8, $9, $10, $11, $12, 1)`,
      [
        userId,
        cleanName,
        cleanEmail,
        cleanPhone,
        passwordHash,
        hospital.id,
        hospital.name,
        specialization,
        qualification || 'MBBS, MD',
        experience || '5 Years',
        licenseNumber || 'KA-MED-REG',
        avatar,
      ]
    );

    // 2. Create Doctor profile record linked to userId and hospitalId
    await query(
      `INSERT INTO doctors (
        id, user_id, name, email, phone, password_hash, photo, specialization, experience, qualification, license_number, hospital_id, hospital_name, available_slots, consultation_fee, education, bio, is_available_today, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1, $18)`,
      [
        docId,
        userId,
        cleanName,
        cleanEmail,
        cleanPhone,
        passwordHash,
        doctorPhoto,
        specialization,
        experience || '5 Years',
        qualification || 'MBBS, MD',
        licenseNumber || 'KA-MED-REG',
        hospital.id,
        hospital.name,
        JSON.stringify(defaultSlots),
        parseInt(consultationFee || '500', 10),
        qualification || 'MBBS, MD',
        bio || `Consultant ${specialization} at ${hospital.name}.`,
        hospital.location || 'Mangaluru, Coastal Karnataka',
      ]
    );

    const createdDoctor = {
      id: docId,
      userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      specialization,
      qualification: qualification || 'MBBS, MD',
      experience: experience || '5 Years',
      licenseNumber: licenseNumber || 'KA-MED-REG',
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      consultationFee: parseInt(consultationFee || '500', 10),
      photo: doctorPhoto,
      availableSlots: defaultSlots,
      availableDays: defaultDays,
      isAvailableToday: true,
    };

    // Emit real-time update
    emitHospitalDoctorUpdate(hospital.id, {
      action: 'created',
      doctor: createdDoctor,
    });

    res.status(201).json({
      success: true,
      message: `Doctor account for ${cleanName} created successfully.`,
      doctor: createdDoctor,
      credentials: {
        email: cleanEmail,
        temporaryPassword: initialPassword,
        loginUrl: '/doctor/login',
        instructions: 'Share these credentials securely with the doctor to access their clinical dashboard.',
      },
    });
  } catch (error) {
    console.error('❌ Add doctor error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. PUT /api/hospitals/doctors/:id
 * Update doctor belonging strictly to req.hospitalId
 */
export const updateDoctorByHospital = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const { id } = req.params;

    // Verify doctor belongs to this hospital
    const checkRes = await query(
      'SELECT * FROM doctors WHERE (id = $1 OR user_id = $1) AND hospital_id = $2 LIMIT 1',
      [id, hospitalId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You do not have permission to modify this doctor.',
      });
    }

    const doc = checkRes.rows[0];
    const {
      name,
      specialization,
      qualification,
      experience,
      licenseNumber,
      consultationFee,
      photo,
      availableSlots,
      isAvailableToday,
      bio,
    } = req.body;

    const updatedName = name ? (name.startsWith('Dr.') ? name : `Dr. ${name}`) : doc.name;

    await query(
      `UPDATE doctors 
       SET name = $1, specialization = $2, qualification = $3, experience = $4, license_number = $5, consultation_fee = $6, photo = $7, available_slots = $8, is_available_today = $9, bio = $10
       WHERE id = $11 AND hospital_id = $12`,
      [
        updatedName,
        specialization || doc.specialization,
        qualification || doc.qualification,
        experience || doc.experience,
        licenseNumber || doc.license_number,
        consultationFee !== undefined ? parseInt(consultationFee, 10) : doc.consultation_fee,
        photo || doc.photo,
        availableSlots ? (typeof availableSlots === 'string' ? availableSlots : JSON.stringify(availableSlots)) : doc.available_slots,
        isAvailableToday !== undefined ? (isAvailableToday ? 1 : 0) : doc.is_available_today,
        bio || doc.bio,
        doc.id,
        hospitalId,
      ]
    );

    // Update users table
    if (doc.user_id) {
      await query(
        `UPDATE users 
         SET name = $1, specialization = $2, qualification = $3, experience = $4, license_number = $5
         WHERE id = $6`,
        [
          updatedName,
          specialization || doc.specialization,
          qualification || doc.qualification,
          experience || doc.experience,
          licenseNumber || doc.license_number,
          doc.user_id,
        ]
      );
    }

    emitHospitalDoctorUpdate(hospitalId, {
      action: 'updated',
      doctorId: doc.id,
    });

    res.json({ success: true, message: 'Doctor details updated successfully.' });
  } catch (error) {
    console.error('❌ Update doctor error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. DELETE /api/hospitals/doctors/:id
 * Remove doctor account belonging strictly to req.hospitalId
 */
export const deleteDoctorByHospital = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const { id } = req.params;

    const checkRes = await query(
      'SELECT id, user_id, name FROM doctors WHERE (id = $1 OR user_id = $1) AND hospital_id = $2 LIMIT 1',
      [id, hospitalId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You do not have permission to delete this doctor.',
      });
    }

    const doc = checkRes.rows[0];

    await query('DELETE FROM doctors WHERE id = $1', [doc.id]);
    if (doc.user_id) {
      await query('DELETE FROM users WHERE id = $1', [doc.user_id]);
    }

    emitHospitalDoctorUpdate(hospitalId, {
      action: 'deleted',
      doctorId: doc.id,
    });

    res.json({ success: true, message: `Doctor ${doc.name} removed successfully.` });
  } catch (error) {
    console.error('❌ Delete doctor error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. GET /api/hospitals/appointments
 * View appointment queue for this hospital's doctors only
 */
export const getHospitalAppointments = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const hospital = await getAuthenticatedHospital(hospitalId);
    const hospName = hospital?.name || '';
    const { date, status } = req.query;

    let sql = `
      SELECT 
        a.id, 
        a.user_id as "userId", 
        a.doctor_id as "doctorId", 
        a.doctor_name as "doctorName", 
        a.specialization, 
        a.hospital_name as "hospitalName", 
        a.date, 
        a.time_slot as "timeSlot", 
        a.queue_number as "queueNumber", 
        a.estimated_wait_time as "estimatedWaitTime", 
        a.status, 
        a.type, 
        a.patient_name as "patientName", 
        u.email as "patientEmail", 
        u.phone as "patientPhone",
        a.created_at as "createdAt"
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      JOIN doctors d ON (a.doctor_id = d.id OR a.doctor_id = d.user_id)
      WHERE (d.hospital_id = $1 OR d.hospital_name = $2 OR a.hospital_name = $2)
    `;
    const params = [hospitalId, hospName];

    if (date) {
      params.push(date);
      sql += ` AND a.date = $${params.length}`;
    }

    if (status) {
      params.push(status.toLowerCase());
      sql += ` AND LOWER(a.status) = $${params.length}`;
    }

    sql += ` ORDER BY a.date DESC, a.time_slot ASC, a.queue_number ASC`;

    const result = await query(sql, params);
    res.json({ success: true, appointments: result.rows });
  } catch (error) {
    console.error('❌ Get hospital appointments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. GET /api/hospitals/patients
 * View distinct patients for this hospital's doctors only
 */
export const getHospitalPatients = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const hospital = await getAuthenticatedHospital(hospitalId);
    const hospName = hospital?.name || '';

    const sql = `
      SELECT DISTINCT 
        u.id as "userId", 
        COALESCE(u.name, a.patient_name) as "name", 
        u.email, 
        u.phone, 
        u.abha_id as "abhaId",
        MAX(a.date) as "lastVisitDate", 
        COUNT(a.id) as "totalVisits",
        a.specialization as "lastSpecialization",
        a.doctor_name as "lastDoctorName"
      FROM appointments a
      JOIN doctors d ON (a.doctor_id = d.id OR a.doctor_id = d.user_id)
      LEFT JOIN users u ON a.user_id = u.id
      WHERE (d.hospital_id = $1 OR d.hospital_name = $2 OR a.hospital_name = $2)
      GROUP BY u.id, u.name, a.patient_name, u.email, u.phone, u.abha_id, a.specialization, a.doctor_name
      ORDER BY MAX(a.date) DESC`;

    const result = await query(sql, [hospitalId, hospName]);
    res.json({ success: true, patients: result.rows });
  } catch (error) {
    console.error('❌ Get hospital patients error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 8. GET /api/hospitals/documents
 * List all documents uploaded by req.hospitalId
 */
export const getHospitalDocuments = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;

    const result = await query(
      `SELECT 
        id, 
        hospital_id as "hospitalId", 
        hospital_name as "hospitalName", 
        document_name as "documentName", 
        document_type as "documentType", 
        version, 
        file_url as "fileUrl", 
        file_size as "fileSize", 
        status, 
        uploaded_by as "uploadedBy", 
        page_count as "pageCount", 
        content_text as "contentText", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM hospital_documents
      WHERE hospital_id = $1
      ORDER BY created_at DESC`,
      [hospitalId]
    );

    res.json({ success: true, documents: result.rows });
  } catch (error) {
    console.error('❌ Get hospital documents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 9. POST /api/hospitals/documents
 * Upload / Index PDF document for req.hospitalId
 */
export const uploadHospitalDocument = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const hospital = await getAuthenticatedHospital(hospitalId);

    if (!hospital) {
      return res.status(403).json({ success: false, message: 'Invalid hospital session.' });
    }

    const {
      documentName,
      documentType,
      version,
      contentText,
      pageCount,
      fileUrl,
      fileSize,
      uploadedBy,
    } = req.body;

    if (!documentName || !documentName.trim()) {
      return res.status(400).json({ success: false, message: 'Document name is required.' });
    }
    if (!contentText || !contentText.trim()) {
      return res.status(400).json({ success: false, message: 'Document policy text/summary is required for RAG indexing.' });
    }

    const docId = `doc-${hospitalId}-${Date.now().toString().slice(-6)}`;
    const finalDocName = documentName.trim().endsWith('.pdf') ? documentName.trim() : `${documentName.trim()}.pdf`;
    const finalVersion = version?.trim() || '1.0';
    const finalType = documentType?.trim() || 'Hospital Policy';
    const finalPages = parseInt(pageCount || '4', 10);
    const finalSize = fileSize || Math.floor(1024 * 1024 * (1.2 + Math.random() * 2));
    const finalUrl =
      fileUrl ||
      `https://medconnect.karavali.ai/docs/${hospitalId}/${finalDocName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const finalUploadedBy = uploadedBy || req.user?.name || `${hospital.name} Administration`;

    await query(
      `INSERT INTO hospital_documents (
        id, hospital_id, hospital_name, document_name, document_type, version, file_url, file_size, status, uploaded_by, page_count, content_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Indexed', $9, $10, $11)`,
      [
        docId,
        hospital.id,
        hospital.name,
        finalDocName,
        finalType,
        finalVersion,
        finalUrl,
        finalSize,
        finalUploadedBy,
        finalPages,
        contentText.trim(),
      ]
    );

    // Sync with legacy hospital_schemes for compatibility
    try {
      await query(
        `INSERT INTO hospital_schemes (
          id, hospital_name, scheme_title, category, coverage_amount, eligibility, description, document_url, content_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          docId,
          hospital.name,
          finalDocName.replace(/\.pdf$/i, ''),
          finalType,
          'Full Empanelled Coverage',
          'Eligible ABDM / Hospital Registered Patients',
          contentText.trim().substring(0, 300),
          finalUrl,
          contentText.trim(),
        ]
      );
    } catch (e) {
      console.warn('Sync to hospital_schemes warning:', e.message);
    }

    const createdDoc = {
      id: docId,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      documentName: finalDocName,
      documentType: finalType,
      version: finalVersion,
      fileUrl: finalUrl,
      fileSize: finalSize,
      status: 'Indexed',
      uploadedBy: finalUploadedBy,
      pageCount: finalPages,
      contentText: contentText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // REAL-TIME EVENT EMITTED SCOPED TO HOSPITAL
    emitHospitalDocumentUpdate(hospital.id, {
      action: 'uploaded',
      document: createdDoc,
    });

    res.status(201).json({
      success: true,
      message: `Document "${finalDocName}" uploaded and indexed into ${hospital.name} RAG Knowledge Base.`,
      document: createdDoc,
    });
  } catch (error) {
    console.error('❌ Upload hospital document error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 10. PUT /api/hospitals/documents/:id
 * Update / Replace document for req.hospitalId
 */
export const updateHospitalDocument = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const { id } = req.params;

    const checkRes = await query(
      'SELECT * FROM hospital_documents WHERE id = $1 AND hospital_id = $2 LIMIT 1',
      [id, hospitalId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You do not have permission to modify this document.',
      });
    }

    const doc = checkRes.rows[0];
    const { documentName, documentType, version, contentText, pageCount, status } = req.body;

    const updatedName = documentName ? (documentName.endsWith('.pdf') ? documentName : `${documentName}.pdf`) : doc.document_name;
    const updatedType = documentType || doc.document_type;
    const updatedVersion = version || doc.version;
    const updatedText = contentText || doc.content_text;
    const updatedPages = pageCount ? parseInt(pageCount, 10) : doc.page_count;
    const updatedStatus = status || doc.status || 'Indexed';

    await query(
      `UPDATE hospital_documents
       SET document_name = $1, document_type = $2, version = $3, content_text = $4, page_count = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND hospital_id = $8`,
      [updatedName, updatedType, updatedVersion, updatedText, updatedPages, updatedStatus, id, hospitalId]
    );

    // Update hospital_schemes if exists
    try {
      await query(
        `UPDATE hospital_schemes 
         SET scheme_title = $1, category = $2, content_text = $3
         WHERE id = $4`,
        [updatedName.replace(/\.pdf$/i, ''), updatedType, updatedText, id]
      );
    } catch (e) {}

    const updatedDoc = {
      ...doc,
      documentName: updatedName,
      documentType: updatedType,
      version: updatedVersion,
      contentText: updatedText,
      pageCount: updatedPages,
      status: updatedStatus,
      updatedAt: new Date().toISOString(),
    };

    emitHospitalDocumentUpdate(hospitalId, {
      action: 'updated',
      document: updatedDoc,
    });

    res.json({
      success: true,
      message: 'Document updated and re-indexed successfully.',
      document: updatedDoc,
    });
  } catch (error) {
    console.error('❌ Update document error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 11. DELETE /api/hospitals/documents/:id
 * Delete document strictly belonging to req.hospitalId
 */
export const deleteHospitalDocument = async (req, res) => {
  try {
    const hospitalId = req.hospitalId;
    const { id } = req.params;

    const checkRes = await query(
      'SELECT id, document_name FROM hospital_documents WHERE id = $1 AND hospital_id = $2 LIMIT 1',
      [id, hospitalId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You do not have permission to delete this document.',
      });
    }

    const docName = checkRes.rows[0].document_name;

    await query('DELETE FROM hospital_documents WHERE id = $1 AND hospital_id = $2', [id, hospitalId]);
    try {
      await query('DELETE FROM hospital_schemes WHERE id = $1', [id]);
    } catch (e) {}

    emitHospitalDocumentUpdate(hospitalId, {
      action: 'deleted',
      documentId: id,
      documentName: docName,
    });

    res.json({ success: true, message: `Document "${docName}" removed from knowledge base.` });
  } catch (error) {
    console.error('❌ Delete document error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 12. GET /api/hospitals/:id/public-documents
 * Public / Patient endpoint: Returns available documents for selected hospital
 */
export const getHospitalPublicDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    // Search by hospitalId or hospitalName
    let result = await query(
      `SELECT 
        id, 
        hospital_id as "hospitalId", 
        hospital_name as "hospitalName", 
        document_name as "documentName", 
        document_type as "documentType", 
        version, 
        file_url as "fileUrl", 
        file_size as "fileSize", 
        status, 
        uploaded_by as "uploadedBy", 
        page_count as "pageCount", 
        content_text as "contentText", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM hospital_documents
      WHERE hospital_id = $1 OR LOWER(hospital_name) LIKE LOWER($2)
      ORDER BY created_at DESC`,
      [id, `%${id.replace(/-/g, ' ')}%`]
    );

    res.json({ success: true, documents: result.rows });
  } catch (error) {
    console.error('❌ Get public hospital documents error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
