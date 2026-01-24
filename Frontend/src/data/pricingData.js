// AWS Pricing data (simplified, based on us-east-1 region)
// Real implementation would fetch from AWS Price List API

export const EC2_PRICES = {
    'us-east-1': {
        't3.micro': { linux: 0.0104, windows: 0.0152 },
        't3.small': { linux: 0.0208, windows: 0.0304 },
        't3.medium': { linux: 0.0416, windows: 0.0608 },
        't3.large': { linux: 0.0832, windows: 0.1216 },
        't3.xlarge': { linux: 0.1664, windows: 0.2432 },
        'm5.large': { linux: 0.096, windows: 0.185 },
        'm5.xlarge': { linux: 0.192, windows: 0.37 }
    }
};

export const EBS_PRICES = {
    'us-east-1': {
        gp3: 0.08, // per GB-month
        gp2: 0.10,
        io1: 0.125
    }
};

export const S3_PRICES = {
    'us-east-1': {
        'STANDARD': 0.023,
        'STANDARD_IA': 0.0125,
        'GLACIER': 0.004,
        'DEEP_ARCHIVE': 0.00099
    }
};

export const S3_REQUEST_PRICES = {
    PUT: 0.005,  // per 1000 requests
    GET: 0.0004  // per 1000 requests
};

export const FARGATE_PRICES = {
    'us-east-1': {
        vCPU: 0.04048,    // per vCPU-hour
        memory: 0.004445  // per GB-hour
    }
};

export const RDS_PRICES = {
    'us-east-1': {
        'db.t3.micro': { postgres: 0.018, mysql: 0.017, mariadb: 0.017 },
        'db.t3.small': { postgres: 0.036, mysql: 0.034, mariadb: 0.034 },
        'db.t3.medium': { postgres: 0.072, mysql: 0.068, mariadb: 0.068 },
        'db.t3.large': { postgres: 0.144, mysql: 0.136, mariadb: 0.136 },
        'db.r5.large': { postgres: 0.24, mysql: 0.228, mariadb: 0.228 }
    }
};

export const RDS_STORAGE_PRICES = {
    gp2: 0.115, // per GB-month
    gp3: 0.08,
    io1: 0.125
};

export const ALB_PRICES = {
    'us-east-1': {
        hourly: 0.0225,
        lcuHour: 0.008
    }
};

export const CLOUDFRONT_PRICES = {
    'us-east-1': {
        dataTransferFirst10TB: 0.085,
        dataTransfer10to50TB: 0.08,
        httpRequests: 0.0075,  // per 10,000
        httpsRequests: 0.01    // per 10,000
    }
};

export const ELASTICACHE_PRICES = {
    'us-east-1': {
        'cache.t3.micro': 0.017,
        'cache.t3.small': 0.034,
        'cache.t3.medium': 0.068,
        'cache.r5.large': 0.228
    }
};

export const WAF_PRICES = {
    webACL: 5.00,      // per month
    rule: 1.00,        // per month per rule
    requests: 0.60     // per million requests
};

export const DATA_TRANSFER_PRICES = {
    internetEgressFirst10TB: 0.09,
    internetEgress10to50TB: 0.085,
    interRegion: 0.02,
    interAZ: 0.01,
    sameAZPrivate: 0
};

// VPC Pricing (per hour)
export const VPC_PRICES = {
    'us-east-1': {
        hourly: 0.07,                      // VPC hourly cost
        natGateway: 0.045,                 // per NAT Gateway hour
        natGatewayDataProcessing: 0.045,   // per GB of data processed by NAT
        vpcFlowLogs: 0.06,                 // per GB ingested
    }
};

// Elastic IP Pricing (per hour when not in use, free when attached)
export const ELASTIC_IP_PRICES = {
    'us-east-1': {
        hourlyUnused: 0.005,               // $0.005/hour when not associated
        hourlyAssociated: 0,               // Free when associated
    }
};

// NAT Gateway Data Transfer
export const NAT_GATEWAY_PRICES = {
    'us-east-1': {
        hourly: 0.045,                     // $0.045/hour
        dataProcessing: 0.045              // $0.045/GB
    }
};

// VPC Subnet IP Allocation Cost (minimal, based on CIDR size)
export const SUBNET_IP_PRICING = {
    'us-east-1': {
        costPerIP: 0,                      // IPs within VPC are free, tracked via VPC cost
    }
};

// Lambda Data Transfer
export const LAMBDA_DATA_TRANSFER = {
    'us-east-1': {
        firstGB: 1,                        // First 1GB free per month
        overagePerGB: 0.09                 // $0.09/GB after free tier
    }
};

// S3 Data Transfer
export const S3_DATA_TRANSFER_PRICES = {
    'us-east-1': {
        inbound: 0,                        // Free
        outbound: {
            'first-10TB': 0.09,
            '10-100TB': 0.085,
            'over-100TB': 0.08
        }
    }
};

// API Gateway Data Transfer
export const API_GATEWAY_DATA_TRANSFER = {
    'us-east-1': {
        requestCost: 0.03,                 // $0.03 per million requests (implicit transfer)
        dataOutbound: 0.09                 // $0.09/GB for responses
    }
};
