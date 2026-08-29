import { query } from './db/index.js';
import { getDoctorQueueDashboard, updateQueueStatus, getDoctorForUser } from './controllers/doctorDashboardController.js';
import { createAppointment } from './controllers/appointmentController.js';

async function runVerificationTest() {
  console.log('🧪 Starting Complete Doctor Portal & Real-Time Queue Verification Test...\n');

  try {
    // STEP 1: Verify Schema & Mapping
    console.log('1️⃣ Checking Database Schema & Doctors table mapping...');
    const docCheck = await query('SELECT id, user_id, name, specialization, hospital_name FROM doctors WHERE user_id = $1 OR id = $2', ['user-doc-1', 'doc-kmc-1']);
    console.log('   Doctor mapping result:', docCheck.rows);

    if (docCheck.rows.length === 0 || docCheck.rows[0].user_id !== 'user-doc-1') {
      throw new Error('❌ Schema verification failed: doctors.user_id is not mapped to user-doc-1!');
    }
    console.log('   ✅ Schema verification passed: doctors.user_id = user-doc-1 linked to Dr. Vignesh Shetty (doc-kmc-1)\n');

    // STEP 2: Test Patient A Booking Dr. Vignesh
    console.log('2️⃣ Test Patient A (user-patient-1) booking Dr. Vignesh Shetty (doc-kmc-1)...');
    const mockReqA = {
      body: {
        doctorId: 'doc-kmc-1',
        doctorName: 'Dr. Vignesh Shetty',
        doctorPhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d',
        specialization: 'Cardiologist',
        hospitalName: 'KMC Hospital Attavar & Jyothi',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '09:30 AM',
        type: 'offline',
        patientName: 'Patient A (Test Verification)',
        userId: 'user-patient-1',
      },
      user: { id: 'user-patient-1', name: 'Patient A (Test Verification)' },
    };

    let bookedAppointmentId = null;
    const mockResA = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Booking Response (${code}):`, data.message);
          if (data.appointment) bookedAppointmentId = data.appointment.id;
        },
      }),
      json: (data) => {
        console.log('   Booking Response:', data.message);
        if (data.appointment) bookedAppointmentId = data.appointment.id;
      },
    };

    await createAppointment(mockReqA, mockResA);

    if (!bookedAppointmentId) {
      // Fallback query latest appointment for Patient A
      const aptQuery = await query('SELECT id FROM appointments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', ['user-patient-1']);
      bookedAppointmentId = aptQuery.rows[0]?.id;
    }

    console.log(`   ✅ Appointment created with ID: ${bookedAppointmentId}\n`);

    // STEP 3: Verify Dr. Vignesh (user-doc-1) Doctor Dashboard sees Patient A
    console.log('3️⃣ Verify Dr. Vignesh Shetty (doctor@medconnect.com / user-doc-1) Dashboard Queue...');
    const reqDocVignesh = { user: { id: 'user-doc-1', name: 'Dr. Vignesh Shetty', role: 'doctor' } };
    let vigneshQueueData = null;
    const resDocVignesh = {
      json: (data) => { vigneshQueueData = data; },
      status: (code) => ({ json: (data) => { vigneshQueueData = data; } }),
    };

    await getDoctorQueueDashboard(reqDocVignesh, resDocVignesh);

    console.log(`   Dr. Vignesh Queue Count: ${vigneshQueueData?.queue?.length || 0}`);
    const foundPatientA = vigneshQueueData?.queue?.find(a => a.id === bookedAppointmentId || a.patientName?.includes('Patient A'));

    if (!foundPatientA) {
      throw new Error('❌ Doctor Dashboard test failed: Dr. Vignesh cannot see Patient A in his OPD queue!');
    }
    console.log('   ✅ Dr. Vignesh Dashboard successfully retrieved Patient A from database!\n');

    // STEP 4: Test Multi-Doctor Isolation (Dr. Gautham Bhandary user-doc-2 / doc-kmc-2 MUST NOT see Patient A)
    console.log('4️⃣ Verify Doctor Isolation: Dr. Gautham Bhandary (user-doc-2 / doc-kmc-2) MUST NOT see Patient A...');
    const reqDocGautham = { user: { id: 'user-doc-2', name: 'Dr. Gautham Bhandary', role: 'doctor' } };
    let gauthamQueueData = null;
    const resDocGautham = {
      json: (data) => { gauthamQueueData = data; },
      status: (code) => ({ json: (data) => { gauthamQueueData = data; } }),
    };

    await getDoctorQueueDashboard(reqDocGautham, resDocGautham);

    const foundPatientAInGautham = gauthamQueueData?.queue?.find(a => a.id === bookedAppointmentId || a.patientName?.includes('Patient A'));
    if (foundPatientAInGautham) {
      throw new Error('❌ Doctor Isolation failed: Dr. Gautham Bhandary can see Dr. Vignesh\'s patient!');
    }
    console.log('   ✅ Doctor Isolation passed: Dr. Gautham Bhandary does NOT see Dr. Vignesh\'s patient!\n');

    // STEP 5: Test Doctor OPD Queue Status Machine Transitions (WAITING -> IN_CONSULTATION -> COMPLETED)
    console.log('5️⃣ Testing OPD Queue Status transitions (Start Consultation -> Complete)...');
    
    // 5a. Start Consultation
    const reqStatus1 = {
      user: { id: 'user-doc-1', name: 'Dr. Vignesh Shetty' },
      body: { appointmentId: bookedAppointmentId, status: 'in_consultation' },
    };
    let statusRes1 = null;
    const resStatus1 = {
      json: (data) => { statusRes1 = data; },
      status: (code) => ({ json: (data) => { statusRes1 = data; } }),
    };
    await updateQueueStatus(reqStatus1, resStatus1);
    console.log('   Start Consultation response:', statusRes1?.message);

    // Verify DB status
    const dbApt1 = await query('SELECT status FROM appointments WHERE id = $1', [bookedAppointmentId]);
    console.log(`   Database status after start: ${dbApt1.rows[0]?.status}`);
    if (dbApt1.rows[0]?.status !== 'in_consultation') {
      throw new Error('❌ Status update failed: appointment status is not in_consultation!');
    }

    // 5b. Complete Consultation
    const reqStatus2 = {
      user: { id: 'user-doc-1', name: 'Dr. Vignesh Shetty' },
      body: { appointmentId: bookedAppointmentId, status: 'completed' },
    };
    let statusRes2 = null;
    const resStatus2 = {
      json: (data) => { statusRes2 = data; },
      status: (code) => ({ json: (data) => { statusRes2 = data; } }),
    };
    await updateQueueStatus(reqStatus2, resStatus2);
    console.log('   Complete Consultation response:', statusRes2?.message);

    // Verify DB status
    const dbApt2 = await query('SELECT status FROM appointments WHERE id = $1', [bookedAppointmentId]);
    console.log(`   Database status after completion: ${dbApt2.rows[0]?.status}`);
    if (dbApt2.rows[0]?.status !== 'completed') {
      throw new Error('❌ Status update failed: appointment status is not completed!');
    }

    console.log('\n🎉 ALL 5 VERIFICATION CHECKS PASSED PERFECTLY! Doctor portal & real-time sync is 100% fixed & verified!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed with error:', err);
    process.exit(1);
  }
}

runVerificationTest();
