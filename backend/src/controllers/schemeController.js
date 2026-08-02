import { query } from '../db/index.js';

export const getHospitalSchemes = async (req, res) => {
  try {
    const { hospitalName } = req.query;

    let sql = `
      SELECT 
        id, 
        hospital_name as "hospitalName", 
        scheme_title as "schemeTitle", 
        category, 
        coverage_amount as "coverageAmount", 
        eligibility, 
        description, 
        document_url as "documentUrl", 
        content_text as "contentText", 
        created_at as "createdAt"
      FROM hospital_schemes
    `;

    const params = [];
    if (hospitalName) {
      sql += ` WHERE hospital_name ILIKE $1`;
      params.push(`%${hospitalName}%`);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, schemes: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHospitalScheme = async (req, res) => {
  try {
    const { hospitalName, schemeTitle, category, coverageAmount, eligibility, description, documentUrl, contentText } = req.body;

    if (!hospitalName || !schemeTitle) {
      return res.status(400).json({ success: false, message: 'Hospital Name and Scheme Title are required.' });
    }

    const schemeId = `sch-${Date.now()}`;
    const insertSql = `
      INSERT INTO hospital_schemes (
        id, hospital_name, scheme_title, category, coverage_amount, eligibility, description, document_url, content_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, 
        hospital_name as "hospitalName", 
        scheme_title as "schemeTitle", 
        category, 
        coverage_amount as "coverageAmount", 
        eligibility, 
        description, 
        document_url as "documentUrl", 
        content_text as "contentText", 
        created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      schemeId,
      hospitalName,
      schemeTitle,
      category || 'Government Scheme',
      coverageAmount || 'Up to ₹5 Lakhs / Family',
      eligibility || 'BPL Card Holders & ABHA ID Verified Patients',
      description || '',
      documentUrl || 'https://medconnect.karavali.ai/docs/ayushman-bharat-policy.pdf',
      contentText || description || `${schemeTitle} provided at ${hospitalName}. 100% Cashless treatment for empanelled procedures.`
    ]);

    res.status(201).json({
      success: true,
      message: 'Hospital scheme policy uploaded to RAG Knowledge Base',
      scheme: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHospitalScheme = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM hospital_schemes WHERE id = $1', [id]);
    res.json({ success: true, message: 'Scheme removed from hospital knowledge base' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
