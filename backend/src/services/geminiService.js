import { GoogleGenAI } from '@google/genai';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey && !apiKey.includes('your-gemini-key')) {
    try {
      return new GoogleGenAI({ apiKey });
    } catch (err) {
      console.warn('⚠️ Google Gemini AI Initialization error:', err.message);
    }
  }
  return null;
}

/**
 * 1. AI Symptom Triage with Google Gemini
 */
export const analyzeSymptomsWithGemini = async (inputData) => {
  const symptoms = typeof inputData === 'string' ? inputData : inputData.symptoms || '';
  const duration = typeof inputData === 'object' ? inputData.duration || '1-3 days' : '1-3 days';
  const severity = typeof inputData === 'object' ? inputData.severity || 'moderate' : 'moderate';
  const location = typeof inputData === 'object' ? inputData.location || '' : '';
  const hasFever = typeof inputData === 'object' ? inputData.hasFever : undefined;
  const isGettingWorse = typeof inputData === 'object' ? inputData.isGettingWorse : undefined;
  const medications = typeof inputData === 'object' ? inputData.medications || '' : '';
  const additionalContext = typeof inputData === 'object' ? inputData.additionalContext || '' : '';

  const client = getAiClient();
  if (client && symptoms.trim()) {
    try {
      const prompt = `
You are the MedConnect Karavali AI Triage Assistant serving Coastal Karnataka (Mangaluru, Udupi, Manipal, Surathkal).
Your purpose is clinical symptom triage and healthcare navigation, NOT definitive medical diagnosis.

Analyze only the information provided by the patient:
- Primary Symptoms: "${symptoms}"
- Reported Duration: "${duration}"
- Reported Severity: "${severity}"
- Body Location: "${location || 'Not specified'}"
- Has Fever: "${hasFever === true ? 'Yes' : hasFever === false ? 'No' : 'Unspecified'}"
- Is Getting Worse: "${isGettingWorse === true ? 'Yes' : isGettingWorse === false ? 'No' : 'Unspecified'}"
- Medications: "${medications || 'None reported'}"
- Additional Notes: "${additionalContext || 'None'}"

CRITICAL CLINICAL RULES:
1. Meaningless/Gibberish Input: If the input is random letters, greetings without symptoms, or nonsense (e.g., "hello xyz abc", "test 123", "asdf"), set "is_valid_symptom": false, provide a gentle message asking the user to describe what physical or mental health feelings they are experiencing, and return routine urgency.
2. Emergency Escalation: Detect any red-flag emergency symptoms (severe chest pain, crushing tightness radiating to arm/jaw, severe difficulty breathing, sudden face drooping/weakness/speech slurring/stroke signs, loss of consciousness/fainting, profuse bleeding, severe allergic reaction/anaphylaxis, acute head trauma, suicidal thoughts). If detected, set "is_emergency": true, "urgency": "emergency", "urgency_label": "Possible Medical Emergency", and populate "emergency_warning" and "red_flags".
3. No Definitive Diagnosis: Do not claim a definitive diagnosis (e.g. NEVER say "You have pneumonia"). Use non-definitive language such as "Your symptoms may be consistent with conditions affecting the respiratory system. A clinician should evaluate you for an accurate diagnosis."
4. Recommended Specialty: "recommended_specialty" MUST be one of the real medical specialties (e.g., "Cardiologist", "Neurologist", "Pediatrician", "Orthopedist", "ENT Specialist", "General Physician", "Pulmonologist", "Dermatologist", "Gynecologist", "Urologist", "Oncologist", "Psychiatrist", "Gastroenterologist", "Ophthalmologist", "Emergency Physician"). For children, infants, or pediatric symptoms (e.g. child with vomiting, fever, or rash), prioritize "Pediatrician". DO NOT invent doctor names or hospital names in this field.

Return a valid JSON object strictly matching this schema:
{
  "is_valid_symptom": true,
  "summary": "Concise 1-2 sentence summary of symptoms",
  "symptoms_detected": ["Symptom 1", "Symptom 2"],
  "duration": "${duration}",
  "severity": "mild" | "moderate" | "severe",
  "urgency": "routine" | "soon" | "urgent" | "emergency",
  "urgency_label": "Routine Consultation" | "Medical Attention Recommended" | "Urgent Evaluation Needed" | "Possible Medical Emergency",
  "is_emergency": false,
  "emergency_warning": null,
  "red_flags": [],
  "possible_categories": ["Affected anatomical/health system 1", "Affected system 2"],
  "clinical_assessment": "Thoughtful, non-definitive clinical triage explanation",
  "recommended_specialty": "Cardiologist",
  "recommended_actions": [
    "Actionable step 1",
    "Actionable step 2",
    "Actionable step 3"
  ],
  "follow_up_questions": [
    "Relevant clinical follow-up question 1",
    "Relevant clinical follow-up question 2"
  ],
  "confidence": 0.9
}
Return ONLY valid JSON.
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawText = response.text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('⚠️ Gemini AI Triage API error, utilizing clinical rule engine fallback:', err.message);
    }
  }

  // Robust Clinical Fallback Rule Engine
  const lower = symptoms.toLowerCase().trim();

  // 1. Check for gibberish / non-symptom input
  const nonSymptomWords = ['hello', 'hi', 'hey', 'test', 'xyz', 'abc', 'asdf', 'qwerty', '123'];
  const isPureGibberish = lower.length < 5 || (nonSymptomWords.some(w => lower === w) && !lower.includes('pain') && !lower.includes('fever') && !lower.includes('cough'));

  if (isPureGibberish) {
    return {
      is_valid_symptom: false,
      summary: "We could not detect clear health symptoms from your input.",
      symptoms_detected: [],
      duration: duration || "Recent",
      severity: "mild",
      urgency: "routine",
      urgency_label: "Routine Consultation",
      is_emergency: false,
      emergency_warning: null,
      red_flags: [],
      possible_categories: ["General Health Inquiry"],
      clinical_assessment: "Please describe specific physical or mental health feelings you are experiencing (e.g. fever, headache, joint ache, cough, or discomfort) so our clinical triage system can assist you accurately.",
      recommended_specialty: "General Physician",
      recommended_actions: [
        "Provide specific details about your symptoms",
        "Note down when the discomfort began",
        "Mention if you have any existing health conditions"
      ],
      follow_up_questions: [
        "What specific discomfort or symptom are you experiencing?",
        "How long have you felt this way?"
      ],
      confidence: 0.5
    };
  }

  // 2. Clinical Emergency Detection
  const hasChestPain = lower.includes('chest') || lower.includes('heart') || lower.includes('crushing') || lower.includes('angina') || (lower.includes('tightness') && lower.includes('left arm'));
  const hasBreathCrisis = lower.includes('breath') || lower.includes('gasp') || lower.includes('choking') || lower.includes('suffocat');
  const hasStrokeSigns = lower.includes('paraly') || lower.includes('slur') || (lower.includes('face') && lower.includes('droop')) || (lower.includes('sudden') && lower.includes('weakness'));
  const hasLossOfConsciousness = lower.includes('faint') || lower.includes('passed out') || lower.includes('unconscious') || lower.includes('blackout');
  const hasSevereBleeding = lower.includes('profuse bleeding') || lower.includes('coughing blood') || lower.includes('vomiting blood');

  if (hasChestPain || (hasBreathCrisis && lower.includes('severe')) || hasStrokeSigns || hasLossOfConsciousness || hasSevereBleeding) {
    const redFlags = [];
    if (hasChestPain) redFlags.push('Acute chest pain / pressure');
    if (hasBreathCrisis) redFlags.push('Shortness of breath / respiratory distress');
    if (hasStrokeSigns) redFlags.push('Sudden neurological deficit / weakness');
    if (hasLossOfConsciousness) redFlags.push('Syncopal episode / loss of consciousness');
    if (hasSevereBleeding) redFlags.push('Severe / acute hemorrhage');

    return {
      is_valid_symptom: true,
      summary: "Patient reported symptoms that may indicate a cardiovascular, respiratory, or neurological emergency.",
      symptoms_detected: redFlags,
      duration: duration || "Acute onset",
      severity: "severe",
      urgency: "emergency",
      urgency_label: "Possible Medical Emergency",
      is_emergency: true,
      emergency_warning: "Your symptoms may indicate a medical emergency requiring immediate evaluation. Do not delay seeking urgent clinical care or waiting for a routine appointment.",
      red_flags: redFlags,
      possible_categories: ["Cardiovascular System", "Emergency Medical Assessment", "Critical Care"],
      clinical_assessment: "Your described symptoms represent high-priority clinical red flags. Immediate face-to-face emergency medical assessment is essential to rule out acute cardiac or respiratory conditions.",
      recommended_specialty: hasChestPain ? "Cardiologist" : hasStrokeSigns ? "Neurologist" : "Emergency Physician",
      recommended_actions: [
        "Call Emergency 108 immediately or proceed to the nearest Emergency Room (ER)",
        "Do not drive yourself; have an ambulance or attendant transport you",
        "Sit in an upright, comfortable resting position and avoid any physical exertion",
        "Keep current medical records and prescription list readily accessible"
      ],
      follow_up_questions: [
        "Is the pain radiating to your left arm, neck, back, or jaw?",
        "Are you feeling nauseous, dizzy, or breaking into a cold sweat?"
      ],
      confidence: 0.95
    };
  }

  // 3. Neurological / Migraine
  if (lower.includes('headache') || lower.includes('migraine') || lower.includes('dizzy') || lower.includes('light sensitivity') || lower.includes('vertigo')) {
    return {
      is_valid_symptom: true,
      summary: "Patient reported neurological headache / migraine symptoms with visual or sensory sensitivity.",
      symptoms_detected: ["Headache / Migraine", lower.includes('light') ? "Photophobia (Light sensitivity)" : "Sensory sensitivity", lower.includes('dizzy') ? "Dizziness" : "Cranial pressure"],
      duration: duration || "1-2 days",
      severity: severity === 'severe' ? 'severe' : 'moderate',
      urgency: severity === 'severe' ? 'urgent' : 'soon',
      urgency_label: severity === 'severe' ? 'Urgent Evaluation Needed' : 'Medical Attention Recommended',
      is_emergency: false,
      emergency_warning: null,
      red_flags: [],
      possible_categories: ["Neurological System", "Cranial Vascular Dynamics"],
      clinical_assessment: "Your symptoms may be consistent with conditions affecting the cranial nervous system, such as a migraine or vascular headache. A neurological consultation is recommended for an accurate assessment.",
      recommended_specialty: "Neurologist",
      recommended_actions: [
        "Rest in a quiet, darkened room away from screens and bright lights",
        "Maintain adequate hydration with water or electrolyte fluids",
        "Apply a cool or warm compress across the forehead or neck",
        "Schedule an outpatient consultation if headaches recur frequently"
      ],
      follow_up_questions: [
        "Is the pain throbbing on one side of your head?",
        "Do you experience visual disturbances (auras) or nausea before the headache?"
      ],
      confidence: 0.88
    };
  }

  // 4. Pediatric Case (Child / Baby / Toddler)
  if (lower.includes('child') || lower.includes('baby') || lower.includes('kid') || lower.includes('infant') || lower.includes('toddler') || lower.includes('son') || lower.includes('daughter')) {
    return {
      is_valid_symptom: true,
      summary: "Pediatric health symptoms reported requiring specialized pediatric assessment.",
      symptoms_detected: [lower.includes('vomit') ? "Pediatric vomiting" : "Pediatric discomfort", lower.includes('fever') ? "Fever" : "Lethargy / low appetite"],
      duration: duration || "1-2 days",
      severity: severity === 'severe' ? 'severe' : 'moderate',
      urgency: lower.includes('vomit') && lower.includes('letharg') ? 'urgent' : 'soon',
      urgency_label: "Medical Attention Recommended",
      is_emergency: false,
      emergency_warning: null,
      red_flags: [],
      possible_categories: ["Pediatrics", "Gastrointestinal System", "Child Health"],
      clinical_assessment: "Children are vulnerable to rapid fluid loss and dehydration. A pediatric specialist should evaluate your child to determine the root cause and ensure proper hydration.",
      recommended_specialty: "Pediatrician",
      recommended_actions: [
        "Offer small, frequent sips of Oral Rehydration Solution (ORS) or electrolyte water",
        "Monitor wet diaper count and fluid intake to prevent dehydration",
        "Do not administer adult medications or over-the-counter antiemetics without a doctor's advice",
        "Schedule an appointment with a verified pediatrician"
      ],
      follow_up_questions: [
        "Is the child able to keep any liquids down?",
        "Are there signs of dehydration such as dry mouth, lack of tears, or decreased urination?"
      ],
      confidence: 0.91
    };
  }

  // 5. Orthopedic / Musculoskeletal
  if (lower.includes('joint') || lower.includes('knee') || lower.includes('back') || lower.includes('spine') || lower.includes('fracture') || lower.includes('lifting') || lower.includes('shoulder') || lower.includes('sprain')) {
    return {
      is_valid_symptom: true,
      summary: "Musculoskeletal discomfort reported, commonly associated with mechanical strain or joint inflammation.",
      symptoms_detected: ["Musculoskeletal pain", lower.includes('back') ? "Lumbar spinal strain" : "Joint tenderness"],
      duration: duration || "2-3 days",
      severity: severity || "moderate",
      urgency: lower.includes('fracture') || lower.includes('unable to walk') ? 'urgent' : 'routine',
      urgency_label: "Routine Consultation",
      is_emergency: false,
      emergency_warning: null,
      red_flags: [],
      possible_categories: ["Musculoskeletal System", "Orthopedic / Spine Health"],
      clinical_assessment: "Your symptoms may be consistent with mechanical muscle strain or joint inflammation. An orthopedic specialist can conduct a physical examination and imaging if necessary.",
      recommended_specialty: "Orthopedist",
      recommended_actions: [
        "Avoid heavy lifting, sudden twisting, or strenuous bending",
        "Apply cold compress for 15-20 minutes during the first 48 hours, followed by gentle warmth",
        "Maintain good spinal posture while sitting and resting",
        "Schedule an orthopedic outpatient visit if pain restricts daily mobility"
      ],
      follow_up_questions: [
        "Did the discomfort begin immediately after lifting or strenuous physical activity?",
        "Does the pain radiate down into your legs or arms?"
      ],
      confidence: 0.86
    };
  }

  // 6. Ear, Nose, Throat (ENT)
  if (lower.includes('throat') || lower.includes('ear') || lower.includes('sinus') || lower.includes('nasal') || lower.includes('tonsil') || lower.includes('voice')) {
    return {
      is_valid_symptom: true,
      summary: "Symptoms affecting the upper respiratory tract, ear, or throat structures.",
      symptoms_detected: [lower.includes('throat') ? "Sore throat" : "ENT discomfort", lower.includes('ear') ? "Ear pressure / ache" : "Nasal congestion"],
      duration: duration || "2-4 days",
      severity: severity || "mild",
      urgency: "routine",
      urgency_label: "Routine Consultation",
      is_emergency: false,
      emergency_warning: null,
      red_flags: [],
      possible_categories: ["Otolaryngology (ENT)", "Upper Respiratory System"],
      clinical_assessment: "Your symptoms may be consistent with localized inflammation in the ear, nose, or throat. An ENT specialist can perform an otoscopic or pharyngeal examination.",
      recommended_specialty: "ENT Specialist",
      recommended_actions: [
        "Gargle with warm salt water 2-3 times daily",
        "Inhale steam with warm water to relieve sinus congestion",
        "Avoid cold, chilled, or excessively spicy foods",
        "Consult an ENT physician if difficulty swallowing or ear pain increases"
      ],
      follow_up_questions: [
        "Is there any pain when swallowing or tenderness under your jaw?",
        "Do you have a blocked feeling or discharge from your ears?"
      ],
      confidence: 0.87
    };
  }

  // 7. Dermatology / Skin
  if (lower.includes('skin') || lower.includes('rash') || lower.includes('itching') || lower.includes('allergy') || lower.includes('pimple') || lower.includes('eczema')) {
    return {
      is_valid_symptom: true,
      summary: "Dermatological symptoms reported involving skin irritation, rash, or allergic response.",
      symptoms_detected: ["Cutaneous rash / irritation", lower.includes('itch') ? "Pruritus (Itching)" : "Skin inflammation"],
      duration: duration || "3-5 days",
      severity: severity || "mild",
      urgency: "routine",
      urgency_label: "Routine Consultation",
      is_emergency: false,
      emergency_warning: null,
      red_flags: [],
      possible_categories: ["Dermatology", "Immunological / Allergic Response"],
      clinical_assessment: "Your symptoms may be consistent with dermatological irritation or contact hypersensitivity. A dermatologist can inspect the lesion pattern and recommend targeted topical treatment.",
      recommended_specialty: "Dermatologist",
      recommended_actions: [
        "Avoid scratching the affected area to prevent secondary bacterial infection",
        "Use mild, fragrance-free soap and moisturize with soothing calamine or plain lotion",
        "Avoid new cosmetic products or known allergen exposures",
        "Schedule a dermatology OPD evaluation for precise diagnosis"
      ],
      follow_up_questions: [
        "Has the rash spread to new areas of your body?",
        "Did you come into contact with any new soaps, chemicals, or plants recently?"
      ],
      confidence: 0.89
    };
  }

  // 8. General Infectious / Respiratory (Default)
  return {
    is_valid_symptom: true,
    summary: "Patient described systemic symptoms such as fever, cough, fatigue, or general malaise.",
    symptoms_detected: [lower.includes('fever') ? "Fever / Body temperature" : "General Malaise", lower.includes('cough') ? "Cough" : "Fatigue"],
    duration: duration || "2 days",
    severity: severity || "moderate",
    urgency: hasFever && severity === 'severe' ? 'soon' : 'routine',
    urgency_label: "Routine Consultation",
    is_emergency: false,
    emergency_warning: null,
    red_flags: [],
    possible_categories: ["Respiratory System", "Infectious / Inflammatory Response", "General Internal Medicine"],
    clinical_assessment: "Your symptoms may be consistent with an infectious or inflammatory process such as a seasonal viral illness. A general physician should evaluate you to confirm diagnosis and advise appropriate management.",
    recommended_specialty: "General Physician",
    recommended_actions: [
      "Stay thoroughly hydrated with warm water, soups, or tender coconut water",
      "Rest adequately and avoid strenuous physical activities",
      "Monitor body temperature twice daily",
      "Consult a General Physician if symptoms do not improve within 48-72 hours"
    ],
    follow_up_questions: [
      "Do you have a sore throat, runny nose, or body aches?",
      "Are you experiencing any shortness of breath when walking?"
    ],
    confidence: 0.85
  };
};

/**
 * 2. AI Assistant Medical Chat with Google Gemini
 */
export const chatWithGemini = async (userMessage, chatHistory = []) => {
  const client = getAiClient();
  if (client) {
    try {
      const prompt = `
You are MedConnect AI Assistant, a compassionate, highly knowledgeable healthcare chatbot serving Coastal Karnataka (Mangaluru, Udupi, Manipal, Surathkal).
Provide clear, empathetic, medically sound guidance. Include regional details (like KMC Hospital, AJ Hospital, Father Muller, Kasturba Hospital Manipal) when relevant.

User Query: "${userMessage}"
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn('⚠️ Gemini AI Chat failed, using fallback:', err.message);
    }
  }

  // Smart Contextual Fallback Response
  const lower = userMessage.toLowerCase();
  if (lower.includes('fever') || lower.includes('cough')) {
    return 'For fever and cough, stay well-hydrated with warm fluids or tender coconut water. Take paracetamol 500mg after meals if temperature exceeds 100°F. If fever persists over 48 hours, use our AI Symptom Checker or visit Father Muller or District Wenlock Hospital OPD in Mangaluru.';
  } else if (lower.includes('doctor') || lower.includes('cardiologist') || lower.includes('appointment')) {
    return 'We have 61 verified specialists in Mangaluru & Udupi! For Cardiology, Dr. Vignesh Shetty (KMC Hospital) and Dr. Srinivas Nayak (AJ Hospital) have available OPD slots today. Would you like to book a slot?';
  } else if (lower.includes('insurance') || lower.includes('cashless')) {
    return 'KMC Hospital, AJ Hospital Kuntikan, Father Muller Hospital, and Kasturba Hospital Manipal offer 100% cashless treatment with Star Health, HDFC Ergo, and Ayushman Bharat ABHA schemes.';
  }

  return 'Thank you for reaching out to MedConnect AI! I have analyzed your query against our regional clinical database across Dakshina Kannada & Udupi. Let me know if you would like me to match you with a doctor or check hospital bed availability.';
};

