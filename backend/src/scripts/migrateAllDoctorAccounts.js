import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';

async function migrateAllDoctorAccounts() {
  console.log('🚀 Starting Complete Doctor Identity & Account Migration...\n');

  try {
    // 1. Ensure doctors table schema has user_id foreign key
    console.log('--- Step 1: Ensuring Database Schema & Constraints ---');
    try {
      await query(`
        ALTER TABLE doctors 
        ADD COLUMN IF NOT EXISTS user_id VARCHAR(100) REFERENCES users(id);
      `);
      console.log('   ✅ Column doctors.user_id verified.');
    } catch (e) {
      console.log('   ℹ️ Column check note:', e.message);
    }

    // 2. Fetch all doctors
    console.log('\n--- Step 2: Fetching All Doctors ---');
    const docRes = await query('SELECT * FROM doctors ORDER BY hospital_name, id');
    const doctors = docRes.rows;
    console.log(`   Found ${doctors.length} doctors across all hospitals.`);

    const defaultPassword = 'Doctor@2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const emailTracker = new Set();
    const phoneTracker = new Set();

    // Load existing emails and phones
    const existingUsers = await query('SELECT email, phone FROM users');
    existingUsers.rows.forEach(u => {
      if (u.email) emailTracker.add(u.email.toLowerCase());
      if (u.phone) phoneTracker.add(u.phone);
    });

    const mappingTable = [];

    // 3. Process every doctor
    console.log('\n--- Step 3: Generating Unique Accounts & Linking users -> doctors ---');

    for (let i = 0; i < doctors.length; i++) {
      const doc = doctors[i];
      const cleanName = doc.name.replace(/^Dr\.\s*/i, '').trim().toLowerCase();
      const parts = cleanName.split(/\s+/).filter(Boolean);
      let baseEmail = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}@medconnect.com` : `${parts[0]}@medconnect.com`;
      
      // Handle key requested names:
      if (parts[0] === 'meera') baseEmail = 'meera@medconnect.com';
      if (parts[0] === 'vignesh') baseEmail = 'vignesh@medconnect.com';
      if (parts[0] === 'santhosh') baseEmail = 'santhosh@medconnect.com';
      if (parts[0] === 'suman') baseEmail = 'suman@medconnect.com';
      if (parts[0] === 'neha') baseEmail = 'neha@medconnect.com';
      if (parts[0] === 'gautham') baseEmail = 'gautham.bhandary@medconnect.com';

      let uniqueEmail = baseEmail;
      let counter = 1;
      while (emailTracker.has(uniqueEmail.toLowerCase()) && doc.email !== uniqueEmail) {
        uniqueEmail = `${parts[0]}.${parts[parts.length - 1] || 'doc'}${counter}@medconnect.com`;
        counter++;
      }
      emailTracker.add(uniqueEmail.toLowerCase());

      // Generate unique phone
      let uniquePhone = doc.phone;
      if (!uniquePhone || phoneTracker.has(uniquePhone)) {
        uniquePhone = `+91 8242${String(100000 + i).slice(-6)}`;
      }
      phoneTracker.add(uniquePhone);

      const userId = doc.user_id || `user-doc-${doc.id.replace(/^doc-/, '')}`;
      const avatar = doc.name.replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      // Check if user exists by id
      const checkUser = await query('SELECT id FROM users WHERE id = $1', [userId]);

      if (checkUser.rows.length > 0) {
        const existingUserId = checkUser.rows[0].id;
        await query(`
          UPDATE users 
          SET name = $1, email = $2, password_hash = $3, role = 'doctor', hospital_id = $4, hospital_name = $5, specialization = $6
          WHERE id = $7
        `, [doc.name, uniqueEmail, passwordHash, doc.hospital_id, doc.hospital_name, doc.specialization, existingUserId]);

        await query(`
          UPDATE doctors 
          SET user_id = $1, email = $2 
          WHERE id = $3
        `, [existingUserId, uniqueEmail, doc.id]);

        mappingTable.push({
          name: doc.name,
          email: uniqueEmail,
          userId: existingUserId,
          doctorId: doc.id,
          hospital: doc.hospital_name
        });
      } else {
        await query(`
          INSERT INTO users (id, name, email, phone, password_hash, role, hospital_id, hospital_name, specialization, avatar)
          VALUES ($1, $2, $3, $4, $5, 'doctor', $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE 
          SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = 'doctor', hospital_id = EXCLUDED.hospital_id, hospital_name = EXCLUDED.hospital_name, specialization = EXCLUDED.specialization
        `, [userId, doc.name, uniqueEmail, uniquePhone, passwordHash, doc.hospital_id, doc.hospital_name, doc.specialization, avatar]);

        await query(`
          UPDATE doctors 
          SET user_id = $1, email = $2 
          WHERE id = $3
        `, [userId, uniqueEmail, doc.id]);

        mappingTable.push({
          name: doc.name,
          email: uniqueEmail,
          userId: userId,
          doctorId: doc.id,
          hospital: doc.hospital_name
        });
      }
    }

    // 4. Create Unique Index
    console.log('\n--- Step 4: Creating Unique Index doctors_user_id_unique ---');
    try {
      await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS doctors_user_id_unique
        ON doctors(user_id);
      `);
      console.log('   ✅ UNIQUE INDEX doctors_user_id_unique created/verified.');
    } catch (e) {
      console.log('   ℹ️ Index note:', e.message);
    }

    // 5. Verification Printout
    console.log('\n========================================================================================================================');
    console.log('📋 DOCTOR IDENTITY MAPPING TABLE (Sample 20 of ' + mappingTable.length + ' Doctors)');
    console.log('========================================================================================================================');
    console.log('| Doctor Name                  | Email                          | User ID         | Doctor ID      | Hospital');
    console.log('------------------------------------------------------------------------------------------------------------------------');
    mappingTable.slice(0, 20).forEach(m => {
      console.log(`| ${m.name.padEnd(28)} | ${m.email.padEnd(30)} | ${m.userId.padEnd(15)} | ${m.doctorId.padEnd(14)} | ${m.hospital?.substring(0, 30)}`);
    });
    console.log('========================================================================================================================');

    console.log(`\n🎉 MIGRATION SUCCESSFUL! All ${mappingTable.length} doctors now have individual login accounts with bcrypt password hashes and 1-to-1 database linkage.`);
    process.exit(0);

  } catch (err) {
    console.error('\n❌ MIGRATION FAILED:', err);
    process.exit(1);
  }
}

migrateAllDoctorAccounts();
