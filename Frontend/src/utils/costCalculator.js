/**
 * Cost Calculator Engine
 * Uses AWS Price List API pricing data (with fallback to static prices)
 */
import { getCurrentPricing, getPrice } from '../services/awsPricingService';
import { getInterRegionRateSync, getInternetEgressRateSync } from '../services/dataTransferPricing';

// Pricing model discounts
const PRICING_MODEL_DISCOUNTS = {
    'on-demand': 0,
    'reserved-1yr': 0.30,   // 30% discount
    'reserved-3yr': 0.50,   // 50% discount
    'spot': 0.70,           // 70% discount
};

// Services that support Reserved Instance pricing
const RESERVED_INSTANCE_SERVICES = ['ec2', 'rds', 'elasticache', 'opensearch', 'ecs'];

// Services that support Spot pricing
const SPOT_SERVICES = ['ec2'];

/**
 * Apply pricing model discount to cost
 */
const applyPricingModel = (cost, serviceType, pricingModel) => {
    const discount = PRICING_MODEL_DISCOUNTS[pricingModel] || 0;
    
    // Only apply discount if service supports the pricing model
    if (pricingModel.startsWith('reserved') && !RESERVED_INSTANCE_SERVICES.includes(serviceType)) {
        return cost; // No discount for services without Reserved Instances
    }
    
    if (pricingModel === 'spot' && !SPOT_SERVICES.includes(serviceType)) {
        return cost; // No discount for services without Spot pricing
    }
    
    return cost * (1 - discount);
};

export const calculateServiceCost = (serviceType, config, region = 'us-east-1', pricingModel = 'on-demand') => {
    switch (serviceType) {
        case 'ec2':
            return calculateEC2Cost(config, region, pricingModel);
        case 's3':
            return calculateS3Cost(config, region, pricingModel);
        case 'ecs':
            return calculateECSCost(config, region, pricingModel);
        case 'rds':
            return calculateRDSCost(config, region, pricingModel);
        case 'alb':
            return calculateALBCost(config, region, pricingModel);
        case 'cloudfront':
            return calculateCloudFrontCost(config, region, pricingModel);
        case 'elasticache':
            return calculateElastiCacheCost(config, region, pricingModel);
        case 'waf':
            return calculateWAFCost(config, pricingModel);
        // New services
        case 'lambda':
            return calculateLambdaCost(config, pricingModel);
        case 'dynamodb':
            return calculateDynamoDBCost(config, pricingModel);
        case 'sqs':
            return calculateSQSCost(config, pricingModel);
        case 'sns':
            return calculateSNSCost(config, pricingModel);
        case 'eventbridge':
            return calculateEventBridgeCost(config, pricingModel);
        case 'apigateway':
            return calculateAPIGatewayCost(config, pricingModel);
        case 'route53':
            return calculateRoute53Cost(config, pricingModel);
        case 'natgateway':
            return calculateNATGatewayCost(config, pricingModel);
        case 'cognito':
            return calculateCognitoCost(config, pricingModel);
        case 'secrets':
            return calculateSecretsCost(config, pricingModel);
        case 'efs':
            return calculateEFSCost(config, pricingModel);
        case 'aurora':
            return calculateAuroraCost(config, pricingModel);
        case 'apprunner':
            return calculateAppRunnerCost(config, pricingModel);
        case 'kinesis':
            return calculateKinesisCost(config, pricingModel);
        case 'opensearch':
            return calculateOpenSearchCost(config, region, pricingModel);
        case 'athena':
            return calculateAthenaCost(config, pricingModel);
        // Phase 2: New services
        case 'redshift':
            return calculateRedshiftCost(config, region, pricingModel);
        case 'quicksight':
            return calculateQuickSightCost(config, pricingModel);
        case 'emr':
            return calculateEMRCost(config, region, pricingModel);
        case 'glue':
            return calculateGlueCost(config, pricingModel);
        case 'eks':
            return calculateEKSCost(config, region, pricingModel);
        case 'batch':
            return calculateBatchCost(config, region, pricingModel);
        case 'lightsail':
            return calculateLightsailCost(config, pricingModel);
        case 'msk':
            return calculateMSKCost(config, region, pricingModel);
        case 'mq':
            return calculateMQCost(config, region, pricingModel);
        case 'guardduty':
            return calculateGuardDutyCost(config, pricingModel);
        case 'config':
            return calculateConfigCost(config, pricingModel);
        case 'cloudtrail':
            return calculateCloudTrailCost(config, pricingModel);
        case 'ssm':
            return calculateSSMCost(config, pricingModel);
        case 'acm':
            return calculateACMCost(config, pricingModel);
        default:
            return { total: 0, breakdown: {} };
    }
};

