import { query } from '../db/index.js';

export const getDoctors = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        photo, 
        specialization, 
        experience, 
        rating, 
        reviews_count as "reviewsCount", 
        languages, 
        available_slots as "availableSlots", 
        hospital_name as "hospitalName", 
        location, 
        distance, 
        consultation_fee as "consultationFee", 
        education, 
        bio, 
        is_available_today as "isAvailableToday"
      FROM doctors
      ORDER BY rating DESC
    `);

    const doctors = result.rows.map(d => ({
      ...d,
      languages: typeof d.languages === 'string' ? JSON.parse(d.languages || '[]') : (d.languages || []),
      availableSlots: typeof d.availableSlots === 'string' ? JSON.parse(d.availableSlots || '[]') : (d.availableSlots || []),
    }));

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { name, photo, specialization, experience, hospitalName, location, consultationFee, education, bio } = req.body;
    const docId = `doc-${Date.now()}`;
    const languagesStr = JSON.stringify(['English', 'Kannada']);
    const slotsStr = JSON.stringify(['10:00 AM', '02:00 PM', '04:00 PM']);

    const insertSql = `
      INSERT INTO doctors (id, name, photo, specialization, experience, rating, reviews_count, languages, available_slots, hospital_name, location, distance, consultation_fee, education, bio, is_available_today)
      VALUES ($1, $2, $3, $4, $5, 4.8, 10, $6::text[], $7::text[], $8, $9, '2.5 km', $10, $11, $12, true)
      RETURNING id, name, photo, specialization, experience, rating, reviews_count as "reviewsCount", hospital_name as "hospitalName", location, consultation_fee as "consultationFee"
    `;

    const result = await query(insertSql, [
      docId, name, photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300', specialization, experience || '10 Years', languagesStr, slotsStr, hospitalName || 'KMC Health City', location || 'Mangaluru', consultationFee || 600, education || 'MBBS, MD', bio || 'Consultant Specialist'
    ]);

    let newDoctor = result.rows[0];
    if (!newDoctor) {
      const fetchRes = await query('SELECT id, name, photo, specialization, experience, rating, hospital_name as "hospitalName", location FROM doctors WHERE id = $1', [docId]);
      newDoctor = fetchRes.rows[0];
    }

    res.status(201).json({ success: true, message: 'Doctor added to database', doctor: newDoctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM doctors WHERE id = $1', [id]);
    res.json({ success: true, message: 'Doctor removed from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
