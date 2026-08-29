import { query } from './index.js';

async function resetUsers() {
  try {
    await query("DELETE FROM users WHERE id NOT IN ('user-patient-1', 'user-doc-1', 'user-hosp-1', 'user-admin-1')");
    console.log(`[DATABASE RESET SUCCESS] Deleted custom registered users from database!`);
    const countRes = await query("SELECT count(*) as total FROM users");
    const count = countRes.rows[0]?.total ?? countRes.rows[0]?.count ?? Object.values(countRes.rows[0] || {})[0];
    console.log(`[DATABASE STATE] Total remaining core demo users in database: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting database users:', err);
    process.exit(1);
  }
}

resetUsers();

