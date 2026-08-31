import { query } from '../db/index.js';
import { analyzeSymptomsWithGemini, chatWithGemini, queryHospitalRagWithGemini } from '../services/geminiService.js';

export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, duration, severity, location, hasFever, isGettingWorse, medications, additionalContext } = req.body;
    let userId = req.user?.id || req.body.userId || 'user-patient-1';

    if (!symptoms || !symptoms.trim()) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms.' });
    }

    // Ensure the patient user exists in DB for foreign key reference
    try {
      const userCheck = await query(`SELECT id FROM users WHERE id = $1`, [userId]);
      if (userCheck.rows.length === 0) {
        // Find existing patient or create user
        const existingPatient = await query(`SELECT id FROM users WHERE role = 'patient' LIMIT 1`);
        if (existingPatient.rows.length > 0) {
          userId = existingPatient.rows[0].id;
        } else {
          await query(
            `INSERT INTO users (id, name, email, role, phone) VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'Patient User', `patient_${Date.now()}@medconnect.karavali`, 'patient', `98${Math.floor(10000000 + Math.random() * 90000000)}`]
          );
        }
      }
    } catch (err) {
      console.warn('⚠️ User lookup for symptom triage:', err.message);
    }

    // Call Gemini AI Structured Triage Engine
    const triageData = await analyzeSymptomsWithGemini({
      symptoms,
      duration,
      severity,
      location,
      hasFever,
      isGettingWorse,
      medications,
      additionalContext,
    });

    const urgency = triageData.urgency || 'routine';
    const urgencyLabel = triageData.urgency_label || 'Routine Consultation';
    const recommendedSpecialist = triageData.recommended_specialty || 'General Physician';
    const possibleCategories = triageData.possible_categories || ['General Internal Medicine'];
    const recommendedActions = triageData.recommended_actions || [];
    const followUpQuestions = triageData.follow_up_questions || [];
    const isEmergency = !!triageData.is_emergency;

    // Save to symptom history in DB
    const logId = `sym-${Date.now()}`;
    try {
      await query(
        `INSERT INTO symptom_history (id, user_id, symptoms, analysis_summary, urgency, recommended_specialist, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [logId, userId, symptoms, JSON.stringify(triageData), urgency, recommendedSpecialist]
      );
    } catch (dbErr) {
      console.warn('⚠️ Symptom history DB save error:', dbErr.message);
    }

    // Query REAL doctors from Database matching the recommended specialty
    let specPattern = `%${recommendedSpecialist.split(' ')[0]}%`;
    let altPattern = `%${recommendedSpecialist}%`;
    if (recommendedSpecialist.toLowerCase().includes('cardio')) {
      specPattern = '%Cardio%';
      altPattern = '%Heart%';
    } else if (recommendedSpecialist.toLowerCase().includes('neuro')) {
      specPattern = '%Neuro%';
      altPattern = '%Brain%';
    } else if (recommendedSpecialist.toLowerCase().includes('pediat')) {
      specPattern = '%Pediat%';
      altPattern = '%Child%';
    } else if (recommendedSpecialist.toLowerCase().includes('ortho')) {
      specPattern = '%Ortho%';
      altPattern = '%Bone%';
    } else if (recommendedSpecialist.toLowerCase().includes('pulmon') || recommendedSpecialist.toLowerCase().includes('chest')) {
      specPattern = '%Pulmon%';
      altPattern = '%Chest%';
    } else if (recommendedSpecialist.toLowerCase().includes('derma')) {
      specPattern = '%Derma%';
      altPattern = '%Skin%';
    } else if (recommendedSpecialist.toLowerCase().includes('ent')) {
      specPattern = '%ENT%';
      altPattern = '%Ear%';
    }

    let doctorResult = await query(
      `SELECT id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount",
              hospital_name as "hospitalName", location, distance, consultation_fee as "consultationFee",
              available_slots as "availableSlots"
       FROM doctors
       WHERE specialization ILIKE $1 OR specialization ILIKE $2
       ORDER BY rating DESC LIMIT 6`,
      [specPattern, altPattern]
    );

    // Fallback if no specific doctors found
    if (doctorResult.rows.length === 0) {
      doctorResult = await query(
        `SELECT id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount",
                hospital_name as "hospitalName", location, distance, consultation_fee as "consultationFee",
                available_slots as "availableSlots"
         FROM doctors
         WHERE specialization ILIKE '%General%' OR specialization ILIKE '%Medicine%'
         ORDER BY rating DESC LIMIT 4`
      );
    }

    res.json({
      success: true,
      triageResult: {
        ...triageData,
        urgency,
        urgency_label: urgencyLabel,
        recommended_specialty: recommendedSpecialist,
        recommendedSpecialist,
        possible_categories: possibleCategories,
        recommended_actions: recommendedActions,
        follow_up_questions: followUpQuestions,
        is_emergency: isEmergency,
        matchedDoctors: doctorResult.rows,
        recommendedDoctors: doctorResult.rows,
      },
    });
  } catch (error) {
    console.error('❌ Symptom triage error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error analyzing symptoms.' });
  }
};

export const getSymptomHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.json({ success: true, history: [] });
    }

    const result = await query(
      `SELECT id, symptoms, analysis_summary, urgency, recommended_specialist as "recommendedSpecialist", created_at as "createdAt"
       FROM symptom_history
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    const history = result.rows.map(row => {
      let parsed = null;
      try {
        parsed = typeof row.analysis_summary === 'string' ? JSON.parse(row.analysis_summary) : row.analysis_summary;
      } catch (e) {
        parsed = { summary: row.analysis_summary };
      }
      return {
        ...row,
        analysis: parsed,
      };
    });

    res.json({ success: true, history });
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
