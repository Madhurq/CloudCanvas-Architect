# Quick Fix: AWS IAM Permissions Error

## Error Message
```
User: arn:aws:iam::929185123257:user/trial is not authorized to perform: 
cloudformation:CreateStack on resource: arn:aws:cloudformation:ap-south-1:929185123257:stack/arch-1-1769280886302/*
```

## Problem
Your IAM user `trial` doesn't have permission to create CloudFormation stacks.

## Solution (Choose One)

### Option 1: Quick Fix - Attach PowerUserAccess Policy (Recommended for Testing)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → Select `trial`
3. Click **Add permissions** → **Attach policies directly**
4. Search for `PowerUserAccess`
5. Check the box and click **Next** → **Add permissions**

**Note**: PowerUserAccess gives broad permissions. For production, use Option 2.

### Option 2: Custom Policy (Recommended for Production)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Policies** → **Create policy**
3. Click **JSON** tab
4. Paste this policy:

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
        "iam:PassRole",
        "iam:GetRole"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Click **Next**
6. Name it: `CloudCanvasDeploymentPolicy`
7. Click **Create policy**
8. Go back to **Users** → Select `trial`
9. Click **Add permissions** → **Attach policies directly**
10. Search for `CloudCanvasDeploymentPolicy`
11. Check the box and click **Next** → **Add permissions**

### Option 3: Minimal Permissions (Most Secure)

If you only need specific services, use this minimal policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DeleteStack",
        "cloudformation:UpdateStack",
        "cloudformation:GetTemplate",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:DescribeInstances",
        "rds:CreateDBInstance",
        "rds:DescribeDBInstances",
        "s3:CreateBucket",
        "s3:PutObject",
        "lambda:CreateFunction",
        "lambda:InvokeFunction",
        "iam:CreateRole",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## Verify Permissions

After attaching the policy:

1. Wait 1-2 minutes for permissions to propagate
2. Try deploying again in CloudCanvas-Architect
3. If it still fails, check:
   - Policy is attached to the correct user
   - No conflicting deny policies
   - Region permissions (some services are region-specific)

## Using AWS CLI

You can also attach the policy via CLI:

```bash
# Attach PowerUserAccess
aws iam attach-user-policy \
  --user-name trial \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Or create and attach custom policy
aws iam create-policy \
  --policy-name CloudCanvasDeploymentPolicy \
  --policy-document file://policy.json

aws iam attach-user-policy \
  --user-name trial \
  --policy-arn arn:aws:iam::929185123257:policy/CloudCanvasDeploymentPolicy
```

## Required Permissions Summary

### Minimum Required
- `cloudformation:CreateStack` - Create stacks
- `cloudformation:DescribeStacks` - Check status
- `cloudformation:DeleteStack` - Delete stacks (optional)

### For Each Service Type
- **EC2**: `ec2:*` or specific actions
- **RDS**: `rds:*` or specific actions
- **S3**: `s3:*` or specific actions
- **Lambda**: `lambda:*` + `iam:CreateRole`, `iam:PassRole`
- **ALB**: `elasticloadbalancing:*`
- **DynamoDB**: `dynamodb:*`

### IAM Permissions (for Lambda)
- `iam:CreateRole` - Create IAM roles for Lambda
- `iam:PutRolePolicy` - Attach policies to roles
- `iam:PassRole` - Allow CloudFormation to pass roles
- `iam:GetRole` - Read role details

## Troubleshooting

### Still Getting Permission Errors?

1. **Check Policy Attachment**
   ```bash
   aws iam list-attached-user-policies --user-name trial
   ```

2. **Check Inline Policies**
   ```bash
   aws iam list-user-policies --user-name trial
   ```

3. **Check for Deny Policies**
   - Look for any policies with `"Effect": "Deny"`
   - Deny policies override Allow policies

4. **Check Service-Specific Permissions**
   - Some services need additional permissions
   - Check CloudFormation events for specific errors

5. **Region-Specific Issues**
   - Some services aren't available in all regions
   - Ensure your region supports the service

### Common Errors

#### "AccessDenied: User is not authorized to perform: iam:PassRole"
**Fix**: Add `iam:PassRole` permission to your policy

#### "AccessDenied: User is not authorized to perform: ec2:RunInstances"
**Fix**: Add `ec2:*` or `ec2:RunInstances` permission

#### "AccessDenied: User is not authorized to perform: rds:CreateDBInstance"
**Fix**: Add `rds:*` or `rds:CreateDBInstance` permission

## Security Best Practices

1. **Use Least Privilege**: Only grant permissions you need
2. **Use Separate IAM User**: Don't use root account credentials
3. **Enable MFA**: Add multi-factor authentication
4. **Rotate Credentials**: Change access keys regularly
5. **Use Temporary Credentials**: Consider AWS STS for short-lived credentials
6. **Monitor Usage**: Enable CloudTrail to audit actions

## Next Steps

After fixing permissions:
1. ✅ Try deploying again
2. ✅ Monitor CloudFormation console for progress
3. ✅ Check deployment history in CloudCanvas-Architect
4. ✅ Verify resources are created in AWS Console

## Need Help?

- **AWS IAM Documentation**: https://docs.aws.amazon.com/iam/
- **CloudFormation Permissions**: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-template.html
- **CloudCanvas Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**Quick Command Reference:**

```bash
# Check current policies
aws iam list-attached-user-policies --user-name trial

# Attach PowerUserAccess (quick fix)
aws iam attach-user-policy \
  --user-name trial \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Test permissions
aws cloudformation describe-stacks --region ap-south-1
```
