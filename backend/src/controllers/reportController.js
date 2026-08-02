import { query } from '../db/index.js';

export const getReports = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;
    if (!userId) {
      return res.json({ success: true, reports: [] });
    }

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

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM medical_reports WHERE id = $1', [id]);
    res.json({ success: true, message: 'Report deleted from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
