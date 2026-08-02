import { query } from '../db/index.js';

export const getHospitals = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        banner, 
        location, 
        distance, 
        rating, 
        departments, 
        doctors_count as "doctorsCount", 
        beds_available as "bedsAvailable", 
        emergency_status as "emergencyStatus", 
        facilities, 
        phone, 
        reviews_count as "reviewsCount", 
        approved
      FROM hospitals
    `);

    const hospitals = result.rows.map(h => ({
      ...h,
      departments: typeof h.departments === 'string' ? JSON.parse(h.departments || '[]') : (h.departments || []),
      facilities: typeof h.facilities === 'string' ? JSON.parse(h.facilities || '[]') : (h.facilities || []),
    }));

    res.json({ success: true, hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveHospital = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE hospitals SET approved = true WHERE id = $1', [id]);
    res.json({ success: true, message: 'Hospital approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM hospitals WHERE id = $1', [id]);
    res.json({ success: true, message: 'Hospital removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
