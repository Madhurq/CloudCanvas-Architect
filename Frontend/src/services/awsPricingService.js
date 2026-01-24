/**
 * AWS Pricing Service
 * Fetches real-time pricing from AWS Price List API (FREE!)
 * Falls back to cached/static data if API is unavailable
 */

// Cache for pricing data
const priceCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// AWS Price List API base URL (public, no auth required!)
const AWS_PRICING_BASE = 'https://pricing.us-east-1.amazonaws.com';
const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

// Service offer codes
const SERVICE_CODES = {
    ec2: 'AmazonEC2',
    s3: 'AmazonS3',
    rds: 'AmazonRDS',
    ecs: 'AmazonECS',
    elasticache: 'AmazonElastiCache',
    cloudfront: 'AmazonCloudFront',
    elb: 'AWSELB',
    waf: 'awswaf',
    lambda: 'AWSLambda',
    dynamodb: 'AmazonDynamoDB',
    sqs: 'AWSQueueService',
    sns: 'AmazonSNS',
    apigateway: 'AmazonApiGateway',
    route53: 'AmazonRoute53',
    kinesis: 'AmazonKinesis',
    cognito: 'AmazonCognito'
};

// Static fallback prices (used when API is unavailable)
// Regional pricing multipliers based on AWS public pricing
const REGIONAL_MULTIPLIERS = {
    'us-east-1': 1.0,      // Base region
    'us-west-2': 1.0,      // Same as us-east-1 for most services
    'eu-west-1': 1.1,      // ~10% higher
    'eu-central-1': 1.12,  // ~12% higher
    'ap-southeast-1': 1.15, // ~15% higher
    'ap-northeast-1': 1.18, // ~18% higher
};

