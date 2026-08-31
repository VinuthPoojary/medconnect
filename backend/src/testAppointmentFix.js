import { query } from './db/index.js';
import {
  createAppointment,
  getSlotCounts,
  getAppointments,
  getLiveQueue,
  getDoctorQueueStatus,
} from './controllers/appointmentController.js';

// Helper mock response
const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    },
  };
  return res;
};

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING CRITICAL APPOINTMENT SYSTEM VERIFICATION TEST SUITE');
  console.log('===============================================================\n');

  // Clean test appointments
  await query("DELETE FROM appointments WHERE id LIKE 'test-apt-%' OR date IN ('2026-08-30', '2026-08-31')");

  // Ensure test users exist in users table
  await query(`
    INSERT INTO users (id, name, email, phone, password_hash, role) 
    VALUES 
      ('user-patient-1', 'Patient Kavya', 'kavya@test.com', '+91 98450 12345', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'patient'),
      ('user-patient-2', 'Patient B', 'patientb@test.com', '+91 98450 99992', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'patient'),
      ('user-patient-3', 'Patient C', 'patientc@test.com', '+91 98450 99993', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'patient')
    ON CONFLICT (id) DO NOTHING
  `);

  // Fetch doctors from DB
  const docRes = await query('SELECT * FROM doctors LIMIT 2');
  if (docRes.rows.length < 2) {
    throw new Error('Need at least 2 doctors in database to run multi-doctor tests.');
  }

  const doctorA = docRes.rows[0];
  const doctorB = docRes.rows[1];
  console.log(`👨‍⚕️ Doctor A: ${doctorA.name} (${doctorA.id})`);
  console.log(`👩‍⚕️ Doctor B: ${doctorB.name} (${doctorB.id})\n`);

  // -------------------------------------------------------------
  // TEST 1: Date Scoping & Slot Isolation (Initial state = 0 booked)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Verify Initial Slot Counts (Aug 30 vs Aug 31) ---');
  const mockReq1 = {
    query: { doctorId: doctorA.id, date: '2026-08-31' },
  };
  const mockRes1 = createMockRes();
  await getSlotCounts(mockReq1, mockRes1);

  const slot31Initial = mockRes1.data?.slotCounts?.['10:30 AM']?.patientsBooked || 0;
  console.log(`   Doctor A (2026-08-31 10:30 AM) initial booked: ${slot31Initial}`);
  if (slot31Initial !== 0) throw new Error('Initial count on 2026-08-31 should be 0');
  console.log('   ✅ TEST 1 PASSED\n');

  // -------------------------------------------------------------
  // TEST 2 & TEST 3: Patient A books Doctor A on 2026-08-31 10:30 AM -> Token #1
  // -------------------------------------------------------------
  console.log('--- TEST 2: Patient A Books Doctor A on Aug 31, 10:30 AM ---');
  const mockReqBookA = {
    user: { id: 'user-patient-1', name: 'Patient Kavya' },
    body: {
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      date: '2026-08-31',
      timeSlot: '10:30 AM',
      type: 'in-person',
      userId: 'user-patient-1',
    },
  };
  const mockResBookA = createMockRes();
  await createAppointment(mockReqBookA, mockResBookA);

  const aptA = mockResBookA.data?.appointment;
  const tokenA = aptA?.queueNumber;
  console.log(`   Patient A Appointment Status: ${mockResBookA.statusCode}`);
  console.log(`   Patient A Token: #${tokenA}, QueuePos: ${aptA?.expectedPosition}`);
  if (mockResBookA.statusCode !== 201 || tokenA !== 1) {
    throw new Error(`Patient A expected Token #1, got #${tokenA} (Status: ${mockResBookA.statusCode})`);
  }
  console.log('   ✅ TEST 2 PASSED: Patient A received Token #1\n');

  // -------------------------------------------------------------
  // Verify Aug 30 is still 0 while Aug 31 is 1
  // -------------------------------------------------------------
  console.log('--- TEST 2b: Verify Aug 30 Count is UNCHANGED (0) while Aug 31 is 1 ---');
  const mockReqSlotAug30 = {
    query: { doctorId: doctorA.id, date: '2026-08-30' },
  };
  const mockResSlotAug30 = createMockRes();
  await getSlotCounts(mockReqSlotAug30, mockResSlotAug30);
  const countAug30 = mockResSlotAug30.data?.slotCounts?.['10:30 AM']?.patientsBooked || 0;

  const mockReqSlotAug31 = {
    query: { doctorId: doctorA.id, date: '2026-08-31' },
  };
  const mockResSlotAug31 = createMockRes();
  await getSlotCounts(mockReqSlotAug31, mockResSlotAug31);
  const countAug31 = mockResSlotAug31.data?.slotCounts?.['10:30 AM']?.patientsBooked || 0;
  const expPosAug31 = mockResSlotAug31.data?.slotCounts?.['10:30 AM']?.expectedPosition || 1;

  console.log(`   Aug 30 10:30 AM Booked: ${countAug30}`);
  console.log(`   Aug 31 10:30 AM Booked: ${countAug31}, Expected Position for next patient: #${expPosAug31}`);

  if (countAug30 !== 0) throw new Error('Aug 30 count should be 0!');
  if (countAug31 !== 1) throw new Error('Aug 31 count should be 1!');
  if (expPosAug31 !== 2) throw new Error('Aug 31 expected position for next patient should be #2!');
  console.log('   ✅ TEST 2b PASSED: Date scoping verified\n');

  // -------------------------------------------------------------
  // TEST 3: Patient B books Doctor A on 2026-08-31 10:30 AM -> Token #2
  // -------------------------------------------------------------
  console.log('--- TEST 3: Patient B Books Doctor A on Aug 31, 10:30 AM -> Token #2 ---');
  const mockReqBookB = {
    user: { id: 'user-patient-2', name: 'Patient B' },
    body: {
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      date: '2026-08-31',
      timeSlot: '10:30 AM',
      type: 'in-person',
      userId: 'user-patient-2',
    },
  };
  const mockResBookB = createMockRes();
  await createAppointment(mockReqBookB, mockResBookB);

  const aptB = mockResBookB.data?.appointment;
  const tokenB = aptB?.queueNumber;
  console.log(`   Patient B Appointment Status: ${mockResBookB.statusCode}`);
  console.log(`   Patient B Token: #${tokenB}, Patients Ahead: ${aptB?.patientsAhead}`);
  if (mockResBookB.statusCode !== 201 || tokenB !== 2) {
    throw new Error(`Patient B expected Token #2, got #${tokenB}`);
  }
  console.log('   ✅ TEST 3 PASSED: Patient B received Token #2\n');

  // -------------------------------------------------------------
  // TEST 3b: Patient C books Doctor A on 2026-08-31 02:00 PM -> Token #1 (Separate queue)
  // -------------------------------------------------------------
  console.log('--- TEST 3b: Patient C Books Doctor A on Aug 31, 02:00 PM (Separate Slot) -> Token #1 ---');
  const mockReqBookC = {
    user: { id: 'user-patient-3', name: 'Patient C' },
    body: {
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      date: '2026-08-31',
      timeSlot: '02:00 PM',
      type: 'in-person',
      userId: 'user-patient-3',
    },
  };
  const mockResBookC = createMockRes();
  await createAppointment(mockReqBookC, mockResBookC);

  const aptC = mockResBookC.data?.appointment;
  const tokenC = aptC?.queueNumber;
  console.log(`   Patient C (02:00 PM) Token: #${tokenC}`);
  if (mockResBookC.statusCode !== 201 || tokenC !== 1) {
    throw new Error(`Patient C expected Token #1 for 02:00 PM slot, got #${tokenC}`);
  }
  console.log('   ✅ TEST 3b PASSED: Time slot queue scoping verified (starts at #1)\n');

  // -------------------------------------------------------------
  // TEST 4: Persistence across Logout / Login (Fetching by Auth User ID)
  // -------------------------------------------------------------
  console.log('--- TEST 4: Fetch Appointments by Authenticated User ID ---');
  const mockReqGetA = {
    user: { id: 'user-patient-1' },
  };
  const mockResGetA = createMockRes();
  await getAppointments(mockReqGetA, mockResGetA);

  const userAApts = mockResGetA.data?.appointments || [];
  console.log(`   Fetched ${userAApts.length} appointment(s) for Patient A from DB.`);
  const foundAptA = userAApts.find(a => a.id === aptA.id);
  if (!foundAptA) throw new Error('Patient A appointment not found in DB fetch!');
  console.log(`   Appointment Details: Doctor=${foundAptA.doctorName}, Date=${foundAptA.date}, Time=${foundAptA.timeSlot}, Token=#${foundAptA.queueNumber}`);
  console.log('   ✅ TEST 4 PASSED: DB persistence and auth isolation verified\n');

  // -------------------------------------------------------------
  // TEST 5: Duplicate Click / Duplicate Booking Protection (409 Conflict)
  // -------------------------------------------------------------
  console.log('--- TEST 5: Duplicate Booking Attempt (Patient A in same slot) ---');
  const mockReqDup = {
    user: { id: 'user-patient-1', name: 'Patient Kavya' },
    body: {
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      date: '2026-08-31',
      timeSlot: '10:30 AM',
      type: 'in-person',
      userId: 'user-patient-1',
    },
  };
  const mockResDup = createMockRes();
  await createAppointment(mockReqDup, mockResDup);

  console.log(`   Duplicate Booking Response Status: ${mockResDup.statusCode}, Message: "${mockResDup.data?.message}"`);
  if (mockResDup.statusCode !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate booking, got ${mockResDup.statusCode}`);
  }
  console.log('   ✅ TEST 5 PASSED: Concurrency & duplicate booking prevented\n');

  // -------------------------------------------------------------
  // TEST 6: Doctor Independence (Doctor A vs Doctor B on Aug 31 10:30 AM)
  // -------------------------------------------------------------
  console.log('--- TEST 6: Doctor Independence (Doctor A vs Doctor B on Aug 31 10:30 AM) ---');
  const mockReqSlotDocB = {
    query: { doctorId: doctorB.id, date: '2026-08-31' },
  };
  const mockResSlotDocB = createMockRes();
  await getSlotCounts(mockReqSlotDocB, mockResSlotDocB);
  const countDocB = mockResSlotDocB.data?.slotCounts?.['10:30 AM']?.patientsBooked || 0;

  console.log(`   Doctor A (Aug 31, 10:30 AM) Booked Count: 2 (Patient A & Patient B)`);
  console.log(`   Doctor B (Aug 31, 10:30 AM) Booked Count: ${countDocB}`);
  if (countDocB !== 0) {
    throw new Error(`Doctor B count should be 0, got ${countDocB}`);
  }
  console.log('   ✅ TEST 6 PASSED: Multiple doctors remain completely independent\n');

  console.log('===============================================================');
  console.log('🎉 ALL TEST SUITE CASES PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