const calculateEC2Cost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    // Get EC2 instance price from API data
    const instancePrice = pricing.ec2?.[config.instanceType]?.[config.os] || 0;
    const ebsPrice = pricing.ebs?.gp3 || 0.08;

    const computeCost = instancePrice * config.hoursPerMonth * config.count;
    const storageCost = ebsPrice * config.ebsStorage * config.count;

    const baseCost = computeCost + storageCost;
    const finalCost = applyPricingModel(baseCost, 'ec2', pricingModel);

    return {
        total: finalCost,
        breakdown: {
            'Compute': applyPricingModel(computeCost, 'ec2', pricingModel),
            'EBS Storage': storageCost
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateS3Cost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    const storageRate = pricing.s3?.[config.storageClass] || 0.023;
    const putRate = pricing.s3Requests?.PUT || 0.005;
    const getRate = pricing.s3Requests?.GET || 0.0004;
    const transferRate = pricing.dataTransfer?.internetEgressFirst10TB || 0.09;

    const storageCost = storageRate * config.storageGB;
    const putCost = (config.putRequests / 1000) * putRate;
    const getCost = (config.getRequests / 1000) * getRate;
    const transferCost = config.dataTransferOutGB * transferRate;

    return {
        total: storageCost + putCost + getCost + transferCost,
        breakdown: {
            'Storage': storageCost,
            'PUT Requests': putCost,
            'GET Requests': getCost,
            'Data Transfer Out': transferCost
        },
        priceSource: pricing.source
    };
};

const calculateECSCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    const vCPURate = pricing.fargate?.vCPU || 0.04048;
    const memoryRate = pricing.fargate?.memory || 0.004445;

    const vCPUCost = vCPURate * config.vCPU * config.hoursPerMonth * config.taskCount;
    const memoryCost = memoryRate * config.memoryGB * config.hoursPerMonth * config.taskCount;

    const baseCost = vCPUCost + memoryCost;
    const finalCost = applyPricingModel(baseCost, 'ecs', pricingModel);

    return {
        total: finalCost,
        breakdown: {
            'vCPU': applyPricingModel(vCPUCost, 'ecs', pricingModel),
            'Memory': applyPricingModel(memoryCost, 'ecs', pricingModel)
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateRDSCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    const instancePrice = pricing.rds?.[config.instanceClass]?.[config.engine] || 0;
    const storagePrice = pricing.rdsStorage?.gp2 || 0.115;

    const instanceCost = instancePrice * 730 * (config.multiAZ ? 2 : 1);
    const storageCost = storagePrice * config.storageGB * (config.multiAZ ? 2 : 1);

    const baseCost = instanceCost + storageCost;
    const finalCost = applyPricingModel(baseCost, 'rds', pricingModel);

    return {
        total: finalCost,
        breakdown: {
            'Instance': applyPricingModel(instanceCost, 'rds', pricingModel),
            'Storage': storageCost,
            ...(config.multiAZ && { 'Multi-AZ': 'Enabled (2x cost)' })
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateALBCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    const hourlyRate = pricing.alb?.hourly || 0.0225;
    const lcuRate = pricing.alb?.lcuHour || 0.008;

    const hourlyCost = hourlyRate * config.hoursPerMonth;
    const lcuCost = lcuRate * config.lcuHours * config.hoursPerMonth;

    return {
        total: hourlyCost + lcuCost,
        breakdown: {
            'Hourly': hourlyCost,
            'LCU Usage': lcuCost
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateCloudFrontCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    const transferRate = pricing.cloudfront?.dataTransferFirst10TB || 0.085;
    const httpRate = pricing.cloudfront?.httpRequests || 0.0075;
    const httpsRate = pricing.cloudfront?.httpsRequests || 0.01;

    const transferCost = config.dataTransferGB * transferRate;
    const requestCost = (config.requestsMillions * 1000000 / 10000) *
        (config.httpRequests ? httpsRate : httpRate);

    return {
        total: transferCost + requestCost,
        breakdown: {
            'Data Transfer': transferCost,
            'Requests': requestCost
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateElastiCacheCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    const nodePrice = pricing.elasticache?.[config.nodeType] || 0;
    const baseCost = nodePrice * config.hoursPerMonth * config.numNodes;
    const finalCost = applyPricingModel(baseCost, 'elasticache', pricingModel);

    return {
        total: finalCost,
        breakdown: {
            'Node Hours': finalCost
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateWAFCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const aclRate = pricing.waf?.webACL || 5.00;
    const ruleRate = pricing.waf?.rule || 1.00;
    const requestRate = pricing.waf?.requests || 0.60;

    const aclCost = aclRate * config.webACLs;
    const ruleCost = ruleRate * config.rules * config.webACLs;
    const requestCost = requestRate * config.requestsMillions;

    return {
        total: aclCost + ruleCost + requestCost,
        breakdown: {
            'Web ACLs': aclCost,
            'Rules': ruleCost,
            'Requests': requestCost
        },
        priceSource: pricing.source
    };
};

// ==================== NEW SERVICE CALCULATORS ====================

const calculateLambdaCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const requestRate = pricing.lambda?.requestsPerMillion || 0.20;
    const gbSecondsRate = pricing.lambda?.gbSeconds || 0.0000166667;
    const freeRequests = pricing.lambda?.freeRequestsPerMonth || 1000000;
    const freeGbSeconds = pricing.lambda?.freeGbSecondsPerMonth || 400000;

    // Calculate GB-seconds
    const memoryGB = config.memoryMB / 1024;
    const durationSeconds = config.avgDurationMs / 1000;
    const totalGbSeconds = config.requestsPerMonth * memoryGB * durationSeconds;

    // Apply free tier
    const billableRequests = Math.max(0, config.requestsPerMonth - freeRequests);
    const billableGbSeconds = Math.max(0, totalGbSeconds - freeGbSeconds);

    const requestCost = (billableRequests / 1000000) * requestRate;
    const computeCost = billableGbSeconds * gbSecondsRate;

    return {
        total: requestCost + computeCost,
        breakdown: {
            'Requests': requestCost,
            'Compute (GB-s)': computeCost,
            'Free Tier': config.requestsPerMonth <= freeRequests ? 'Applied' : 'Exceeded'
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateDynamoDBCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    let readCost = 0;
    let writeCost = 0;

    if (config.capacityMode === 'provisioned') {
        const readRate = pricing.dynamodb?.readUnit || 0.00013;
        const writeRate = pricing.dynamodb?.writeUnit || 0.00065;
        readCost = config.readUnits * 730 * readRate;
        writeCost = config.writeUnits * 730 * writeRate;
    } else {
        // On-demand pricing (simplified)
        readCost = (config.readUnits * 1000000 / 1000000) * (pricing.dynamodb?.onDemandRead || 0.25);
        writeCost = (config.writeUnits * 1000000 / 1000000) * (pricing.dynamodb?.onDemandWrite || 1.25);
    }

    const storageRate = pricing.dynamodb?.storagePerGB || 0.25;
    const storageCost = config.storageGB * storageRate;

    return {
        total: readCost + writeCost + storageCost,
        breakdown: {
            'Read Capacity': readCost,
            'Write Capacity': writeCost,
            'Storage': storageCost
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateSQSCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const rate = config.queueType === 'fifo'
        ? (pricing.sqs?.fifo || 0.50)
        : (pricing.sqs?.standard || 0.40);

    // First 1M requests are free
    const billableRequests = Math.max(0, config.requestsMillions - 1);
    const totalCost = billableRequests * rate;

    return {
        total: totalCost,
        breakdown: {
            'API Requests': totalCost,
            'Queue Type': config.queueType.toUpperCase(),
            'Free Tier': config.requestsMillions <= 1 ? 'Applied' : 'Exceeded'
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateSNSCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const publishRate = pricing.sns?.publishPer100k || 0.50;
    const publishCost = (config.publishRequests / 100000) * publishRate;

    let deliveryCost = 0;
    switch (config.deliveryType) {
        case 'sqs':
            deliveryCost = 0; // SNS to SQS is free
            break;
        case 'lambda':
            deliveryCost = 0; // SNS to Lambda is free
            break;
        case 'http':
            deliveryCost = (config.deliveries / 100000) * (pricing.sns?.httpDeliveryPer100k || 0.60);
            break;
        case 'email':
            deliveryCost = (config.deliveries / 100000) * (pricing.sns?.emailPer100k || 2.00);
            break;
        case 'sms':
            deliveryCost = (config.deliveries / 100) * (pricing.sns?.smsPer100 || 0.75);
            break;
    }

    return {
        total: publishCost + deliveryCost,
        breakdown: {
            'Publish Requests': publishCost,
            'Deliveries': deliveryCost
        },
        priceSource: pricing.source
    };
};

const calculateEventBridgeCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const rate = pricing.eventbridge?.eventsPerMillion || 1.00;
    const eventCost = (config.eventsPerMonth / 1000000) * rate;

    return {
        total: eventCost,
        breakdown: {
            'Events': eventCost
        },
        priceSource: pricing.source
    };
};

const calculateAPIGatewayCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    let rate;
    switch (config.apiType) {
        case 'REST':
            rate = pricing.apigateway?.restPer1M || 3.50;
            break;
        case 'HTTP':
            rate = pricing.apigateway?.httpPer1M || 1.00;
            break;
        case 'WebSocket':
            rate = pricing.apigateway?.websocketPer1M || 1.00;
            break;
        default:
            rate = 3.50;
    }

    const requestCost = config.requestsMillions * rate;

    return {
        total: requestCost,
        breakdown: {
            'API Requests': requestCost,
            'API Type': config.apiType
        },
        priceSource: pricing.source
    };
};

const calculateRoute53Cost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const zoneRate = pricing.route53?.hostedZone || 0.50;
    const queryRate = pricing.route53?.queriesPer1M || 0.40;
    const healthCheckRate = pricing.route53?.healthCheck || 0.50;

    const zoneCost = config.hostedZones * zoneRate;
    const queryCost = config.queriesMillions * queryRate;
    const healthCost = config.healthChecks * healthCheckRate;

    return {
        total: zoneCost + queryCost + healthCost,
        breakdown: {
            'Hosted Zones': zoneCost,
            'DNS Queries': queryCost,
            'Health Checks': healthCost
        },
        priceSource: pricing.source
    };
};

const calculateNATGatewayCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const hourlyRate = pricing.natGateway?.hourly || 0.045;
    const dataRate = pricing.natGateway?.perGB || 0.045;

    const hourlyCost = config.hoursPerMonth * hourlyRate;
    const dataCost = config.dataProcessedGB * dataRate;

    return {
        total: hourlyCost + dataCost,
        breakdown: {
            'Hourly': hourlyCost,
            'Data Processed': dataCost
        },
        priceSource: pricing.source
    };
};

const calculateCognitoCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    // First 50k MAUs are free
    const billableMAUs = Math.max(0, config.monthlyActiveUsers - 50000);
    const mauRate = pricing.cognito?.mauFirst50k || 0.0055;
    const mauCost = billableMAUs * mauRate;

    let advancedCost = 0;
    if (config.advancedSecurity) {
        advancedCost = config.monthlyActiveUsers * (pricing.cognito?.advancedSecurity || 0.05);
    }

    return {
        total: mauCost + advancedCost,
        breakdown: {
            'Monthly Active Users': mauCost,
            ...(config.advancedSecurity && { 'Advanced Security': advancedCost }),
            'Free Tier (50k)': config.monthlyActiveUsers <= 50000 ? 'Applied' : 'Exceeded'
        },
        priceSource: pricing.source
    };
};

const calculateSecretsCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const secretRate = pricing.secrets?.perSecret || 0.40;
    const apiRate = pricing.secrets?.per10kAPICalls || 0.05;

    const secretCost = config.secretsCount * secretRate;
    const apiCost = (config.apiCallsPerMonth / 10000) * apiRate;

    return {
        total: secretCost + apiCost,
        breakdown: {
            'Secrets Storage': secretCost,
            'API Calls': apiCost
        },
        priceSource: pricing.source
    };
};

const calculateEFSCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const storageRate = pricing.efs?.[config.storageClass] || 0.30;
    const storageCost = config.storageGB * storageRate;

    return {
        total: storageCost,
        breakdown: {
            'Storage': storageCost,
            'Class': config.storageClass
        },
        priceSource: pricing.source
    };
};

const calculateAuroraCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const acuRate = pricing.aurora?.[config.engine] || 0.12;
    const storageRate = pricing.aurora?.storagePerGB || 0.10;

    // Estimate average ACU usage as midpoint
    const avgACU = (config.acuMin + config.acuMax) / 2;
    const computeCost = avgACU * 730 * acuRate;
    const storageCost = config.storageGB * storageRate;

    return {
        total: computeCost + storageCost,
        breakdown: {
            'Compute (ACU-hours)': computeCost,
            'Storage': storageCost,
            'ACU Range': `${config.acuMin} - ${config.acuMax}`
        },
        priceSource: pricing.source
    };
};

const calculateAppRunnerCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const vCPURate = pricing.appRunner?.vCPUHour || 0.064;
    const memoryRate = pricing.appRunner?.memoryGBHour || 0.007;
    const provVCPURate = pricing.appRunner?.provisionedVCPU || 0.007;
    const provMemoryRate = pricing.appRunner?.provisionedMemory || 0.0007;

    // Active compute cost
    const activeVCPUCost = config.vCPU * config.activeInstanceHours * vCPURate;
    const activeMemoryCost = config.memoryGB * config.activeInstanceHours * memoryRate;

    // Provisioned (idle) cost
    const idleHours = 730 - config.activeInstanceHours;
    const provVCPUCost = config.vCPU * idleHours * provVCPURate * config.provisionedInstances;
    const provMemoryCost = config.memoryGB * idleHours * provMemoryRate * config.provisionedInstances;

    return {
        total: activeVCPUCost + activeMemoryCost + provVCPUCost + provMemoryCost,
        breakdown: {
            'Active Compute': activeVCPUCost + activeMemoryCost,
            'Provisioned': provVCPUCost + provMemoryCost
        },
        priceSource: pricing.source
    };
};

const calculateKinesisCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const shardRate = pricing.kinesis?.shardHour || 0.015;
    const shardCost = config.shards * config.hoursPerMonth * shardRate;

    // PUT payload units (25KB each)
    const putRate = pricing.kinesis?.putPayloadUnit || 0.014;
    const putUnits = (config.dataIngestionGB * 1024 * 1024) / 25; // Convert to 25KB units
    const putCost = (putUnits / 1000000) * putRate;

    return {
        total: shardCost + putCost,
        breakdown: {
            'Shard Hours': shardCost,
            'PUT Payload': putCost
        },
        priceSource: pricing.source
    };
};

const calculateOpenSearchCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);

    const instanceRate = pricing.opensearch?.[config.instanceType] || 0.036;
    const storageRate = pricing.opensearch?.storagePerGB || 0.135;

    const instanceCost = instanceRate * 730 * config.instanceCount;
    const storageCost = storageRate * config.storageGB;

    const baseCost = instanceCost + storageCost;
    const finalCost = applyPricingModel(baseCost, 'opensearch', pricingModel);

    return {
        total: finalCost,
        breakdown: {
            'Instances': applyPricingModel(instanceCost, 'opensearch', pricingModel),
            'Storage': storageCost
        },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateAthenaCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();

    const tbRate = pricing.athena?.perTBScanned || 5.00;
    const queryCost = config.dataScannedTB * tbRate;

    return {
        total: queryCost,
        breakdown: {
            'Data Scanned': queryCost
        },
        priceSource: pricing.source
    };
};

/**
 * Calculate total cost for all nodes
 */
const calculateRedshiftCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);
    const hourlyRate = pricing.redshift?.[config.nodeType] || 1.086;
    const computeCost = hourlyRate * config.numNodes * config.hoursPerMonth;
    return {
        total: computeCost,
        breakdown: { 'Compute': computeCost, 'Nodes': config.numNodes, 'Node Type': config.nodeType },
        priceSource: pricing.source
    };
};

const calculateQuickSightCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();
    let monthlyCost = 0;
    // Reader $0.30/month, Author $12/month, Admin $18/month
    const userPricing = { 'reader': 0.30, 'author': 12, 'admin': 18 };
    monthlyCost = (config.users || 1) * (userPricing[config.userType] || 0.30);
    return {
        total: monthlyCost,
        breakdown: { 'Users': config.users, 'User Type': config.userType },
        priceSource: pricing.source
    };
};

const calculateEMRCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);
    const masterRate = pricing.ec2?.[config.masterInstanceType]?.['linux'] || 0.137;
    const coreRate = pricing.ec2?.[config.masterInstanceType]?.['linux'] || 0.137;
    const emrOverhead = 0.028; // EMR overhead per instance
    
    const masterCost = masterRate * config.hoursPerMonth + emrOverhead * config.hoursPerMonth;
    const coreCost = coreRate * config.coreNodes * config.hoursPerMonth + emrOverhead * config.coreNodes * config.hoursPerMonth;
    const taskCost = coreRate * config.taskNodes * config.hoursPerMonth + emrOverhead * config.taskNodes * config.hoursPerMonth;
    
    const total = masterCost + coreCost + taskCost;
    return {
        total,
        breakdown: { 'Master': masterCost, 'Core Nodes': coreCost, 'Task Nodes': taskCost },
        priceSource: pricing.source
    };
};

const calculateGlueCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();
    const dpuHourRate = pricing.glue?.dpuHour || 0.44;
    const crawlerRate = pricing.glue?.crawlerHour || 0.44;
    
    const dpuCost = config.dpuHours * dpuHourRate;
    const crawlerCost = config.crawlerHours * crawlerRate;
    
    return {
        total: dpuCost + crawlerCost,
        breakdown: { 'DPU Hours': dpuCost, 'Crawler Hours': crawlerCost },
        priceSource: pricing.source
    };
};

const calculateEKSCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);
    const clusterRate = pricing.eks?.clusterHour || 0.10;
    const nodeRate = pricing.ec2?.[config.nodeGroupType]?.['linux'] || 0.0416;
    
    const clusterCost = clusterRate * config.hoursPerMonth * config.clusterCount;
    const nodeCost = nodeRate * config.numNodes * config.hoursPerMonth;
    
    const baseCost = clusterCost + nodeCost;
    const finalCost = applyPricingModel(baseCost, 'ec2', pricingModel);
    
    return {
        total: finalCost,
        breakdown: { 'Cluster Management': clusterCost, 'EC2 Nodes': nodeCost },
        priceSource: pricing.source,
        pricingModel
    };
};

const calculateBatchCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);
    const instanceRate = pricing.ec2?.[config.computeInstanceType]?.['linux'] || 0.0416;
    
    // Estimate: ~10% utilization average
    const estimatedHours = (config.jobsPerMonth * 0.001) * 0.1; // Rough estimate
    const computeCost = instanceRate * config.maxvCPUs * estimatedHours;
    
    return {
        total: computeCost,
        breakdown: { 'Compute': computeCost, 'Max vCPUs': config.maxvCPUs },
        priceSource: pricing.source
    };
};

const calculateLightsailCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();
    const bundlePricing = {
        'small': 3.50,
        'medium': 7.00,
        'large': 14.00,
        'xlarge': 28.00,
        '2xlarge': 56.00
    };
    
    const instanceCost = (bundlePricing[config.bundleSize] || 3.50) * config.instanceCount;
    const staticIPCost = config.staticIP ? 0.50 * config.instanceCount : 0;
    
    return {
        total: instanceCost + staticIPCost,
        breakdown: { 'Instances': instanceCost, 'Static IPs': staticIPCost },
        priceSource: pricing.source
    };
};

const calculateMSKCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);
    const brokerRate = pricing.msk?.[config.brokerNodeType] || 0.252;
    const storageRate = pricing.ebs?.gp3 || 0.08;
    
    const brokerCost = brokerRate * config.brokerCount * config.hoursPerMonth;
    const storageCost = storageRate * config.brokerCount * config.storageGB;
    
    return {
        total: brokerCost + storageCost,
        breakdown: { 'Broker Hours': brokerCost, 'Storage': storageCost },
        priceSource: pricing.source
    };
};

const calculateMQCost = (config, region, pricingModel) => {
    const pricing = getCurrentPricing(region);
    const instancePricing = {
        'mq.t3.micro': 0.063,
        'mq.t3.small': 0.127,
        'mq.m5.large': 0.265,
        'mq.m5.xlarge': 0.530
    };
    
    const instanceCost = (instancePricing[config.instanceType] || 0.063) * 730;
    const storageCost = 0.001 * config.storageGB * 730; // $0.001 per GB-hour
    
    return {
        total: instanceCost + storageCost,
        breakdown: { 'Instance': instanceCost, 'Storage': storageCost },
        priceSource: pricing.source
    };
};

const calculateGuardDutyCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();
    // $0.003 per 100,000 CloudTrail events, $0.35 per VPC Flow Log event (millions)
    const baseMonthly = 30; // Minimum
    
    return {
        total: baseMonthly,
        breakdown: { 'GuardDuty Monitoring': baseMonthly },
        priceSource: pricing.source
    };
};

const calculateConfigCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();
    // $3 per million config items recorded
    const recordingCost = 0.003 * config.recordedResources;
    const ruleCost = 1.00 * config.configRules; // $1 per rule
    
    return {
        total: recordingCost + ruleCost,
        breakdown: { 'Recording': recordingCost, 'Config Rules': ruleCost },
        priceSource: pricing.source
    };
};

const calculateCloudTrailCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();
    // $2 per 100,000 events
    const eventCost = 0.002; // Simplified
    
    return {
        total: eventCost,
        breakdown: { 'CloudTrail': eventCost },
        priceSource: pricing.source
    };
};

const calculateSSMCost = (config, pricingModel) => {
    const pricing = getCurrentPricing();
    const operationCost = 0.0015 * config.instancesManaged; // $0.0015 per instance
    
    return {
        total: operationCost,
        breakdown: { 'Instance Management': operationCost },
        priceSource: pricing.source
    };
};

const calculateACMCost = (config, pricingModel) => {
    // ACM public certificates are FREE
    // Private CA: $400/month + $0.75 per certificate
    const privateCAcost = config.privateCA ? 400 : 0;
    
    return {
        total: privateCAcost,
        breakdown: { 'Private CA': privateCAcost, 'Public Certificates': 'Free' },
        priceSource: 'AWS Pricing'
    };
};

