import bcryptjs from 'bcryptjs';
import pool from '../config/database.js';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database with initial data...');

    // Create demo user
    const hashedPassword = await bcryptjs.hash('demo123456', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, organization, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['demo@cloudcanvas.io', hashedPassword, 'Demo', 'User', 'CloudCanvas Demo', 'user']
    );

    // Seed sample template architectures
    const demoUserResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@cloudcanvas.io']
    );

    if (demoUserResult.rows.length > 0) {
      const userId = demoUserResult.rows[0].id;

      // Simple 3-tier architecture template
      await client.query(
        `INSERT INTO architectures (user_id, name, description, nodes, edges, is_template, template_category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          userId,
          '3-Tier Web Application',
          'Classic load-balanced web application with database',
          JSON.stringify([
            { id: '1', data: { label: 'ALB' }, position: { x: 0, y: 0 } },
            { id: '2', data: { label: 'EC2 Servers' }, position: { x: 100, y: 100 } },
            { id: '3', data: { label: 'RDS Database' }, position: { x: 200, y: 0 } },
          ]),
          JSON.stringify([
            { source: '1', target: '2' },
            { source: '2', target: '3' },
          ]),
          true,
          'Web Application',
        ]
      );
    }

    console.log('✓ Database seeding completed successfully');
  } catch (error) {
    console.error('✗ Seeding failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
