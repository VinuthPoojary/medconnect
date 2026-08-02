import { query } from '../db/index.js';
import { analyzeSymptomsWithGemini, chatWithGemini, queryHospitalRagWithGemini } from '../services/geminiService.js';

export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, duration, severity } = req.body;
    const userId = req.user?.id || 'user-patient-1';

    if (!symptoms) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms.' });
    }

    // Call Gemini AI Triage Engine
    const geminiTriage = await analyzeSymptomsWithGemini(symptoms, duration, severity);

    const urgency = geminiTriage.urgency || 'Medium';
    const recommendedSpecialist = geminiTriage.recommendedSpecialist || 'General Physician';
    const possibleConditions = geminiTriage.possibleConditions || [];
    const recommendedActions = geminiTriage.recommendedActions || [];
    const suggestedHospitals = geminiTriage.suggestedHospitals || ['KMC Hospital Attavar & Jyothi', 'AJ Hospital & Research Centre'];

    // Save to symptom history in DB
    const logId = `sym-${Date.now()}`;
    await query(
      `INSERT INTO symptom_history (id, user_id, symptoms, analysis_summary, urgency, recommended_specialist)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [logId, userId, symptoms, JSON.stringify(possibleConditions), urgency, recommendedSpecialist]
    );

    // Get recommended doctors from database matching the AI specialist
    const doctorResult = await query(
      `SELECT id, name, photo, specialization, experience, rating, hospital_name as "hospitalName", location, consultation_fee as "consultationFee"
       FROM doctors
       WHERE specialization ILIKE $1 OR $1 IS NULL
       ORDER BY rating DESC LIMIT 3`,
      [`%${recommendedSpecialist}%`]
    );

    res.json({
      success: true,
      triageResult: {
        urgency,
        recommendedSpecialist,
        possibleConditions,
        recommendedActions,
        suggestedHospitals,
        recommendedDoctors: doctorResult.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const chatWithAi = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const aiReply = await chatWithGemini(message, chatHistory);
    res.json({ success: true, response: aiReply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const queryHospitalRag = async (req, res) => {
  try {
    const { hospitalName, query: userQuery } = req.body;
    if (!hospitalName || !userQuery) {
      return res.status(400).json({ success: false, message: 'Hospital name and query are required.' });
    }

    // Retrieve official uploaded schemes & policies from hospital_schemes PostgreSQL table
    const docResult = await query(
      `SELECT scheme_title as "schemeTitle", category, coverage_amount as "coverageAmount", eligibility, description, content_text as "contentText"
       FROM hospital_schemes
       WHERE hospital_name ILIKE $1`,
      [`%${hospitalName}%`]
    );

    const ragResponse = await queryHospitalRagWithGemini(hospitalName, userQuery, docResult.rows);
    res.json({
      success: true,
      hospitalName,
      query: userQuery,
      ragResponse,
      retrievedDocumentsCount: docResult.rows.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recommendDoctors = async (req, res) => {
  try {
    const { department, specialization } = req.body;
    const filter = specialization || department || '';
    const result = await query(
      `SELECT id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount", hospital_name as "hospitalName", location, distance, consultation_fee as "consultationFee"
       FROM doctors
       WHERE specialization ILIKE $1 OR hospital_name ILIKE $1
       ORDER BY rating DESC LIMIT 5`,
      [`%${filter}%`]
    );

    res.json({ success: true, doctors: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