const FALLBACK_PRICES = {
    ec2: {
        'us-east-1': {
            't3.micro': { linux: 0.0104, windows: 0.0152 },
            't3.small': { linux: 0.0208, windows: 0.0304 },
            't3.medium': { linux: 0.0416, windows: 0.0608 },
            't3.large': { linux: 0.0832, windows: 0.1216 },
            't3.xlarge': { linux: 0.1664, windows: 0.2432 },
            'm5.large': { linux: 0.096, windows: 0.185 },
            'm5.xlarge': { linux: 0.192, windows: 0.37 }
        }
    },
    ebs: {
        'us-east-1': { gp3: 0.08, gp2: 0.10, io1: 0.125 }
    },
    s3: {
        'us-east-1': {
            'STANDARD': 0.023,
            'STANDARD_IA': 0.0125,
            'GLACIER': 0.004,
            'DEEP_ARCHIVE': 0.00099
        }
    },
    s3Requests: { PUT: 0.005, GET: 0.0004 },
    fargate: {
        'us-east-1': { vCPU: 0.04048, memory: 0.004445 }
    },
    rds: {
        'us-east-1': {
            'db.t3.micro': { postgres: 0.018, mysql: 0.017, mariadb: 0.017 },
            'db.t3.small': { postgres: 0.036, mysql: 0.034, mariadb: 0.034 },
            'db.t3.medium': { postgres: 0.072, mysql: 0.068, mariadb: 0.068 },
            'db.t3.large': { postgres: 0.144, mysql: 0.136, mariadb: 0.136 },
            'db.r5.large': { postgres: 0.24, mysql: 0.228, mariadb: 0.228 }
        }
    },
    rdsStorage: { gp2: 0.115, gp3: 0.08, io1: 0.125 },
    alb: {
        'us-east-1': { hourly: 0.0225, lcuHour: 0.008 }
    },
    cloudfront: {
        'us-east-1': {
            dataTransferFirst10TB: 0.085,
            dataTransfer10to50TB: 0.08,
            httpRequests: 0.0075,
            httpsRequests: 0.01
        }
    },
    elasticache: {
        'us-east-1': {
            'cache.t3.micro': 0.017,
            'cache.t3.small': 0.034,
            'cache.t3.medium': 0.068,
            'cache.r5.large': 0.228
        }
    },
    waf: { webACL: 5.00, rule: 1.00, requests: 0.60 },
    dataTransfer: {
        internetEgressFirst10TB: 0.09,
        internetEgress10to50TB: 0.085,
        interRegion: 0.02,
        interAZ: 0.01,
        sameAZPrivate: 0
    },
    // New services pricing
    lambda: {
        requestsPerMillion: 0.20,
        gbSeconds: 0.0000166667,
        freeRequestsPerMonth: 1000000,
        freeGbSecondsPerMonth: 400000
    },
    dynamodb: {
        readUnit: 0.00013,  // per RCU-hour
        writeUnit: 0.00065, // per WCU-hour
        storagePerGB: 0.25,
        onDemandRead: 0.25,   // per million
        onDemandWrite: 1.25   // per million
    },
    sqs: {
        standard: 0.40,  // per million requests
        fifo: 0.50      // per million requests
    },
    sns: {
        publishPer100k: 0.50,
        sqsDeliveryPer100k: 0,
        httpDeliveryPer100k: 0.60,
        emailPer100k: 2.00,
        smsPer100: 0.75
    },
    eventbridge: {
        eventsPerMillion: 1.00,
        customBusPerMillion: 1.00
    },
    apigateway: {
        restPer1M: 3.50,
        httpPer1M: 1.00,
        websocketPer1M: 1.00,
        websocketMessages: 1.00
    },
    route53: {
        hostedZone: 0.50,
        queriesPer1M: 0.40,
        healthCheck: 0.50,
        healthCheckHttps: 0.75
    },
    natGateway: {
        hourly: 0.045,
        perGB: 0.045
    },
    cognito: {
        mauFirst50k: 0.0055,
        mau50kTo100k: 0.0046,
        advancedSecurity: 0.05
    },
    secrets: {
        perSecret: 0.40,
        per10kAPICalls: 0.05
    },
    efs: {
        'STANDARD': 0.30,
        'INFREQUENT_ACCESS': 0.016,
        iaTierAccess: 0.01  // per access
    },
    aurora: {
        'aurora-postgresql': 0.12,  // per ACU-hour
        'aurora-mysql': 0.12,
        storagePerGB: 0.10,
        ioPerMillion: 0.20
    },
    appRunner: {
        vCPUHour: 0.064,
        memoryGBHour: 0.007,
        provisionedVCPU: 0.007,
        provisionedMemory: 0.0007
    },
    kinesis: {
        shardHour: 0.015,
        putPayloadUnit: 0.014,  // per million
        extendedRetention: 0.020
    },
    opensearch: {
        't3.small.search': 0.036,
        't3.medium.search': 0.073,
        'm5.large.search': 0.142,
        'r5.large.search': 0.186,
        storagePerGB: 0.135
    },
    athena: {
        perTBScanned: 5.00
    }
};

/**
 * Get cached data or fetch new data
 */
const getCachedOrFetch = async (key, fetchFn) => {
    const cached = priceCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const data = await fetchFn();
        priceCache.set(key, { data, timestamp: Date.now() });
        return data;
    } catch (error) {
        console.warn(`Failed to fetch pricing for ${key}, using fallback:`, error.message);
        return null;
    }
};

const fetchBackendPricing = async (region) => {
    if (!API_BASE) return null;
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    const url = `${API_BASE}/api/pricing${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Backend pricing HTTP ${response.status}`);
    const payload = await response.json();

    const entries = payload?.data?.pricing;
    if (!Array.isArray(entries)) return null;

    const pricing = entries.reduce((acc, entry) => {
        if (entry?.serviceId && entry?.pricing) {
            acc[entry.serviceId] = entry.pricing;
        }
        return acc;
    }, {});

    if (Object.keys(pricing).length === 0) return null;

    return {
        ...pricing,
        source: 'backend',
        lastUpdated: new Date().toISOString()
    };
};

