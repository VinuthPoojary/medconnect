import { query } from '../db/index.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;
    if (!userId) {
      return res.json({ success: true, notifications: [] });
    }

    const result = await query(
      `SELECT id, user_id as "userId", title, message, category, timestamp, read, created_at as "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE notifications SET read = true WHERE id = $1', [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM notifications WHERE id = $1', [id]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
