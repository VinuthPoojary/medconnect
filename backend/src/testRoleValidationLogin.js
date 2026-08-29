import { query } from './db/index.js';
import { login } from './controllers/authController.js';
import { loginDoctor } from './controllers/authDoctorController.js';
import { loginHospital } from './controllers/authHospitalController.js';

async function runRoleValidationTests() {
  console.log('🧪 Starting Strict Role Validation Login Tests...\n');

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: Patient selected + Patient credentials
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Patient selected + Patient credentials ---');
    let resData1 = null;
    let statusCode1 = 200;
    const mockRes1 = {
      status: (code) => { statusCode1 = code; return { json: (d) => { resData1 = d; } }; },
      json: (d) => { resData1 = d; }
    };
    await login({
      body: {
        email: 'patient@medconnect.com',
        password: 'Patient@2026',
        role: 'patient'
      }
    }, mockRes1);

    if (!resData1?.success || resData1?.user?.role !== 'patient') {
      throw new Error(`TEST 1 Failed! Expected successful login as patient, got: ${JSON.stringify(resData1)}`);
    }
    console.log(`   ✅ PASSED: Authenticated as Patient (${resData1.user.name}, role: ${resData1.user.role})\n`);

    // -------------------------------------------------------------------------
    // Scenario 2: Doctor selected + Doctor credentials (Dr. Meera)
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Doctor selected + Doctor credentials (meera@medconnect.com) ---');
    let resData2 = null;
    let statusCode2 = 200;
    const mockRes2 = {
      status: (code) => { statusCode2 = code; return { json: (d) => { resData2 = d; } }; },
      json: (d) => { resData2 = d; }
    };
    await login({
      body: {
        email: 'meera@medconnect.com',
        password: 'Doctor@2026',
        role: 'doctor'
      }
    }, mockRes2);

    if (!resData2?.success || resData2?.user?.role !== 'doctor' || !resData2?.doctor?.id) {
      throw new Error(`TEST 2 Failed! Expected doctor login with resolved doctor ID, got: ${JSON.stringify(resData2)}`);
    }
    console.log(`   ✅ PASSED: Authenticated as Doctor (${resData2.user.name}, doctorId: ${resData2.doctor.id}, role: ${resData2.user.role})\n`);

    // -------------------------------------------------------------------------
    // Scenario 3: Hospital selected + Hospital credentials
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Hospital selected + Hospital credentials ---');
    let resData3 = null;
    let statusCode3 = 200;
    const mockRes3 = {
      status: (code) => { statusCode3 = code; return { json: (d) => { resData3 = d; } }; },
      json: (d) => { resData3 = d; }
    };
    await login({
      body: {
        email: 'hospital@medconnect.com',
        password: 'Hospital@2026',
        role: 'hospital'
      }
    }, mockRes3);

    if (!resData3?.success || resData3?.user?.role !== 'hospital') {
      throw new Error(`TEST 3 Failed! Expected hospital login, got: ${JSON.stringify(resData3)}`);
    }
    console.log(`   ✅ PASSED: Authenticated as Hospital (${resData3.user.name}, role: ${resData3.user.role})\n`);

    // -------------------------------------------------------------------------
    // Scenario 4: Admin selected + Admin credentials
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Admin selected + Admin credentials ---');
    let resData4 = null;
    let statusCode4 = 200;
    const mockRes4 = {
      status: (code) => { statusCode4 = code; return { json: (d) => { resData4 = d; } }; },
      json: (d) => { resData4 = d; }
    };
    await login({
      body: {
        email: 'admin@medconnect.com',
        password: 'Admin@2026',
        role: 'admin'
      }
    }, mockRes4);

    if (!resData4?.success || resData4?.user?.role !== 'admin') {
      throw new Error(`TEST 4 Failed! Expected admin login, got: ${JSON.stringify(resData4)}`);
    }
    console.log(`   ✅ PASSED: Authenticated as Admin (${resData4.user.name}, role: ${resData4.user.role})\n`);

    // -------------------------------------------------------------------------
    // Scenario 5: Patient selected + Doctor credentials (CRITICAL BUG REPORT SCENARIO)
    // (suma.hegde@medconnect.com or meera@medconnect.com entered under Patient tab)
    // -------------------------------------------------------------------------
    console.log('--- TEST 5: Patient selected + Doctor credentials (suma.hegde@medconnect.com) ---');
    let resData5 = null;
    let statusCode5 = 200;
    const mockRes5 = {
      status: (code) => { statusCode5 = code; return { json: (d) => { resData5 = d; } }; },
      json: (d) => { resData5 = d; }
    };
    await login({
      body: {
        email: 'suma.hegde@medconnect.com',
        password: 'Doctor@2026',
        role: 'patient' // SELECTED ROLE IS PATIENT
      }
    }, mockRes5);

    if (statusCode5 !== 403 || resData5?.success !== false) {
      throw new Error(`TEST 5 Failed! Expected 403 rejection, got status ${statusCode5}: ${JSON.stringify(resData5)}`);
    }
    console.log(`   Server Response (Status ${statusCode5}): "${resData5.message}"`);
    if (!resData5.message.includes('registered as a Doctor')) {
      throw new Error(`TEST 5 Failed! Message does not indicate Doctor registration requirement.`);
    }
    console.log(`   ✅ PASSED: Login rejected with exact directive: "${resData5.message}"\n`);

    // -------------------------------------------------------------------------
    // Scenario 6: Doctor selected + Patient credentials
    // (patient@medconnect.com entered under Doctor login)
    // -------------------------------------------------------------------------
    console.log('--- TEST 6: Doctor selected + Patient credentials (patient@medconnect.com) ---');
    let resData6 = null;
    let statusCode6 = 200;
    const mockRes6 = {
      status: (code) => { statusCode6 = code; return { json: (d) => { resData6 = d; } }; },
      json: (d) => { resData6 = d; }
    };
    await loginDoctor({
      body: {
        email: 'patient@medconnect.com',
        password: 'Patient@2026'
      }
    }, mockRes6);

    if (statusCode6 !== 403 || resData6?.success !== false) {
      throw new Error(`TEST 6 Failed! Expected 403 rejection, got status ${statusCode6}: ${JSON.stringify(resData6)}`);
    }
    console.log(`   Server Response (Status ${statusCode6}): "${resData6.message}"`);
    if (!resData6.message.includes('registered as a Patient')) {
      throw new Error(`TEST 6 Failed! Message does not indicate Patient registration requirement.`);
    }
    console.log(`   ✅ PASSED: Login rejected with exact directive: "${resData6.message}"\n`);

    // -------------------------------------------------------------------------
    // Scenario 7: Hospital selected + Patient credentials
    // (patient@medconnect.com entered under Hospital login)
    // -------------------------------------------------------------------------
    console.log('--- TEST 7: Hospital selected + Patient credentials ---');
    let resData7 = null;
    let statusCode7 = 200;
    const mockRes7 = {
      status: (code) => { statusCode7 = code; return { json: (d) => { resData7 = d; } }; },
      json: (d) => { resData7 = d; }
    };
    await loginHospital({
      body: {
        email: 'patient@medconnect.com',
        password: 'Patient@2026'
      }
    }, mockRes7);

    if (statusCode7 !== 403 || resData7?.success !== false) {
      throw new Error(`TEST 7 Failed! Expected 403 rejection, got status ${statusCode7}: ${JSON.stringify(resData7)}`);
    }
    console.log(`   Server Response (Status ${statusCode7}): "${resData7.message}"`);
    if (!resData7.message.includes('registered as a Patient')) {
      throw new Error(`TEST 7 Failed! Message does not indicate Patient registration requirement.`);
    }
    console.log(`   ✅ PASSED: Login rejected with exact directive: "${resData7.message}"\n`);

    console.log('========================================================================');
    console.log('🎉 ALL 7 ROLE VALIDATION AND ACCESS CONTROL TESTS PASSED 100%!');
    console.log('========================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  }
}

runRoleValidationTests();
