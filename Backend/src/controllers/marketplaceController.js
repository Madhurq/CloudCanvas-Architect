import pool from '../config/database.js';
import logger from '../config/logger.js';
import { formatResponse } from '../utils/helpers.js';

// Get all marketplace listings (public)
export const getMarketplaceListings = async (req, res) => {
  const { category, search, sortBy = 'created_at', order = 'DESC', limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT 
        ml.id, ml.title, ml.description, ml.category, ml.price, ml.preview_image,
        ml.tags, ml.downloads, ml.rating, ml.review_count, ml.is_featured,
        ml.created_at, ml.updated_at,
        u.first_name, u.last_name, u.email,
        a.region, a.pricing_model, a.estimated_monthly_cost
      FROM marketplace_listings ml
      JOIN users u ON ml.user_id = u.id
      JOIN architectures a ON ml.architecture_id = a.id
      WHERE ml.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND ml.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (ml.title ILIKE $${paramIndex} OR ml.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    const validSortFields = ['created_at', 'downloads', 'rating', 'price'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ml.${sortField} ${sortOrder}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json(formatResponse(true, { listings: result.rows }));
  } catch (error) {
    logger.error('Get marketplace listings error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch marketplace listings'));
  }
};

// Get single marketplace listing details
export const getMarketplaceListing = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        ml.*, 
        u.first_name, u.last_name, u.email,
        a.nodes, a.edges, a.region, a.pricing_model, a.estimated_monthly_cost
      FROM marketplace_listings ml
      JOIN users u ON ml.user_id = u.id
      JOIN architectures a ON ml.architecture_id = a.id
      WHERE ml.id = $1 AND ml.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Listing not found'));
    }

    const listing = result.rows[0];
    listing.nodes = typeof listing.nodes === 'string' ? JSON.parse(listing.nodes) : listing.nodes;
    listing.edges = typeof listing.edges === 'string' ? JSON.parse(listing.edges) : listing.edges;

    res.json(formatResponse(true, { listing }));
  } catch (error) {
    logger.error('Get marketplace listing error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch listing'));
  }
};

// Publish architecture to marketplace
export const publishToMarketplace = async (req, res) => {
  const { architectureId, title, description, category, price = 0, tags = [] } = req.body;
  const userId = req.user.userId;

  try {
    // Verify architecture ownership
    const archCheck = await pool.query(
      `SELECT id, nodes, edges, region, pricing_model, estimated_monthly_cost
       FROM architectures WHERE id = $1 AND user_id = $2`,
      [architectureId, userId]
    );

    if (archCheck.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Architecture not found or access denied'));
    }

    // Check if already listed
    const existingListing = await pool.query(
      'SELECT id FROM marketplace_listings WHERE architecture_id = $1',
      [architectureId]
    );

    if (existingListing.rows.length > 0) {
      return res.status(409).json(formatResponse(false, null, 'Architecture already published to marketplace'));
    }

    // Create listing
    const archRow = archCheck.rows[0];
    const region = archRow.region || null;
    const archNodes = typeof archRow.nodes === 'string' ? JSON.parse(archRow.nodes) : archRow.nodes;
    const archEdges = typeof archRow.edges === 'string' ? JSON.parse(archRow.edges) : archRow.edges;
    const architectureData = {
      nodes: archNodes || [],
      edges: archEdges || [],
      region: region,
      pricingModel: archRow.pricing_model || null,
      estimated_monthly_cost: archRow.estimated_monthly_cost || null,
    };

    let result;
    try {
      // Attempt insert including architecture_data and region (if present)
      result = await pool.query(`
        INSERT INTO marketplace_listings (
          user_id, architecture_id, title, description, category, price, tags, architecture_data, region
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title, description, category, price, tags, created_at
      `, [
        userId,
        architectureId,
        title,
        description,
        category,
        price,
        tags,
        JSON.stringify(architectureData),
        region,
      ]);
    } catch (err) {
      if (err?.code === '42703') {
        // Fallback if columns do not exist
        result = await pool.query(`
          INSERT INTO marketplace_listings (
            user_id, architecture_id, title, description, category, price, tags
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, title, description, category, price, tags, created_at
        `, [userId, architectureId, title, description, category, price, tags]);
      } else {
        throw err;
      }
    }

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [userId, 'MARKETPLACE_PUBLISH', 'marketplace_listings', result.rows[0].id]
    );

    logger.info(`Architecture ${architectureId} published to marketplace by user ${userId}`);
    res.status(201).json(formatResponse(true, { listing: result.rows[0] }));
  } catch (error) {
    logger.error(`Publish to marketplace error: ${error?.message}`);
    res.status(500).json(formatResponse(false, null, 'Failed to publish to marketplace'));
  }
};

