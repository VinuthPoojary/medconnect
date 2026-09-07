import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db/index.js';

/**
 * Clean hospital name to generate a readable application login email
 * Example:
 * "KMC Hospital Attavar & Jyothi" -> "kmchospital@medconnectkaravali.com"
 * "AJ Hospital & Research Centre" -> "ajhospital@medconnectkaravali.com"
 */
function generateBaseSlug(hospitalName) {
  const normalized = (hospitalName || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // Extract first 2-3 significant words for concise readable email slug
  const words = normalized.split(/\s+/).filter(Boolean);
  let slug = '';
  
  if (words.length >= 2 && words[1] === 'hospital') {
    slug = `${words[0]}hospital`;
  } else if (words.includes('hospital')) {
    const hospIdx = words.indexOf('hospital');
    slug = words.slice(0, hospIdx + 1).join('');
  } else {
    slug = words.slice(0, 2).join('');
  }

  // Fallback if slug is too short
  if (!slug || slug.length < 3) {
    slug = normalized.replace(/\s+/g, '').substring(0, 15) || 'hospital';
  }

  return slug;
}

/**
 * Generate a secure temporary password
 * e.g. "MedKaravali#8419!"
 */
function generateTempPassword() {
  const randomNum = crypto.randomInt(1000, 9999);
  return `MedKaravali#${randomNum}!`;
}

export async function generateHospitalLogins() {
  console.log('\n🏥 ========================================================');
  console.log('   MEDCONNECT KARAVALI - HOSPITAL CREDENTIALS GENERATOR');
  console.log('========================================================\n');

  try {
    // 1. Fetch all existing hospitals from database
    const hospitalsRes = await query('SELECT * FROM hospitals ORDER BY id ASC');
    const hospitals = hospitalsRes.rows;

    if (!hospitals || hospitals.length === 0) {
      console.log('⚠️  No hospitals found in the database.');
      return;
    }

    console.log(`📋 Found ${hospitals.length} hospitals in the database. Processing...\n`);

    const report = [];
    const usedEmails = new Set();

    // Collect all existing emails across users & hospitals to avoid collisions
    const existingUsers = await query('SELECT email FROM users WHERE email IS NOT NULL');
    existingUsers.rows.forEach(r => usedEmails.add(r.email.toLowerCase()));

    const existingHosps = await query('SELECT email FROM hospitals WHERE email IS NOT NULL');
    existingHosps.rows.forEach(r => usedEmails.add(r.email.toLowerCase()));

    for (const hosp of hospitals) {
      // Check if hospital already has credentials
      const linkedUserRes = await query(
        "SELECT * FROM users WHERE (hospital_id = $1 OR id = $2) AND role = 'hospital' LIMIT 1",
        [hosp.id, `user-${hosp.id}`]
      );
      const linkedUser = linkedUserRes.rows[0];

      if (hosp.email && hosp.password_hash) {
        // Ensure users table is in sync with hospital
        const userId = `user-${hosp.id}`;
        const avatar = hosp.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').toUpperCase().substring(0, 3) || 'HC';
        if (!linkedUser) {
          await query(
            `INSERT INTO users (id, name, email, phone, password_hash, role, hospital_id, hospital_name, login_enabled, avatar)
             VALUES ($1, $2, $3, $4, $5, 'hospital', $6, $7, 1, $8)`,
            [userId, hosp.name, hosp.email, hosp.phone || '+91 824 200 0000', hosp.password_hash, hosp.id, hosp.name, avatar]
          );
        }
        report.push({
          'Hospital ID': hosp.id,
          'Hospital Name': hosp.name,
          'Hospital Email': hosp.email,
          'Temporary Password': '*** [PRESERVED / ALREADY ACTIVE] ***',
          'Login Status': 'SKIPPED (Already Active)',
        });
        continue;
      }

      // Generate unique email slug
      const baseSlug = generateBaseSlug(hosp.name);
      let emailCandidate = `${baseSlug}@medconnectkaravali.com`;
      let counter = 2;

      while (usedEmails.has(emailCandidate.toLowerCase())) {
        const suffix = String(counter).padStart(3, '0');
        emailCandidate = `${baseSlug}-${suffix}@medconnectkaravali.com`;
        counter++;
      }

      usedEmails.add(emailCandidate.toLowerCase());

      // Generate secure temporary password
      const tempPassword = generateTempPassword();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      // Save credentials to hospitals table
      await query(
        `UPDATE hospitals 
         SET email = $1, password_hash = $2, login_enabled = 1 
         WHERE id = $3`,
        [emailCandidate, passwordHash, hosp.id]
      );

      // Save/link authentication identity in users table
      const userId = `user-${hosp.id}`;
      const avatar = hosp.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').toUpperCase().substring(0, 3) || 'HC';

      // Check if user record with this ID exists
      const existingUserById = await query('SELECT id FROM users WHERE id = $1', [userId]);

      if (existingUserById.rows.length > 0) {
        await query(
          `UPDATE users 
           SET email = $1, password_hash = $2, role = 'hospital', hospital_id = $3, hospital_name = $4, login_enabled = 1, avatar = $5
           WHERE id = $6`,
          [emailCandidate, passwordHash, hosp.id, hosp.name, avatar, userId]
        );
      } else {
        await query(
          `INSERT INTO users (id, name, email, phone, password_hash, role, hospital_id, hospital_name, login_enabled, avatar)
           VALUES ($1, $2, $3, $4, $5, 'hospital', $6, $7, 1, $8)`,
          [userId, hosp.name, emailCandidate, hosp.phone || '+91 824 200 0000', passwordHash, hosp.id, hosp.name, avatar]
        );
      }

      report.push({
        'Hospital ID': hosp.id,
        'Hospital Name': hosp.name,
        'Hospital Email': emailCandidate,
        'Temporary Password': tempPassword,
        'Login Status': 'CREATED (Active)',
      });
    }

    // Print readable credential report table
    console.table(report);

    console.log('\n🔒 ========================================================');
    console.log('   IMPORTANT SECURITY NOTICE:');
    console.log('   • Temporary passwords are shown ONCE in this console report.');
    console.log('   • Only the bcrypt password hash is saved in the database.');
    console.log('   • Hospital admins can use these credentials at /hospital/login.');
    console.log('========================================================\n');

  } catch (error) {
    console.error('❌ Failed to generate hospital logins:', error);
    throw error;
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.includes('generateHospitalLogins.js')) {
  generateHospitalLogins().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}
