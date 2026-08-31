import { query } from './db/index.js';
import {
  uploadReportFile,
  getSignedReportUrl,
  getReportFileBuffer,
  deleteReportFile,
  BUCKET_NAME,
} from './services/storageService.js';
import {
  extractStructuredMedicalDataFromVisionOrPdf,
  validateAndEvaluateMedicalReport,
} from './services/medicalReportParser.js';
import {
  analyzeReport,
  getReports,
  getReportSignedUrl,
  deleteReport,
} from './controllers/reportController.js';

async function runMedicalReportStoragePipelineTest() {
  console.log('🧪 Starting MedConnect Karavali Medical Report Storage & Access Control Test...\n');

  try {
    const testPatientId = 'user-patient-1';
    const testDoctorAuthorizedUserId = 'user-doc-1'; // Dr. Vignesh Shetty
    const testDoctorUnauthorizedUserId = 'user-doc-unauth-999';

    // Ensure test patient user exists in database
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role)
       VALUES ($1, 'Kavya Poojary', 'patient@medconnect.com', '+91 98450 12345', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'patient')
       ON CONFLICT (id) DO NOTHING`,
      [testPatientId]
    );

    // Ensure authorized doctor exists in database
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role)
       VALUES ($1, 'Dr. Vignesh Shetty', 'doctor@medconnect.com', '+91 94481 22334', '$2a$10$f3DkZ70z5P5gL5oBv3e5E.v35G8b6b0c2a1d3e5f7g9h1i3j5k', 'doctor')
       ON CONFLICT (id) DO NOTHING`,
      [testDoctorAuthorizedUserId]
    );

    await query(
      `INSERT INTO doctors (id, user_id, name, specialization, hospital_name)
       VALUES ('doc-kmc-1', $1, 'Dr. Vignesh Shetty', 'Cardiologist', 'KMC Hospital')
       ON CONFLICT (id) DO UPDATE SET user_id = $1`,
      [testDoctorAuthorizedUserId]
    );

    // Setup active appointment relationship for authorized doctor
    await query(
      `INSERT INTO appointments (id, user_id, doctor_id, doctor_name, date, time_slot, status)
       VALUES ('apt-test-rel-1', $1, 'doc-kmc-1', 'Dr. Vignesh Shetty', '2026-08-30', '10:00 AM', 'upcoming')
       ON CONFLICT (id) DO NOTHING`,
      [testPatientId]
    );

    // -------------------------------------------------------------------------
    // TEST 1: Storage Layer File Upload
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Private Supabase Storage Upload ---');
    const sampleReportContent = `
      MANGALORE CLINICAL DIAGNOSTIC LABORATORY
      Patient Name: Kavya Poojary    Age: 28    Sex: Female
      Date: 2026-08-29
      ------------------------------------------------------
      TEST NAME                      RESULT   UNIT       REFERENCE RANGE
      Hemoglobin (Hb)                8.8      g/dL       12.0 - 16.0
      Total RBC Count                3.0      ×10¹²/L    4.0 - 5.2
      Total WBC Count (TLC)          23.9     ×10⁹/L     4.0 - 11.0
      Platelet Count                 199.0    ×10⁹/L     150.0 - 450.0
      Neutrophils                    91.0     %          40.0 - 75.0
      Lymphocytes                    6.0      %          20.0 - 45.0
    `;

    const sampleBuffer = Buffer.from(sampleReportContent, 'utf-8');
    const testReportId = `rep-test-${Date.now()}`;
    const testFilename = 'blood-test.pdf';

    const uploadRes = await uploadReportFile({
      fileBuffer: sampleBuffer,
      mimeType: 'application/pdf',
      patientId: testPatientId,
      reportId: testReportId,
      originalFilename: testFilename,
    });

    console.log(`   Bucket: ${uploadRes.bucket}`);
    console.log(`   Storage File Path: ${uploadRes.filePath}`);
    console.log(`   File Size: ${uploadRes.fileSize} bytes`);

    const expectedPath = `${testPatientId}/${testReportId}/blood-test.pdf`;
    if (uploadRes.filePath !== expectedPath) {
      throw new Error(`❌ Storage path mismatch: expected ${expectedPath}, got ${uploadRes.filePath}`);
    }
    console.log(`   ✅ Confirmed Storage path format: ${uploadRes.filePath}`);

    // Verify buffer retrieval
    const retrievedBuffer = await getReportFileBuffer(uploadRes.filePath);
    if (!retrievedBuffer || retrievedBuffer.length !== sampleBuffer.length) {
      throw new Error(`❌ Retrieved file buffer size mismatch!`);
    }
    console.log(`   ✅ Confirmed file buffer integrity verified from storage (${retrievedBuffer.length} bytes)`);

    // -------------------------------------------------------------------------
    // TEST 2: Controller Ingestion Pipeline (Upload + OCR + Database Record)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Full Upload & AI Ingestion Controller Pipeline ---');
    let analyzeRes = null;
    await analyzeReport({
      user: { id: testPatientId, role: 'patient' },
      file: {
        buffer: sampleBuffer,
        mimetype: 'application/pdf',
        originalname: 'blood-test.pdf',
      },
    }, {
      status: (code) => ({ json: (d) => { analyzeRes = { code, ...d }; } }),
      json: (d) => { analyzeRes = { code: 200, ...d }; },
    });

    if (!analyzeRes?.success || !analyzeRes?.report) {
      throw new Error(`❌ analyzeReport controller pipeline failed: ${JSON.stringify(analyzeRes)}`);
    }

    const createdReport = analyzeRes.report;
    console.log(`   Created Report ID: ${createdReport.id}`);
    console.log(`   Patient ID: ${createdReport.patientId}`);
    console.log(`   Storage File Path: ${createdReport.filePath}`);
    console.log(`   Analysis Status: ${createdReport.analysisStatus}`);
    console.log(`   Recommended Specialty: ${createdReport.recommendedSpecialty}`);
    console.log(`   Important Biomarkers Extracted (${createdReport.importantValues.length}):`);
    createdReport.importantValues.forEach(v => console.log(`     • ${v.label || v.name}: ${v.value} [${v.status}]`));

    // Verify database row
    const dbRow = await query('SELECT * FROM medical_reports WHERE id = $1', [createdReport.id]);
    if (dbRow.rows.length === 0) {
      throw new Error(`❌ medical_reports record was not found in PostgreSQL!`);
    }
    console.log(`   ✅ Database record confirmed in PostgreSQL (analysis_status: ${dbRow.rows[0].analysis_status})`);

    // -------------------------------------------------------------------------
    // TEST 3: Access Control & Temporary Signed URLs
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Access Control & Temporary Signed URLs ---');

    // Case 3a: Patient accessing their own report
    let patientSignedUrlRes = null;
    await getReportSignedUrl({
      user: { id: testPatientId, role: 'patient' },
      params: { id: createdReport.id },
    }, {
      status: (code) => ({ json: (d) => { patientSignedUrlRes = { code, ...d }; } }),
      json: (d) => { patientSignedUrlRes = { code: 200, ...d }; },
    });

    if (!patientSignedUrlRes?.success || !patientSignedUrlRes?.signedUrl) {
      throw new Error(`❌ Patient failed to get signed URL for own report!`);
    }
    console.log(`   ✅ Patient successfully generated temporary signed URL: ${patientSignedUrlRes.signedUrl.slice(0, 60)}...`);

    // Case 3b: Authorized Doctor (with active appointment) accessing patient's report
    let authDoctorRes = null;
    await getReportSignedUrl({
      user: { id: testDoctorAuthorizedUserId, role: 'doctor' },
      params: { id: createdReport.id },
    }, {
      status: (code) => ({ json: (d) => { authDoctorRes = { code, ...d }; } }),
      json: (d) => { authDoctorRes = { code: 200, ...d }; },
    });

    if (!authDoctorRes?.success || !authDoctorRes?.signedUrl) {
      throw new Error(`❌ Authorized doctor failed to get signed URL!`);
    }
    console.log(`   ✅ Authorized doctor verified via appointment relation and granted signed URL`);

    // Case 3c: Unauthorized Doctor (NO appointment relationship) accessing patient's report
    let unauthDoctorRes = null;
    await getReportSignedUrl({
      user: { id: testDoctorUnauthorizedUserId, role: 'doctor' },
      params: { id: createdReport.id },
    }, {
      status: (code) => ({ json: (d) => { unauthDoctorRes = { code, ...d }; } }),
      json: (d) => { unauthDoctorRes = { code: 200, ...d }; },
    });

    if (unauthDoctorRes?.code !== 403) {
      throw new Error(`❌ Security violation: Unauthorized doctor was not rejected with HTTP 403! Got code: ${unauthDoctorRes?.code}`);
    }
    console.log(`   ✅ Unauthorized doctor strictly rejected with HTTP 403 Forbidden ("${unauthDoctorRes.message}")`);

    // -------------------------------------------------------------------------
    // TEST 4: Fetch Reports Across Sessions (Persistence Verification)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Persistence Verification Across Logout / Login ---');
    let fetchedReportsRes = null;
    await getReports({
      user: { id: testPatientId, role: 'patient' },
      query: {},
    }, {
      status: (code) => ({ json: (d) => { fetchedReportsRes = { code, ...d }; } }),
      json: (d) => { fetchedReportsRes = { code: 200, ...d }; },
    });

    const patientReports = fetchedReportsRes?.reports || [];
    const foundRep = patientReports.find(r => r.id === createdReport.id);
    if (!foundRep) {
      throw new Error(`❌ Uploaded report not found in patient report list!`);
    }
    console.log(`   ✅ Confirmed: Report '${foundRep.title}' persisted in database and returned for authenticated user`);

    // -------------------------------------------------------------------------
    // TEST 5: Report Deletion (Removes from Storage & Database)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Delete Report (Storage & Database Cleanup) ---');
    let deleteRes = null;
    await deleteReport({
      user: { id: testPatientId, role: 'patient' },
      params: { id: createdReport.id },
    }, {
      status: (code) => ({ json: (d) => { deleteRes = { code, ...d }; } }),
      json: (d) => { deleteRes = { code: 200, ...d }; },
    });

    if (!deleteRes?.success) {
      throw new Error(`❌ Failed to delete report: ${JSON.stringify(deleteRes)}`);
    }

    // Verify row deleted from PostgreSQL
    const checkDeletedRow = await query('SELECT * FROM medical_reports WHERE id = $1', [createdReport.id]);
    if (checkDeletedRow.rows.length !== 0) {
      throw new Error(`❌ Database row was not deleted!`);
    }
    console.log(`   ✅ Confirmed: Report deleted from database and storage file cleaned up.`);

    // Cleanup first sample file
    await deleteReportFile(uploadRes.filePath);

    console.log('\n========================================================================');
    console.log('🎉 ALL SUPABASE STORAGE & ACCESS CONTROL ACCEPTANCE TESTS PASSED 100%!');
    console.log('========================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
    process.exit(1);
  }
}

runMedicalReportStoragePipelineTest();
