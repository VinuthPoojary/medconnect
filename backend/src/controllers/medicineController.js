import { query } from '../db/index.js';

export const getMedicines = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;
    if (!userId) {
      return res.json({ success: true, medicines: [] });
    }

    const result = await query(
      `SELECT id, user_id as "userId", name, dosage, frequency, time, completed, doctor_name as "doctorName", created_at as "createdAt"
       FROM medicines
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, medicines: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const { name, dosage, frequency, time, doctorName } = req.body;
    const userId = req.user?.id || 'user-patient-1';
    const medId = `med-${Date.now()}`;

    const insertSql = `
      INSERT INTO medicines (id, user_id, name, dosage, frequency, time, completed, doctor_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id as "userId", name, dosage, frequency, time, completed, doctor_name as "doctorName", created_at as "createdAt"
    `;

    const result = await query(insertSql, [
      medId, userId, name, dosage || '1 Tablet', frequency || 'Daily', time || '08:00 AM', false, doctorName || 'Attending Physician'
    ]);

    let newMed = result.rows[0];
    if (!newMed) {
      const fetchRes = await query('SELECT id, user_id as "userId", name, dosage, frequency, time, completed, doctor_name as "doctorName" FROM medicines WHERE id = $1', [medId]);
      newMed = fetchRes.rows[0];
    }

    res.status(201).json({ success: true, message: 'Medication added to database', medicine: newMed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateSql = `
      UPDATE medicines
      SET completed = NOT completed
      WHERE id = $1
      RETURNING id, user_id as "userId", name, dosage, frequency, time, completed, doctor_name as "doctorName"
    `;

    const result = await query(updateSql, [id]);
    let updatedMed = result.rows[0];
    if (!updatedMed) {
      const fetchRes = await query('SELECT id, user_id as "userId", name, dosage, frequency, time, completed, doctor_name as "doctorName" FROM medicines WHERE id = $1', [id]);
      updatedMed = fetchRes.rows[0];
    }

    res.json({ success: true, medicine: updatedMed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM medicines WHERE id = $1', [id]);
    res.json({ success: true, message: 'Medicine removed from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