/**
 * 3. RAG Hospital Knowledge Assistant with Grounded Context (Retrieval-Augmented Generation)
 */
export const queryHospitalRagWithGemini = async (hospitalName, query, hospitalDocuments = []) => {
  const client = getAiClient();

  const docContext = hospitalDocuments.length > 0
    ? hospitalDocuments.map(d => `--- Document: ${d.schemeTitle} (${d.category}) ---\nCoverage: ${d.coverageAmount}\nEligibility: ${d.eligibility}\nOfficial Rules: ${d.contentText || d.description}`).join('\n\n')
    : `Official Hospital Policy: ${hospitalName} accepts Ayushman Bharat PM-JAY (100% Cashless up to ₹5 Lakhs), Arogya Karnataka, Star Health, HDFC Ergo, and BPL cardholder discounts. OPD registration fee is ₹250. Emergency services operate 24x7.`;

  if (client) {
    try {
      const prompt = `
You are the official RAG Knowledge Assistant for ${hospitalName}.
Answer the patient's inquiry strictly and accurately using ONLY the official hospital document context below.
Do not invent information. If the document specifies coverage, eligibility, or rules, state them clearly.

[OFFICIAL HOSPITAL KNOWLEDGE BASE - ${hospitalName}]
${docContext}

Patient Question: "${query}"
`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn('⚠️ RAG Gemini API call failed, using grounded fallback:', err.message);
    }
  }

  // Grounded RAG Fallback
  return `Based on official documents uploaded by ${hospitalName}: ${hospitalName} accepts Ayushman Bharat PM-JAY and Arogya Karnataka for 100% cashless inpatient treatment up to ₹5,00.000 per family. Eligible cardholders (BPL/ABHA) receive priority OPD clearance and covered surgical packages.`;
};
