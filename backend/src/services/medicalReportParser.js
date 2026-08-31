import { createRequire } from 'module';
import { GoogleGenAI } from '@google/genai';

const require = createRequire(import.meta.url);
let pdfParse;
try {
  const pdfModule = require('pdf-parse');
  pdfParse = typeof pdfModule === 'function' ? pdfModule : (pdfModule?.default || pdfModule);
} catch (e) {
  console.warn('⚠️ pdf-parse module loading note:', e.message);
}

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
 * Standard Clinical Reference Ranges Library (used for validation & reference)
 */
export const CLINICAL_REFERENCE_RANGES = {
  // Complete Blood Count (CBC) & Hematology
  'Hemoglobin': { aliases: ['hb', 'hgb', 'hemoglobin'], min: 13.0, max: 18.0, unit: 'g/dL', category: 'Hematology', specialty: 'Hematologist' },
  'Total RBC': { aliases: ['rbc', 'total rbc', 'rbc count', 'red blood cells', 'red blood cell count'], min: 4.5, max: 6.5, unit: '×10¹²/L', category: 'Hematology', specialty: 'Hematologist' },
  'Hematocrit': { aliases: ['hct', 'pcv', 'packed cell volume', 'hematocrit'], min: 40.0, max: 54.0, unit: '%', category: 'Hematology', specialty: 'Hematologist' },
  'MCV': { aliases: ['mcv', 'mean corpuscular volume'], min: 80.0, max: 100.0, unit: 'fL', category: 'Hematology', specialty: 'Hematologist' },
  'MCH': { aliases: ['mch', 'mean corpuscular hemoglobin'], min: 27.0, max: 32.0, unit: 'pg', category: 'Hematology', specialty: 'Hematologist' },
  'MCHC': { aliases: ['mchc', 'mean corpuscular hemoglobin concentration'], min: 32.0, max: 36.0, unit: 'g/dL', category: 'Hematology', specialty: 'Hematologist' },
  'RDW': { aliases: ['rdw', 'rdw-cv', 'red cell distribution width'], min: 11.5, max: 14.5, unit: '%', category: 'Hematology', specialty: 'Hematologist' },
  'Platelet Count': { aliases: ['platelet', 'platelets', 'platelet count', 'plt'], min: 150.0, max: 450.0, unit: '×10⁹/L', category: 'Hematology', specialty: 'Hematologist' },
  'Total WBC': { aliases: ['wbc', 'total wbc', 'wbc count', 'tlc', 'total leucocyte count', 'white blood cells'], min: 4.0, max: 11.0, unit: '×10⁹/L', category: 'Hematology', specialty: 'Hematologist' },
  'Neutrophils': { aliases: ['neutrophils', 'polymorphs', 'segs', 'segmented neutrophils'], min: 40.0, max: 75.0, unit: '%', category: 'Hematology', specialty: 'Hematologist' },
  'Lymphocytes': { aliases: ['lymphocytes', 'lymphs'], min: 20.0, max: 45.0, unit: '%', category: 'Hematology', specialty: 'Hematologist' },
  'Monocytes': { aliases: ['monocytes', 'monos'], min: 2.0, max: 10.0, unit: '%', category: 'Hematology', specialty: 'Hematologist' },
  'Eosinophils': { aliases: ['eosinophils', 'eos'], min: 1.0, max: 6.0, unit: '%', category: 'Hematology', specialty: 'Hematologist' },
  'Basophils': { aliases: ['basophils', 'baso'], min: 0.0, max: 1.0, unit: '%', category: 'Hematology', specialty: 'Hematologist' },
  'ESR': { aliases: ['esr', 'erythrocyte sedimentation rate'], min: 0.0, max: 20.0, unit: 'mm/hr', category: 'Hematology', specialty: 'General Physician' },

  // Endocrinology & Diabetes
  'Fasting Blood Sugar': { aliases: ['fasting blood sugar', 'fbs', 'fasting glucose', 'fasting blood glucose'], min: 70.0, max: 99.0, unit: 'mg/dL', category: 'Endocrinology', specialty: 'Endocrinologist' },
  'Postprandial Blood Sugar': { aliases: ['postprandial blood sugar', 'ppbs', 'pp glucose', 'post prandial blood sugar'], min: 70.0, max: 140.0, unit: 'mg/dL', category: 'Endocrinology', specialty: 'Endocrinologist' },
  'HbA1c': { aliases: ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin'], min: 4.0, max: 5.6, unit: '%', category: 'Endocrinology', specialty: 'Endocrinologist' },
  'TSH': { aliases: ['tsh', 'thyroid stimulating hormone', 'tsh (thyroid)'], min: 0.4, max: 4.2, unit: 'mIU/L', category: 'Endocrinology', specialty: 'Endocrinologist' },
  'Free T3': { aliases: ['free t3', 'ft3'], min: 2.3, max: 4.2, unit: 'pg/mL', category: 'Endocrinology', specialty: 'Endocrinologist' },
  'Free T4': { aliases: ['free t4', 'ft4'], min: 0.8, max: 1.8, unit: 'ng/dL', category: 'Endocrinology', specialty: 'Endocrinologist' },

  // Renal / Kidney Function
  'Serum Creatinine': { aliases: ['serum creatinine', 'creatinine', 'sr. creatinine'], min: 0.7, max: 1.2, unit: 'mg/dL', category: 'Nephrology', specialty: 'Nephrologist' },
  'Blood Urea': { aliases: ['blood urea', 'urea', 'blood urea nitrogen', 'bun'], min: 7.0, max: 20.0, unit: 'mg/dL', category: 'Nephrology', specialty: 'Nephrologist' },
  'Uric Acid': { aliases: ['uric acid', 'serum uric acid'], min: 3.5, max: 7.2, unit: 'mg/dL', category: 'Nephrology', specialty: 'Nephrologist' },

  // Lipid / Cardiology
  'Total Cholesterol': { aliases: ['total cholesterol', 'cholesterol', 'serum cholesterol'], min: 125.0, max: 200.0, unit: 'mg/dL', category: 'Cardiology', specialty: 'Cardiologist' },
  'Triglycerides': { aliases: ['triglycerides', 'serum triglycerides', 'tg'], min: 35.0, max: 150.0, unit: 'mg/dL', category: 'Cardiology', specialty: 'Cardiologist' },
  'HDL Cholesterol': { aliases: ['hdl', 'hdl cholesterol', 'good cholesterol'], min: 40.0, max: 60.0, unit: 'mg/dL', category: 'Cardiology', specialty: 'Cardiologist' },
  'LDL Cholesterol': { aliases: ['ldl', 'ldl cholesterol', 'bad cholesterol'], min: 0.0, max: 100.0, unit: 'mg/dL', category: 'Cardiology', specialty: 'Cardiologist' },

  // Liver Function
  'Total Bilirubin': { aliases: ['total bilirubin', 'bilirubin total', 's. bilirubin'], min: 0.2, max: 1.2, unit: 'mg/dL', category: 'Gastroenterology', specialty: 'Gastroenterologist' },
  'SGPT / ALT': { aliases: ['sgpt', 'alt', 'alanine aminotransferase', 'sgpt / alt'], min: 7.0, max: 56.0, unit: 'U/L', category: 'Gastroenterology', specialty: 'Gastroenterologist' },
  'SGOT / AST': { aliases: ['sgot', 'ast', 'aspartate aminotransferase', 'sgot / ast'], min: 10.0, max: 40.0, unit: 'U/L', category: 'Gastroenterology', specialty: 'Gastroenterologist' },
};

/**
 * Stage 1: Image / PDF Vision OCR Extraction
 * Extracts ONLY visually present parameters from the uploaded document.
 * ABSOLUTE RULE: Zero Hallucination. Never generate tests not present in document.
 */
export const extractStructuredMedicalDataFromVisionOrPdf = async (fileBuffer, mimeType, filename = '') => {
  const client = getAiClient();
  const isBinaryPdf = fileBuffer && fileBuffer.length >= 5 && fileBuffer.slice(0, 5).toString('ascii').startsWith('%PDF-');
  const isImage = (mimeType && mimeType.startsWith('image/')) || /\.(jpg|jpeg|png|webp|bmp|tiff)$/i.test(filename);
  const isPdf = isBinaryPdf || (mimeType === 'application/pdf' && isBinaryPdf);

  // 1. Try Gemini Vision / Multimodal Extraction if available
  if (client && fileBuffer && fileBuffer.length > 0) {
    try {
      const base64Data = fileBuffer.toString('base64');
      let contentsPayload;

      const visionPrompt = `
You are an expert Clinical Document Extraction Engine for MedConnect Karavali.
Carefully examine the medical lab report document.

CRITICAL INSTRUCTIONS — ZERO HALLUCINATION POLICY:
1. Extract ONLY the test parameters, measured values, units, and reference ranges that are ACTUALLY VISIBLE and PRINTED in this document.
2. Under NO circumstance should you invent, assume, or fabricate any test (for example, NEVER add Fasting Blood Sugar, Creatinine, or TSH unless that exact test appears in this document).
3. If a parameter is visible (e.g. Hb 8.8, RBC 3.0, Hct 26, MCV 85, MCH 29, MCHC 34, Platelet 199, WBC 23.9, Neutrophils 91, Lymphocytes 6, Monocytes 2, Eosinophils 1), extract the exact numerical value and unit printed.
4. Extract patient metadata (name, age, sex, report date, laboratory/hospital name) if printed.
5. If a test value is unreadable or blurry, mark status as "unreadable" with confidence 0.

Output a valid JSON object strictly matching this schema:
{
  "patient": {
    "name": "string or null",
    "age": "string or number or null",
    "sex": "Male" | "Female" | "Other" | null
  },
  "report": {
    "title": "string (e.g. Complete Blood Count / Hematology Report)",
    "date": "YYYY-MM-DD or string or null",
    "category": "Hematology" | "Endocrinology" | "Cardiology" | "Nephrology" | "Gastroenterology" | "General Health",
    "laboratory": "string or null"
  },
  "tests": [
    {
      "name": "Exact test name printed (e.g. Hemoglobin)",
      "value": "8.8 g/dL",
      "numericValue": 8.8,
      "unit": "g/dL",
      "referenceRange": "13.0 - 18.0",
      "refMin": 13.0,
      "refMax": 18.0,
      "status": "Low" | "Normal" | "High" | "Abnormal" | "Unreadable",
      "confidence": 0.98,
      "sourceEvidence": "Exact printed text snippet"
    }
  ]
}

Return ONLY the valid JSON object.
`;

      if (isImage || isBinaryPdf) {
        const docMime = isBinaryPdf ? 'application/pdf' : (mimeType || 'image/jpeg');
        contentsPayload = [
          {
            inlineData: {
              mimeType: docMime,
              data: base64Data,
            },
          },
          visionPrompt,
        ];
      } else {
        // Plain text report buffer
        const textContent = fileBuffer.toString('utf-8');
        contentsPayload = `${visionPrompt}\n\n[DOCUMENT CONTENT]\n${textContent}`;
      }

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentsPayload,
      });

      const rawText = response.text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && Array.isArray(parsed.tests) && parsed.tests.length > 0) {
          return {
            source: isImage || isBinaryPdf ? 'gemini_vision' : 'gemini_text_extraction',
            patient: parsed.patient || {},
            report: parsed.report || {},
            tests: parsed.tests.map(t => ({
              name: t.name,
              value: t.value || `${t.numericValue} ${t.unit || ''}`.trim(),
              numericValue: typeof t.numericValue === 'number' ? t.numericValue : parseFloat(t.value),
              unit: t.unit || '',
              referenceRange: t.referenceRange || '',
              refMin: t.refMin,
              refMax: t.refMax,
              status: t.status || 'Normal',
              confidence: t.confidence || 0.95,
              sourceEvidence: t.sourceEvidence || `${t.name}: ${t.value}`,
            })),
          };
        }
      }
    } catch (err) {
      console.warn('⚠️ Gemini Extraction note:', err.message);
    }
  }

  // 2. Deterministic Local Parsing (for Text PDFs or string extraction)
  let rawText = '';
  try {
    if (isBinaryPdf && pdfParse) {
      const parsedPdf = await pdfParse(fileBuffer);
      rawText = parsedPdf.text || '';
    } else if (fileBuffer) {
      rawText = fileBuffer.toString('utf-8');
    }
  } catch (e) {
    console.error('Error decoding text buffer:', e.message);
    rawText = fileBuffer ? fileBuffer.toString('utf-8') : '';
  }

  return parseDeterministicText(rawText, filename);
};

