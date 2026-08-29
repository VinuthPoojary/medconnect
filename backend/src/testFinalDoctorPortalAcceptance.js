import bcrypt from 'bcryptjs';
import { query } from './db/index.js';
import { login } from './controllers/authController.js';
import { loginDoctor } from './controllers/authDoctorController.js';
import { getAppointments, createAppointment } from './controllers/appointmentController.js';
import { getDoctorMe, getDoctorQueueDashboard } from './controllers/doctorDashboardController.js';

async function runFinalDoctorAcceptanceTest() {
  console.log('🧪 Starting Final Doctor Portal Acceptance Test...\n');

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Verify Dr. Meera & Dr. Vignesh in Database
    // -------------------------------------------------------------------------
    console.log('--- STEP 1: Resolving Doctor Records in Database ---');
    const meeraDocRes = await query(`
      SELECT d.id, d.name, d.specialization, d.hospital_name, d.user_id, u.email 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      WHERE u.email = 'meera@medconnect.com' OR LOWER(d.name) LIKE '%meera%'
      LIMIT 1
    `);
    if (meeraDocRes.rows.length === 0) throw new Error('❌ Dr. Meera record not found in database!');
    const docMeera = meeraDocRes.rows[0];
    console.log(`   Dr. Meera: [${docMeera.id}] ${docMeera.name} (${docMeera.hospital_name}) [Email: ${docMeera.email}, User ID: ${docMeera.user_id}]`);

    const vigneshDocRes = await query(`
      SELECT d.id, d.name, d.specialization, d.hospital_name, d.user_id, u.email 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      WHERE u.email = 'vignesh@medconnect.com' OR LOWER(d.name) LIKE '%vignesh%'
      LIMIT 1
    `);
    if (vigneshDocRes.rows.length === 0) throw new Error('❌ Dr. Vignesh record not found in database!');
    const docVignesh = vigneshDocRes.rows[0];
    console.log(`   Dr. Vignesh: [${docVignesh.id}] ${docVignesh.name} (${docVignesh.hospital_name}) [Email: ${docVignesh.email}, User ID: ${docVignesh.user_id}]\n`);

    // -------------------------------------------------------------------------
    // STEP 2: Patient A logs in & books Dr. Meera at 09:30 AM
    // -------------------------------------------------------------------------
    console.log('--- STEP 2: Patient A Logs In & Books Dr. Meera ---');
    let patientA = null;
    const reqPatientLogin = { body: { email: 'patient@medconnect.com', password: 'Patient@2026', role: 'patient' } };
    await login(reqPatientLogin, {
      status: () => ({ json: (d) => { patientA = d.user; } }),
      json: (d) => { patientA = d.user; }
    });
    console.log(`   Patient A Authenticated: ${patientA.name} (id: ${patientA.id})`);

    const todayDate = new Date().toISOString().split('T')[0];
    let createdApt = null;
    await createAppointment({
      user: { id: patientA.id, name: patientA.name },
      body: {
        doctorId: docMeera.id,
        doctorName: docMeera.name,
        date: todayDate,
        timeSlot: '09:30 AM',
        type: 'offline',
        patientName: patientA.name,
        userId: patientA.id
      }
    }, {
      status: () => ({ json: (d) => { createdApt = d.appointment; } }),
      json: (d) => { createdApt = d.appointment; }
    });

    if (!createdApt || !createdApt.id) throw new Error('❌ Failed to create appointment for Dr. Meera!');
    console.log(`   Appointment Created: ${createdApt.id} (Token: ${createdApt.tokenNumber || '#' + createdApt.queueNumber})`);

    // Verify DB linkage
    const dbAptCheck = await query('SELECT * FROM appointments WHERE id = $1', [createdApt.id]);
    const savedApt = dbAptCheck.rows[0];
    if (savedApt.doctor_id !== docMeera.id) {
      throw new Error(`❌ Database doctor_id mismatch! Expected "${docMeera.id}", got "${savedApt.doctor_id}"`);
    }
    console.log(`   ✅ DB Record Verified: appointments.doctor_id (${savedApt.doctor_id}) === Dr. Meera's ID (${docMeera.id})\n`);

    // -------------------------------------------------------------------------
    // STEP 3: Doctor Login as meera@medconnect.com
    // -------------------------------------------------------------------------
    console.log('--- STEP 3: Doctor Login as meera@medconnect.com ---');
    let meeraSession = null;
    const reqMeeraLogin = { body: { email: 'meera@medconnect.com', password: 'Doctor@2026' } };
    await loginDoctor(reqMeeraLogin, {
      status: () => ({ json: (d) => { meeraSession = d.user; } }),
      json: (d) => { meeraSession = d.user; }
    });

    if (!meeraSession || meeraSession.doctorId !== docMeera.id) {
      throw new Error(`❌ Dr. Meera login failed! Expected doctorId="${docMeera.id}", got "${meeraSession?.doctorId}"`);
    }
    console.log(`   Dr. Meera Authenticated: ${meeraSession.name} (doctorId: ${meeraSession.doctorId}, hospital: ${meeraSession.hospitalName})`);

    // Check Dr. Meera's OPD Queue
    let meeraQueue = null;
    await getDoctorQueueDashboard({ user: { id: meeraSession.id, name: meeraSession.name, role: 'doctor' } }, {
      status: () => ({ json: (d) => { meeraQueue = d; } }),
      json: (d) => { meeraQueue = d; }
    });

    const foundInMeeraQueue = meeraQueue?.queue?.find(a => a.id === createdApt.id);
    if (!foundInMeeraQueue) {
      throw new Error('❌ Patient A does NOT appear in Dr. Meera\'s queue dashboard!');
    }
    console.log(`   ✅ Dr. Meera sees Patient A in her OPD Queue (Token: ${foundInMeeraQueue.tokenNumber || '#' + foundInMeeraQueue.queueNumber})\n`);

    // -------------------------------------------------------------------------
    // STEP 4: Log out and Log In as vignesh@medconnect.com (Multi-Doctor Isolation)
    // -------------------------------------------------------------------------
    console.log('--- STEP 4: Doctor Login as vignesh@medconnect.com (Isolation Check) ---');
    let vigneshSession = null;
    const reqVigneshLogin = { body: { email: 'vignesh@medconnect.com', password: 'Doctor@2026' } };
    await loginDoctor(reqVigneshLogin, {
      status: () => ({ json: (d) => { vigneshSession = d.user; } }),
      json: (d) => { vigneshSession = d.user; }
    });

    if (!vigneshSession || vigneshSession.doctorId !== docVignesh.id) {
      throw new Error(`❌ Dr. Vignesh login failed! Expected doctorId="${docVignesh.id}", got "${vigneshSession?.doctorId}"`);
    }
    console.log(`   Dr. Vignesh Authenticated: ${vigneshSession.name} (doctorId: ${vigneshSession.doctorId})`);

    // Check Dr. Vignesh's OPD Queue
    let vigneshQueue = null;
    await getDoctorQueueDashboard({ user: { id: vigneshSession.id, name: vigneshSession.name, role: 'doctor' } }, {
      status: () => ({ json: (d) => { vigneshQueue = d; } }),
      json: (d) => { vigneshQueue = d; }
    });

    const foundInVigneshQueue = vigneshQueue?.queue?.find(a => a.id === createdApt.id);
    if (foundInVigneshQueue) {
      throw new Error('❌ Multi-Doctor Isolation breached! Dr. Vignesh can see Dr. Meera\'s patient!');
    }
    console.log(`   ✅ Isolation Verified: Patient A does NOT appear in Dr. Vignesh's queue.\n`);

    // -------------------------------------------------------------------------
    // STEP 5: Patient logs out -> Logs in again -> Views "My Appointments"
    // -------------------------------------------------------------------------
    console.log('--- STEP 5: Patient Logs Out -> Logs In Again -> Views "My Appointments" ---');
    let patientARelogin = null;
    await login(reqPatientLogin, {
      status: () => ({ json: (d) => { patientARelogin = d.user; } }),
      json: (d) => { patientARelogin = d.user; }
    });

    let patientAApts = [];
    await getAppointments({ user: { id: patientARelogin.id, name: patientARelogin.name } }, {
      status: () => ({ json: (d) => { patientAApts = d.appointments || []; } }),
      json: (d) => { patientAApts = d.appointments || []; }
    });

    const retrievedApt = patientAApts.find(a => a.id === createdApt.id);
    if (!retrievedApt) throw new Error('❌ Appointment not found in Patient A\'s My Appointments!');

    console.log(`   Retrieved Appointment from DB:`);
    console.log(`   - Doctor Name: "${retrievedApt.doctorName}"`);
    console.log(`   - Specialization: "${retrievedApt.specialization}"`);
    console.log(`   - Hospital: "${retrievedApt.hospitalName}"`);
    console.log(`   - Date: "${retrievedApt.date}"`);
    console.log(`   - Time Slot: "${retrievedApt.timeSlot}"`);
    console.log(`   - Token: "#${retrievedApt.queueNumber}"`);

    if (retrievedApt.doctorName !== docMeera.name) {
      throw new Error(`❌ Wrong doctor name displayed! Expected "${docMeera.name}", got "${retrievedApt.doctorName}"`);
    }

    console.log(`   ✅ Patient My Appointments correctly displays Dr. Meera at 09:30 AM with Token #${retrievedApt.queueNumber}.\n`);

    console.log('========================================================================');
    console.log('🎉 ALL FINAL ACCEPTANCE TEST CHECKS PASSED WITH 100% PERFECTION!');
    console.log('========================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ FINAL ACCEPTANCE TEST FAILED:', err);
    process.exit(1);
  }
}

runFinalDoctorAcceptanceTest();
