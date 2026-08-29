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
 * Stage 7: LLM Patient Explanation Engine
 * Crucial Architecture Decision:
 * Receives ONLY structured JSON findings (Biomarkers, Reference Ranges, Clinical Risk)
 * NEVER receives raw PDF binary files.
 */
export const generateReportExplanationWithGemini = async (structuredData, clinicalFindings) => {
  const client = getAiClient();
  const { metadata, importantValues } = structuredData;
  const { overallStatus, riskLevel, recommendedSpecialist, detectedIssues } = clinicalFindings;

  // Prepare clean structured JSON payload for LLM
  const structuredJsonPayload = {
    category: metadata.category,
    patientName: metadata.patientName,
    labName: metadata.labName,
    reportDate: metadata.reportDate,
    overallStatus,
    riskLevel,
    recommendedSpecialist,
    biomarkers: importantValues.map(v => ({
      parameter: v.label,
      recordedValue: v.value,
      referenceRange: (v.refMin !== undefined && v.refMax !== undefined) ? `${v.refMin} - ${v.refMax} ${v.unit}` : 'Standard',
      clinicalStatus: v.status
    })),
    flaggedAbnormalities: detectedIssues
  };

  if (client) {
    try {
      const prompt = `
You are an expert Clinical AI Medical Explainer for MedConnect.
You have been provided with validated, structured medical lab data that was extracted and verified by a deterministic medical reference range engine.

IMPORTANT ARCHITECTURAL RULE: You are working purely with structured JSON data.

[STRUCTURED MEDICAL DATA JSON]
${JSON.stringify(structuredJsonPayload, null, 2)}

Task:
Generate a compassionate, patient-friendly, easy-to-understand medical breakdown.
Return a valid JSON object strictly matching this schema:
{
  "summary": "Clear 2-3 sentence executive summary explaining overall health status in simple terms.",
  "patientExplanation": "Detailed layman-friendly explanation of why certain biomarkers are elevated/low, what it means for body function, and reassurance.",
  "recommendations": [
    "Actionable lifestyle/diet recommendation 1",
    "Actionable lifestyle/diet recommendation 2",
    "Actionable follow-up recommendation 3"
  ],
  "questionsForDoctor": [
    "Question 1 to ask the doctor during consultation",
    "Question 2 to ask the doctor during consultation"
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
          summary: parsed.summary || `${metadata.category} report for ${metadata.patientName}. Status evaluated as ${overallStatus}.`,
          patientExplanation: parsed.patientExplanation || `Clinical analysis shows ${detectedIssues.join(', ')}.`,
          recommendations: parsed.recommendations || [
            'Maintain balanced diet rich in hydration and fresh greens.',
            `Consult a ${recommendedSpecialist} for comprehensive follow-up assessment.`
          ],
          questionsForDoctor: parsed.questionsForDoctor || [
            `How does my ${importantValues[0]?.label || 'test result'} affect my long-term health?`,
            'Are any additional follow-up diagnostic tests needed?'
          ]
        };
      }
    } catch (err) {
      console.warn('⚠️ Gemini Report Explanation API call failed, using clinical fallback:', err.message);
    }
  }

  // Fallback Explanation Engine if Gemini API is offline
  let summary = `Your ${metadata.category} report has been analyzed. Overall clinical status is marked as ${overallStatus} with ${riskLevel} risk level.`;
  let patientExplanation = `All parameters were checked against standard reference ranges. `;
  if (overallStatus === 'Abnormal') {
    summary = `Your ${metadata.category} shows biomarkers outside standard reference bounds (${detectedIssues.length} observation flagged). Consultation with a ${recommendedSpecialist} is advised.`;
    patientExplanation += `Elevated or reduced levels in ${detectedIssues.join(', ')} require specialist evaluation to ensure optimal metabolic balance.`;
  } else {
    summary = `Great news! All evaluated lab parameters in your ${metadata.category} report are within standard physiological reference ranges.`;
    patientExplanation += `Your biomarkers demonstrate normal metabolic and physiological function.`;
  }

  const recommendations = [
    'Maintain a wholesome coastal Karnataka diet with fresh vegetables and hydration.',
    overallStatus === 'Abnormal'
      ? `Schedule an appointment with a ${recommendedSpecialist} within 7 days.`
      : 'Continue routine annual health checkups.'
  ];

  const questionsForDoctor = [
    `What factors contributed to my ${importantValues.find(v => v.status !== 'Normal')?.label || 'biomarker'} levels?`,
    'Should I repeat this lab test in 3 to 6 months?'
  ];

  return {
    summary,
    patientExplanation,
    recommendations,
    questionsForDoctor
  };
};
