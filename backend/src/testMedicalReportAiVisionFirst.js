import { query } from './db/index.js';
import {
  extractStructuredMedicalDataFromVisionOrPdf,
  validateAndEvaluateMedicalReport,
} from './services/medicalReportParser.js';
import { generateReportExplanationWithGemini } from './services/reportAiExplanationService.js';
import { analyzeReport } from './controllers/reportController.js';

async function runMedicalReportAiVisionFirstTest() {
  console.log('🧪 Starting Medical Report AI Vision-First & Zero-Hallucination Acceptance Test...\n');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Hematology Report Parsing (Exact Document Reproduction)
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Ingesting Real Hematology Report Document ---');
    const hematologyReportText = `
      MANGALORE CLINICAL DIAGNOSTIC LABORATORY
      KMC Hospital Attavar, Mangaluru, Karnataka
      ======================================================
      Patient Name: Kavya Poojary    Age: 28    Sex: Female
      Ref By: Dr. Vignesh Shetty     Date: 2026-08-28
      ======================================================
      TEST NAME                      RESULT   UNIT       REFERENCE RANGE
      ------------------------------------------------------
      Hemoglobin (Hb)                8.8      g/dL       12.0 - 16.0
      Total RBC Count                3.0      ×10¹²/L    4.0 - 5.2
      Hematocrit / PCV               26.0     %          36.0 - 46.0
      MCV                            85.0     fL         80.0 - 100.0
      MCH                            29.0     pg         27.0 - 32.0
      MCHC                           34.0     g/dL       32.0 - 36.0
      Platelet Count                 199.0    ×10⁹/L     150.0 - 450.0
      Total WBC Count (TLC)          23.9     ×10⁹/L     4.0 - 11.0
      Neutrophils                    91.0     %          40.0 - 75.0
      Lymphocytes                    6.0      %          20.0 - 45.0
      Monocytes                      2.0      %          2.0 - 10.0
      Eosinophils                    1.0      %          1.0 - 6.0
      ======================================================
    `;

    const fileBuffer = Buffer.from(hematologyReportText, 'utf-8');
    const extractedData = await extractStructuredMedicalDataFromVisionOrPdf(fileBuffer, 'text/plain', 'Hematology_CBC_Report.pdf');

    console.log(`   Source of extraction: ${extractedData.source}`);
    console.log(`   Total parameters extracted from document: ${extractedData.tests.length}`);

    // Verify EXACT document parameters are extracted
    const extractedNames = extractedData.tests.map(t => t.name);
    console.log('   Extracted Parameters:');
    extractedData.tests.forEach(t => {
      console.log(`     • ${t.name}: ${t.value} [Ref: ${t.referenceRange}] (Status: ${t.status})`);
    });

    // Check Hemoglobin = 8.8
    const hbTest = extractedData.tests.find(t => t.name.includes('Hemoglobin') || t.name.includes('Hb'));
    if (!hbTest || hbTest.numericValue !== 8.8) {
      throw new Error(`❌ Expected Hemoglobin = 8.8, got ${hbTest?.numericValue}`);
    }
    console.log(`\n   ✅ Hemoglobin verified as 8.8 g/dL (Low)`);

    // Check Total RBC = 3.0
    const rbcTest = extractedData.tests.find(t => t.name.includes('RBC'));
    if (!rbcTest || rbcTest.numericValue !== 3.0) {
      throw new Error(`❌ Expected Total RBC = 3.0, got ${rbcTest?.numericValue}`);
    }
    console.log(`   ✅ Total RBC verified as 3.0 ×10¹²/L (Low)`);

    // Check Total WBC = 23.9
    const wbcTest = extractedData.tests.find(t => t.name.includes('WBC') || t.name.includes('TLC'));
    if (!wbcTest || wbcTest.numericValue !== 23.9) {
      throw new Error(`❌ Expected Total WBC = 23.9, got ${wbcTest?.numericValue}`);
    }
    console.log(`   ✅ Total WBC verified as 23.9 ×10⁹/L (High)`);

    // Check Platelets = 199
    const pltTest = extractedData.tests.find(t => t.name.includes('Platelet') || t.name.includes('PLT'));
    if (!pltTest || pltTest.numericValue !== 199.0) {
      throw new Error(`❌ Expected Platelet Count = 199, got ${pltTest?.numericValue}`);
    }
    console.log(`   ✅ Platelet Count verified as 199.0 ×10⁹/L (Normal)`);

    // -------------------------------------------------------------------------
    // TEST 2: ZERO-HALLUCINATION VERIFICATION
    // Must NOT contain Fasting Blood Sugar, Creatinine, or TSH
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Zero-Hallucination Check (Verify Unmentioned Tests are Excluded) ---');
    const fbsTest = extractedData.tests.find(t => t.name.toLowerCase().includes('sugar') || t.name.toLowerCase().includes('glucose'));
    if (fbsTest) {
      throw new Error(`❌ HALLUCINATION DETECTED: Fasting Blood Sugar was found in extraction even though document does not contain it!`);
    }
    console.log(`   ✅ Confirmed: Fasting Blood Sugar is NOT present in extraction`);

    const creatTest = extractedData.tests.find(t => t.name.toLowerCase().includes('creatinine'));
    if (creatTest) {
      throw new Error(`❌ HALLUCINATION DETECTED: Creatinine was found in extraction even though document does not contain it!`);
    }
    console.log(`   ✅ Confirmed: Serum Creatinine is NOT present in extraction`);

    const tshTest = extractedData.tests.find(t => t.name.toLowerCase().includes('tsh') || t.name.toLowerCase().includes('thyroid'));
    if (tshTest) {
      throw new Error(`❌ HALLUCINATION DETECTED: TSH was found in extraction even though document does not contain it!`);
    }
    console.log(`   ✅ Confirmed: TSH / Thyroid is NOT present in extraction`);

    // -------------------------------------------------------------------------
    // TEST 3: Validation Layer & Clinical Specialist Determination
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Validation Layer & Dynamic Specialist Determination ---');
    const clinicalFindings = validateAndEvaluateMedicalReport(extractedData);

    console.log(`   Category: ${clinicalFindings.metadata.category}`);
    console.log(`   Overall Status: ${clinicalFindings.overallStatus}`);
    console.log(`   Risk Level: ${clinicalFindings.riskLevel}`);
    console.log(`   Recommended Specialist: ${clinicalFindings.recommendedSpecialist}`);
    console.log(`   Specialist Rationale: ${clinicalFindings.specialistReason}`);

    if (clinicalFindings.recommendedSpecialist !== 'Hematologist') {
      throw new Error(`❌ Expected specialist 'Hematologist', got '${clinicalFindings.recommendedSpecialist}'`);
    }
    console.log(`   ✅ Correctly routed to Hematologist based on blood count abnormalities (Low Hb 8.8, Elevated WBC 23.9)`);

    // -------------------------------------------------------------------------
    // TEST 4: Database Doctor Query for Coastal Karnataka Specialists
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Querying Database for Matching Coastal Karnataka Specialists ---');
    const doctorResult = await query(
      `SELECT id, name, photo, specialization, experience, rating, hospital_name as "hospitalName", location 
       FROM doctors 
       WHERE specialization ILIKE '%Hematolog%' OR specialization ILIKE '%Physician%' OR specialization ILIKE '%Medicine%'
       ORDER BY rating DESC LIMIT 3`
    );

    if (doctorResult.rows.length === 0) {
      throw new Error(`❌ No doctors returned from database!`);
    }
    console.log(`   Matched Specialists from Database:`);
    doctorResult.rows.forEach(d => {
      console.log(`     • ${d.name} (${d.specialization}) - ${d.hospitalName}`);
    });
    console.log(`   ✅ Matched ${doctorResult.rows.length} real doctors from database.`);

    // -------------------------------------------------------------------------
    // TEST 5: Full Controller Pipeline Execution
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Full Controller Pipeline Execution ---');
    let controllerResponse = null;
    await analyzeReport({
      user: { id: 'user-patient-1', name: 'Kavya Poojary', role: 'patient' },
      file: {
        buffer: Buffer.from(hematologyReportText, 'utf-8'),
        mimetype: 'application/pdf',
        originalname: 'Kavya_Poojary_Hematology.pdf',
      },
    }, {
      status: (code) => ({ json: (d) => { controllerResponse = d; } }),
      json: (d) => { controllerResponse = d; }
    });

    if (!controllerResponse?.success || !controllerResponse?.report) {
      throw new Error(`❌ Controller pipeline failed: ${JSON.stringify(controllerResponse)}`);
    }

    const report = controllerResponse.report;
    console.log(`   Executive Summary: "${report.summary}"`);
    console.log(`   What It May Mean: "${report.whatItMayMean}"`);
    console.log(`   Detected Abnormalities (${report.detectedIssues.length}):`);
    report.detectedIssues.forEach(iss => console.log(`     ⚠️ ${iss}`));

    console.log('\n========================================================================');
    console.log('🎉 ALL MEDICAL REPORT AI VISION-FIRST ACCEPTANCE TESTS PASSED 100%!');
    console.log('========================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ACCEPTANCE TEST FAILED:', err);
    process.exit(1);
  }
}

runMedicalReportAiVisionFirstTest();
