# AWS Deployment Guide

This guide explains how to deploy your architecture designs directly to AWS using CloudCanvas-Architect.

## Overview

The deployment feature allows you to:
- 🚀 Deploy your architecture directly to AWS
- 📥 Download CloudFormation templates
- 📊 Track deployment history
- ⏱️ Monitor deployment status in real-time
- 🗑️ Manage deployment records

## Prerequisites

Before deploying to AWS, ensure you have:

1. **AWS Account**: An active AWS account
2. **AWS Credentials**: Access Key ID and Secret Access Key with appropriate permissions
3. **Architecture Design**: A saved architecture with AWS services

### Required AWS Permissions

Your IAM user should have permissions to:
- Create CloudFormation stacks (`cloudformation:CreateStack`)
- Create/manage resources defined in your architecture (EC2, RDS, S3, etc.)
- IAM role creation and passing (for Lambda functions)

**Recommended**: Create a dedicated IAM user with the `PowerUserAccess` managed policy or custom permissions.

**⚠️ Getting Permission Errors?** See [IAM_PERMISSIONS_FIX.md](./IAM_PERMISSIONS_FIX.md) for step-by-step instructions.

### Security Best Practices

⚠️ **IMPORTANT SECURITY NOTES**:

1. **Never commit AWS credentials** to version control
2. **Use temporary credentials** when possible (AWS STS)
3. **Create a dedicated IAM user** with minimal required permissions
4. **Enable MFA** on your AWS account
5. **Rotate credentials regularly**
6. **Review CloudFormation templates** before deploying

## Getting Started

### Step 1: Design Your Architecture

1. Use the drag-and-drop canvas to add AWS services
2. Configure each service (instance types, regions, etc.)
3. Connect services to show relationships
4. Save your architecture (File > Save)

### Step 2: Review CloudFormation Template (Optional)

Before deploying, you can preview and download the CloudFormation template:

1. Click **"🚀 Deploy to AWS"** button
2. Click **"📥 Download Template"** button
3. Review the generated CloudFormation JSON
4. Verify all resources match your expectations

### Step 3: Deploy to AWS

1. Click **"🚀 Deploy to AWS"** button in the toolbar
2. Select **"Deploy New"** tab
3. Enter your AWS credentials:
   - **AWS Access Key ID**: Your IAM user access key (e.g., `AKIA...`)
   - **AWS Secret Access Key**: Your secret key
   - **AWS Region**: Target region for deployment
4. Review the deployment information:
   - Number of services to deploy
   - Number of connections
5. Click **"🚀 Deploy Now"**

### Step 4: Monitor Deployment

After initiating deployment:

1. The deployment will appear in the **"Deployment History"** tab
2. Status updates automatically:
   - ⏳ **Creating**: Stack is being created
   - ✅ **Complete**: Deployment successful
   - ❌ **Failed**: Deployment failed (check error message)
   - ↩️ **Rolled Back**: CloudFormation rolled back changes

3. View deployment details:
   - CloudFormation Stack ID
   - Region
   - Creation time
   - Error messages (if any)

## Supported AWS Services

The CloudFormation generator supports the following services:

### Compute
- **EC2**: Virtual machines with custom AMI, instance types, security groups
- **Lambda**: Serverless functions with configurable runtime, memory, timeout
- **ECS**: Container orchestration with Fargate support
- **EKS**: Kubernetes clusters

### Storage
- **S3**: Object storage with versioning and encryption
- **EFS**: Elastic File System (coming soon)

### Database
- **RDS**: Relational databases (MySQL, PostgreSQL, etc.)
- **DynamoDB**: NoSQL database with on-demand or provisioned capacity
- **ElastiCache**: In-memory caching (Redis, Memcached)

### Networking
- **VPC**: Virtual Private Cloud with custom CIDR
- **ALB**: Application Load Balancer
- **CloudFront**: CDN distribution
- **API Gateway**: REST and HTTP APIs

### Messaging
- **SQS**: Message queuing
- **SNS**: Pub/sub messaging

## Configuration Options

### EC2 Configuration
```javascript
{
  instanceType: 't2.micro',
  amiId: 'ami-xxxxx',
  keyName: 'my-key-pair',
  securityGroups: ['sg-xxxxx'],
  userData: '#!/bin/bash\necho "Hello World"'
}
```

### RDS Configuration
```javascript
{
  engine: 'mysql',
  engineVersion: '8.0.35',
  dbInstanceClass: 'db.t3.micro',
  allocatedStorage: '20',
  multiAZ: false,
  publiclyAccessible: false
}
```

### Lambda Configuration
```javascript
{
  runtime: 'nodejs20.x',
  handler: 'index.handler',
  timeout: 30,
  memorySize: 128,
  environment: {
    NODE_ENV: 'production'
  }
}
```

### S3 Configuration
```javascript
{
  versioning: true,
  blockPublicAccess: true,
  bucketName: 'my-bucket'
}
```

## CloudFormation Template Features

Generated templates include:

### Parameters
- Sensitive data (database passwords) as parameters
- Default values provided
- Validation rules

### Resources
- All configured AWS services
- Proper resource naming and tagging
- Security best practices (encryption, access control)
- IAM roles for Lambda functions

### Outputs
- Important resource identifiers
- Endpoints and URLs
- Cross-stack exports

### Tags
- All resources tagged with:
  - `Name`: Resource name from your design
  - `ManagedBy`: CloudCanvas-Architect

## Deployment History

View all your deployments in the **"Deployment History"** tab:

- **Status**: Current deployment status with color-coded badges
- **Region**: AWS region where deployed
- **Stack ID**: CloudFormation stack identifier
- **Timestamps**: Creation and completion times
- **Actions**: Delete deployment records

### Managing Deployments

- **Refresh**: Click refresh button to update statuses
- **Delete Record**: Remove deployment record from database
  - ⚠️ **Note**: This does NOT delete the AWS stack. Delete manually in AWS Console.

## Troubleshooting

### Common Issues

#### "Architecture not found"
- **Solution**: Save your architecture before deploying

#### "Invalid credentials"
- **Solution**: Verify your AWS Access Key ID and Secret Access Key
- Check if credentials are active in IAM console

#### "Insufficient permissions"
- **Solution**: Ensure IAM user has necessary permissions
- Grant `cloudformation:*` and resource-specific permissions

#### "Stack creation failed"
- **Solution**: Check error message in deployment history
- Common causes:
  - Invalid AMI ID for region
  - Missing VPC/subnet configuration
  - Service quotas exceeded
  - Resource naming conflicts

#### "Template validation error"
- **Solution**: Download template and validate manually
- Check for missing required parameters
- Verify resource dependencies

### Viewing Detailed Errors

1. Go to **AWS CloudFormation Console**
2. Find your stack by Stack ID
3. Check **Events** tab for detailed error messages
4. Review **Resources** tab for failed resources

## Manual Stack Management

### Updating Stacks
Currently, stack updates are not supported through the UI. To update:
1. Download the template
2. Make manual changes
3. Update via AWS Console or AWS CLI

### Deleting Stacks
To delete a deployed stack:
1. Go to **AWS CloudFormation Console**
2. Select the stack
3. Click **Delete**
4. Confirm deletion

**Note**: Deleting a stack will delete all resources created by it.

## Advanced Usage

### Custom CloudFormation Templates

You can download and customize templates:

1. Click **"📥 Download Template"**
2. Edit the JSON file:
   - Add custom resources
   - Modify properties
   - Add conditions or mappings
3. Deploy via AWS Console or CLI

### Using AWS CLI

Deploy downloaded templates using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name my-architecture \
  --template-body file://template.json \
  --parameters ParameterKey=DBPassword,ParameterValue=MySecurePassword123! \
  --capabilities CAPABILITY_IAM
```

### Terraform Export (Coming Soon)

Future versions will support exporting to Terraform format.

## API Reference

### Backend Endpoints

#### Create Deployment
```
POST /api/deployments
Body: {
  architectureId: number,
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  awsRegion: string
}
```

#### Get Deployment Status
```
GET /api/deployments/:id/status
Query: {
  awsAccessKeyId?: string,  // Optional for real-time polling
  awsSecretAccessKey?: string
}
```

#### Preview CloudFormation Template
```
GET /api/deployments/preview/:architectureId
```

#### Get Deployment History
```
GET /api/deployments/architecture/:architectureId
```

#### Delete Deployment Record
```
DELETE /api/deployments/:id
```

## Limitations

Current limitations:
- No stack updates (only create)
- No stack deletion through UI
- Limited to supported AWS services
- No cost estimation before deployment
- No rollback control through UI

## Roadmap

Planned features:
- 🔄 Stack updates
- 🗑️ Stack deletion through UI
- 💰 Pre-deployment cost estimation
- 🔐 AWS SSO integration
- 🏗️ Terraform export
- 📊 Resource monitoring post-deployment
- 🔔 Deployment notifications
- 🔒 AWS Secrets Manager integration
- 🌍 Multi-region deployments

## Best Practices

1. **Start Small**: Deploy simple architectures first
2. **Test in Dev**: Use separate AWS account for testing
3. **Review Templates**: Always review before deploying
4. **Tag Resources**: Use consistent tagging strategy
5. **Monitor Costs**: Check AWS billing regularly
6. **Clean Up**: Delete unused stacks to avoid charges
7. **Use Parameters**: For sensitive data like passwords
8. **Version Control**: Keep templates in version control (without credentials)

## Support

For issues or questions:
- Check the [main README](./README.md)
- Review [API Documentation](./API_DOCUMENTATION.md)
- Check deployment history for error messages
- Review CloudFormation events in AWS Console

## Security Considerations

### Credential Handling
- Credentials are NOT stored in the database
- Sent over HTTPS only
- Used only for deployment request
- Cleared from browser after use

### Infrastructure Security
Generated templates follow AWS security best practices:
- Encryption enabled by default
- Public access blocked where appropriate
- Proper IAM roles and policies
- Security groups configured

### Recommendations
1. Use temporary credentials (AWS STS)
2. Enable CloudTrail for audit logging
3. Review IAM permissions regularly
4. Enable AWS Config for compliance
5. Use AWS Organizations for multi-account setups

## Examples

### Example 1: Simple Web Application

**Architecture**:
- 1x EC2 instance (web server)
- 1x RDS MySQL database
- 1x S3 bucket (static assets)
- 1x ALB (load balancer)

**Steps**:
1. Design architecture on canvas
2. Configure EC2 instance type and AMI
3. Configure RDS engine and size
4. Download and review template
5. Deploy to AWS

### Example 2: Serverless API

**Architecture**:
- 3x Lambda functions
- 1x API Gateway
- 1x DynamoDB table
- 1x S3 bucket

**Steps**:
1. Add Lambda functions with runtime configuration
2. Add API Gateway
3. Add DynamoDB with key schema
4. Connect components
5. Deploy to AWS

## Conclusion

The AWS deployment feature streamlines the process of turning your architecture designs into real AWS infrastructure. Always follow security best practices and review templates before deploying.

Happy deploying! 🚀
