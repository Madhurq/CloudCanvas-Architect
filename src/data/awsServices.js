// AWS Service definitions with pricing and connection rules
export const awsServices = {
    // ==================== COMPUTE ====================
    ec2: {
        id: 'ec2',
        name: 'EC2 Instance',
        category: 'compute',
        color: '#FF9900',
        icon: '🖥️',
        useCase: 'Virtual servers for full control over OS, scaling, and configurations',
        whenToUse: 'Need full OS access, custom software, or legacy app hosting',
        defaultConfig: {
            instanceType: 't3.medium',
            count: 1,
            hoursPerMonth: 730,
            os: 'linux',
            ebsStorage: 30
        },
        configFields: [
            { key: 'instanceType', label: 'Instance Type', type: 'select', options: ['t3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge', 'm5.large', 'm5.xlarge'] },
            { key: 'count', label: 'Instance Count', type: 'number', min: 1, max: 100 },
            { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
            { key: 'os', label: 'Operating System', type: 'select', options: ['linux', 'windows'] },
            { key: 'ebsStorage', label: 'EBS Storage (GB)', type: 'number', min: 8, max: 16000 }
        ],
        allowedConnections: ['rds', 's3'],
        defaultPorts: { inbound: [80, 443, 22], outbound: [5432, 6379, 443] }
    },

    lambda: {
        id: 'lambda',
        name: 'Lambda',
        category: 'compute',
        color: '#FF9900',
        icon: 'λ',
        useCase: 'Run code without servers - pay only when code executes',
        whenToUse: 'Event-driven, short tasks, APIs, automations (<15 min)',
        defaultConfig: {
            requestsPerMonth: 1000000,
            avgDurationMs: 200,
            memoryMB: 128
        },
        configFields: [
            { key: 'requestsPerMonth', label: 'Requests/Month', type: 'number', min: 0, max: 1000000000 },
            { key: 'avgDurationMs', label: 'Avg Duration (ms)', type: 'number', min: 1, max: 900000 },
            { key: 'memoryMB', label: 'Memory (MB)', type: 'select', options: [128, 256, 512, 1024, 2048, 4096, 10240] }
        ],
        allowedConnections: ['s3', 'rds'],
        defaultPorts: { inbound: [], outbound: [443] }
    },

    // ==================== STORAGE ====================
    s3: {
        id: 's3',
        name: 'S3 Bucket',
        category: 'storage',
        color: '#3F8624',
        icon: '🪣',
        useCase: 'Unlimited object storage for files, backups, static websites',
        whenToUse: 'Store files, images, videos, backups, or host static sites',
        defaultConfig: {
            storageGB: 100,
            storageClass: 'STANDARD',
            putRequests: 100000,
            getRequests: 1000000,
            dataTransferOutGB: 50
        },
        configFields: [
            { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 1, max: 100000 },
            { key: 'storageClass', label: 'Storage Class', type: 'select', options: ['STANDARD', 'STANDARD_IA', 'GLACIER', 'DEEP_ARCHIVE'] },
            { key: 'putRequests', label: 'PUT Requests/Month', type: 'number', min: 0, max: 100000000 },
            { key: 'getRequests', label: 'GET Requests/Month', type: 'number', min: 0, max: 100000000 },
            { key: 'dataTransferOutGB', label: 'Data Transfer Out (GB)', type: 'number', min: 0, max: 100000 }
        ],
        allowedConnections: [],
        defaultPorts: { inbound: [443], outbound: [] }
    },

    // ==================== DATABASE ====================
    rds: {
        id: 'rds',
        name: 'RDS Database',
        category: 'database',
        color: '#3B48CC',
        icon: '🗄️',
        useCase: 'Managed relational databases (PostgreSQL, MySQL, MariaDB)',
        whenToUse: 'Traditional SQL workloads with ACID compliance needed',
        defaultConfig: {
            instanceClass: 'db.t3.small',
            engine: 'postgres',
            storageGB: 100,
            multiAZ: false
        },
        configFields: [
            { key: 'instanceClass', label: 'Instance Class', type: 'select', options: ['db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.t3.large', 'db.r5.large'] },
            { key: 'engine', label: 'Database Engine', type: 'select', options: ['postgres', 'mysql', 'mariadb'] },
            { key: 'storageGB', label: 'Storage (GB)', type: 'number', min: 20, max: 65536 },
            { key: 'multiAZ', label: 'Multi-AZ Deployment', type: 'boolean' }
        ],
        allowedConnections: [],
        defaultPorts: { inbound: [5432, 3306], outbound: [] }
    },

    // ==================== NETWORKING ====================
    alb: {
        id: 'alb',
        name: 'Application Load Balancer',
        category: 'networking',
        color: '#8C4FFF',
        icon: '⚖️',
        useCase: 'Distribute HTTP/HTTPS traffic across multiple targets',
        whenToUse: 'Web apps needing path-based routing, TLS termination',
        defaultConfig: {
            hoursPerMonth: 730,
            lcuHours: 10,
            newConnections: 100000,
            processedBytes: 50
        },
        configFields: [
            { key: 'hoursPerMonth', label: 'Hours/Month', type: 'number', min: 1, max: 730 },
            { key: 'lcuHours', label: 'LCU-Hours/Hour', type: 'number', min: 0, max: 1000 },
            { key: 'newConnections', label: 'New Connections/Month', type: 'number', min: 0, max: 100000000 },
            { key: 'processedBytes', label: 'Processed Data (GB)', type: 'number', min: 0, max: 100000 }
        ],
        allowedConnections: ['ec2', 'lambda'],
        defaultPorts: { inbound: [80, 443], outbound: [80, 8080] }
    }
};

// Service categories for filtering
export const serviceCategories = {
    compute: { name: 'Compute', color: '#FF9900' },
    storage: { name: 'Storage', color: '#3F8624' },
    database: { name: 'Database', color: '#3B48CC' },
    networking: { name: 'Networking', color: '#8C4FFF' }
};
