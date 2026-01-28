import { useState, useMemo } from 'react';
import useStore from '../store/useStore';
import '../styles/IAMSetupGuide.css';

export default function IAMSetupGuide({ onComplete, onCancel }) {
  const { nodes } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [credentials, setCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [secretKeyCopied, setSecretKeyCopied] = useState(false);
  const [accessKeyCopied, setAccessKeyCopied] = useState(false);

  const steps = [
    {
      title: 'Create IAM User in AWS Console',
      description: 'Follow these steps to create a new IAM user for CloudCanvas deployments:',
      details: (
        <ol className="steps-list">
          <li>
            <strong>Open AWS Console:</strong> Go to{' '}
            <a href="https://console.aws.amazon.com/" target="_blank" rel="noopener noreferrer" className="link">
              AWS Console
            </a>
          </li>
          <li>
            <strong>Navigate to IAM:</strong> Search for "IAM" in the search bar and click on it
          </li>
          <li>
            <strong>Go to Users:</strong> Click on "Users" in the left sidebar
          </li>
          <li>
            <strong>Create User:</strong> Click "Create user" button
          </li>
          <li>
            <strong>Enter Username:</strong> Type a name like <code>cloudcanvas-deployer</code>
          </li>
          <li>
            <strong>Check Console Access:</strong> <strong>UNCHECK</strong> "Provide user access to AWS Management Console"
          </li>
          <li>
            <strong>Click Next:</strong> Continue to set permissions
          </li>
        </ol>
      ),
      action: 'User Created',
    },
    {
      title: 'Set IAM Permissions (Least Privilege)',
      description: 'Grant only the minimal permissions needed to deploy stacks based on the services in your design.',
      details: (
        <div>
          <ol className="steps-list">
            <li>
              <strong>On Permissions Page:</strong> Select "Attach policies directly".
            </li>
            <li>
              <strong>Attach CloudFormation stack ops:</strong> Use the AWS managed policy <code>AWSCloudFormationFullAccess</code> (preferred over broad PowerUser).
            </li>
            <li>
              <strong>Attach service-scoped permissions:</strong> Add policies only for services present in your canvas (e.g., EC2, S3, RDS, ALB, Lambda). For tighter control, use the custom policy below.
            </li>
          </ol>

          {/* Dynamic least-privilege policy generator */}
          <LeastPrivilegePolicy nodes={nodes} />

          <p className="hint">
            💡 <strong>Tip:</strong> Scope <code>Resource</code> to specific ARNs in production and restrict <code>iam:PassRole</code> with conditions. See IAM_PERMISSIONS_FIX.md for more examples.
          </p>
        </div>
      ),
      action: 'Permissions Set',
    },
    {
      title: 'Generate Access Keys',
      description: 'Create the credentials you\'ll need for CloudCanvas deployments:',
      details: (
        <ol className="steps-list">
          <li>
            <strong>User Created Confirmation:</strong> You should see a success message
          </li>
          <li>
            <strong>Click on the User:</strong> Click on your newly created user <code>cloudcanvas-deployer</code>
          </li>
          <li>
            <strong>Go to Security Credentials Tab:</strong> Click on "Security credentials" tab
          </li>
          <li>
            <strong>Create Access Key:</strong> Click "Create access key" button
          </li>
          <li>
            <strong>Select Use Case:</strong> Select "Other" and click "Next"
          </li>
          <li>
            <strong>Copy Your Credentials:</strong> You'll see two credentials:
            <div className="credential-box">
              <p><strong>Access Key ID:</strong> Starts with "AKIA..."</p>
              <p><strong>Secret Access Key:</strong> Long alphanumeric string</p>
            </div>
            <p className="warning">⚠️ <strong>IMPORTANT:</strong> This is the only time you'll see the secret key! Copy both values now.</p>
          </li>
          <li>
            <strong>Paste Below:</strong> Copy your credentials into the fields below
          </li>
        </ol>
      ),
      action: 'Keys Generated',
    },
    {
      title: 'Paste Your Credentials',
      description: 'Enter the credentials you generated in AWS Console:',
      details: (
        <div className="credentials-form">
          <div className="form-group">
            <label htmlFor="accessKeyId">
              AWS Access Key ID
              {accessKeyCopied && <span className="copied-badge">✓ Copied</span>}
            </label>
            <div className="input-wrapper">
              <input
                type="password"
                id="accessKeyId"
                value={credentials.accessKeyId}
                onChange={(e) => setCredentials({ ...credentials, accessKeyId: e.target.value })}
                placeholder="AKIA..."
                className="form-input"
              />
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(credentials.accessKeyId);
                  setAccessKeyCopied(true);
                  setTimeout(() => setAccessKeyCopied(false), 2000);
                }}
                disabled={!credentials.accessKeyId}
              >
                📋
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="secretAccessKey">
              AWS Secret Access Key
              {secretKeyCopied && <span className="copied-badge">✓ Copied</span>}
            </label>
            <div className="input-wrapper">
              <input
                type={showSecretKey ? 'text' : 'password'}
                id="secretAccessKey"
                value={credentials.secretAccessKey}
                onChange={(e) => setCredentials({ ...credentials, secretAccessKey: e.target.value })}
                placeholder="••••••••"
                className="form-input"
              />
              <button
                className="show-btn"
                onClick={() => setShowSecretKey(!showSecretKey)}
                disabled={!credentials.secretAccessKey}
              >
                {showSecretKey ? '👁️' : '👁️‍🗨️'}
              </button>
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(credentials.secretAccessKey);
                  setSecretKeyCopied(true);
                  setTimeout(() => setSecretKeyCopied(false), 2000);
                }}
                disabled={!credentials.secretAccessKey}
              >
                📋
              </button>
            </div>
          </div>

          <div className="security-note">
            <p>🔒 <strong>Security Best Practices:</strong></p>
            <ul>
              <li>Never commit credentials to version control</li>
              <li>Use temporary credentials when possible</li>
              <li>Rotate credentials regularly (every 90 days)</li>
              <li>Use IAM roles instead of access keys when deploying from AWS services</li>
              <li>Delete unused access keys immediately</li>
            </ul>
          </div>
        </div>
      ),
      action: 'Credentials Ready',
    },
  ];

  const isStepValid = () => {
    if (currentStep === 3) {
      return credentials.accessKeyId.trim() && credentials.secretAccessKey.trim();
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (!isStepValid()) {
      alert('Please enter both credentials before proceeding');
      return;
    }
    onComplete(credentials);
  };

  const step = steps[currentStep];

  return (
    <div className="iam-setup-overlay" onClick={onCancel}>
      <div className="iam-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="iam-setup-header">
          <h2>🔐 AWS IAM Setup Guide</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="iam-setup-progress">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`progress-step ${index === currentStep ? 'active' : ''} ${
                index < currentStep ? 'completed' : ''
              }`}
              onClick={() => setCurrentStep(index)}
            >
              <div className="progress-number">{index < currentStep ? '✓' : index + 1}</div>
              <div className="progress-label">{_.title}</div>
            </div>
          ))}
        </div>

        <div className="iam-setup-content">
          <h3>{step.title}</h3>
          <p className="step-description">{step.description}</p>
          <div className="step-details">{step.details}</div>
        </div>

        <div className="iam-setup-footer">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            ← Back
          </button>

          <div className="footer-center">
            <span className="step-counter">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {currentStep === steps.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleComplete}
              disabled={!isStepValid()}
            >
              Complete & Deploy →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              Next →
            </button>
          )}
        </div>

        <div className="iam-setup-tips">
          <p>
            💡 <strong>Need help?</strong> Check out the{' '}
            <a href="#" className="link">
              IAM_PERMISSIONS_FIX.md
            </a>{' '}
            guide for detailed instructions and custom policies.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper component: generate a least-privilege policy based on current nodes
