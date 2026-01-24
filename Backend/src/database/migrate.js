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

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  changes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Architectures table
CREATE TABLE IF NOT EXISTS architectures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nodes TEXT NOT NULL,
  edges TEXT NOT NULL,
  region VARCHAR(100) NOT NULL,
  pricing_model VARCHAR(100) NOT NULL,
  estimated_monthly_cost NUMERIC(12,2),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing cache table
CREATE TABLE IF NOT EXISTS pricing_cache (
  service_id VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  pricing_data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (service_id, region)
);
`;

// Alterations for existing installations
const alterations = `
-- Add Firebase columns to existing users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) UNIQUE;

-- Make password_hash nullable for Firebase users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add missing columns to architectures if needed
ALTER TABLE architectures ADD COLUMN IF NOT EXISTS estimated_monthly_cost NUMERIC(12,2);
ALTER TABLE architectures ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE architectures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
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
