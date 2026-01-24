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
