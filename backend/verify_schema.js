const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'vital_signs'
      ORDER BY ordinal_position;
    `);
    
    console.log('--- Vital Signs Table Columns ---');
    res.rows.forEach(row => {
      console.log('- ' + row.column_name + ': ' + row.data_type);
    });
    console.log('----------------------------------');

    const required = [
      'id', 'patient_id', 'medical_record_id', 'nurse_id',
      'temperature', 'bp_systolic', 'bp_diastolic',
      'heart_rate', 'respiration', 'spo2', 'weight',
      'note', 'created_at'
    ];

    const existing = res.rows.map(r => r.column_name);
    const missing = required.filter(c => !existing.includes(c));

    if (missing.length === 0) {
      console.log('✅ All required columns are present!');
    } else {
      console.error('❌ Missing columns: ' + missing.join(', '));
      process.exit(1);
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();