/**
 * Deterministic Line-by-Line Medical Text Parser
 * Extracts ONLY matches actually present in the text. NEVER adds synthetic mock parameters.
 */
function parseDeterministicText(rawText, filename = '') {
  const lines = (rawText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const foundTests = [];
  const processedNames = new Set();

  let patientName = 'Patient';
  let labName = 'Diagnostic Laboratory';
  let reportDate = new Date().toISOString().split('T')[0];
  let category = 'Hematology & General Lab Report';

  // Extract Metadata
  for (const line of lines) {
    if (/patient\s*name|name\s*:/i.test(line)) {
      const m = line.match(/(?:patient\s*name|name)\s*[:\-]\s*([A-Za-z\s.]+)/i);
      if (m && m[1]) patientName = m[1].trim();
    }
    if (/date\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i.test(line)) {
      const m = line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/);
      if (m && m[1]) reportDate = m[1];
    }
    if (/lab|hospital|clinic|diagnostic|pathology/i.test(line) && labName === 'Diagnostic Laboratory') {
      labName = line.slice(0, 60);
    }
  }

  // Scan against standard reference ranges
  for (const [stdName, info] of Object.entries(CLINICAL_REFERENCE_RANGES)) {
    if (processedNames.has(stdName)) continue;

    for (const alias of info.aliases) {
      // Regex looking for: alias [separator] number [unit] [reference range]
      const regex = new RegExp(`(?:^|\\b)${alias}\\b[^0-9\\n\\r]{0,30}?([0-9]+\\.?[0-9]*)(?:\\s*([a-zA-Z%µ¹²³×\\/\\^]+))?(?:[^0-9\\n\\r]{0,15}?([0-9]+\\.?[0-9]*)\\s*[-–~至to]\\s*([0-9]+\\.?[0-9]*))?`, 'i');
      const match = rawText.match(regex);

      if (match && match[1]) {
        const valNum = parseFloat(match[1]);
        if (!isNaN(valNum)) {
          processedNames.add(stdName);
          const detectedUnit = match[2] ? match[2].trim() : info.unit;
          const repMin = match[3] ? parseFloat(match[3]) : info.min;
          const repMax = match[4] ? parseFloat(match[4]) : info.max;

          let status = 'Normal';
          if (repMin !== undefined && valNum < repMin) status = 'Low';
          if (repMax !== undefined && valNum > repMax) status = 'High';

          foundTests.push({
            name: stdName,
            value: `${valNum} ${detectedUnit}`,
            numericValue: valNum,
            unit: detectedUnit,
            referenceRange: `${repMin} - ${repMax}`,
            refMin: repMin,
            refMax: repMax,
            status,
            confidence: 0.92,
            sourceEvidence: match[0].trim(),
          });
          break;
        }
      }
    }
  }

  // Check category
  if (foundTests.some(t => ['Hemoglobin', 'Total RBC', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'Platelet Count', 'Total WBC', 'Neutrophils', 'Lymphocytes'].includes(t.name))) {
    category = 'Hematology (Complete Blood Count)';
  } else if (foundTests.some(t => ['Fasting Blood Sugar', 'Postprandial Blood Sugar', 'HbA1c', 'TSH'].includes(t.name))) {
    category = 'Endocrinology & Diabetes';
  } else if (foundTests.some(t => ['Serum Creatinine', 'Blood Urea', 'Uric Acid'].includes(t.name))) {
    category = 'Renal Function';
  } else if (foundTests.some(t => ['Total Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol'].includes(t.name))) {
    category = 'Lipid Profile';
  }

  return {
    source: 'deterministic_text',
    patient: { name: patientName },
    report: { title: filename ? filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : 'Medical Lab Report', date: reportDate, category, laboratory: labName },
    tests: foundTests,
  };
}

