import pool from '../config/database.js';
import logger from '../config/logger.js';
import admin, { firebaseInitialized } from '../config/firebaseAdmin.js';
import { hashPassword, verifyPassword, generateTokens, formatResponse } from '../utils/helpers.js';

export const register = async (req, res) => {
  const { email, password, firstName, lastName, organization } = req.body;

  try {
    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json(formatResponse(false, null, 'User already exists'));
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, organization)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, organization`,
      [email, passwordHash, firstName, lastName, organization]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, $2, $3)',
      [user.id, 'USER_REGISTERED', 'users']
    );

    logger.info(`User registered: ${email}`);
    res.status(201).json(formatResponse(true, { user, accessToken, refreshToken }));
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json(formatResponse(false, null, 'Registration failed'));
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json(formatResponse(false, null, 'Invalid credentials'));
    }

    const user = result.rows[0];
    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json(formatResponse(false, null, 'Invalid credentials'));
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, $2, $3)',
      [user.id, 'USER_LOGIN', 'users']
    );

    const { accessToken, refreshToken } = generateTokens(user.id);
    logger.info(`User logged in: ${email}`);

    res.json(formatResponse(true, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      accessToken,
      refreshToken,
    }));
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json(formatResponse(false, null, 'Login failed'));
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    res.json(formatResponse(true, { accessToken, refreshToken: newRefreshToken }));
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json(formatResponse(false, null, 'Invalid refresh token'));
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, organization, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'User not found'));
    }

    const user = result.rows[0];
    res.json(formatResponse(true, { user }));
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch profile'));
  }
};

// Sync a Firebase-authenticated user into Supabase (users table)
// Expects: { idToken }
export const syncFirebaseUser = async (req, res) => {
  const { idToken } = req.body;
  
  // Initialize variables outside try so catch can see them
  let email = null;
  let uid = null;

  if (!idToken) return res.status(400).json(formatResponse(false, null, 'Missing idToken'));

  try {
    if (!firebaseInitialized) {
      return res.status(503).json(formatResponse(false, null, 'Firebase auth not configured.'));
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email || null;

    logger.info(`Attempting sync for: ${email || uid}`);

    const syncQuery = `
      INSERT INTO users (email, provider, provider_id)
      VALUES ($1, 'FIREBASE', $2)
      ON CONFLICT (email) 
      DO UPDATE SET 
        provider_id = EXCLUDED.provider_id,
        provider = EXCLUDED.provider,
        last_login = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await pool.query(syncQuery, [email, uid]);
    return res.json(formatResponse(true, { user: result.rows[0] }));

  } catch (error) {
    // If we hit a unique constraint error (23505), just fetch the user that Request #1 just created
    if (error.code === '23505') {
      logger.warn(`Conflict detected for ${email}, recovering...`);
      try {
        const recovery = await pool.query(
          'SELECT * FROM users WHERE email = $1 OR provider_id = $2', 
          [email, uid]
        );
        if (recovery.rows.length > 0) {
          return res.json(formatResponse(true, { user: recovery.rows[0] }));
        }
      } catch (recoveryError) {
        logger.error('Recovery fetch failed:', recoveryError);
      }
    }

    logger.error(`Firebase sync error: ${error.message}`);
    return res.status(401).json(formatResponse(false, null, 'Firebase sync failed'));
  }
};