export const calculateTotalCost = (nodes, region = 'us-east-1', pricingModel = 'on-demand') => {
    let totalMonthly = 0;
    let onDemandMonthly = 0;
    const serviceCosts = [];
    const pricing = getCurrentPricing(region);

    // Per-region aggregation
    const perRegionTotals = {};

    nodes.forEach(node => {
        // Skip container nodes (VPC, Subnets, etc.) - they don't have service costs
        if (node.data?.isContainer || node.type === 'groupNode') {
            return;
        }
        
        if (node.data?.config && node.data?.serviceType) {
            const nodeRegion = node.data?.region || region;
            const cost = calculateServiceCost(node.data.serviceType, node.data.config, nodeRegion, pricingModel);
            const onDemandCost = calculateServiceCost(node.data.serviceType, node.data.config, nodeRegion, 'on-demand');

            totalMonthly += cost.total;
            onDemandMonthly += onDemandCost.total;

            // Aggregate per region
            perRegionTotals[nodeRegion] = (perRegionTotals[nodeRegion] || 0) + cost.total;

            serviceCosts.push({
                id: node.id,
                name: node.data.label,
                serviceType: node.data.serviceType,
                region: nodeRegion,
                ...cost
            });
        }
    });

    const savings = onDemandMonthly - totalMonthly;
    const savingsPercentage = onDemandMonthly > 0 ? (savings / onDemandMonthly) * 100 : 0;

    return {
        totalMonthly,
        totalYearly: totalMonthly * 12,
        onDemandMonthly,
        onDemandYearly: onDemandMonthly * 12,
        savings,
        savingsPercentage,
        services: serviceCosts,
        perRegion: perRegionTotals,
        pricingSource: pricing.source,
        pricingLastUpdated: pricing.lastUpdated,
        region,
        pricingModel
    };
};

