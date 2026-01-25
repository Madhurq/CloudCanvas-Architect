import pool from '../config/database.js';
import logger from '../config/logger.js';
import { formatResponse } from '../utils/helpers.js';

export const createArchitecture = async (req, res) => {
  const { name, description, nodes, edges, region, pricingModel } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO architectures (user_id, name, description, nodes, edges, region, pricing_model)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, name, description, nodes, edges, region, pricing_model, created_at`,
      [userId, name, description, JSON.stringify(nodes), JSON.stringify(edges), region, pricingModel]
    );

    const architecture = result.rows[0];

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'ARCHITECTURE_CREATED', 'architectures', architecture.id, JSON.stringify({ name })]
    );

    logger.info(`Architecture created: ${architecture.id} by user ${userId}`);
    res.status(201).json(formatResponse(true, { architecture }));
  } catch (error) {
    logger.error('Create architecture error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to create architecture'));
  }
};

export const getArchitectures = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT id, name, description, nodes, edges, region, pricing_model, estimated_monthly_cost, created_at, updated_at
       FROM architectures
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    const architectures = result.rows.map(arch => ({
      ...arch,
      nodes: typeof arch.nodes === 'string' ? JSON.parse(arch.nodes) : arch.nodes,
      edges: typeof arch.edges === 'string' ? JSON.parse(arch.edges) : arch.edges,
    }));

    res.json(formatResponse(true, { architectures }));
  } catch (error) {
    logger.error('Get architectures error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch architectures'));
  }
};

export const getArchitecture = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT id, user_id, name, description, nodes, edges, region, pricing_model, estimated_monthly_cost, is_public, created_at, updated_at
       FROM architectures
       WHERE id = $1 AND (user_id = $2 OR is_public = true)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Architecture not found'));
    }

    const architecture = result.rows[0];
    architecture.nodes = typeof architecture.nodes === 'string' ? JSON.parse(architecture.nodes) : architecture.nodes;
    architecture.edges = typeof architecture.edges === 'string' ? JSON.parse(architecture.edges) : architecture.edges;

    res.json(formatResponse(true, { architecture }));
  } catch (error) {
    logger.error('Get architecture error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch architecture'));
  }
};

export const updateArchitecture = async (req, res) => {
  const { id } = req.params;
  const { name, description, nodes, edges, region, pricingModel, estimatedMonthlyCost } = req.body;
  const userId = req.user.userId;

  try {
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM architectures WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Architecture not found'));
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json(formatResponse(false, null, 'Unauthorized'));
    }

    const result = await pool.query(
      `UPDATE architectures
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           nodes = COALESCE($4, nodes),
           edges = COALESCE($5, edges),
           region = COALESCE($6, region),
           pricing_model = COALESCE($7, pricing_model),
           estimated_monthly_cost = COALESCE($8, estimated_monthly_cost),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, description, nodes, edges, region, pricing_model, estimated_monthly_cost, updated_at`,
      [id, name, description, nodes ? JSON.stringify(nodes) : null, edges ? JSON.stringify(edges) : null, region, pricingModel, estimatedMonthlyCost]
    );

    const architecture = result.rows[0];

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'ARCHITECTURE_UPDATED', 'architectures', id]
    );

    logger.info(`Architecture updated: ${id}`);
    res.json(formatResponse(true, { architecture }));
  } catch (error) {
    logger.error('Update architecture error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to update architecture'));
  }
};

export const deleteArchitecture = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM architectures WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Architecture not found'));
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json(formatResponse(false, null, 'Unauthorized'));
    }

    await pool.query('DELETE FROM architectures WHERE id = $1', [id]);

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'ARCHITECTURE_DELETED', 'architectures', id]
    );

    logger.info(`Architecture deleted: ${id}`);
    res.json(formatResponse(true, { message: 'Architecture deleted' }));
  } catch (error) {
    logger.error('Delete architecture error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to delete architecture'));
  }
};
