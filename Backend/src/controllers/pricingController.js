import pool from '../config/database.js';
import logger from '../config/logger.js';
import { formatResponse } from '../utils/helpers.js';

export const getPricingData = async (req, res) => {
  const { region, service } = req.query;

  try {
    let query = 'SELECT service_id, region, pricing_data FROM pricing_cache WHERE 1=1';
    const params = [];

    if (region) {
      query += ` AND region = $${params.length + 1}`;
      params.push(region);
    }

    if (service) {
      query += ` AND service_id = $${params.length + 1}`;
      params.push(service);
    }

    const result = await pool.query(query, params);
    const pricingData = result.rows.map(row => ({
      serviceId: row.service_id,
      region: row.region,
      pricing: JSON.parse(row.pricing_data),
    }));

    res.json(formatResponse(true, { pricing: pricingData }));
  } catch (error) {
    logger.error('Get pricing error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch pricing'));
  }
};

export const syncPricingData = async (req, res) => {
  // This would call AWS Pricing API and update the cache
  // Implementation depends on AWS SDK integration
  try {
    logger.info('Pricing sync started');
    res.json(formatResponse(true, { message: 'Pricing sync in progress' }));
  } catch (error) {
    logger.error('Pricing sync error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to sync pricing'));
  }
};
