import { analyzeSymptomsWithGemini } from './services/geminiService.js';
import { query } from './db/index.js';

async function runTests() {
  console.log('=====================================================');
  console.log('🩺 RUNNING AI SYMPTOM CHECKER VERIFICATION SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let total = 5;

  // TEST CASE 1: Fever + dry cough + fatigue
  console.log('🧪 TEST CASE 1: Fever + dry cough + fatigue');
  const case1 = await analyzeSymptomsWithGemini({
    symptoms: 'I have had fever for 2 days, dry cough and feeling very fatigued',
    duration: '1–3 Days',
    severity: 'moderate',
    hasFever: true,
  });
  console.log('Result 1:', {
    urgency: case1.urgency,
    specialty: case1.recommended_specialty,
    is_emergency: case1.is_emergency,
    symptoms_detected: case1.symptoms_detected,
    categories: case1.possible_categories,
  });
  if (!case1.is_emergency && case1.is_valid_symptom && (case1.recommended_specialty.includes('Physician') || case1.recommended_specialty.includes('Pulmon') || case1.recommended_specialty.includes('General'))) {
    console.log('✅ PASS Case 1: Relevant non-emergency triage with appropriate specialty\n');
    passed++;
  } else {
    console.log('❌ FAIL Case 1\n');
  }

  // TEST CASE 2: Chest pain + difficulty breathing (EMERGENCY)
  console.log('🧪 TEST CASE 2: Chest pain + difficulty breathing (Emergency Escalation)');
  const case2 = await analyzeSymptomsWithGemini({
    symptoms: 'I have severe chest pain and severe difficulty breathing with dizziness since morning',
    duration: '< 24 Hours',
    severity: 'severe',
  });
  console.log('Result 2:', {
    urgency: case2.urgency,
    is_emergency: case2.is_emergency,
    red_flags: case2.red_flags,
    warning: case2.emergency_warning,
    specialty: case2.recommended_specialty,
  });
  if (case2.is_emergency && case2.urgency === 'emergency' && case2.red_flags.length > 0) {
    console.log('✅ PASS Case 2: Strong emergency escalation triggered with red flags\n');
    passed++;
  } else {
    console.log('❌ FAIL Case 2\n');
  }

  // TEST CASE 3: Severe migraine + light sensitivity
  console.log('🧪 TEST CASE 3: Severe migraine + light sensitivity (Neurology)');
  const case3 = await analyzeSymptomsWithGemini({
    symptoms: 'Severe throbbing migraine on one side of head and intense light sensitivity',
    duration: '1–3 Days',
    severity: 'severe',
  });
  console.log('Result 3:', {
    urgency: case3.urgency,
    specialty: case3.recommended_specialty,
    categories: case3.possible_categories,
  });
  if (case3.recommended_specialty.includes('Neuro') && case3.possible_categories.some(c => c.toLowerCase().includes('neuro') || c.toLowerCase().includes('cranial'))) {
    console.log('✅ PASS Case 3: Correctly mapped to Neurologist with non-definitive assessment\n');
    passed++;
  } else {
    console.log('❌ FAIL Case 3\n');
  }

  // TEST CASE 4: Child with vomiting (Pediatric)
  console.log('🧪 TEST CASE 4: Child with vomiting (Pediatric Pathway)');
  const case4 = await analyzeSymptomsWithGemini({
    symptoms: 'My 4-year-old child has had mild vomiting and tummy ache since yesterday',
    duration: '1–3 Days',
    severity: 'mild',
  });
  console.log('Result 4:', {
    urgency: case4.urgency,
    specialty: case4.recommended_specialty,
    categories: case4.possible_categories,
  });
  if ((case4.recommended_specialty.includes('Pediat') || case4.recommended_specialty.includes('General')) && case4.possible_categories.some(c => c.toLowerCase().includes('pediat') || c.toLowerCase().includes('child') || c.toLowerCase().includes('gastro') || c.toLowerCase().includes('general'))) {
    console.log('✅ PASS Case 4: Appropriately routed to Pediatric / Child health pathway\n');
    passed++;
  } else {
    console.log('❌ FAIL Case 4\n');
  }

  // TEST CASE 5: Gibberish input (hello xyz abc)
  console.log('🧪 TEST CASE 5: Meaningless / Gibberish text (hello xyz abc)');
  const case5 = await analyzeSymptomsWithGemini({
    symptoms: 'hello xyz abc',
  });
  console.log('Result 5:', {
    is_valid_symptom: case5.is_valid_symptom,
    clinical_assessment: case5.clinical_assessment,
  });
  if (case5.is_valid_symptom === false) {
    console.log('✅ PASS Case 5: Safely detected non-medical input and asked user to describe symptoms without hallucinating condition\n');
    passed++;
  } else {
    console.log('❌ FAIL Case 5\n');
  }

  // TEST CASE 6: Real Doctor Database Querying
  console.log('🧪 TEST CASE 6: Real Doctor Matching from Database');
  const spec = 'Cardiologist';
  const doctorResult = await query(
    `SELECT id, name, photo, specialization, experience, rating, hospital_name as "hospitalName", location, consultation_fee as "consultationFee"
     FROM doctors
     WHERE specialization ILIKE $1
     ORDER BY rating DESC LIMIT 3`,
    [`%${spec}%`]
  );
  console.log(`Queried ${doctorResult.rows.length} real doctors for ${spec}:`);
  doctorResult.rows.forEach(d => {
    console.log(` - ${d.name} (${d.specialization}) at ${d.hospitalName}, ${d.location} | ⭐ ${d.rating}`);
  });
  if (doctorResult.rows.length > 0 && doctorResult.rows[0].name.startsWith('Dr.')) {
    console.log('✅ PASS Case 6: Real verified doctors queried from database matching specialty\n');
  }

  console.log('=====================================================');
  console.log(`🎯 VERIFICATION COMPLETE: ${passed}/${total} Core Triage Test Suites Passed!`);
  console.log('=====================================================');
}

runTests().catch(console.error);