/**
 * Calculate VPC costs (hourly + NAT Gateway + data transfer)
 */
export const calculateVPCCost = (config, region = 'us-east-1', pricingModel = 'on-demand') => {
    const pricing = getCurrentPricing(region);
    const vpcPricing = pricing.vpc || { hourly: 0.07, natGateway: 0.045, natGatewayDataProcessing: 0.045 };

    const hoursPerMonth = 730; // Average hours per month
    
    // VPC hourly cost
    const vpcHourlyCost = (vpcPricing.hourly || 0.07) * hoursPerMonth;
    
    // NAT Gateway costs (optional)
    const natGatewayCost = (config.natGateways || 0) * (vpcPricing.natGateway || 0.045) * hoursPerMonth;
    const natDataProcessingCost = (config.natDataProcessingGB || 0) * (vpcPricing.natGatewayDataProcessing || 0.045);
    
    // Elastic IP costs (when not in use)
    const elasticIPCost = (config.unusedElasticIPs || 0) * (pricing.elasticIP?.hourlyUnused || 0.005) * hoursPerMonth;
    
    // VPC Flow Logs costs (optional)
    const flowLogsCost = (config.flowLogsGB || 0) * (vpcPricing.vpcFlowLogs || 0.06);
    
    const totalCost = vpcHourlyCost + natGatewayCost + natDataProcessingCost + elasticIPCost + flowLogsCost;
    const finalCost = applyPricingModel(totalCost, 'vpc', pricingModel);

    return {
        total: finalCost,
        breakdown: {
            'VPC Hourly': vpcHourlyCost,
            'NAT Gateway': natGatewayCost,
            'NAT Data Processing': natDataProcessingCost,
            'Elastic IPs (unused)': elasticIPCost,
            'VPC Flow Logs': flowLogsCost
        },
        priceSource: pricing.source
    };
};

