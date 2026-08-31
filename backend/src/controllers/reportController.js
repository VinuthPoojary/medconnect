import crypto from 'crypto';
import { query } from '../db/index.js';
import {
  uploadReportFile,
  getSignedReportUrl,
  getReportFileBuffer,
  deleteReportFile,
} from '../services/storageService.js';
import {
  extractStructuredMedicalDataFromVisionOrPdf,
  validateAndEvaluateMedicalReport,
} from '../services/medicalReportParser.js';
import { generateReportExplanationWithGemini } from '../services/reportAiExplanationService.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Fetch Medical Reports for Authenticated Patient or Authorized Doctor
 */
export const getReports = async (req, res) => {
  try {
    const authUserId = req.user?.id || 'user-patient-1';
    const authRole = req.user?.role || 'patient';
    const queryPatientId = req.query?.patientId;

    let targetPatientId = authUserId;

    // Doctor viewing patient reports: Enforce appointment/consultation relationship check
    if (authRole === 'doctor' && queryPatientId && queryPatientId !== authUserId) {
      const relationCheck = await query(
        `SELECT 1 FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         WHERE d.user_id = $1 AND a.user_id = $2
         LIMIT 1`,
        [authUserId, queryPatientId]
      );

      if (relationCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have an active appointment or consultation relationship with this patient.',
        });
      }
      targetPatientId = queryPatientId;
    }

    const result = await query(
      `SELECT id, patient_id as "patientId", user_id as "userId", file_name as "fileName", file_path as "filePath", 
              file_type as "fileType", file_size as "fileSize", uploaded_at as "uploadedAt", 
              analysis_status as "analysisStatus", extracted_data as "extractedData", 
              ai_summary as "aiSummary", recommended_specialty as "recommendedSpecialty", 
              specialist_reason as "specialistReason", title, category, date, 
              doctor_name as "doctorName", status, summary, metrics, file_url as "fileUrl", 
              created_at as "createdAt"
       FROM medical_reports
       WHERE patient_id = $1 OR user_id = $1
       ORDER BY created_at DESC`,
      [targetPatientId]
    );

    const reports = await Promise.all(
      result.rows.map(async (r) => {
        let metricsObj = {};
        if (typeof r.metrics === 'string') {
          try { metricsObj = JSON.parse(r.metrics); } catch (e) { metricsObj = {}; }
        } else if (r.metrics) {
          metricsObj = r.metrics;
        }

        let extractedDataArr = [];
        if (typeof r.extractedData === 'string') {
          try { extractedDataArr = JSON.parse(r.extractedData); } catch (e) { extractedDataArr = []; }
        } else if (Array.isArray(r.extractedData)) {
          extractedDataArr = r.extractedData;
        } else if (r.extractedData?.tests) {
          extractedDataArr = r.extractedData.tests;
        }

        // Generate dynamic temporary signed URL for viewing if file_path exists
        let signedUrl = r.fileUrl || '';
        if (r.filePath) {
          try {
            signedUrl = await getSignedReportUrl(r.filePath, 300);
          } catch (e) {}
        }

        return {
          id: r.id,
          patientId: r.patientId || r.userId,
          userId: r.userId || r.patientId,
          title: r.title || r.fileName || 'Medical Lab Report',
          fileName: r.fileName || r.title || 'report.pdf',
          filePath: r.filePath || '',
          fileType: r.fileType || 'application/pdf',
          fileSize: r.fileSize || 0,
          category: r.category || 'General Lab Report',
          date: r.date || (r.uploadedAt ? new Date(r.uploadedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          doctorName: r.doctorName || 'Diagnostic Clinical Laboratory',
          status: r.status || 'Normal',
          analysisStatus: r.analysisStatus || 'completed',
          summary: r.summary || r.aiSummary || 'AI Report analysis completed.',
          aiSummary: r.aiSummary || r.summary,
          patientExplanation: metricsObj.patientExplanation || '',
          whatItMayMean: metricsObj.whatItMayMean || '',
          riskLevel: metricsObj.riskLevel || 'Low',
          detectedIssues: metricsObj.detectedIssues || [],
          importantValues: extractedDataArr.length > 0 ? extractedDataArr : (metricsObj.importantValues || []),
          recommendations: metricsObj.recommendations || [],
          questionsForDoctor: metricsObj.questionsForDoctor || [],
          recommendedSpecialist: r.recommendedSpecialty || metricsObj.recommendedSpecialist || 'General Physician',
          recommendedSpecialty: r.recommendedSpecialty || metricsObj.recommendedSpecialist || 'General Physician',
          specialistReason: r.specialistReason || metricsObj.specialistReason || '',
          recommendedDoctors: metricsObj.recommendedDoctors || [],
          disclaimer: metricsObj.disclaimer || 'This AI analysis is for informational purposes only and does not replace evaluation by a qualified healthcare professional.',
          fileUrl: signedUrl,
          createdAt: r.createdAt,
        };
      })
    );

    res.json({ success: true, reports });
  } catch (error) {
    console.error('getReports Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload Medical Report to Private Supabase Storage & Trigger Zero-Hallucination AI Vision Analysis
 */
export const analyzeReport = async (req, res) => {
  try {
    const patientId = req.user?.id || 'user-patient-1';
    let fileBuffer = null;
    let mimeType = 'application/pdf';
    let originalName = 'Medical_Report.pdf';

    // Step 1: File Validation (MIME & Size)
    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      originalName = req.file.originalname;
    } else if (req.body?.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:[^;]+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      if (req.body.filename) originalName = req.body.filename;
      if (req.body.mimeType) mimeType = req.body.mimeType;
    } else if (req.body?.text) {
      fileBuffer = Buffer.from(req.body.text, 'utf-8');
      mimeType = 'text/plain';
      if (req.body.filename) originalName = req.body.filename;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select a valid medical report file (PDF, JPG, PNG).' });
    }

    // Validate MIME Type
    const isSupportedMime = ALLOWED_MIME_TYPES.includes(mimeType) || mimeType === 'text/plain';
    const isSupportedExt = /\.(pdf|jpg|jpeg|png|webp|txt)$/i.test(originalName);
    if (!isSupportedMime && !isSupportedExt) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload PDF, JPG, JPEG, or PNG medical documents.',
      });
    }

    // Validate File Size (Max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 25MB limit. Please upload a smaller medical report scan.',
      });
    }

    // Step 2: Generate Unique Report ID & Secure Storage Path
    const reportId = `rep-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const safeFilename = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const reportTitle = originalName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    const reportDate = new Date().toISOString().split('T')[0];

    // Step 3: Upload to Private Supabase Storage Bucket
    const storageResult = await uploadReportFile({
      fileBuffer,
      mimeType,
      patientId,
      reportId,
      originalFilename: safeFilename,
    });

    const storageFilePath = storageResult.filePath;

    // Step 4: Insert Initial Database Record (analysis_status = 'pending')
    await query(
      `INSERT INTO medical_reports (
        id, patient_id, user_id, file_name, file_path, file_type, file_size, 
        uploaded_at, analysis_status, title, category, date, doctor_name, status, summary, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'pending', $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)`,
      [
        reportId,
        patientId,
        patientId,
        safeFilename,
        storageFilePath,
        mimeType,
        fileBuffer.length,
        reportTitle,
        'Medical Lab Report',
        reportDate,
        'Diagnostic Clinical Laboratory',
        'Normal',
        'Uploading and initiating AI Vision analysis...',
      ]
    );

    // Step 5: Execute AI Vision/OCR Extraction & Validation Pipeline
    let clinicalFindings;
    let aiExplanation;
    let matchedSpecialist = 'General Physician';
    let doctorResult = { rows: [] };

    try {
      // Vision OCR Extraction from uploaded file
      const extractedData = await extractStructuredMedicalDataFromVisionOrPdf(fileBuffer, mimeType, originalName);

      // Strict Validation Layer (Zero Hallucination)
      clinicalFindings = validateAndEvaluateMedicalReport(extractedData);
      matchedSpecialist = clinicalFindings.recommendedSpecialist || 'General Physician';

      // Query Database for Matching Local Doctors in Coastal Karnataka
      doctorResult = await query(
        `SELECT id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount", 
                hospital_name as "hospitalName", location, distance, consultation_fee as "consultationFee"
         FROM doctors
         WHERE specialization ILIKE $1 OR specialization ILIKE $2 OR specialization ILIKE $3
         ORDER BY rating DESC LIMIT 3`,
        [`%${matchedSpecialist}%`, `%Physician%`, `%Medicine%`]
      );

      if (doctorResult.rows.length === 0) {
        doctorResult = await query(
          `SELECT id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount", 
                  hospital_name as "hospitalName", location, distance, consultation_fee as "consultationFee"
           FROM doctors
           ORDER BY rating DESC LIMIT 3`
        );
      }

      // Safe Patient-Friendly AI Explanation Engine
      aiExplanation = await generateReportExplanationWithGemini(clinicalFindings);

    } catch (aiErr) {
      console.error('⚠️ AI Extraction error (marking analysis as failed without deleting document):', aiErr);
      await query(
        `UPDATE medical_reports SET analysis_status = 'failed', summary = $1 WHERE id = $2`,
        [`AI analysis could not complete: ${aiErr.message}. You may click [Try Again] to re-analyze.`, reportId]
      );

      const signedUrl = await getSignedReportUrl(storageFilePath, 300);
      return res.json({
        success: true,
        message: 'Report uploaded to private storage, but AI analysis requires retry.',
        report: {
          id: reportId,
          patientId,
          userId: patientId,
          title: reportTitle,
          fileName: safeFilename,
          filePath: storageFilePath,
          fileType: mimeType,
          fileSize: fileBuffer.length,
          analysisStatus: 'failed',
          summary: 'AI analysis could not be completed. Please click Try Again.',
          fileUrl: signedUrl,
          date: reportDate,
        },
      });
    }

    // Step 6: Generate Temporary Signed URL (5-minute expiry)
    const signedUrl = await getSignedReportUrl(storageFilePath, 300);

    // Step 7: Update PostgreSQL DB with Final Validated Clinical Findings
    const metricsPayload = JSON.stringify({
      riskLevel: clinicalFindings.riskLevel,
      detectedIssues: clinicalFindings.detectedIssues,
      importantValues: clinicalFindings.importantValues,
      whatItMayMean: aiExplanation.whatItMayMean,
      recommendations: aiExplanation.recommendations,
      questionsForDoctor: aiExplanation.questionsForDoctor,
      recommendedSpecialist: matchedSpecialist,
      specialistReason: clinicalFindings.specialistReason,
      recommendedDoctors: doctorResult.rows,
      patientExplanation: aiExplanation.patientExplanation,
      disclaimer: aiExplanation.disclaimer,
    });

    const extractedDataJson = JSON.stringify(clinicalFindings.importantValues);

    await query(
      `UPDATE medical_reports 
       SET analysis_status = 'completed',
           category = $1,
           status = $2,
           summary = $3,
           ai_summary = $3,
           metrics = $4,
           extracted_data = $5,
           recommended_specialty = $6,
           specialist_reason = $7,
           doctor_name = $8
       WHERE id = $9`,
      [
        clinicalFindings.metadata.category,
        clinicalFindings.overallStatus,
        aiExplanation.summary,
        metricsPayload,
        extractedDataJson,
        matchedSpecialist,
        clinicalFindings.specialistReason,
        doctorResult.rows[0]?.name ? `${doctorResult.rows[0].name} (${doctorResult.rows[0].hospitalName})` : 'Diagnostic Clinical Laboratory',
        reportId,
      ]
    );

    const completeReport = {
      id: reportId,
      patientId,
      userId: patientId,
      title: reportTitle,
      fileName: safeFilename,
      filePath: storageFilePath,
      fileType: mimeType,
      fileSize: fileBuffer.length,
      category: clinicalFindings.metadata.category,
      date: clinicalFindings.metadata.reportDate || reportDate,
      patientName: clinicalFindings.metadata.patientName,
      laboratory: clinicalFindings.metadata.laboratory,
      doctorName: doctorResult.rows[0]?.name ? `${doctorResult.rows[0].name} (${doctorResult.rows[0].hospitalName})` : 'Diagnostic Clinical Laboratory',
      status: clinicalFindings.overallStatus,
      analysisStatus: 'completed',
      summary: aiExplanation.summary,
      patientExplanation: aiExplanation.patientExplanation,
      whatItMayMean: aiExplanation.whatItMayMean,
      riskLevel: clinicalFindings.riskLevel,
      detectedIssues: clinicalFindings.detectedIssues,
      importantValues: clinicalFindings.importantValues,
      recommendations: aiExplanation.recommendations,
      questionsForDoctor: aiExplanation.questionsForDoctor,
      recommendedSpecialist: matchedSpecialist,
      recommendedSpecialty: matchedSpecialist,
      specialistReason: clinicalFindings.specialistReason,
      recommendedDoctors: doctorResult.rows,
      disclaimer: aiExplanation.disclaimer,
      fileUrl: signedUrl,
      size: `${(fileBuffer.length / (1024 * 1024)).toFixed(1)} MB`,
    };

    res.json({
      success: true,
      message: 'Medical report securely uploaded to private Supabase Storage and clinically analyzed.',
      report: completeReport,
    });
  } catch (error) {
    console.error('analyzeReport Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Report upload and analysis failed' });
  }
};

/**
 * Generate Dynamic Temporary Signed URL with Access Control Verification
 */
export const getReportSignedUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const authUserId = req.user?.id || 'user-patient-1';
    const authRole = req.user?.role || 'patient';

    const result = await query(
      `SELECT id, patient_id as "patientId", user_id as "userId", file_name as "fileName", 
              file_path as "filePath", file_type as "fileType"
       FROM medical_reports 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medical report not found' });
    }

    const report = result.rows[0];
    const reportPatientId = report.patientId || report.userId;

    // Authorization Check
    let isAuthorized = false;

    if (reportPatientId === authUserId) {
      // Patient accessing their own report
      isAuthorized = true;
    } else if (authRole === 'doctor') {
      // Doctor accessing patient's report: verify active appointment/consultation relationship
      const relationCheck = await query(
        `SELECT 1 FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         WHERE d.user_id = $1 AND a.user_id = $2
         LIMIT 1`,
        [authUserId, reportPatientId]
      );
      if (relationCheck.rows.length > 0) {
        isAuthorized = true;
      }
    } else if (authRole === 'admin' || authRole === 'hospital') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to view this medical document.',
      });
    }

    const signedUrl = await getSignedReportUrl(report.filePath, 300);

    res.json({
      success: true,
      signedUrl,
      fileName: report.fileName,
      fileType: report.fileType,
      expiresIn: 300,
    });
  } catch (error) {
    console.error('getReportSignedUrl Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Secure Local File Stream (Fallback for local storage with signed token verification)
 */
export const getSecureFileStream = async (req, res) => {
  try {
    const { path: filePath, token } = req.query;
    if (!filePath || !token) {
      return res.status(400).send('Invalid file request parameters');
    }

    // Verify token validity (5-minute window)
    const expectedToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${filePath}:${Math.floor(Date.now() / (1000 * 300))}`)
      .digest('hex');

    const prevToken = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
      .update(`${filePath}:${Math.floor(Date.now() / (1000 * 300)) - 1}`)
      .digest('hex');

    if (token !== expectedToken && token !== prevToken) {
      return res.status(403).send('Signed URL has expired or is invalid. Please request a new link.');
    }

    const buffer = await getReportFileBuffer(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeMap = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
    res.send(buffer);
  } catch (error) {
    console.error('getSecureFileStream Error:', error);
    res.status(404).send('Document not found');
  }
};

/**
 * Re-trigger AI Vision Analysis on an Existing Uploaded Report
 */
export const reanalyzeReport = async (req, res) => {
  try {
    const { id } = req.params;
    const authUserId = req.user?.id || 'user-patient-1';

    const result = await query(
      `SELECT id, patient_id as "patientId", user_id as "userId", file_name as "fileName", 
              file_path as "filePath", file_type as "fileType"
       FROM medical_reports 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const report = result.rows[0];
    const reportPatientId = report.patientId || report.userId;
    if (reportPatientId !== authUserId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to reanalyze this report' });
    }

    // Retrieve file buffer from storage
    const fileBuffer = await getReportFileBuffer(report.filePath);

    // Re-run Vision OCR
    const extractedData = await extractStructuredMedicalDataFromVisionOrPdf(fileBuffer, report.fileType, report.fileName);
    const clinicalFindings = validateAndEvaluateMedicalReport(extractedData);
    const matchedSpecialist = clinicalFindings.recommendedSpecialist || 'General Physician';

    const doctorResult = await query(
      `SELECT id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount", 
              hospital_name as "hospitalName", location, distance, consultation_fee as "consultationFee"
       FROM doctors
       WHERE specialization ILIKE $1 OR specialization ILIKE $2 OR specialization ILIKE $3
       ORDER BY rating DESC LIMIT 3`,
      [`%${matchedSpecialist}%`, `%Physician%`, `%Medicine%`]
    );

    const aiExplanation = await generateReportExplanationWithGemini(clinicalFindings);

    const metricsPayload = JSON.stringify({
      riskLevel: clinicalFindings.riskLevel,
      detectedIssues: clinicalFindings.detectedIssues,
      importantValues: clinicalFindings.importantValues,
      whatItMayMean: aiExplanation.whatItMayMean,
      recommendations: aiExplanation.recommendations,
      questionsForDoctor: aiExplanation.questionsForDoctor,
      recommendedSpecialist: matchedSpecialist,
      specialistReason: clinicalFindings.specialistReason,
      recommendedDoctors: doctorResult.rows,
      patientExplanation: aiExplanation.patientExplanation,
      disclaimer: aiExplanation.disclaimer,
    });

    await query(
      `UPDATE medical_reports 
       SET analysis_status = 'completed',
           category = $1,
           status = $2,
           summary = $3,
           ai_summary = $3,
           metrics = $4,
           extracted_data = $5,
           recommended_specialty = $6,
           specialist_reason = $7
       WHERE id = $8`,
      [
        clinicalFindings.metadata.category,
        clinicalFindings.overallStatus,
        aiExplanation.summary,
        metricsPayload,
        JSON.stringify(clinicalFindings.importantValues),
        matchedSpecialist,
        clinicalFindings.specialistReason,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Report re-analyzed successfully',
    });
  } catch (error) {
    console.error('reanalyzeReport Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Report: Verifies Ownership, Deletes from Supabase Storage & Database Record
 */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const authUserId = req.user?.id || 'user-patient-1';

    const result = await query(
      `SELECT id, patient_id as "patientId", user_id as "userId", file_path as "filePath" 
       FROM medical_reports 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medical report not found' });
    }

    const report = result.rows[0];
    const reportPatientId = report.patientId || report.userId;

    if (reportPatientId !== authUserId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to delete this report.',
      });
    }

    // 1. Delete file from Private Supabase Storage
    if (report.filePath) {
      await deleteReportFile(report.filePath);
    }

    // 2. Delete database record
    await query('DELETE FROM medical_reports WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Medical report and storage document deleted successfully.',
    });
  } catch (error) {
    console.error('deleteReport Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create Report (Metadata Only / Manual Ingestion)
 */
export const createReport = async (req, res) => {
  try {
    const { title, category, date, doctorName, status, summary, metrics, fileUrl, fileType, fileName, filePath } = req.body;
    const userId = req.user?.id || 'user-patient-1';
    const reportId = `rep-${Date.now()}`;
    const reportDate = date || new Date().toISOString().split('T')[0];
    const metricsStr = typeof metrics === 'object' ? JSON.stringify(metrics) : (metrics || '{}');

    await query(
      `INSERT INTO medical_reports (
        id, patient_id, user_id, file_name, file_path, file_type, 
        title, category, date, doctor_name, status, summary, metrics, file_url, analysis_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'completed')`,
      [
        reportId,
        userId,
        userId,
        fileName || title || 'report.pdf',
        filePath || '',
        fileType || 'application/pdf',
        title || 'Medical Lab Report',
        category || 'General Health',
        reportDate,
        doctorName || 'Diagnostic Clinical Laboratory',
        status || 'Normal',
        summary || 'Medical report record created.',
        metricsStr,
        fileUrl || '',
      ]
    );

    res.status(201).json({ success: true, message: 'Report saved to database', reportId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
