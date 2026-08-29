import { query } from '../db/index.js';
import {
  extractTextFromFile,
  parseStructuredMedicalData,
  evaluateClinicalFindings,
} from '../services/medicalReportParser.js';
import { generateReportExplanationWithGemini } from '../services/reportAiExplanationService.js';

export const getReports = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId || 'user-patient-1';

    const result = await query(
      `SELECT id, user_id as "userId", title, category, date, doctor_name as "doctorName", status, summary, metrics, file_url as "fileUrl", file_type as "fileType", created_at as "createdAt"
       FROM medical_reports
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const reports = result.rows.map(r => ({
      ...r,
      metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics || '{}') : (r.metrics || {}),
    }));

    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReport = async (req, res) => {
  try {
    const { title, category, date, doctorName, status, summary, metrics, fileUrl, fileType } = req.body;
    const userId = req.user?.id || 'user-patient-1';
    const reportId = `rep-${Date.now()}`;
    const reportDate = date || new Date().toISOString().split('T')[0];
    const metricsStr = typeof metrics === 'object' ? JSON.stringify(metrics) : (metrics || '{}');

    const insertSql = `
      INSERT INTO medical_reports (id, user_id, title, category, date, doctor_name, status, summary, metrics, file_url, file_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, user_id as "userId", title, category, date, doctor_name as "doctorName", status, summary, metrics, file_url as "fileUrl", file_type as "fileType", created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      reportId, userId, title, category, reportDate, doctorName || 'General Health Clinic', status || 'Normal', summary || 'AI Report Summary Generated.', metricsStr, fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileType || 'pdf'
    ]);

    let newReport = result.rows[0];
    if (!newReport) {
      const fetchRes = await query('SELECT id, user_id as "userId", title, category, date, doctor_name as "doctorName", status, summary, metrics, file_url as "fileUrl", file_type as "fileType" FROM medical_reports WHERE id = $1', [reportId]);
      newReport = fetchRes.rows[0];
    }

    if (newReport && typeof newReport.metrics === 'string') {
      newReport.metrics = JSON.parse(newReport.metrics || '{}');
    }

    res.status(201).json({ success: true, message: 'Report saved to database', report: newReport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Architectural Pipeline: Real Medical Report Analysis
 * Stage 1: File Validation
 * Stage 2: OCR / Text Extraction (Zero LLM)
 * Stage 3: Structured Medical Data Parsing
 * Stage 4 & 5 & 6: Reference Range Check & Clinical Reasoning
 * Stage 7: Doctor Recommendation (PostgreSQL DB Query)
 * Stage 8: Gemini LLM Explanation (Structured JSON ONLY)
 */
export const analyzeReport = async (req, res) => {
  try {
    const userId = req.user?.id || 'user-patient-1';
    let fileBuffer;
    let mimeType = 'application/pdf';
    let originalName = 'Medical_Report.pdf';

    // Stage 1: File Validation
    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      originalName = req.file.originalname;
    } else if (req.body?.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      if (req.body.filename) originalName = req.body.filename;
    } else {
      // Demo fallback buffer
      fileBuffer = Buffer.from('Patient Name: Kavya Poojary\nDate: 2026-08-16\nHemoglobin: 13.8 g/dL\nTSH: 6.4 mIU/L\nFasting Blood Sugar: 118 mg/dL\nTotal Cholesterol: 238 mg/dL');
    }

    // Stage 2: OCR / PDF Text Extraction (No LLM)
    const rawText = await extractTextFromFile(fileBuffer, mimeType, originalName);

    // Stage 3: Structured Medical Data Parser
    const structuredData = parseStructuredMedicalData(rawText, originalName);

    // Stage 4, 5 & 6: Reference Range Check, Abnormality Detection & Clinical Reasoning
    const clinicalFindings = evaluateClinicalFindings(structuredData);

    // Stage 7: Query Database for Matching Local Doctors
    const matchedSpecialist = clinicalFindings.recommendedSpecialist || 'General Physician';
    const doctorResult = await query(
      `SELECT id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount", hospital_name as "hospitalName", location, distance, consultation_fee as "consultationFee"
       FROM doctors
       WHERE specialization ILIKE $1 OR hospital_name ILIKE $1
       ORDER BY rating DESC LIMIT 3`,
      [`%${matchedSpecialist}%`]
    );

    // Stage 8: Gemini LLM Explanation (Receives ONLY Structured JSON Findings)
    const aiExplanation = await generateReportExplanationWithGemini(structuredData, clinicalFindings);

    // Assemble Final Report Object
    const reportId = `rep-${Date.now()}`;
    const reportDate = new Date().toISOString().split('T')[0];
    const reportTitle = originalName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

    const completeReport = {
      id: reportId,
      userId,
      title: reportTitle,
      category: clinicalFindings.category,
      date: reportDate,
      doctorName: doctorResult.rows[0]?.name ? `${doctorResult.rows[0].name} (${doctorResult.rows[0].hospitalName})` : 'General Health Clinic',
      status: clinicalFindings.overallStatus,
      summary: aiExplanation.summary,
      patientExplanation: aiExplanation.patientExplanation,
      riskLevel: clinicalFindings.riskLevel,
      detectedIssues: clinicalFindings.detectedIssues,
      importantValues: structuredData.importantValues,
      recommendations: aiExplanation.recommendations,
      questionsForDoctor: aiExplanation.questionsForDoctor,
      recommendedSpecialist: matchedSpecialist,
      recommendedDoctors: doctorResult.rows,
      fileType: mimeType.includes('pdf') ? 'PDF Document' : 'Image Scan',
      size: `${(fileBuffer.length / (1024 * 1024)).toFixed(1)} MB`,
    };

    // Save to PostgreSQL DB
    const metricsPayload = JSON.stringify({
      riskLevel: completeReport.riskLevel,
      detectedIssues: completeReport.detectedIssues,
      importantValues: completeReport.importantValues,
      recommendations: completeReport.recommendations,
      questionsForDoctor: completeReport.questionsForDoctor,
      recommendedSpecialist: completeReport.recommendedSpecialist,
      recommendedDoctors: completeReport.recommendedDoctors,
      patientExplanation: completeReport.patientExplanation,
    });

    await query(
      `INSERT INTO medical_reports (id, user_id, title, category, date, doctor_name, status, summary, metrics, file_url, file_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        reportId,
        userId,
        reportTitle,
        clinicalFindings.category,
        reportDate,
        completeReport.doctorName,
        completeReport.status,
        completeReport.summary,
        metricsPayload,
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        completeReport.fileType,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Medical report parsed, structured, and clinically evaluated successfully',
      report: completeReport,
    });
  } catch (error) {
    console.error('Error analyzing medical report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM medical_reports WHERE id = $1', [id]);
    res.json({ success: true, message: 'Report deleted from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
