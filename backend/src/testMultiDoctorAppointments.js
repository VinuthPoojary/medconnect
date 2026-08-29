import { query } from './db/index.js';
import { login } from './controllers/authController.js';
import { loginDoctor } from './controllers/authDoctorController.js';
import { getAppointments, createAppointment } from './controllers/appointmentController.js';
import { getDoctorMe, getDoctorQueueDashboard } from './controllers/doctorDashboardController.js';

async function runMultiDoctorTest() {
  console.log('🧪 Starting Multi-Doctor Data-Binding Acceptance Tests...\n');

  try {
    // 0. Inspect available doctors in database
    const docRes = await query('SELECT id, name, specialization, hospital_name, user_id FROM doctors ORDER BY id ASC');
    console.log(`📋 Available Doctors in Database (${docRes.rows.length}):`);
    docRes.rows.forEach(d => console.log(`   - [${d.id}] ${d.name} (${d.specialization} at ${d.hospital_name}) [user_id: ${d.user_id}]`));
    console.log('');

    const docVignesh = docRes.rows.find(d => d.name.toLowerCase().includes('vignesh')) || docRes.rows[0];
    const docSuman = docRes.rows.find(d => d.name.toLowerCase().includes('suman')) || docRes.rows[1];
    const docNeha = docRes.rows.find(d => d.name.toLowerCase().includes('neha') || d.name.toLowerCase().includes('gautham') || d.name.toLowerCase().includes('ananya')) || docRes.rows[2];

    console.log(`🎯 Testing with 3 distinct doctors:`);
    console.log(`   Doctor 1: [${docVignesh.id}] ${docVignesh.name} (${docVignesh.hospital_name})`);
    console.log(`   Doctor 2: [${docSuman.id}] ${docSuman.name} (${docSuman.hospital_name})`);
    console.log(`   Doctor 3: [${docNeha.id}] ${docNeha.name} (${docNeha.hospital_name})\n`);

    // 1. Patient Login
    console.log('--- STEP 1: Patient Login ---');
    let patient = null;
    const reqPatientLogin = { body: { email: 'patient@medconnect.com', password: 'Patient@2026', role: 'patient' } };
    await login(reqPatientLogin, {
      status: () => ({ json: (d) => { patient = d.user; } }),
      json: (d) => { patient = d.user; }
    });
    console.log(`   Patient Authenticated: ${patient.name} (id: ${patient.id})\n`);

    const dateToday = new Date().toISOString().split('T')[0];

    // 2. Book Doctor 1 (Dr. Vignesh)
    console.log(`--- STEP 2: Book Doctor 1 (${docVignesh.name}) ---`);
    let aptId1 = null;
    await createAppointment({
      user: { id: patient.id, name: patient.name },
      body: {
        doctorId: docVignesh.id,
        doctorName: docVignesh.name,
        date: dateToday,
        timeSlot: '09:30 AM',
        type: 'offline',
        patientName: patient.name,
        userId: patient.id
      }
    }, {
      status: () => ({ json: (d) => { aptId1 = d.appointment?.id; } }),
      json: (d) => { aptId1 = d.appointment?.id; }
    });
    console.log(`   Booked appointment 1: ${aptId1}`);

    // 3. Book Doctor 2 (Dr. Suman)
    console.log(`--- STEP 3: Book Doctor 2 (${docSuman.name}) ---`);
    let aptId2 = null;
    await createAppointment({
      user: { id: patient.id, name: patient.name },
      body: {
        doctorId: docSuman.id,
        doctorName: docSuman.name,
        date: dateToday,
        timeSlot: '11:00 AM',
        type: 'offline',
        patientName: patient.name,
        userId: patient.id
      }
    }, {
      status: () => ({ json: (d) => { aptId2 = d.appointment?.id; } }),
      json: (d) => { aptId2 = d.appointment?.id; }
    });
    console.log(`   Booked appointment 2: ${aptId2}`);

    // 4. Book Doctor 3 (Dr. Neha / 3rd Doctor)
    console.log(`--- STEP 4: Book Doctor 3 (${docNeha.name}) ---`);
    let aptId3 = null;
    await createAppointment({
      user: { id: patient.id, name: patient.name },
      body: {
        doctorId: docNeha.id,
        doctorName: docNeha.name,
        date: dateToday,
        timeSlot: '02:30 PM',
        type: 'online',
        patientName: patient.name,
        userId: patient.id
      }
    }, {
      status: () => ({ json: (d) => { aptId3 = d.appointment?.id; } }),
      json: (d) => { aptId3 = d.appointment?.id; }
    });
    console.log(`   Booked appointment 3: ${aptId3}\n`);

    // 5. Patient logs out and logs in again (Session Restoration)
    console.log('--- STEP 5: Logout -> Login Again -> Verify "My Appointments" Data Binding ---');
    let patientRelogin = null;
    await login(reqPatientLogin, {
      status: () => ({ json: (d) => { patientRelogin = d.user; } }),
      json: (d) => { patientRelogin = d.user; }
    });

    let patientApts = [];
    await getAppointments({ user: { id: patientRelogin.id, name: patientRelogin.name } }, {
      status: () => ({ json: (d) => { patientApts = d.appointments || []; } }),
      json: (d) => { patientApts = d.appointments || []; }
    });

    console.log(`   Fetched ${patientApts.length} total appointments for ${patientRelogin.name}:`);

    const a1 = patientApts.find(a => a.id === aptId1);
    const a2 = patientApts.find(a => a.id === aptId2);
    const a3 = patientApts.find(a => a.id === aptId3);

    console.log(`   - Appointment 1: Doctor="${a1?.doctorName}", Hospital="${a1?.hospitalName}", Spec="${a1?.specialization}"`);
    console.log(`   - Appointment 2: Doctor="${a2?.doctorName}", Hospital="${a2?.hospitalName}", Spec="${a2?.specialization}"`);
    console.log(`   - Appointment 3: Doctor="${a3?.doctorName}", Hospital="${a3?.hospitalName}", Spec="${a3?.specialization}"\n`);

    if (a1?.doctorName !== docVignesh.name) {
      throw new Error(`❌ Appointment 1 has wrong doctor name! Expected "${docVignesh.name}", got "${a1?.doctorName}"`);
    }
    if (a2?.doctorName !== docSuman.name) {
      throw new Error(`❌ Appointment 2 has wrong doctor name! Expected "${docSuman.name}", got "${a2?.doctorName}"`);
    }
    if (a3?.doctorName !== docNeha.name) {
      throw new Error(`❌ Appointment 3 has wrong doctor name! Expected "${docNeha.name}", got "${a3?.doctorName}"`);
    }

    console.log('   ✅ VERIFICATION PASSED: Every appointment correctly and independently displays its own doctor!\n');

    // 6. Doctor Portals Verification
    console.log('--- STEP 6: Doctor Portals Isolation Verification ---');
    // Doctor 1 Dashboard
    let doc1Queue = null;
    await getDoctorQueueDashboard({ user: { id: docVignesh.user_id, role: 'doctor' } }, {
      status: () => ({ json: (d) => { doc1Queue = d; } }),
      json: (d) => { doc1Queue = d; }
    });
    const doc1HasApt1 = doc1Queue?.queue?.some(a => a.id === aptId1);
    const doc1HasApt2 = doc1Queue?.queue?.some(a => a.id === aptId2);

    if (!doc1HasApt1 || doc1HasApt2) {
      throw new Error(`❌ Doctor 1 Queue Isolation failed! Has Apt 1: ${doc1HasApt1}, Has Apt 2: ${doc1HasApt2}`);
    }
    console.log(`   ✅ Doctor 1 (${docVignesh.name}) sees Appointment 1, but NOT Appointment 2.`);

    console.log('\n========================================================================');
    console.log('🎉 ALL MULTI-DOCTOR APPOINTMENTS DATA BINDING TESTS PASSED PERFECTLY!');
    console.log('========================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ MULTI-DOCTOR TEST FAILED:', err);
    process.exit(1);
  }
}

runMultiDoctorTest();