/**
 * Fetch the index of all AWS service offers
 */
export const fetchServiceIndex = async () => {
    return getCachedOrFetch('serviceIndex', async () => {
        const response = await fetch(`${AWS_PRICING_BASE}/offers/v1.0/aws/index.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    });
};

/**
 * Fetch pricing for a specific AWS service
 * Note: These files are LARGE (EC2 is 1GB+), so we use the savings plan/regional endpoints
 */
export const fetchServicePricing = async (serviceCode, region = 'us-east-1') => {
    const cacheKey = `${serviceCode}-${region}`;

    return getCachedOrFetch(cacheKey, async () => {
        // Use the regional pricing endpoint which is much smaller
        const url = `${AWS_PRICING_BASE}/offers/v1.0/aws/${serviceCode}/current/${region}/index.json`;
        const response = await fetch(url);

        if (!response.ok) {
            // Fallback to the savingsPlan endpoint for simpler pricing
            const savingsPlanUrl = `${AWS_PRICING_BASE}/savingsPlan/v1.0/aws/${serviceCode}/current/region_index.json`;
            const spResponse = await fetch(savingsPlanUrl);
            if (!spResponse.ok) throw new Error(`HTTP ${response.status}`);
            return spResponse.json();
        }

        return response.json();
    });
};

/**
 * Parse EC2 pricing from AWS API response
 */
const parseEC2Pricing = (pricingData, region) => {
    const prices = {};

    if (!pricingData?.products) {
        return FALLBACK_PRICES.ec2[region] || FALLBACK_PRICES.ec2['us-east-1'];
    }

    try {
        const products = Object.values(pricingData.products);
        const terms = pricingData.terms?.OnDemand || {};

        for (const product of products) {
            const attrs = product.attributes;
            if (
                attrs?.instanceType &&
                attrs?.operatingSystem &&
                attrs?.tenancy === 'Shared' &&
                attrs?.capacitystatus === 'Used' &&
                attrs?.preInstalledSw === 'NA'
            ) {
                const instanceType = attrs.instanceType;
                const os = attrs.operatingSystem.toLowerCase();

                // Get the on-demand price
                const productTerms = terms[product.sku];
                if (productTerms) {
                    const termKey = Object.keys(productTerms)[0];
                    const priceDimensions = productTerms[termKey]?.priceDimensions;
                    if (priceDimensions) {
                        const priceKey = Object.keys(priceDimensions)[0];
                        const pricePerUnit = parseFloat(
                            priceDimensions[priceKey]?.pricePerUnit?.USD || '0'
                        );

                        if (!prices[instanceType]) {
                            prices[instanceType] = {};
                        }
                        prices[instanceType][os] = pricePerUnit;
                    }
                }
            }
        }
    } catch (error) {
        console.warn('Error parsing EC2 pricing:', error);
        return FALLBACK_PRICES.ec2[region] || FALLBACK_PRICES.ec2['us-east-1'];
    }

    return Object.keys(prices).length > 0
        ? prices
        : FALLBACK_PRICES.ec2[region] || FALLBACK_PRICES.ec2['us-east-1'];
};

/**
 * Initialize pricing data - call this on app startup
 */
export const initializePricing = async (region = 'us-east-1') => {
    console.log('Initializing AWS pricing data...');

    const results = {
        ec2: FALLBACK_PRICES.ec2[region] || FALLBACK_PRICES.ec2['us-east-1'],
        ebs: FALLBACK_PRICES.ebs[region] || FALLBACK_PRICES.ebs['us-east-1'],
        s3: FALLBACK_PRICES.s3[region] || FALLBACK_PRICES.s3['us-east-1'],
        s3Requests: FALLBACK_PRICES.s3Requests,
        fargate: FALLBACK_PRICES.fargate[region] || FALLBACK_PRICES.fargate['us-east-1'],
        rds: FALLBACK_PRICES.rds[region] || FALLBACK_PRICES.rds['us-east-1'],
        rdsStorage: FALLBACK_PRICES.rdsStorage,
        alb: FALLBACK_PRICES.alb[region] || FALLBACK_PRICES.alb['us-east-1'],
        cloudfront: FALLBACK_PRICES.cloudfront[region] || FALLBACK_PRICES.cloudfront['us-east-1'],
        elasticache: FALLBACK_PRICES.elasticache[region] || FALLBACK_PRICES.elasticache['us-east-1'],
        waf: FALLBACK_PRICES.waf,
        dataTransfer: FALLBACK_PRICES.dataTransfer,
        // New services
        lambda: FALLBACK_PRICES.lambda,
        dynamodb: FALLBACK_PRICES.dynamodb,
        sqs: FALLBACK_PRICES.sqs,
        sns: FALLBACK_PRICES.sns,
        eventbridge: FALLBACK_PRICES.eventbridge,
        apigateway: FALLBACK_PRICES.apigateway,
        route53: FALLBACK_PRICES.route53,
        natGateway: FALLBACK_PRICES.natGateway,
        cognito: FALLBACK_PRICES.cognito,
        secrets: FALLBACK_PRICES.secrets,
        efs: FALLBACK_PRICES.efs,
        aurora: FALLBACK_PRICES.aurora,
        appRunner: FALLBACK_PRICES.appRunner,
        kinesis: FALLBACK_PRICES.kinesis,
        opensearch: FALLBACK_PRICES.opensearch,
        athena: FALLBACK_PRICES.athena,
        source: 'fallback',
        lastUpdated: new Date().toISOString()
    };

    try {
        // Prefer backend pricing cache when available
        const backendPricing = await fetchBackendPricing(region);
        if (backendPricing) {
            const mergedPricing = {
                ...results,
                ...backendPricing,
                source: 'backend',
                lastUpdated: backendPricing.lastUpdated || new Date().toISOString()
            };
            priceCache.set('currentPricing', { data: mergedPricing, timestamp: Date.now() });
            console.log('Pricing initialized (source: backend)');
            return mergedPricing;
        }

        // Try to fetch EC2 pricing (most commonly used)
        const ec2Data = await fetchServicePricing('AmazonEC2', region);
        if (ec2Data) {
            const parsedPrices = parseEC2Pricing(ec2Data, region);
            if (Object.keys(parsedPrices).length > 0) {
                results.ec2 = parsedPrices;
                results.source = 'aws-api';
            }
        }
    } catch (error) {
        console.warn('Could not fetch live pricing, using fallback data:', error.message);
    }

    // Store in cache for the pricing module to use
    priceCache.set('currentPricing', { data: results, timestamp: Date.now() });

    console.log(`Pricing initialized (source: ${results.source})`);
    return results;
};

/**
 * Apply regional multiplier to pricing object
 */
const applyRegionalMultiplier = (prices, region) => {
    const multiplier = REGIONAL_MULTIPLIERS[region] || 1.0;
    if (multiplier === 1.0) return prices;

    const adjusted = {};
    for (const [key, value] of Object.entries(prices)) {
        if (typeof value === 'number') {
            adjusted[key] = value * multiplier;
        } else if (typeof value === 'object' && value !== null) {
            adjusted[key] = applyRegionalMultiplier(value, region);
        } else {
            adjusted[key] = value;
        }
    }
    return adjusted;
};

/**
 * Get current pricing data (from cache or fallback)
 */
export const getCurrentPricing = (region = 'us-east-1') => {
    const cached = priceCache.get('currentPricing');
    let basePricing;

    if (cached) {
        basePricing = cached.data;
    } else {
        // Return fallback structure
        basePricing = {
            ec2: FALLBACK_PRICES.ec2['us-east-1'],
            ebs: FALLBACK_PRICES.ebs['us-east-1'],
            s3: FALLBACK_PRICES.s3['us-east-1'],
            s3Requests: FALLBACK_PRICES.s3Requests,
            fargate: FALLBACK_PRICES.fargate['us-east-1'],
            rds: FALLBACK_PRICES.rds['us-east-1'],
            rdsStorage: FALLBACK_PRICES.rdsStorage,
            alb: FALLBACK_PRICES.alb['us-east-1'],
            cloudfront: FALLBACK_PRICES.cloudfront['us-east-1'],
            elasticache: FALLBACK_PRICES.elasticache['us-east-1'],
            waf: FALLBACK_PRICES.waf,
            dataTransfer: FALLBACK_PRICES.dataTransfer,
            // New services
            lambda: FALLBACK_PRICES.lambda,
            dynamodb: FALLBACK_PRICES.dynamodb,
            sqs: FALLBACK_PRICES.sqs,
            sns: FALLBACK_PRICES.sns,
            eventbridge: FALLBACK_PRICES.eventbridge,
            apigateway: FALLBACK_PRICES.apigateway,
            route53: FALLBACK_PRICES.route53,
            natGateway: FALLBACK_PRICES.natGateway,
            cognito: FALLBACK_PRICES.cognito,
            secrets: FALLBACK_PRICES.secrets,
            efs: FALLBACK_PRICES.efs,
            aurora: FALLBACK_PRICES.aurora,
            appRunner: FALLBACK_PRICES.appRunner,
            kinesis: FALLBACK_PRICES.kinesis,
            opensearch: FALLBACK_PRICES.opensearch,
            athena: FALLBACK_PRICES.athena,
            source: 'fallback',
            lastUpdated: new Date().toISOString()
        };
    }

    // Apply regional multiplier if not us-east-1
    if (region !== 'us-east-1') {
        return {
            ...basePricing,
            ec2: applyRegionalMultiplier(basePricing.ec2, region),
            ebs: applyRegionalMultiplier(basePricing.ebs, region),
            s3: applyRegionalMultiplier(basePricing.s3, region),
            fargate: applyRegionalMultiplier(basePricing.fargate, region),
            rds: applyRegionalMultiplier(basePricing.rds, region),
            alb: applyRegionalMultiplier(basePricing.alb, region),
            cloudfront: applyRegionalMultiplier(basePricing.cloudfront, region),
            elasticache: applyRegionalMultiplier(basePricing.elasticache, region),
            natGateway: applyRegionalMultiplier(basePricing.natGateway, region),
            efs: applyRegionalMultiplier(basePricing.efs, region),
            aurora: applyRegionalMultiplier(basePricing.aurora, region),
            appRunner: applyRegionalMultiplier(basePricing.appRunner, region),
            kinesis: applyRegionalMultiplier(basePricing.kinesis, region),
            opensearch: applyRegionalMultiplier(basePricing.opensearch, region),
        };
    }

    return basePricing;
};

/**
 * Get a specific price (with fallback)
 */
export const getPrice = (service, path, fallback = 0) => {
    const pricing = getCurrentPricing();
    const servicePricing = pricing[service];

    if (!servicePricing) return fallback;

    // Navigate the path (e.g., ['t3.micro', 'linux'])
    let current = servicePricing;
    for (const key of path) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return fallback;
        }
    }

    return typeof current === 'number' ? current : fallback;
};

/**
 * Get pricing metadata (source, last updated)
 */
export const getPricingMeta = () => {
    const pricing = getCurrentPricing();
    return {
        source: pricing.source,
        lastUpdated: pricing.lastUpdated
    };
};

/**
 * Force refresh pricing data
 */
export const refreshPricing = async (region = 'us-east-1') => {
    priceCache.clear();
    return initializePricing(region);
};

export default {
    initializePricing,
    getCurrentPricing,
    getPrice,
    getPricingMeta,
    refreshPricing,
    FALLBACK_PRICES
};
