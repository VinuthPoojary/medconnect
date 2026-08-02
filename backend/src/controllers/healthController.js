import { query } from '../db/index.js';

export const checkHealth = async (req, res) => {
  try {
    await query('SELECT 1 as ok');
    res.json({
      status: 'online',
      message: 'MedConnect Karavali Express Server Operational',
      database: {
        connected: true,
        status: 'Active',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'degraded',
      message: 'Server online but database connection failed.',
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
};