function LeastPrivilegePolicy({ nodes }) {
  const serviceActions = useMemo(() => {
    const actions = new Set([
      'cloudformation:CreateStack',
      'cloudformation:UpdateStack',
      'cloudformation:DescribeStacks',
      'cloudformation:DeleteStack',
      'cloudformation:ListStacks',
    ]);

    const has = (type) => nodes?.some(n => n?.data?.serviceType === type);

    // VPC and Networking - Always needed for EC2/network resources
    if (has('vpc') || has('subnet_public') || has('subnet_private') || has('security_group')) {
      [
        'ec2:CreateVpc','ec2:DeleteVpc','ec2:DescribeVpcs',
        'ec2:CreateSubnet','ec2:DeleteSubnet','ec2:DescribeSubnets',
        'ec2:CreateSecurityGroup','ec2:DeleteSecurityGroup','ec2:DescribeSecurityGroups',
        'ec2:AuthorizeSecurityGroupIngress','ec2:AuthorizeSecurityGroupEgress',
        'ec2:RevokeSecurityGroupIngress','ec2:RevokeSecurityGroupEgress',
        'ec2:CreateTags','ec2:DeleteTags','ec2:DescribeTags'
      ].forEach(a => actions.add(a));
    }

    // EC2 Compute
    if (has('ec2')) {
      [
        'ec2:RunInstances','ec2:TerminateInstances','ec2:StopInstances','ec2:StartInstances',
        'ec2:ModifyInstanceAttribute','ec2:DescribeInstances','ec2:GetConsoleOutput',
        'ec2:DescribeKeyPairs','ec2:DescribeImages','ec2:DescribeAvailabilityZones',
        'ssm:GetParameters','ssm:GetParameter' // For AMI lookup via SSM Parameter Store
      ].forEach(a => actions.add(a));
    }

    // Load Balancing (ALB/NLB)
    if (has('alb') || has('nlb')) {
      [
        'elasticloadbalancing:CreateLoadBalancer',
        'elasticloadbalancing:DeleteLoadBalancer',
        'elasticloadbalancing:DescribeLoadBalancers',
        'elasticloadbalancing:ModifyLoadBalancerAttributes',
        'elasticloadbalancing:CreateTargetGroup',
        'elasticloadbalancing:DeleteTargetGroup',
        'elasticloadbalancing:DescribeTargetGroups',
        'elasticloadbalancing:RegisterTargets',
        'elasticloadbalancing:DeregisterTargets',
        'elasticloadbalancing:DescribeTargetHealth',
        'elasticloadbalancing:CreateListener',
        'elasticloadbalancing:DeleteListener',
        'elasticloadbalancing:DescribeListeners',
        'elasticloadbalancing:ModifyListener'
      ].forEach(a => actions.add(a));
    }

    // RDS Databases
    if (has('rds') || has('aurora')) {
      [
        'rds:CreateDBInstance','rds:DeleteDBInstance','rds:ModifyDBInstance',
        'rds:DescribeDBInstances','rds:DescribeDBClusters','rds:DescribeDBParameterGroups',
        'rds:AddTagsToResource','rds:ListTagsForResource',
        'rds:CreateDBSubnetGroup','rds:DeleteDBSubnetGroup','rds:DescribeDBSubnetGroups'
      ].forEach(a => actions.add(a));
    }

    // DynamoDB
    if (has('dynamodb')) {
      [
        'dynamodb:CreateTable','dynamodb:DeleteTable','dynamodb:DescribeTable',
        'dynamodb:UpdateTable','dynamodb:ListTables',
        'dynamodb:TagResource','dynamodb:UntagResource','dynamodb:ListTagsOfResource'
      ].forEach(a => actions.add(a));
    }

    // ElastiCache
    if (has('elasticache')) {
      [
        'elasticache:CreateCacheCluster','elasticache:DeleteCacheCluster',
        'elasticache:DescribeCacheClusters','elasticache:ModifyCacheCluster',
        'elasticache:CreateCacheSubnetGroup','elasticache:DeleteCacheSubnetGroup',
        'elasticache:DescribeCacheSubnetGroups',
        'elasticache:AddTagsToResource','elasticache:ListTagsForResource'
      ].forEach(a => actions.add(a));
    }

    // S3
    if (has('s3')) {
      [
        's3:CreateBucket','s3:DeleteBucket','s3:GetBucketLocation',
        's3:PutBucketVersioning','s3:GetBucketVersioning',
        's3:PutBucketPolicy','s3:GetBucketPolicy','s3:DeleteBucketPolicy',
        's3:PutBucketPublicAccessBlock','s3:GetBucketPublicAccessBlock',
        's3:PutEncryptionConfiguration','s3:GetEncryptionConfiguration',
        's3:PutObject','s3:GetObject','s3:DeleteObject',
        's3:ListBucket','s3:ListBucketVersions',
        's3:PutObjectTagging','s3:GetObjectTagging',
        's3:PutBucketTagging','s3:GetBucketTagging'
      ].forEach(a => actions.add(a));
    }

    // Lambda
    if (has('lambda')) {
      [
        'lambda:CreateFunction','lambda:DeleteFunction','lambda:GetFunction',
        'lambda:UpdateFunctionCode','lambda:UpdateFunctionConfiguration',
        'lambda:ListFunctions','lambda:InvokeFunction',
        'lambda:AddPermission','lambda:RemovePermission',
        'lambda:TagResource','lambda:UntagResource','lambda:ListTags',
        'iam:PassRole','iam:GetRole','iam:CreateRole','iam:DeleteRole',
        'iam:PutRolePolicy','iam:DeleteRolePolicy'
      ].forEach(a => actions.add(a));
    }

    // SQS
    if (has('sqs')) {
      [
        'sqs:CreateQueue','sqs:DeleteQueue','sqs:GetQueueAttributes',
        'sqs:SetQueueAttributes','sqs:ListQueues','sqs:SendMessage','sqs:ReceiveMessage',
        'sqs:DeleteMessage','sqs:PurgeQueue',
        'sqs:TagQueue','sqs:UntagQueueFromResource','sqs:ListQueueTags'
      ].forEach(a => actions.add(a));
    }

    // SNS
    if (has('sns')) {
      [
        'sns:CreateTopic','sns:DeleteTopic','sns:GetTopicAttributes',
        'sns:SetTopicAttributes','sns:ListTopics','sns:Publish',
        'sns:Subscribe','sns:Unsubscribe','sns:ListSubscriptions',
        'sns:TagResource','sns:UntagResource','sns:ListTagsForResource'
      ].forEach(a => actions.add(a));
    }

    // ECS
    if (has('ecs')) {
      [
        'ecs:CreateCluster','ecs:DeleteCluster','ecs:DescribeClusters',
        'ecs:ListClusters','ecs:TagResource','ecs:UntagResource','ecs:ListTagsForResource',
        'ecs:RegisterTaskDefinition','ecs:DeregisterTaskDefinition',
        'ecs:CreateService','ecs:DeleteService','ecs:DescribeServices'
      ].forEach(a => actions.add(a));
    }

    // EKS
    if (has('eks')) {
      [
        'eks:CreateCluster','eks:DeleteCluster','eks:DescribeCluster',
        'eks:ListClusters','eks:UpdateClusterVersion',
        'eks:TagResource','eks:UntagResource','eks:ListTagsForResource',
        'ec2:DescribeSecurityGroups','ec2:DescribeSubnets','ec2:DescribeVpcs',
        'iam:GetRole','iam:PassRole'
      ].forEach(a => actions.add(a));
    }

    // API Gateway
    if (has('apigateway')) {
      [
        'apigateway:POST','apigateway:GET','apigateway:PUT','apigateway:DELETE',
        'apigateway:PATCH','apigateway:TagResource','apigateway:UntagResource',
        'apigateway:UpdateStage'
      ].forEach(a => actions.add(a));
    }

    // CloudFront
    if (has('cloudfront')) {
      [
        'cloudfront:CreateDistribution','cloudfront:DeleteDistribution',
        'cloudfront:GetDistribution','cloudfront:ListDistributions',
        'cloudfront:UpdateDistribution','cloudfront:TagResource','cloudfront:UntagResource',
        'acm:DescribeCertificate','acm:ListCertificates' // For HTTPS support
      ].forEach(a => actions.add(a));
    }

    // CloudWatch Logs and Monitoring (always useful)
    [
      'logs:CreateLogGroup','logs:DeleteLogGroup','logs:DescribeLogGroups',
      'logs:CreateLogStream','logs:DeleteLogStream','logs:DescribeLogStreams',
      'logs:PutLogEvents','logs:GetLogEvents',
      'cloudwatch:PutMetricData','cloudwatch:DescribeAlarms',
      'cloudwatch:DeleteAlarms','cloudwatch:PutMetricAlarm'
    ].forEach(a => actions.add(a));

    return Array.from(actions).sort();
  }, [nodes]);

  const policyDoc = useMemo(() => ({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'CloudFormationStackOps',
        Effect: 'Allow',
        Action: [
          'cloudformation:CreateStack',
          'cloudformation:UpdateStack',
          'cloudformation:DescribeStacks',
          'cloudformation:DeleteStack',
          'cloudformation:ListStacks',
        ],
        Resource: '*'
      },
      {
        Sid: 'ServiceScopedActions',
        Effect: 'Allow',
        Action: serviceActions,
        Resource: '*'
      },
      {
        Sid: 'RestrictPassRole',
        Effect: 'Allow',
        Action: ['iam:PassRole'],
        Resource: '*',
        Condition: {
          StringEquals: {
            'iam:PassedToService': ['lambda.amazonaws.com','ec2.amazonaws.com','eks.amazonaws.com']
          }
        }
      },
      {
        Sid: 'RestrictIAMActions',
        Effect: 'Allow',
        Action: ['iam:CreateRole','iam:DeleteRole','iam:PutRolePolicy','iam:DeleteRolePolicy'],
        Resource: 'arn:aws:iam::*:role/cloudcanvas-*'
      }
    ]
  }), [serviceActions]);

  const [copied, setCopied] = useState(false);

  return (
    <div className="policy-block">
      <p><strong>Custom Policy (copy & paste):</strong></p>
      <pre className="policy-json">{JSON.stringify(policyDoc, null, 2)}</pre>
      <button
        className="btn btn-secondary"
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(policyDoc, null, 2));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >{copied ? '✓ Copied' : 'Copy Policy'}</button>
    </div>
  );
}
