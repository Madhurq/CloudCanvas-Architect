import { fetchServicePricing } from './awsPricingService';
import { DATA_TRANSFER_PRICES } from '../data/pricingData';

/**
 * Data Transfer Pricing Service
 * Hardcoded region-specific inter-region and internet egress rates
 * Based on AWS public pricing documentation (Jan 2026)
 */

// Inter-region data transfer rates (USD/GB) - from source region perspective
// Format: fromRegion -> { toRegion: ratePerGB }
const INTER_REGION_RATES = {
  'us-east-1': {
    'us-west-2': 0.02,
    'eu-west-1': 0.02,
    'eu-central-1': 0.02,
    'ap-southeast-1': 0.02,
    'ap-northeast-1': 0.02,
  },
  'us-west-2': {
    'us-east-1': 0.02,
    'eu-west-1': 0.02,
    'eu-central-1': 0.02,
    'ap-southeast-1': 0.02,
    'ap-northeast-1': 0.02,
  },
  'eu-west-1': {
    'us-east-1': 0.02,
    'us-west-2': 0.02,
    'eu-central-1': 0.01,
    'ap-southeast-1': 0.02,
    'ap-northeast-1': 0.02,
  },
  'eu-central-1': {
    'us-east-1': 0.02,
    'us-west-2': 0.02,
    'eu-west-1': 0.01,
    'ap-southeast-1': 0.02,
    'ap-northeast-1': 0.02,
  },
  'ap-southeast-1': {
    'us-east-1': 0.02,
    'us-west-2': 0.02,
    'eu-west-1': 0.02,
    'eu-central-1': 0.02,
    'ap-northeast-1': 0.01,
  },
  'ap-northeast-1': {
    'us-east-1': 0.02,
    'us-west-2': 0.02,
    'eu-west-1': 0.02,
    'eu-central-1': 0.02,
    'ap-southeast-1': 0.01,
  },
};

// Internet egress rates (USD/GB) by region and volume tier
const INTERNET_EGRESS_RATES = {
  'us-east-1': {
    first10TB: 0.09,      // 0–10 TB
    tenTo50TB: 0.085,     // 10–50 TB
    over50TB: 0.08,       // 50+ TB
  },
  'us-west-2': {
    first10TB: 0.09,
    tenTo50TB: 0.085,
    over50TB: 0.08,
  },
  'eu-west-1': {
    first10TB: 0.09,
    tenTo50TB: 0.085,
    over50TB: 0.08,
  },
  'eu-central-1': {
    first10TB: 0.09,
    tenTo50TB: 0.085,
    over50TB: 0.08,
  },
  'ap-southeast-1': {
    first10TB: 0.12,      // Asia-Pacific higher rates
    tenTo50TB: 0.115,
    over50TB: 0.11,
  },
  'ap-northeast-1': {
    first10TB: 0.12,
    tenTo50TB: 0.115,
    over50TB: 0.11,
  },
};

/**
 * Get inter-region rate (USD/GB)
 * @param {string} fromRegion - Source region
 * @param {string} toRegion - Destination region
 * @returns {number} Rate in USD/GB
 */
export function getInterRegionRateSync(fromRegion, toRegion) {
  if (fromRegion === toRegion) return 0; // Intra-region is free
  return INTER_REGION_RATES[fromRegion]?.[toRegion] ?? 0.02; // Default to $0.02/GB if not found
}

/**
 * Get internet egress rate (USD/GB) based on volume tier
 * @param {string} region - Source region
 * @param {number} bandwidthGB - Total bandwidth in GB/month
 * @returns {number} Rate in USD/GB
 */
export function getInternetEgressRateSync(region, bandwidthGB) {
  const tiers = INTERNET_EGRESS_RATES[region] ?? INTERNET_EGRESS_RATES['us-east-1'];

  if (bandwidthGB <= 10240) return tiers.first10TB;     // First 10 TB = 10,240 GB
  if (bandwidthGB <= 51200) return tiers.tenTo50TB;     // 10–50 TB = 51,200 GB
  return tiers.over50TB;                                 // Over 50 TB
}

/**
 * Dummy prefetch for backward compatibility (no-op since data is hardcoded)
 */
export async function prefetchDataTransferRates(region = 'us-east-1') {
  return { interRegionRates: INTER_REGION_RATES[region] || {}, internetEgressTiers: INTERNET_EGRESS_RATES[region] || {} };
}
