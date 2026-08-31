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
 * Stage 3: LLM Patient Explanation Engine
 * Crucial Rule:
 * Receives ONLY validated structured findings from the Vision/OCR extraction stage.
 * Never guesses, hallucinates, or introduces unmentioned lab parameters.
 */
export const generateReportExplanationWithGemini = async (clinicalFindings) => {
  const client = getAiClient();
  const { metadata, importantValues, detectedIssues, overallStatus, riskLevel, recommendedSpecialist, specialistReason } = clinicalFindings;

  // Filter only abnormal values
  const abnormalBiomarkers = importantValues.filter(v => v.status === 'Low' || v.status === 'High' || v.status === 'Abnormal');
  const normalBiomarkers = importantValues.filter(v => v.status === 'Normal');

  const structuredPayload = {
    category: metadata.category,
    patientName: metadata.patientName,
    laboratory: metadata.laboratory,
    reportDate: metadata.reportDate,
    overallStatus,
    riskLevel,
    recommendedSpecialist,
    specialistReason,
    abnormalBiomarkers: abnormalBiomarkers.map(b => ({
      name: b.label,
      value: b.value,
      referenceRange: b.referenceRange,
      status: b.status,
      evidence: b.sourceEvidence,
    })),
    normalBiomarkersCount: normalBiomarkers.length,
    allDetectedBiomarkers: importantValues.map(v => `${v.label}: ${v.value} [${v.status}]`),
  };

  if (client && importantValues.length > 0) {
    try {
      const prompt = `
You are an expert, compassionate Medical AI Explainer for MedConnect Karavali.
You have been provided with VALIDATED, STRICTLY EXTRACTED laboratory biomarkers from an uploaded medical document.

STRICT MEDICAL EXPLANATION RULES:
1. ONLY discuss the test parameters that are explicitly listed in [STRUCTURED MEDICAL DATA JSON].
2. NEVER mention or invent unlisted tests (e.g. if Fasting Blood Sugar was not in the report, DO NOT mention Fasting Blood Sugar or Glucose).
3. Do NOT make definitive diagnostic claims (e.g. do not say "You have Acute Leukemia" or "You have Diabetes"). Instead use safe, non-definitive phrasing such as "This result can be associated with...", "This may warrant clinical evaluation to rule out...", or "Your doctor will evaluate...".
4. If parameters are normal, reassure the patient clearly.
5. Provide actionable, supportive dietary/lifestyle suggestions and smart, relevant questions to ask their doctor.

[STRUCTURED MEDICAL DATA JSON]
${JSON.stringify(structuredPayload, null, 2)}

Return a valid JSON object matching this schema:
{
  "summary": "Clear, compassionate 2-3 sentence executive clinical summary of overall findings in patient-friendly language.",
  "patientExplanation": "Layman-friendly explanation explaining what the detected abnormal values mean for body physiology, without claiming a definitive diagnosis.",
  "whatItMayMean": "Careful clinical contextualization of possible causes and factors associated with these specific lab values.",
  "recommendations": [
    "Appropriate next step 1",
    "Appropriate next step 2"
  ],
  "questionsForDoctor": [
    "Relevant question 1 for physician consultation",
    "Relevant question 2 for physician consultation"
  ]
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
        return {
          summary: parsed.summary || (overallStatus === 'Abnormal' ? `Analysis of your ${metadata.category} report identified ${abnormalBiomarkers.length} parameter(s) requiring medical review.` : `All detected biomarkers in your ${metadata.category} report are within standard physiological reference ranges.`),
          patientExplanation: parsed.patientExplanation || (overallStatus === 'Abnormal' ? `The uploaded document shows ${detectedIssues.join(', ')}.` : 'Your laboratory parameters reflect normal physiological balance.'),
          whatItMayMean: parsed.whatItMayMean || (overallStatus === 'Abnormal' ? `These findings may be associated with physiological variations, inflammation, or nutritional factors, which your doctor can correlate with your symptoms.` : 'Your laboratory values indicate healthy metabolic function.'),
          recommendations: parsed.recommendations || [
            overallStatus === 'Abnormal' ? `Consult with a ${recommendedSpecialist} for full clinical evaluation.` : 'Continue healthy lifestyle habits and routine checkups.',
            'Maintain adequate hydration and balanced nutrition.'
          ],
          questionsForDoctor: parsed.questionsForDoctor || [
            `What could be contributing to my ${abnormalBiomarkers[0]?.name || 'lab'} values?`,
            'Would you recommend repeating this test in a few weeks?'
          ],
          disclaimer: 'This AI analysis is for informational purposes only and does not replace professional clinical judgment or diagnosis by a qualified healthcare provider.'
        };
      }
    } catch (err) {
      console.warn('⚠️ Gemini Report Explanation call failed, using deterministic safe explanation:', err.message);
    }
  }

  // Deterministic Clinical Fallback
  let summary = '';
  let patientExplanation = '';
  let whatItMayMean = '';
  const recommendations = [];
  const questionsForDoctor = [];

  if (overallStatus === 'Abnormal') {
    summary = `Your ${metadata.category} report shows ${abnormalBiomarkers.length} biomarker(s) outside standard laboratory bounds. Consultation with a ${recommendedSpecialist} is recommended.`;
    patientExplanation = `Detected variations in ${abnormalBiomarkers.map(b => `${b.name} (${b.value})`).join(', ')} may warrant clinical evaluation.`;
    whatItMayMean = `These findings can be associated with acute or chronic physiological responses, dietary intake, or systemic changes that a physician will interpret in the context of your overall health.`;
    recommendations.push(`Schedule an appointment with a ${recommendedSpecialist} at your earliest convenience.`);
    recommendations.push('Bring this report to your consultation for doctor review.');
    questionsForDoctor.push(`What specific lifestyle or clinical factors could have influenced my ${abnormalBiomarkers[0]?.name || 'test'} level?`);
    questionsForDoctor.push('Are there any additional confirmatory blood tests or follow-ups needed?');
  } else if (importantValues.length > 0) {
    summary = `Great news! All ${importantValues.length} laboratory test parameter(s) detected in your ${metadata.category} report are within standard reference ranges.`;
    patientExplanation = `Your evaluated biomarkers show healthy physiological and metabolic balance.`;
    whatItMayMean = `Normal test values suggest appropriate organ function and baseline health in the areas evaluated by this report.`;
    recommendations.push('Maintain regular hydration, balanced nutrition, and active lifestyle.');
    recommendations.push('Continue routine annual preventative health screenings.');
    questionsForDoctor.push('When should I schedule my next routine preventive health checkup?');
  } else {
    summary = 'No standard laboratory test parameters could be detected from this uploaded file.';
    patientExplanation = 'Please ensure you upload a clear, legible photo or PDF scan of your medical lab report.';
    whatItMayMean = 'The document was either unreadable or did not contain recognizable clinical test tables.';
    recommendations.push('Upload a high-resolution scan or photo of your diagnostic report.');
  }

  return {
    summary,
    patientExplanation,
    whatItMayMean,
    recommendations,
    questionsForDoctor,
    disclaimer: 'This AI analysis is for informational purposes only and does not replace professional clinical judgment or diagnosis by a qualified healthcare provider.'
  };
};
