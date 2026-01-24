# AWS Deployment - Quick Start Guide

Get your architecture deployed to AWS in 5 minutes! 🚀

## Prerequisites

✅ **AWS Account** - [Sign up here](https://aws.amazon.com/)  
✅ **IAM User with Permissions** - See setup below  
✅ **CloudCanvas-Architect Running** - `docker-compose up`

## Step 1: Create IAM User (One-time Setup)

### Option A: Using AWS Console

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Add users**
3. Enter username: `cloudcanvas-deployer`
4. Check **Access key - Programmatic access**
5. Click **Next: Permissions**
6. Select **Attach existing policies directly**
7. Search and select `PowerUserAccess` or create custom policy (see below)
8. Click **Next: Tags** → **Next: Review** → **Create user**
9. **IMPORTANT**: Save your Access Key ID and Secret Access Key!

### Option B: Using AWS CLI

```bash
# Create IAM user
aws iam create-user --user-name cloudcanvas-deployer

# Attach policy
aws iam attach-user-policy \
  --user-name cloudcanvas-deployer \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Create access key
aws iam create-access-key --user-name cloudcanvas-deployer
```

### Custom IAM Policy (Minimal Permissions)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ec2:*",
        "rds:*",
        "s3:*",
        "lambda:*",
        "dynamodb:*",
        "elasticloadbalancing:*",
        "iam:CreateRole",
        "iam:PutRolePolicy",
        "iam:AttachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step 2: Design Your Architecture

1. Open CloudCanvas-Architect: http://localhost:5173
2. Login or create an account
3. Drag services onto the canvas:
   - EC2 instance
   - RDS database
   - S3 bucket
   - Load balancer (ALB)
4. Configure each service (click to edit)
5. Connect services if needed
6. Click **"Save"** and name your architecture

## Step 3: Deploy to AWS

### Using the UI

1. Click **"🚀 Deploy to AWS"** button in toolbar
2. Enter your AWS credentials:
   ```
   AWS Access Key ID: AKIA...
   AWS Secret Access Key: wJalr...
   AWS Region: us-east-1
   ```
3. (Optional) Click **"📥 Download Template"** to review
4. Click **"🚀 Deploy Now"**
5. Wait for deployment (usually 5-10 minutes)
6. Check **"Deployment History"** tab for status

### Status Updates

- ⏳ **Creating** - CloudFormation is building your stack
- ✅ **Complete** - All resources created successfully
- ❌ **Failed** - Something went wrong (check error message)

## Step 4: Verify in AWS Console

1. Go to [CloudFormation Console](https://console.aws.amazon.com/cloudformation/)
2. Find your stack (starts with `arch-`)
3. Check **Resources** tab to see created resources
4. Check **Outputs** tab for important info (IPs, endpoints)
5. Check **Events** tab if something failed

## Step 5: Clean Up

### Option A: Using AWS Console
1. Go to CloudFormation Console
2. Select your stack
3. Click **Delete**
4. Confirm deletion
5. Wait for deletion to complete

### Option B: Using AWS CLI
```bash
aws cloudformation delete-stack --stack-name <your-stack-name>
```

## Example: Deploy a Simple Web Application

### Architecture
```
Internet
   ↓
[Application Load Balancer]
   ↓
[EC2 Instance] ← → [RDS MySQL]
   ↓
[S3 Bucket]
```

### Steps

1. **Add Services**
   - Drag ALB to canvas
   - Drag EC2 to canvas
   - Drag RDS to canvas
   - Drag S3 to canvas

2. **Configure EC2**
   - Click EC2 node
   - Set Instance Type: `t2.micro`
   - Set AMI: `ami-0c55b159cbfafe1f0` (Amazon Linux 2)
   - Click Save

3. **Configure RDS**
   - Click RDS node
   - Set Engine: `mysql`
   - Set Instance Class: `db.t3.micro`
   - Set Storage: `20` GB
   - Click Save

4. **Save Architecture**
   - Click "Save" button
   - Name: "My Web App"
   - Click Save

5. **Deploy**
   - Click "🚀 Deploy to AWS"
   - Enter AWS credentials
   - Region: `us-east-1`
   - Click "Deploy Now"

6. **Wait & Verify**
   - Status will change to "Creating"
   - After 5-10 minutes: "Complete"
   - Copy Stack ID
   - Go to AWS Console to verify

### Expected Cost
```
EC2 t2.micro:    ~$8/month
RDS db.t3.micro: ~$13/month
ALB:             ~$16/month
S3:              ~$0.02/GB
Total:           ~$37/month
```

## Troubleshooting

### "Invalid credentials"
- ✅ Check Access Key ID (starts with AKIA)
- ✅ Check Secret Access Key (no spaces)
- ✅ Verify credentials in AWS Console

### "Insufficient permissions"
- ✅ Attach `PowerUserAccess` policy to IAM user
- ✅ Or use custom policy with required permissions
- ✅ Ensure IAM permissions allow `iam:PassRole`

### "Stack creation failed"
- ✅ Check error message in Deployment History
- ✅ Go to AWS CloudFormation Console → Events
- ✅ Common issues:
  - Invalid AMI ID for region
  - Service quotas exceeded
  - Resource naming conflicts
  - Missing VPC/subnet configuration

### "Architecture not found"
- ✅ Save your architecture first
- ✅ Refresh the page
- ✅ Login again

### "Template validation error"
- ✅ Download template and check JSON
- ✅ Verify all required parameters
- ✅ Check resource dependencies

## Best Practices

### 1. Start Small
```
Day 1: Single EC2 instance
Day 2: EC2 + RDS
Day 3: Full architecture
```

### 2. Use Test Environment
```
Create separate AWS account for testing
Set billing alerts ($10, $50, $100)
Clean up resources after testing
```

### 3. Review Before Deploy
```
Always download template first
Check resource types and sizes
Verify estimated costs
Review security settings
```

### 4. Monitor Costs
```
Set up AWS Cost Explorer
Enable billing alerts
Tag all resources
Delete unused stacks
```

### 5. Security
```
Use dedicated IAM user
Rotate credentials monthly
Never commit credentials to Git
Enable MFA on AWS account
Use temporary credentials (AWS STS)
```

## Advanced Usage

### Deploy to Multiple Regions
```
1. Deploy to us-east-1
2. Export architecture
3. Change region to eu-west-1
4. Deploy again
```

### Custom CloudFormation
```
1. Download template
2. Edit JSON (add custom resources)
3. Deploy via AWS Console or CLI
```

### Integrate with CI/CD
```bash
# Example: Deploy via CLI
curl -X POST http://localhost:5000/api/deployments \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "architectureId": 1,
    "awsAccessKeyId": "$AWS_ACCESS_KEY",
    "awsSecretAccessKey": "$AWS_SECRET_KEY",
    "awsRegion": "us-east-1"
  }'
```

## FAQ

**Q: Are my AWS credentials stored?**  
A: No, credentials are only used for deployment and never stored.

**Q: Can I update an existing stack?**  
A: Not currently. You need to delete and redeploy.

**Q: What happens if deployment fails?**  
A: CloudFormation automatically rolls back changes.

**Q: Can I deploy to multiple regions?**  
A: Yes, deploy separately to each region.

**Q: How do I delete deployed resources?**  
A: Delete the CloudFormation stack in AWS Console.

**Q: Is this production-ready?**  
A: Yes, but always review templates and test first.

**Q: What services are supported?**  
A: 15+ services including EC2, RDS, Lambda, S3, DynamoDB.

**Q: Can I export to Terraform?**  
A: Not yet, coming in future release.

## Quick Reference

### Keyboard Shortcuts
```
Ctrl/Cmd + E    Export architecture
Ctrl/Cmd + K    Open templates
Delete          Remove selected
Ctrl/Cmd + Z    Undo
Ctrl/Cmd + Y    Redo
```

### API Endpoints
```
POST   /api/deployments              Deploy now
GET    /api/deployments/:id/status   Check status
GET    /api/deployments/preview/:id  Download template
```

### AWS Console Links
- **CloudFormation**: https://console.aws.amazon.com/cloudformation/
- **EC2**: https://console.aws.amazon.com/ec2/
- **RDS**: https://console.aws.amazon.com/rds/
- **IAM**: https://console.aws.amazon.com/iam/
- **Billing**: https://console.aws.amazon.com/billing/

## Next Steps

After successful deployment:

1. ✅ Verify all resources in AWS Console
2. ✅ Test your deployed application
3. ✅ Set up monitoring (CloudWatch)
4. ✅ Configure backups
5. ✅ Review security groups
6. ✅ Set up auto-scaling (if needed)
7. ✅ Configure DNS (Route 53)
8. ✅ Set up SSL certificate (ACM)

## Getting Help

📚 **Full Documentation**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)  
🧪 **Testing Guide**: [DEPLOYMENT_TESTING.md](./DEPLOYMENT_TESTING.md)  
📖 **API Docs**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)  
💬 **Community**: [GitHub Issues](https://github.com/your-repo/issues)

## Congratulations! 🎉

You've successfully deployed your first architecture to AWS using CloudCanvas-Architect!

**What's Next?**
- Try deploying more complex architectures
- Experiment with different AWS services
- Share your deployments with your team
- Provide feedback for improvements

Happy deploying! ☁️🚀