/**
 * Stage 2: Validation Layer & Clinical Reasoning
 * Filters abnormal findings, validates ranges, determines matching specialist.
 */
export const validateAndEvaluateMedicalReport = (extractedData) => {
  const tests = extractedData?.tests || [];
  const patient = extractedData?.patient || {};
  const reportMeta = extractedData?.report || {};

  // If no tests detected at all (e.g. blank page or non-medical photo)
  if (tests.length === 0) {
    return {
      metadata: {
        patientName: patient.name || 'Patient',
        reportDate: reportMeta.date || new Date().toISOString().split('T')[0],
        category: 'Unclassified Document',
        laboratory: reportMeta.laboratory || 'Diagnostic Center',
      },
      importantValues: [],
      detectedIssues: ['No valid medical test biomarkers could be detected in this uploaded document.'],
      overallStatus: 'Inconclusive',
      riskLevel: 'Low',
      recommendedSpecialist: 'General Physician',
      specialistReason: 'No diagnostic biomarkers detected. Please upload a clear photo or PDF scan of your medical laboratory report.',
    };
  }

  const validatedValues = [];
  const abnormalList = [];
  const specialtyCount = {};

  for (const t of tests) {
    if (!t.name || t.numericValue === undefined || isNaN(t.numericValue)) {
      if (t.status === 'unreadable' || t.status === 'Unreadable') {
        validatedValues.push({
          label: t.name || 'Unidentified Parameter',
          value: 'Unreadable',
          numericValue: null,
          unit: '',
          refMin: null,
          refMax: null,
          status: 'Unreadable',
          confidence: 0,
          sourceEvidence: 'Value unreadable or blurry on report scan',
        });
      }
      continue;
    }

    const valNum = t.numericValue;
    // Find matching reference info using aliases or exact name
    const stdInfo = Object.values(CLINICAL_REFERENCE_RANGES).find(info => 
      info.aliases.some(alias => t.name.toLowerCase().includes(alias.toLowerCase()))
    ) || CLINICAL_REFERENCE_RANGES[t.name] || {};

    const refMin = t.refMin !== undefined && t.refMin !== null ? t.refMin : stdInfo.min;
    const refMax = t.refMax !== undefined && t.refMax !== null ? t.refMax : stdInfo.max;
    const unit = t.unit || stdInfo.unit || '';

    let status = t.status || 'Normal';
    if (refMin !== undefined && refMax !== undefined) {
      if (valNum < refMin) status = 'Low';
      else if (valNum > refMax) status = 'High';
      else status = 'Normal';
    }

    const valueItem = {
      label: t.name,
      value: `${valNum} ${unit}`.trim(),
      numericValue: valNum,
      unit,
      refMin,
      refMax,
      referenceRange: t.referenceRange || (refMin !== undefined && refMax !== undefined ? `${refMin} - ${refMax} ${unit}` : 'Standard'),
      status,
      confidence: t.confidence || 0.95,
      sourceEvidence: t.sourceEvidence || `${t.name}: ${valNum} ${unit}`,
    };

    validatedValues.push(valueItem);

    if (status !== 'Normal') {
      const refStr = (refMin !== undefined && refMax !== undefined) ? ` (Ref: ${refMin} - ${refMax} ${unit})` : '';
      abnormalList.push(`${t.name} recorded at ${valNum} ${unit} [${status}]${refStr}`);

      const spec = stdInfo.specialty || 'General Physician';
      specialtyCount[spec] = (specialtyCount[spec] || 0) + 1;
    }
  }

  // Determine Primary Specialist dynamically based on detected abnormal findings
  let recommendedSpecialist = 'General Physician';
  let maxCount = 0;
  for (const [spec, count] of Object.entries(specialtyCount)) {
    if (count > maxCount) {
      maxCount = count;
      recommendedSpecialist = spec;
    }
  }

  // Provide clinical rationale for recommended specialist
  let specialistReason = 'General Physician consultation for routine evaluation and health optimization.';
  if (recommendedSpecialist === 'Hematologist') {
    specialistReason = 'The uploaded report contains significant abnormalities in blood count biomarkers (e.g. Hemoglobin / WBC / Platelets) warranting evaluation by a Hematologist or Physician.';
  } else if (recommendedSpecialist === 'Endocrinologist') {
    specialistReason = 'The uploaded report contains glucose/hormone abnormalities requiring specialized metabolic assessment.';
  } else if (recommendedSpecialist === 'Nephrologist') {
    specialistReason = 'The uploaded report contains renal/kidney parameter deviations warranting nephrology evaluation.';
  } else if (recommendedSpecialist === 'Cardiologist') {
    specialistReason = 'The uploaded report contains cardiovascular/lipid profile elevations requiring cardiology guidance.';
  } else if (recommendedSpecialist === 'Gastroenterologist') {
    specialistReason = 'The uploaded report contains liver enzyme variations requiring gastroenterology evaluation.';
  }

  // Overall Status and Risk Level
  const isAbnormal = abnormalList.length > 0;
  const overallStatus = isAbnormal ? 'Abnormal' : 'Normal';

  let riskLevel = 'Low';
  const hasSevereHb = validatedValues.some(v => v.label === 'Hemoglobin' && v.numericValue < 9.0);
  const hasSevereWbc = validatedValues.some(v => v.label.includes('WBC') && v.numericValue > 20.0);

  if (hasSevereHb || hasSevereWbc || abnormalList.length >= 3) {
    riskLevel = 'High';
  } else if (isAbnormal) {
    riskLevel = 'Moderate';
  }

  return {
    metadata: {
      patientName: patient.name || 'Patient',
      age: patient.age || null,
      sex: patient.sex || null,
      reportDate: reportMeta.date || new Date().toISOString().split('T')[0],
      category: reportMeta.category || 'General Health Report',
      laboratory: reportMeta.laboratory || 'Diagnostic Clinical Laboratory',
    },
    importantValues: validatedValues,
    detectedIssues: abnormalList.length > 0 ? abnormalList : ['All evaluated biomarkers are strictly within standard reference ranges.'],
    overallStatus,
    riskLevel,
    recommendedSpecialist,
    specialistReason,
  };
};
