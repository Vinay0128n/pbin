const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  try {
    // Drop existing table if it exists
    await pool.query('DROP TABLE IF EXISTS pastes');
    console.log('Dropped existing pastes table');

    // Create new table with correct schema
    await pool.query(`
      CREATE TABLE pastes (
        id UUID PRIMARY KEY,
        content TEXT NOT NULL,
        expires_at TIMESTAMP,
        max_views INTEGER,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created pastes table with correct schema');

    // Verify table structure
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'pastes'
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.column_default || ''}`);
    });

    await pool.end();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
