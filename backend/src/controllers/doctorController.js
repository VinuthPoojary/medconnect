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

import bcrypt from 'bcryptjs';

export const createDoctor = async (req, res) => {
  try {
    const { name, email, phone, password, photo, specialization, experience, hospitalName, hospitalId, location, consultationFee, education, bio } = req.body;
    const docId = `doc-${Date.now()}`;
    const userId = `user-doc-${Date.now()}`;
    const cleanName = (name || 'Doctor').replace(/^Dr\.\s*/i, '').trim().toLowerCase();
    const cleanParts = cleanName.split(/\s+/).filter(Boolean);
    const uniqueEmail = email || (cleanParts.length > 1 ? `${cleanParts[0]}.${cleanParts[cleanParts.length - 1]}@medconnect.com` : `${cleanParts[0]}@medconnect.com`);
    const docPhone = phone || `+91 8242${String(Date.now()).slice(-6)}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'Doctor@2026', salt);
    const avatar = (name || 'DR').replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // 1. Create users record
    await query(`
      INSERT INTO users (id, name, email, phone, password_hash, role, hospital_id, hospital_name, specialization, avatar)
      VALUES ($1, $2, $3, $4, $5, 'doctor', $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = 'doctor'
    `, [userId, name, uniqueEmail, docPhone, passwordHash, hospitalId || 'hosp-1', hospitalName || 'KMC Health City', specialization || 'General Physician', avatar]);

    const languagesStr = JSON.stringify(['English', 'Kannada']);
    const slotsStr = JSON.stringify(['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM', '06:00 PM']);

    // 2. Create doctors record linked via user_id
    const insertSql = `
      INSERT INTO doctors (id, user_id, name, email, phone, password_hash, photo, specialization, experience, rating, reviews_count, languages, available_slots, hospital_id, hospital_name, location, distance, consultation_fee, education, bio, is_available_today)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 4.8, 10, $10::text[], $11::text[], $12, $13, $14, '2.5 km', $15, $16, $17, true)
      RETURNING id, user_id as "userId", name, email, phone, photo, specialization, experience, rating, reviews_count as "reviewsCount", hospital_name as "hospitalName", location, consultation_fee as "consultationFee"
    `;

    const result = await query(insertSql, [
      docId, userId, name, uniqueEmail, docPhone, passwordHash, photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', specialization || 'General Physician', experience || '10 Years', languagesStr, slotsStr, hospitalId || 'hosp-1', hospitalName || 'KMC Health City', location || 'Mangaluru', consultationFee || 600, education || 'MBBS, MD', bio || 'Consultant Specialist'
    ]);

    let newDoctor = result.rows[0];
    if (!newDoctor) {
      const fetchRes = await query('SELECT id, user_id as "userId", name, email, photo, specialization, experience, rating, hospital_name as "hospitalName", location FROM doctors WHERE id = $1', [docId]);
      newDoctor = fetchRes.rows[0];
    }

    res.status(201).json({ success: true, message: 'Doctor account created and linked in database', doctor: newDoctor });
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
