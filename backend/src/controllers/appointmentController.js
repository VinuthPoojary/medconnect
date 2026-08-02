import { query } from '../db/index.js';

export const getAppointments = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;
    if (!userId) {
      return res.json({ success: true, appointments: [] });
    }

    const result = await query(`
      SELECT 
        id, 
        user_id as "userId", 
        doctor_id as "doctorId", 
        doctor_name as "doctorName", 
        doctor_photo as "doctorPhoto", 
        specialization, 
        hospital_name as "hospitalName", 
        date, 
        time_slot as "timeSlot", 
        queue_number as "queueNumber", 
        estimated_wait_time as "estimatedWaitTime", 
        status, 
        type, 
        patient_name as "patientName", 
        meeting_url as "meetingUrl"
      FROM appointments
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json({ success: true, appointments: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, doctorName, doctorPhoto, specialization, hospitalName, date, timeSlot, type, patientName, userId: bodyUserId } = req.body;
    const userId = req.user?.id || bodyUserId || 'user-patient-1';
    const aptId = `apt-${Date.now()}`;

    // Query real appointment count from database for this doctor
    const countRes = await query(
      `SELECT COUNT(*) as count FROM appointments WHERE (doctor_id = $1 OR doctor_name = $2) AND status = 'upcoming'`,
      [doctorId, doctorName]
    );

    const bookedCount = parseInt(countRes.rows[0]?.count || '0', 10);
    const queueNumber = bookedCount + 1;
    const estimatedWaitTimeMinutes = (queueNumber - 1) * 5;
    const estimatedWaitTime = estimatedWaitTimeMinutes > 0 ? `${estimatedWaitTimeMinutes} mins` : '10 mins';
    const meetingUrl = type === 'online' ? `https://medconnect.karavali.ai/telehealth/room-${Math.floor(Math.random() * 8999 + 1000)}` : null;

    const insertQuery = `
      INSERT INTO appointments (
        id, user_id, doctor_id, doctor_name, doctor_photo, specialization, hospital_name, date, time_slot, queue_number, estimated_wait_time, status, type, patient_name, meeting_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, user_id as "userId", doctor_id as "doctorId", doctor_name as "doctorName", doctor_photo as "doctorPhoto", specialization, hospital_name as "hospitalName", date, time_slot as "timeSlot", queue_number as "queueNumber", estimated_wait_time as "estimatedWaitTime", status, type, patient_name as "patientName", meeting_url as "meetingUrl"
    `;

    const result = await query(insertQuery, [
      aptId, userId, doctorId, doctorName, doctorPhoto, specialization, hospitalName, date, timeSlot, queueNumber, estimatedWaitTime, 'upcoming', type, patientName, meetingUrl
    ]);

    let newApt = result.rows[0];
    if (!newApt) {
      const fetchRes = await query('SELECT id, user_id as "userId", doctor_id as "doctorId", doctor_name as "doctorName", doctor_photo as "doctorPhoto", specialization, hospital_name as "hospitalName", date, time_slot as "timeSlot", queue_number as "queueNumber", estimated_wait_time as "estimatedWaitTime", status, type, patient_name as "patientName", meeting_url as "meetingUrl" FROM appointments WHERE id = $1', [aptId]);
      newApt = fetchRes.rows[0];
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked in database',
      appointment: newApt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Appointment cancelled in database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorQueueStatus = async (req, res) => {
  try {
    const { doctorId, doctorName } = req.query;

    const countRes = await query(
      `SELECT COUNT(*) as count FROM appointments WHERE (doctor_id = $1 OR doctor_name = $2) AND status = 'upcoming'`,
      [doctorId || '', doctorName || '']
    );

    const bookedInDb = parseInt(countRes.rows[0]?.count || '0', 10);
    const activeQueueNumber = bookedInDb > 0 ? bookedInDb : 4;
    const patientsAhead = Math.max(0, activeQueueNumber - 1);
    const consultSpeedMinutes = 5;
    const waitTimeMinutes = patientsAhead * consultSpeedMinutes;

    const now = new Date();
    const estTime = new Date(now.getTime() + waitTimeMinutes * 60000);
    const formattedEstTime = estTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    res.json({
      success: true,
      queueStatus: {
        doctorId,
        doctorName,
        totalBookedInDb: bookedInDb,
        queueNumber: activeQueueNumber,
        patientsAhead,
        consultSpeedMinutes,
        waitTimeMinutes,
        estimatedConsultationTime: formattedEstTime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