// Update marketplace listing
export const updateMarketplaceListing = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, price, tags, isActive } = req.body;
  const userId = req.user.userId;

  try {
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM marketplace_listings WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Listing not found'));
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json(formatResponse(false, null, 'Unauthorized'));
    }

    const result = await pool.query(`
      UPDATE marketplace_listings
      SET 
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        price = COALESCE($5, price),
        tags = COALESCE($6, tags),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, title, description, category, price, tags, isActive]);

    logger.info(`Marketplace listing ${id} updated`);
    res.json(formatResponse(true, { listing: result.rows[0] }));
  } catch (error) {
    logger.error('Update marketplace listing error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to update listing'));
  }
};

// Delete/unpublish listing
export const deleteMarketplaceListing = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT user_id FROM marketplace_listings WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Listing not found'));
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json(formatResponse(false, null, 'Unauthorized'));
    }

    await pool.query('DELETE FROM marketplace_listings WHERE id = $1', [id]);

    logger.info(`Marketplace listing ${id} deleted`);
    res.json(formatResponse(true, { message: 'Listing removed from marketplace' }));
  } catch (error) {
    logger.error('Delete marketplace listing error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to delete listing'));
  }
};

// Purchase/download architecture from marketplace
export const purchaseFromMarketplace = async (req, res) => {
  const { id } = req.params; // listing id
  const userId = req.user.userId;

  try {
    // Get listing details
    const listingResult = await pool.query(`
      SELECT ml.*, a.nodes, a.edges, a.region, a.pricing_model
      FROM marketplace_listings ml
      JOIN architectures a ON ml.architecture_id = a.id
      WHERE ml.id = $1 AND ml.is_active = true
    `, [id]);

    if (listingResult.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Listing not found'));
    }

    const listing = listingResult.rows[0];

    // Check if already purchased
    const purchaseCheck = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE listing_id = $1 AND buyer_id = $2',
      [id, userId]
    );

    if (purchaseCheck.rows.length > 0) {
      return res.status(409).json(formatResponse(false, null, 'Already purchased'));
    }

    // Record purchase
    await pool.query(`
      INSERT INTO marketplace_purchases (listing_id, buyer_id, price_paid)
      VALUES ($1, $2, $3)
    `, [id, userId, listing.price]);

    // Increment download count
    await pool.query(
      'UPDATE marketplace_listings SET downloads = downloads + 1 WHERE id = $1',
      [id]
    );

    // Return architecture data
    const architectureData = {
      version: '1.0',
      name: listing.title,
      description: listing.description,
      nodes: typeof listing.nodes === 'string' ? JSON.parse(listing.nodes) : listing.nodes,
      edges: typeof listing.edges === 'string' ? JSON.parse(listing.edges) : listing.edges,
      region: listing.region,
      pricingModel: listing.pricing_model,
    };

    logger.info(`User ${userId} purchased listing ${id}`);
    res.json(formatResponse(true, { architecture: architectureData }));
  } catch (error) {
    logger.error('Purchase from marketplace error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to purchase from marketplace'));
  }
};

// Add review to listing
export const addReview = async (req, res) => {
  const { id } = req.params; // listing id
  const { rating, comment } = req.body;
  const userId = req.user.userId;

  try {
    // Verify purchase
    const purchaseCheck = await pool.query(
      'SELECT id FROM marketplace_purchases WHERE listing_id = $1 AND buyer_id = $2',
      [id, userId]
    );

    if (purchaseCheck.rows.length === 0) {
      return res.status(403).json(formatResponse(false, null, 'Must purchase before reviewing'));
    }

    // Insert review
    await pool.query(`
      INSERT INTO marketplace_reviews (listing_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (listing_id, user_id) 
      DO UPDATE SET rating = $3, comment = $4, created_at = CURRENT_TIMESTAMP
    `, [id, userId, rating, comment]);

    // Update listing rating
    const avgResult = await pool.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM marketplace_reviews
      WHERE listing_id = $1
    `, [id]);

    await pool.query(`
      UPDATE marketplace_listings 
      SET rating = $2, review_count = $3 
      WHERE id = $1
    `, [id, avgResult.rows[0].avg_rating, avgResult.rows[0].review_count]);

    logger.info(`User ${userId} reviewed listing ${id}`);
    res.json(formatResponse(true, { message: 'Review added successfully' }));
  } catch (error) {
    logger.error('Add review error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to add review'));
  }
};

// Get user's published listings
export const getMyListings = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(`
      SELECT 
        ml.*, 
        a.estimated_monthly_cost
      FROM marketplace_listings ml
      JOIN architectures a ON ml.architecture_id = a.id
      WHERE ml.user_id = $1
      ORDER BY ml.created_at DESC
    `, [userId]);

    res.json(formatResponse(true, { listings: result.rows }));
  } catch (error) {
    logger.error('Get my listings error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch your listings'));
  }
};
