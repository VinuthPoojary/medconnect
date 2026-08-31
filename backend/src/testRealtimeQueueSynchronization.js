import { query } from './db/index.js';
import { createAppointment, getDoctorQueueStatus, updateAppointmentStatus } from './controllers/appointmentController.js';
import { updateQueueStatus } from './controllers/doctorDashboardController.js';

async function runTests() {
  console.log('=====================================================');
  console.log('⚡ RUNNING REAL-TIME AI QUEUE TRACKER SYNCHRONIZATION TEST');
  console.log('=====================================================\n');

  const testDoctorId = 'doc-1';
  const testDoctorName = 'Dr. Pradeep Poojary';
  const testDate = '2026-09-02';
  const testSlot = '10:30 AM';

  // 0. Clean up previous test appointments for this doctor & date
  await query(
    `DELETE FROM appointments WHERE (doctor_id = $1 OR doctor_name = $2) AND date = $3`,
    [testDoctorId, testDoctorName, testDate]
  );
  console.log(`🧹 Cleaned up existing test records for ${testDoctorName} on ${testDate}`);

  // Create two distinct authenticated users
  const userAId = `test-user-a-${Date.now()}`;
  const userBId = `test-user-b-${Date.now()}`;
  const randPhoneA = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const randPhoneB = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
  await query(
    `INSERT INTO users (id, name, email, role, phone, password_hash) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userAId, 'Patient A', `patient_a_${Date.now()}@medconnect.test`, 'patient', randPhoneA, 'hashed_pass_test']
  );
  await query(
    `INSERT INTO users (id, name, email, role, phone, password_hash) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userBId, 'Patient B', `patient_b_${Date.now()}@medconnect.test`, 'patient', randPhoneB, 'hashed_pass_test']
  );

  // 1. Patient A books appointment
  console.log('\n--- 1. Patient A Books Dr. Pradeep Poojary (10:30 AM) ---');
  const reqA = {
    user: { id: userAId, email: 'patient_a@test.com', name: 'Patient A' },
    body: {
      doctorId: testDoctorId,
      doctorName: testDoctorName,
      date: testDate,
      timeSlot: testSlot,
      patientName: 'Patient A',
      hospitalName: 'AJ Hospital & Research Centre',
      specialization: 'Orthopedic Surgeon',
    },
  };
  let resAData = null;
  const resA = {
    status: (code) => ({ json: (d) => { resAData = d; } }),
    json: (d) => { resAData = d; },
  };
  await createAppointment(reqA, resA);
  const aptA = resAData.appointment;
  console.log(`✅ Patient A Booked: Appointment ID = ${aptA.id}, Queue Token = #${aptA.queueNumber}`);

  // 2. Patient B books appointment for the SAME doctor, date, slot
  console.log('\n--- 2. Patient B Books Dr. Pradeep Poojary (10:30 AM) ---');
  const reqB = {
    user: { id: userBId, email: 'patient_b@test.com', name: 'Patient B' },
    body: {
      doctorId: testDoctorId,
      doctorName: testDoctorName,
      date: testDate,
      timeSlot: testSlot,
      patientName: 'Patient B',
      hospitalName: 'AJ Hospital & Research Centre',
      specialization: 'Orthopedic Surgeon',
    },
  };
  let resBData = null;
  const resB = {
    status: (code) => ({ json: (d) => { resBData = d; } }),
    json: (d) => { resBData = d; },
  };
  await createAppointment(reqB, resB);
  const aptB = resBData.appointment;
  console.log(`✅ Patient B Booked: Appointment ID = ${aptB.id}, Queue Token = #${aptB.queueNumber}`);

  // 3. Inspect initial Queue State for Patient A and Patient B
  console.log('\n--- 3. Checking Initial Live Queue Status ---');
  const checkQueueA = async () => {
    let qData = null;
    await getDoctorQueueStatus(
      { query: { doctorId: testDoctorId, date: testDate, timeSlot: testSlot, appointmentId: aptA.id, userId: userAId } },
      { json: (d) => { qData = d; } }
    );
    return qData;
  };
  const checkQueueB = async () => {
    let qData = null;
    await getDoctorQueueStatus(
      { query: { doctorId: testDoctorId, date: testDate, timeSlot: testSlot, appointmentId: aptB.id, userId: userBId } },
      { json: (d) => { qData = d; } }
    );
    return qData;
  };

  const initialQA = await checkQueueA();
  const initialQB = await checkQueueB();

  console.log('Patient A Queue View:', {
    yourToken: initialQA.yourToken,
    currentToken: initialQA.currentToken,
    patientsAhead: initialQA.patientsAhead,
    status: initialQA.status,
  });
  console.log('Patient B Queue View:', {
    yourToken: initialQB.yourToken,
    currentToken: initialQB.currentToken,
    patientsAhead: initialQB.patientsAhead,
    status: initialQB.status,
  });

  if (initialQA.yourToken === 1 && initialQA.patientsAhead === 0 && initialQB.yourToken === 2 && initialQB.patientsAhead === 1) {
    console.log('✅ Initial queue computation is correct (Patient A Token #1 ahead: 0, Patient B Token #2 ahead: 1)');
  } else {
    console.error('❌ Initial queue mismatch');
  }

  // 4. Doctor completes consultation for Patient A (Token #1)
  console.log('\n--- 4. Doctor Completes Consultation for Patient A (Token #1) ---');
  let doctorUpdateData = null;
  await updateQueueStatus(
    {
      user: { id: 'user-doc-pradeep', name: testDoctorName },
      body: { appointmentId: aptA.id, status: 'completed' },
    },
    {
      status: (code) => ({ json: (d) => { doctorUpdateData = d; } }),
      json: (d) => { doctorUpdateData = d; },
    }
  );
  console.log('✅ Doctor update completed:', doctorUpdateData);

  // 5. Verify Real-time Database Queue Updates for Patient A & Patient B
  console.log('\n--- 5. Verifying Updated Queue Status across Both Patients ---');
  const updatedQA = await checkQueueA();
  const updatedQB = await checkQueueB();

  console.log('Patient A Queue View After Completion:', {
    yourToken: updatedQA.yourToken,
    currentToken: updatedQA.currentToken,
    patientsAhead: updatedQA.patientsAhead,
    status: updatedQA.status,
  });
  console.log('Patient B Queue View After Patient A Completed:', {
    yourToken: updatedQB.yourToken,
    currentToken: updatedQB.currentToken,
    patientsAhead: updatedQB.patientsAhead,
    status: updatedQB.status,
  });

  let allPassed = true;
  if (updatedQA.status !== 'completed') {
    console.error(`❌ Patient A status expected 'completed' but got '${updatedQA.status}'`);
    allPassed = false;
  }
  if (updatedQB.currentToken !== 2) {
    console.error(`❌ Patient B currentToken expected 2 but got ${updatedQB.currentToken}`);
    allPassed = false;
  }
  if (updatedQB.patientsAhead !== 0) {
    console.error(`❌ Patient B patientsAhead expected 0 but got ${updatedQB.patientsAhead}`);
    allPassed = false;
  }

  if (allPassed) {
    console.log('\n=====================================================');
    console.log('🎉 ALL REAL-TIME QUEUE SYNCHRONIZATION TESTS PASSED 100%!');
    console.log('=====================================================');
  }
}

runTests().catch(console.error);