/**
 * Calculate data transfer costs between services
 * Handles intra-region, inter-region, and internet egress
 * AUTO-DETECTS inter-region transfers when source and target have different regions
 */
export const calculateDataTransferCost = (edges, nodes, region = 'us-east-1', targetRegion = 'us-east-1', pricingModel = 'on-demand') => {
    const pricing = getCurrentPricing(region);
    const dataTransferPrices = pricing.dataTransfer || {
        internetEgressFirst10TB: 0.09,
        internetEgress10to50TB: 0.085,
        interRegion: 0.02,
        interAZ: 0.01,
        sameAZPrivate: 0
    }; // Fallbacks used only when API-backed rates not cached

    let totalTransferCost = 0;
    const breakdown = {};

    edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return;

        const bandwidthGB = edge.data?.bandwidthGB || 10; // Default 10GB/month if not specified
        
        // AUTO-DETECT: Check if source and target are in different regions
        const sourceRegion = sourceNode.data?.region || region;
        const targetRegionNode = targetNode.data?.region || region;
        const isInterRegion = sourceRegion !== targetRegionNode;
        
        // Use explicit transferType if set, otherwise auto-detect based on regions
        let transferType = edge.data?.transferType;
        if (!transferType && isInterRegion) {
            transferType = 'inter-region'; // Auto-detect inter-region transfer
        } else if (!transferType) {
            transferType = 'intra-region'; // Default to same region
        }

        let rate = 0;

        if (transferType === 'internet') {
            // Internet egress pricing (prefer API-backed tiers)
            rate = getInternetEgressRateSync(sourceRegion, bandwidthGB);
        } else if (transferType === 'inter-region') {
            // Inter-region pricing (prefer API-backed per-pair rates)
            rate = getInterRegionRateSync(sourceRegion, targetRegionNode);
        } else if (transferType === 'inter-az') {
            rate = dataTransferPrices.interAZ || 0.01;
        } else {
            // Same AZ private: free
            rate = dataTransferPrices.sameAZPrivate || 0;
        }

        const edgeCost = bandwidthGB * rate;
        totalTransferCost += edgeCost;
        
        // Show regions in breakdown if cross-region
        const regionLabel = isInterRegion ? ` (${sourceRegion} → ${targetRegionNode})` : '';
        breakdown[`${sourceNode.data?.label} → ${targetNode.data?.label}${regionLabel}`] = edgeCost;
    });

    const finalCost = applyPricingModel(totalTransferCost, 'data-transfer', pricingModel);

    return {
        total: finalCost,
        breakdown,
        priceSource: pricing.source
    };
};

/**
 * Calculate total cost including services, VPC, and data transfer
 */
export const calculateTotalArchitectureCost = (nodes, edges, region = 'us-east-1', pricingModel = 'on-demand', vpcConfig = {}, includeVPC = true, includeDataTransfer = true) => {
    // Service costs
    const serviceCostResult = calculateTotalCost(nodes, region, pricingModel);
    
    // VPC costs
    let vpcCost = { total: 0, breakdown: {}, priceSource: 'N/A' };
    if (includeVPC) {
        vpcCost = calculateVPCCost(vpcConfig, region, pricingModel);
    }
    
    // Data transfer costs
    let transferCost = { total: 0, breakdown: {}, priceSource: 'N/A' };
    if (includeDataTransfer) {
        transferCost = calculateDataTransferCost(edges, nodes, region, region, pricingModel);
    }
    
    const totalMonthly = serviceCostResult.totalMonthly + vpcCost.total + transferCost.total;
    const totalYearly = totalMonthly * 12;

    return {
        services: serviceCostResult,
        vpc: vpcCost,
        dataTransfer: transferCost,
        grandTotal: {
            monthly: totalMonthly,
            yearly: totalYearly,
            breakdown: {
                'Services': serviceCostResult.totalMonthly,
                'VPC & Networking': vpcCost.total,
                'Data Transfer': transferCost.total
            }
        },
        region,
        pricingModel,
        includeVPC,
        includeDataTransfer
    };
};
