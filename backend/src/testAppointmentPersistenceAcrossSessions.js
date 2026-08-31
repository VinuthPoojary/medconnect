import { query } from './db/index.js';
import { login } from './controllers/authController.js';
import { createAppointment, getAppointments, getLiveQueue, getDoctorQueueStatus } from './controllers/appointmentController.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medconnect_karavali_super_secret_jwt_key_2026';

const runPersistenceTests = async () => {
  console.log('===============================================================');
  console.log('🧪 RUNNING APPOINTMENT PERSISTENCE & RELOGIN VERIFICATION');
  console.log('===============================================================');

  // Clean test appointments for target date
  await query("DELETE FROM appointments WHERE date = '2026-09-01'");

  // Ensure test users exist
  await query(`
    INSERT INTO users (id, name, email, phone, password_hash, role) 
    VALUES 
      ('user-patient-1', 'Kavya Poojary', 'patient@medconnect.com', '+91 98450 12345', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'patient'),
      ('user-patient-2', 'Patient B', 'patientb@test.com', '+91 98450 99992', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'patient')
    ON CONFLICT (id) DO NOTHING
  `);

  // 1. Authenticate Patient A
  console.log('\n--- STEP 1: Patient A Authenticates & Logs In ---');
  let authPatientA = null;
  const mockReqLoginA = { body: { email: 'patient@medconnect.com', password: 'Patient@2026', role: 'patient' } };
  const mockResLoginA = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { authPatientA = data; return this; }
  };
  await login(mockReqLoginA, mockResLoginA);
  if (!authPatientA?.success || !authPatientA?.user?.token) {
    throw new Error('Patient A login failed: ' + JSON.stringify(authPatientA));
  }
  console.log(`✅ Patient A logged in: ${authPatientA.user.name} (ID: ${authPatientA.user.id})`);

  // Decode JWT to verify identity
  const decodedA = jwt.verify(authPatientA.user.token, JWT_SECRET);
  console.log(`   JWT Subject: id=${decodedA.id}, role=${decodedA.role}`);

  // 2. Patient A Books Dr. Rashmi Bhat on Sep 1, 10:30 AM
  console.log('\n--- STEP 2: Patient A Books Dr. Rashmi Bhat (Sep 01, 10:30 AM) ---');
  let aptResultA = null;
  const mockReqBookA = {
    user: decodedA,
    body: {
      doctorId: 'doc-yen-2',
      doctorName: 'Dr. Rashmi Bhat',
      date: '2026-09-01',
      timeSlot: '10:30 AM',
      type: 'in-person',
      userId: decodedA.id
    }
  };
  const mockResBookA = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { aptResultA = data; return this; }
  };
  await createAppointment(mockReqBookA, mockResBookA);
  console.log(`   Booking Status: ${mockResBookA.statusCode}, Token: #${aptResultA.appointment?.queueNumber}`);
  if (aptResultA.appointment?.queueNumber !== 1) {
    throw new Error(`Expected Patient A Token #1, got #${aptResultA.appointment?.queueNumber}`);
  }
  console.log('✅ Patient A booked Token #1');

  // Verify in real Database
  const dbCheckA = await query('SELECT * FROM appointments WHERE id = $1', [aptResultA.appointment.id]);
  if (dbCheckA.rows.length === 0) throw new Error('Appointment not found in DB!');
  console.log(`   DB Verified Row: id=${dbCheckA.rows[0].id}, user_id=${dbCheckA.rows[0].user_id}, queue_num=${dbCheckA.rows[0].queue_number}`);

  // 3. Patient B Logs In & Books Dr. Rashmi Bhat
  console.log('\n--- STEP 3: Patient B Logs In & Books Same Doctor + Slot ---');
  let authPatientB = null;
  const mockReqLoginB = { body: { email: 'patientb@test.com', password: 'Patient@2026', role: 'patient' } };
  const mockResLoginB = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { authPatientB = data; return this; }
  };
  await login(mockReqLoginB, mockResLoginB);
  const decodedB = jwt.verify(authPatientB.user.token, JWT_SECRET);
  console.log(`✅ Patient B logged in: ${authPatientB.user.name} (ID: ${authPatientB.user.id})`);

  let aptResultB = null;
  const mockReqBookB = {
    user: decodedB,
    body: {
      doctorId: 'doc-yen-2',
      doctorName: 'Dr. Rashmi Bhat',
      date: '2026-09-01',
      timeSlot: '10:30 AM',
      type: 'in-person',
      userId: decodedB.id
    }
  };
  const mockResBookB = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { aptResultB = data; return this; }
  };
  await createAppointment(mockReqBookB, mockResBookB);
  console.log(`   Patient B Booking Status: ${mockResBookB.statusCode}, Token: #${aptResultB.appointment?.queueNumber}`);
  if (aptResultB.appointment?.queueNumber !== 2) {
    throw new Error(`Expected Patient B Token #2, got #${aptResultB.appointment?.queueNumber}`);
  }
  console.log('✅ Patient B received Token #2 in sequence');

  // 4. Simulate Complete Logout (Clear memory session variables)
  console.log('\n--- STEP 4: Simulate Logout (Clear Session State) ---');
  authPatientA = null;
  authPatientB = null;
  aptResultA = null;
  aptResultB = null;
  console.log('   All frontend / session in-memory state purged.');

  // 5. Patient A Relogins & Fetches Appointments
  console.log('\n--- STEP 5: Patient A Re-Logs In & Fetches from Database ---');
  let reloginA = null;
  await login(mockReqLoginA, {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { reloginA = data; return this; }
  });
  const decodedReloginA = jwt.verify(reloginA.user.token, JWT_SECRET);

  let fetchedAptsA = null;
  const mockReqFetchA = {
    user: decodedReloginA,
    query: { userId: decodedReloginA.id }
  };
  await getAppointments(mockReqFetchA, {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { fetchedAptsA = data; return this; }
  });

  console.log(`   Patient A retrieved ${fetchedAptsA.appointments?.length} appointment(s) from database.`);
  const myAptA = fetchedAptsA.appointments?.find(a => a.date === '2026-09-01' && a.timeSlot === '10:30 AM');
  if (!myAptA) throw new Error('Patient A appointment disappeared after relogin!');
  if (myAptA.queueNumber !== 1) throw new Error(`Expected Token #1, got #${myAptA.queueNumber}`);
  console.log(`   ✅ Patient A Appointment Persistent: Doctor=${myAptA.doctorName}, Token=#${myAptA.queueNumber}, Status=${myAptA.status}`);

  // Ensure Patient A does NOT see Patient B's appointment
  const leakedB = fetchedAptsA.appointments?.find(a => a.userId === 'user-patient-2');
  if (leakedB) throw new Error('Security violation: Patient A sees Patient B appointment!');
  console.log('   ✅ Patient isolation verified (Patient A cannot see Patient B data).');

  // 6. Patient B Relogins & Fetches Appointments
  console.log('\n--- STEP 6: Patient B Re-Logs In & Fetches from Database ---');
  let reloginB = null;
  await login(mockReqLoginB, {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { reloginB = data; return this; }
  });
  const decodedReloginB = jwt.verify(reloginB.user.token, JWT_SECRET);

  let fetchedAptsB = null;
  const mockReqFetchB = {
    user: decodedReloginB,
    query: { userId: decodedReloginB.id }
  };
  await getAppointments(mockReqFetchB, {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { fetchedAptsB = data; return this; }
  });

  const myAptB = fetchedAptsB.appointments?.find(a => a.date === '2026-09-01' && a.timeSlot === '10:30 AM');
  if (!myAptB) throw new Error('Patient B appointment disappeared after relogin!');
  if (myAptB.queueNumber !== 2) throw new Error(`Expected Token #2, got #${myAptB.queueNumber}`);
  console.log(`   ✅ Patient B Appointment Persistent: Doctor=${myAptB.doctorName}, Token=#${myAptB.queueNumber}, Status=${myAptB.status}`);

  // 7. Doctor Portal Scoping Test (Dr. Rashmi Bhat)
  console.log('\n--- STEP 7: Doctor Portal Queue Verification ---');
  let docQueue = null;
  const mockReqDoc = {
    query: {
      doctorId: 'doc-yen-2',
      date: '2026-09-01',
      timeSlot: '10:30 AM'
    }
  };
  await getLiveQueue(mockReqDoc, {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(data) { docQueue = data; return this; }
  });

  console.log(`   Dr. Rashmi Bhat Live Queue Size: ${docQueue.queue?.length}`);
  if (docQueue.queue?.length !== 2) {
    throw new Error(`Doctor expected 2 patients in queue, found ${docQueue.queue?.length}`);
  }
  console.log(`   Doctor Queue: Token #${docQueue.queue[0].queueNumber} (${docQueue.queue[0].patientName}), Token #${docQueue.queue[1].queueNumber} (${docQueue.queue[1].patientName})`);
  console.log('   ✅ Doctor sees sequential OPD queue from database.');

  console.log('\n===============================================================');
  console.log('🎉 ALL PERSISTENCE, AUTH MAPPING & RELOGIN TESTS PASSED 100%!');
  console.log('===============================================================');
};

runPersistenceTests().catch(err => {
  console.error('\n❌ Persistence Test Failed:', err);
  process.exit(1);
});
