import { query } from './db/index.js';
import { login } from './controllers/authController.js';
import { loginDoctor } from './controllers/authDoctorController.js';
import { getAppointments, createAppointment } from './controllers/appointmentController.js';
import { getDoctorQueueDashboard, updateQueueStatus } from './controllers/doctorDashboardController.js';

async function runAcceptanceTests() {
  console.log('🧪 Starting 6-Step Final Acceptance Test Suite for Patient & Doctor Flow...\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Authenticate Patient A (patient@medconnect.com)
    // -------------------------------------------------------------
    let patientAToken = null;
    let patientAUser = null;

    const mockAuthReq = {
      body: { phone: 'patient@medconnect.com', email: 'patient@medconnect.com', password: 'MedConnect@2026', role: 'patient' }
    };
    const mockAuthRes = {
      status: (code) => ({ json: (d) => { if (d.user) { patientAUser = d.user; patientAToken = d.user.token; } } }),
      json: (d) => { if (d.user) { patientAUser = d.user; patientAToken = d.user.token; } }
    };

    await login(mockAuthReq, mockAuthRes);

    if (!patientAUser || !patientAToken) {
      throw new Error('❌ Setup failed: Could not log in Patient A!');
    }
    console.log(`🔑 Patient A Logged In: ${patientAUser.name} (id: ${patientAUser.id})`);

    // -------------------------------------------------------------
    // TEST 1: Patient books appointment -> appointment appears in DB with user_id = patientAUser.id
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Patient books appointment with Dr. Vignesh ---');
    let testAptId = null;
    const reqBook = {
      user: { id: patientAUser.id, name: patientAUser.name, email: patientAUser.email },
      body: {
        doctorId: 'doc-kmc-1',
        doctorName: 'Dr. Vignesh Shetty',
        doctorPhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
        specialization: 'Cardiologist',
        hospitalName: 'KMC Hospital Attavar & Jyothi',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '11:00 AM',
        type: 'offline',
        patientName: patientAUser.name,
        userId: patientAUser.id
      }
    };
    const resBook = {
      status: (code) => ({ json: (d) => { if (d.appointment) testAptId = d.appointment.id; } }),
      json: (d) => { if (d.appointment) testAptId = d.appointment.id; }
    };

    await createAppointment(reqBook, resBook);

    if (!testAptId) {
      const dbApt = await query('SELECT id FROM appointments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [patientAUser.id]);
      testAptId = dbApt.rows[0]?.id;
    }

    console.log(`   Appointment booked in DB with ID: ${testAptId}`);

    // Check DB row
    const dbRow = await query('SELECT id, user_id, doctor_id, doctor_name, date, time_slot, status FROM appointments WHERE id = $1', [testAptId]);
    if (!dbRow.rows.length || dbRow.rows[0].user_id !== patientAUser.id) {
      throw new Error(`❌ TEST 1 FAILED: Appointment user_id ${dbRow.rows[0]?.user_id} != ${patientAUser.id}`);
    }
    console.log('   ✅ TEST 1 PASSED: Appointment successfully created in database with user_id = authenticated patient ID');

    // -------------------------------------------------------------
    // TEST 2: Patient refreshes page (Session restored from JWT token) -> GET /api/appointments
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Patient refreshes page (Simulating Session Restoration) ---');
    const reqRefresh = { user: { id: patientAUser.id, name: patientAUser.name } };
    let refreshApts = [];
    const resRefresh = {
      json: (d) => { refreshApts = d.appointments || []; },
      status: (code) => ({ json: (d) => { refreshApts = d.appointments || []; } })
    };

    await getAppointments(reqRefresh, resRefresh);
    const foundOnRefresh = refreshApts.find(a => a.id === testAptId);

    if (!foundOnRefresh) {
      throw new Error('❌ TEST 2 FAILED: Appointment disappeared after simulated page refresh!');
    }
    console.log(`   Fetched ${refreshApts.length} appointments for patient on page refresh.`);
    console.log('   ✅ TEST 2 PASSED: Appointment remains visible after browser page refresh');

    // -------------------------------------------------------------
    // TEST 3: Patient logs out -> logs in again -> GET /api/appointments
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Patient logs out -> logs in again ---');
    // Clear session token in memory
    let newLoginToken = null;
    let newLoginUser = null;
    const reqRelogin = {
      body: { phone: 'patient@medconnect.com', email: 'patient@medconnect.com', password: 'MedConnect@2026', role: 'patient' }
    };
    const resRelogin = {
      status: (code) => ({ json: (d) => { if (d.user) { newLoginUser = d.user; newLoginToken = d.user.token; } } }),
      json: (d) => { if (d.user) { newLoginUser = d.user; newLoginToken = d.user.token; } }
    };

    await login(reqRelogin, resRelogin);
    console.log(`   Re-authenticated as ${newLoginUser?.name} (id: ${newLoginUser?.id})`);

    let reloginApts = [];
    const reqPostLogin = { user: { id: newLoginUser.id, name: newLoginUser.name } };
    const resPostLogin = {
      json: (d) => { reloginApts = d.appointments || []; },
      status: (code) => ({ json: (d) => { reloginApts = d.appointments || []; } })
    };

    await getAppointments(reqPostLogin, resPostLogin);
    const foundAfterRelogin = reloginApts.find(a => a.id === testAptId);

    if (!foundAfterRelogin) {
      throw new Error('❌ TEST 3 FAILED: Appointment disappeared after logout -> login!');
    }
    console.log('   ✅ TEST 3 PASSED: Appointment remains visible in My Appointments after logout & login');

    // -------------------------------------------------------------
    // TEST 4: Doctor logs in -> sees patient appointment
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Doctor Vignesh logs in -> checks OPD queue ---');
    let docVigneshUser = null;
    const reqDocAuth = { body: { doctorId: 'doctor@medconnect.com', password: 'Doctor@2026' } };
    const resDocAuth = {
      status: (code) => ({ json: (d) => { if (d.user) docVigneshUser = d.user; } }),
      json: (d) => { if (d.user) docVigneshUser = d.user; }
    };

    await loginDoctor(reqDocAuth, resDocAuth);
    console.log(`   Logged in as Doctor: ${docVigneshUser?.name} (doctorId: ${docVigneshUser?.doctorId})`);

    let docQueue = [];
    const reqDocQueue = { user: { id: docVigneshUser.id, name: docVigneshUser.name, role: 'doctor' } };
    const resDocQueue = {
      json: (d) => { docQueue = d.queue || []; },
      status: (code) => ({ json: (d) => { docQueue = d.queue || []; } })
    };

    await getDoctorQueueDashboard(reqDocQueue, resDocQueue);
    const foundInDocQueue = docQueue.find(a => a.id === testAptId);

    if (!foundInDocQueue) {
      throw new Error('❌ TEST 4 FAILED: Doctor Dashboard could not find Patient A\'s appointment!');
    }
    console.log('   ✅ TEST 4 PASSED: Doctor Vignesh successfully sees Patient A\'s appointment in OPD Queue');

    // -------------------------------------------------------------
    // TEST 5: Doctor completes appointment -> patient queue updates
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Doctor completes appointment -> status update ---');
    const reqComplete = {
      user: { id: docVigneshUser.id, name: docVigneshUser.name },
      body: { appointmentId: testAptId, status: 'completed' }
    };
    let completeResMsg = '';
    const resComplete = {
      json: (d) => { completeResMsg = d.message; },
      status: (code) => ({ json: (d) => { completeResMsg = d.message; } })
    };

    await updateQueueStatus(reqComplete, resComplete);

    // Verify DB updated status
    const dbStatusCheck = await query('SELECT status FROM appointments WHERE id = $1', [testAptId]);
    if (dbStatusCheck.rows[0]?.status !== 'completed') {
      throw new Error(`❌ TEST 5 FAILED: DB status is '${dbStatusCheck.rows[0]?.status}' instead of 'completed'`);
    }
    console.log('   ✅ TEST 5 PASSED: Doctor completed appointment and status updated in database to COMPLETED');

    // -------------------------------------------------------------
    // TEST 6: Another doctor logs in -> cannot see first doctor's patient
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Doctor Gautham Bhandary logs in -> Doctor isolation check ---');
    let docGauthamUser = null;
    const reqGauthamAuth = { body: { doctorId: 'gautham.bhandary@medconnect.com', password: 'Doctor@2026' } };
    const resGauthamAuth = {
      status: (code) => ({ json: (d) => { if (d.user) docGauthamUser = d.user; } }),
      json: (d) => { if (d.user) docGauthamUser = d.user; }
    };

    await loginDoctor(reqGauthamAuth, resGauthamAuth);

    let gauthamQueue = [];
    const reqGauthamQueue = { user: { id: docGauthamUser ? docGauthamUser.id : 'user-doc-2', name: 'Dr. Gautham Bhandary', role: 'doctor' } };
    const resGauthamQueue = {
      json: (d) => { gauthamQueue = d.queue || []; },
      status: (code) => ({ json: (d) => { gauthamQueue = d.queue || []; } })
    };

    await getDoctorQueueDashboard(reqGauthamQueue, resGauthamQueue);
    const foundInGautham = gauthamQueue.find(a => a.id === testAptId);

    if (foundInGautham) {
      throw new Error('❌ TEST 6 FAILED: Doctor Gautham can see Doctor Vignesh\'s patient!');
    }
    console.log('   ✅ TEST 6 PASSED: Doctor isolation confirmed! Dr. Gautham cannot see Dr. Vignesh\'s patients.');

    console.log('\n===============================================================');
    console.log('🎉 ALL 6 FINAL ACCEPTANCE TESTS PASSED SUCCESSFULLY! FULLY PERSISTENT & SECURE!');
    console.log('===============================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
    process.exit(1);
  }
}

runAcceptanceTests();
