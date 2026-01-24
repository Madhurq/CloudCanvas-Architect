import pool from '../config/database.js';

// Base schema creation
const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  organization VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  provider VARCHAR(50),
  provider_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT email_or_provider CHECK (email IS NOT NULL OR provider_id IS NOT NULL)
);
`;

// Alterations for existing installations
const alterations = `
-- Add Firebase columns to existing users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) UNIQUE;

-- Make password_hash nullable for Firebase users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    
    // Run schema creation first
    await client.query(schema);
    
    // Run alterations for existing tables
    await client.query(alterations);
    
    console.log(' Database migrations completed successfully');
  } catch (error) {
    console.error(' Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
