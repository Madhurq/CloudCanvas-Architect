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

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id SERIAL PRIMARY KEY,
  architecture_id INTEGER REFERENCES architectures(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  aws_region VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  cloudformation_stack_id VARCHAR(500),
  cloudformation_template TEXT NOT NULL,
  error_message TEXT,
  estimated_cost NUMERIC(12,2),
  deployed_resources TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  architecture_id INTEGER REFERENCES architectures(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  price NUMERIC(10,2) DEFAULT 0,
  preview_image TEXT,
  tags TEXT[],
  downloads INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(architecture_id)
);

-- Marketplace purchases table
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  price_paid NUMERIC(10,2) NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, buyer_id)
);

-- Marketplace reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(listing_id, user_id)
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

-- Add deployment columns if needed
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12,2);
ALTER TABLE deployments ADD COLUMN IF NOT EXISTS deployed_resources TEXT;
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
