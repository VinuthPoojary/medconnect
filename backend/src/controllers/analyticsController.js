import { query } from '../db/index.js';

export const getHospitalAnalytics = async (req, res) => {
  try {
    const aptCount = await query('SELECT COUNT(*) as count FROM appointments');
    const docCount = await query('SELECT COUNT(*) as count FROM doctors');
    const hospCount = await query('SELECT COUNT(*) as count FROM hospitals');
    const bedCount = await query('SELECT SUM(beds_available) as total_beds FROM hospitals');

    res.json({
      success: true,
      analytics: {
        totalAppointments: parseInt(aptCount.rows[0]?.count || 0, 10),
        activeDoctors: parseInt(docCount.rows[0]?.count || 0, 10),
        partnerHospitals: parseInt(hospCount.rows[0]?.count || 0, 10),
        bedsAvailable: parseInt(bedCount.rows[0]?.total_beds || 45, 10),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const userCount = await query("SELECT COUNT(*) as count FROM users WHERE role = 'patient'");
    const docCount = await query('SELECT COUNT(*) as count FROM doctors');
    const hospCount = await query('SELECT COUNT(*) as count FROM hospitals WHERE approved = true');
    const pendingHosp = await query('SELECT COUNT(*) as count FROM hospitals WHERE approved = false');
    const aptCount = await query('SELECT COUNT(*) as count FROM appointments');

    res.json({
      success: true,
      analytics: {
        registeredPatients: parseInt(userCount.rows[0]?.count || 0, 10),
        verifiedDoctors: parseInt(docCount.rows[0]?.count || 0, 10),
        approvedHospitals: parseInt(hospCount.rows[0]?.count || 0, 10),
        pendingApprovals: parseInt(pendingHosp.rows[0]?.count || 0, 10),
        totalConsultations: parseInt(aptCount.rows[0]?.count || 0, 10),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
