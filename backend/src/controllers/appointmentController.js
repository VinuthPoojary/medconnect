import { query } from '../db/index.js';
import { emitQueueUpdate } from '../socket.js';

export const getAppointments = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;

    let sql = `
      SELECT 
        a.id, 
        a.user_id as "userId", 
        a.doctor_id as "doctorId", 
        COALESCE(d.name, a.doctor_name) as "doctorName", 
        COALESCE(d.photo, a.doctor_photo) as "doctorPhoto", 
        COALESCE(d.specialization, a.specialization) as specialization, 
        COALESCE(d.hospital_name, a.hospital_name) as "hospitalName", 
        a.date, 
        a.time_slot as "timeSlot", 
        a.queue_number as "queueNumber", 
        a.estimated_wait_time as "estimatedWaitTime", 
        a.status, 
        a.type, 
        a.patient_name as "patientName", 
        a.meeting_url as "meetingUrl",
        a.created_at as "createdAt"
      FROM appointments a
      LEFT JOIN doctors d ON (a.doctor_id = d.id OR a.doctor_id = d.user_id)
    `;

    const params = [];
    if (userId) {
      params.push(userId);
      sql += ` WHERE a.user_id = $1`;
    } else {
      sql += ` WHERE LOWER(a.status) != 'cancelled'`;
    }

    sql += ` ORDER BY a.created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, appointments: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSlotCounts = async (req, res) => {
  try {
    const { doctorId, doctorName, date } = req.query;
    const cleanDocId = doctorId || '';
    const cleanDocName = doctorName ? doctorName.replace(/^Dr\.\s*/i, '').trim() : '';
    const sqlDate = date || new Date().toISOString().split('T')[0];

    // Query real active appointment counts grouped by time_slot from PostgreSQL
    const countRes = await query(
      `SELECT time_slot, COUNT(*) as count 
       FROM appointments 
       WHERE (
         doctor_id = $1 
         OR doctor_id = $2 
         OR LOWER(doctor_name) = LOWER($3)
         OR LOWER(doctor_name) LIKE LOWER($4)
       ) 
       AND (date = $5 OR $5 IS NULL OR $5 = '')
       AND LOWER(status) != 'cancelled'
       GROUP BY time_slot`,
      [cleanDocId, cleanDocId.replace('user-doc-', 'doc-'), doctorName || '', `%${cleanDocName}%`, sqlDate]
    );

    const slotCounts = {};
    let minCount = Infinity;
    let recommendedSlot = null;

    countRes.rows.forEach((row) => {
      const cnt = parseInt(row.count || '0', 10);
      slotCounts[row.time_slot] = {
        patientsBooked: cnt,
        expectedPosition: cnt + 1,
      };
      if (cnt < minCount) {
        minCount = cnt;
        recommendedSlot = row.time_slot;
      }
    });

    res.json({
      success: true,
      doctorId: cleanDocId,
      doctorName,
      date: sqlDate,
      slotCounts,
      recommendedSlot,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLiveQueue = async (req, res) => {
  try {
    const { doctorId, doctorName, date } = req.query;
    const cleanDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT 
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
        meeting_url as "meetingUrl",
        created_at as "createdAt"
      FROM appointments 
      WHERE (doctor_id = $1 OR LOWER(doctor_name) = LOWER($2) OR $1 IS NULL OR $1 = '')
        AND (date = $3 OR $3 IS NULL OR $3 = '')
      ORDER BY queue_number ASC`,
      [doctorId || '', doctorName || '', cleanDate]
    );

    // Find current active token (IN_CONSULTATION or CALLED or highest COMPLETED)
    const inConsultationApt = result.rows.find(a => ['in_consultation', 'called'].includes((a.status || '').toLowerCase()));
    const completedApts = result.rows.filter(a => (a.status || '').toLowerCase() === 'completed');
    const lastCompletedApt = completedApts[completedApts.length - 1];

    const currentTokenNumber = inConsultationApt 
      ? inConsultationApt.queueNumber 
      : (lastCompletedApt ? lastCompletedApt.queueNumber : (result.rows[0]?.queueNumber || 1));

    // Calculate patientsAhead for each appointment
    const queue = result.rows.map((row) => {
      const myToken = row.queueNumber || 1;

      // Count appointments before myToken that are WAITING or IN_CONSULTATION or CALLED
      const aheadCount = result.rows.filter(a => {
        const aStatus = (a.status || '').toLowerCase();
        const aToken = a.queueNumber || 0;
        return aToken < myToken && ['waiting', 'in_consultation', 'called', 'booked', 'upcoming'].includes(aStatus);
      }).length;

      return {
        ...row,
        tokenNumber: `#0${myToken}`,
        currentToken: `#0${currentTokenNumber}`,
        patientsAhead: aheadCount,
        estimatedWait: aheadCount > 0 ? `~${aheadCount * 10} minutes` : 'Immediate (~2 mins)',
      };
    });

    res.json({
      success: true,
      currentToken: `#0${currentTokenNumber}`,
      queue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, doctorName: bodyDocName, doctorPhoto: bodyDocPhoto, specialization: bodySpec, hospitalName: bodyHospName, date, timeSlot, type, patientName, userId: bodyUserId } = req.body;
    const userId = req.user?.id || bodyUserId || 'user-patient-1';
    const finalPatientName = patientName || req.user?.name || 'Patient';
    const aptId = `apt-${Date.now()}`;
    const cleanDate = date || new Date().toISOString().split('T')[0];
    const cleanDocId = doctorId || 'doc-kmc-1';

    // 1. Fetch exact doctor record from database by doctorId or doctorName
    let doctorRecord = null;
    if (cleanDocId) {
      const dRes = await query('SELECT * FROM doctors WHERE id = $1 OR user_id = $1 LIMIT 1', [cleanDocId]);
      if (dRes.rows.length > 0) doctorRecord = dRes.rows[0];
    }
    if (!doctorRecord && bodyDocName) {
      const cleanName = bodyDocName.replace(/^Dr\.\s*/i, '').trim();
      const dRes = await query('SELECT * FROM doctors WHERE LOWER(name) LIKE LOWER($1) LIMIT 1', [`%${cleanName}%`]);
      if (dRes.rows.length > 0) doctorRecord = dRes.rows[0];
    }

    const finalDocId = doctorRecord ? doctorRecord.id : cleanDocId;
    const finalDocName = doctorRecord ? doctorRecord.name : (bodyDocName || 'Doctor');
    const finalDocPhoto = doctorRecord ? doctorRecord.photo : (bodyDocPhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400');
    const finalSpec = doctorRecord ? doctorRecord.specialization : (bodySpec || 'Consultant Specialist');
    const finalHospName = doctorRecord ? (doctorRecord.hospital_name || doctorRecord.hospitalName) : (bodyHospName || 'KMC Hospital');

    // 2. Atomic calculation for next sequential token number (#01, #02, #03...) for this doctor on this date & timeSlot
    const tokenRes = await query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 as "nextToken"
       FROM appointments 
       WHERE (doctor_id = $1 OR doctor_name = $2) AND (date = $3 OR $3 IS NULL OR $3 = '') AND (time_slot = $4 OR $4 IS NULL OR $4 = '')`,
      [finalDocId, finalDocName, cleanDate, timeSlot || '09:30 AM']
    );

    const queueNumber = parseInt(tokenRes.rows[0]?.nextToken || '1', 10);

    // 3. Count active waiting patients ahead of this new token
    const aheadRes = await query(
      `SELECT COUNT(*) as count 
       FROM appointments 
       WHERE (doctor_id = $1 OR doctor_name = $2) 
         AND (date = $3 OR $3 IS NULL OR $3 = '') 
         AND (time_slot = $4 OR $4 IS NULL OR $4 = '')
         AND LOWER(status) IN ('waiting', 'in_consultation', 'called')`,
      [finalDocId, finalDocName, cleanDate, timeSlot || '09:30 AM']
    );

    const patientsAhead = parseInt(aheadRes.rows[0]?.count || '0', 10);
    const estimatedWaitMinutes = patientsAhead * 10;
    const estimatedWaitTime = estimatedWaitMinutes > 0 ? `~${estimatedWaitMinutes} minutes` : 'Immediate (~2 mins)';
    const meetingUrl = type === 'online' ? `https://medconnect.karavali.ai/telehealth/room-${Math.floor(Math.random() * 8999 + 1000)}` : null;

    // 4. Insert appointment into database with status = 'waiting' and assigned queue_number
    const insertQuery = `
      INSERT INTO appointments (
        id, user_id, doctor_id, doctor_name, doctor_photo, specialization, hospital_name, date, time_slot, queue_number, estimated_wait_time, status, type, patient_name, meeting_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, user_id as "userId", doctor_id as "doctorId", doctor_name as "doctorName", doctor_photo as "doctorPhoto", specialization, hospital_name as "hospitalName", date, time_slot as "timeSlot", queue_number as "queueNumber", estimated_wait_time as "estimatedWaitTime", status, type, patient_name as "patientName", meeting_url as "meetingUrl", created_at as "createdAt"
    `;

    const result = await query(insertQuery, [
      aptId, userId, finalDocId, finalDocName, finalDocPhoto, finalSpec, finalHospName, cleanDate, timeSlot || '09:30 AM', queueNumber, estimatedWaitTime, 'waiting', type || 'offline', finalPatientName, meetingUrl
    ]);

    let newApt = result.rows[0];
    if (!newApt) {
      const fetchRes = await query('SELECT id, user_id as "userId", doctor_id as "doctorId", doctor_name as "doctorName", doctor_photo as "doctorPhoto", specialization, hospital_name as "hospitalName", date, time_slot as "timeSlot", queue_number as "queueNumber", estimated_wait_time as "estimatedWaitTime", status, type, patient_name as "patientName", meeting_url as "meetingUrl", created_at as "createdAt" FROM appointments WHERE id = $1', [aptId]);
      newApt = fetchRes.rows[0];
    }

    const payload = {
      ...newApt,
      tokenNumber: `#0${queueNumber}`,
      patientsAhead,
      expectedPosition: queueNumber,
    };

    // 5. Broadcast Real-Time WebSockets Event to Doctor & Patient Dashboards
    try {
      emitQueueUpdate(finalDocId, {
        action: 'appointment_created',
        doctorId: finalDocId,
        appointment: payload,
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: `Appointment booked successfully! Your Token Number is #${queueNumber < 10 ? '0' + queueNumber : queueNumber}`,
      appointment: payload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const fetchRes = await query(`SELECT * FROM appointments WHERE id = $1`, [id]);
    const apt = fetchRes.rows[0];

    await query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1`, [id]);

    if (apt) {
      try {
        emitQueueUpdate(apt.doctor_id, {
          action: 'appointment_cancelled',
          appointmentId: id,
          doctorId: apt.doctor_id,
          date: apt.date,
          timeSlot: apt.time_slot,
          userId: apt.user_id,
          status: 'cancelled',
        });
      } catch (e) {}
    }

    res.json({ success: true, message: 'Appointment cancelled in database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorQueueStatus = async (req, res) => {
  try {
    const { doctorId, doctorName, date, timeSlot, appointmentId } = req.query;
    const authUserId = req.user?.id || req.query.userId || null;
    const cleanDate = date || new Date().toISOString().split('T')[0];
    const cleanDocId = doctorId || '';
    const cleanDocName = doctorName ? doctorName.replace(/^Dr\.\s*/i, '').trim() : '';

    // 1. Fetch all active appointments for this doctor + date (+ timeSlot if provided)
    const queueRes = await query(
      `SELECT 
        id, 
        user_id as "userId", 
        doctor_id as "doctorId", 
        date, 
        time_slot as "timeSlot", 
        queue_number as "queueNumber", 
        status, 
        created_at as "createdAt"
      FROM appointments 
      WHERE (
        doctor_id = $1 
        OR doctor_id = $2 
        OR LOWER(doctor_name) = LOWER($3)
        OR LOWER(doctor_name) LIKE LOWER($4)
      ) 
      AND (date = $5 OR $5 IS NULL OR $5 = '')
      AND LOWER(status) != 'cancelled'
      ORDER BY queue_number ASC`,
      [cleanDocId, cleanDocId.replace('user-doc-', 'doc-'), doctorName || '', `%${cleanDocName}%`, cleanDate]
    );

    const activeList = queueRes.rows;
    const totalBooked = activeList.length;

    // 2. Find currently active token (in_consultation or called or highest completed)
    const inConsultation = activeList.find(a => ['in_consultation', 'called'].includes((a.status || '').toLowerCase()));
    const completedList = activeList.filter(a => (a.status || '').toLowerCase() === 'completed');
    const lastCompleted = completedList[completedList.length - 1];

    const currentTokenNumber = inConsultation 
      ? (inConsultation.queueNumber || 1)
      : (lastCompleted ? lastCompleted.queueNumber : (activeList[0]?.queueNumber || 1));

    // 3. Find the caller's specific appointment
    let myApt = null;
    if (appointmentId) {
      myApt = activeList.find(a => a.id === appointmentId);
    }
    if (!myApt && authUserId) {
      myApt = activeList.find(a => a.userId === authUserId);
    }
    if (!myApt && activeList.length > 0) {
      // Fallback to latest booking in this session
      myApt = activeList[activeList.length - 1];
    }

    const yourTokenNumber = myApt ? (myApt.queueNumber || 1) : totalBooked;
    const myStatus = myApt ? (myApt.status || 'waiting').toLowerCase() : 'waiting';

    // 4. Calculate patientsAhead (count of active waiting/in_consultation appointments with queueNumber < yourTokenNumber)
    const patientsAhead = activeList.filter(a => {
      const aToken = a.queueNumber || 0;
      const aStatus = (a.status || '').toLowerCase();
      return aToken < yourTokenNumber && ['waiting', 'booked', 'upcoming', 'in_consultation', 'called'].includes(aStatus);
    }).length;

    const estimatedWaitMinutes = patientsAhead * 10;
    const estimatedWaitTime = patientsAhead > 0 ? `~${estimatedWaitMinutes} minutes` : 'Immediate (~2 mins)';

    res.json({
      success: true,
      totalBooked,
      currentToken: currentTokenNumber,
      yourToken: yourTokenNumber,
      patientsAhead,
      status: myStatus,
      estimatedWaitTime,
      queueStatus: {
        totalBooked,
        currentToken: currentTokenNumber,
        yourToken: yourTokenNumber,
        patientsAhead,
        status: myStatus,
        estimatedWaitTime,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const cleanStatus = status.toLowerCase();

    // Fetch existing appointment info
    const existingRes = await query(`SELECT doctor_id, doctor_name, date FROM appointments WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const apt = existingRes.rows[0];

    // Update target appointment status
    await query(`UPDATE appointments SET status = $1 WHERE id = $2`, [cleanStatus, id]);

    // If status changed to COMPLETED, auto advance next WAITING patient to IN_CONSULTATION
    if (cleanStatus === 'completed' || cleanStatus === 'completed') {
      const nextRes = await query(
        `SELECT id FROM appointments 
         WHERE (doctor_id = $1 OR doctor_name = $2) AND (date = $3 OR $3 IS NULL OR $3 = '') AND status = 'waiting'
         ORDER BY created_at ASC LIMIT 1`,
        [apt.doctor_id || '', apt.doctor_name || '', apt.date || '']
      );

      if (nextRes.rows.length > 0) {
        await query(`UPDATE appointments SET status = 'in_consultation' WHERE id = $1`, [nextRes.rows[0].id]);
      }
    }

    res.json({
      success: true,
      message: `Appointment status updated to ${cleanStatus.toUpperCase()}`,
      status: cleanStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


