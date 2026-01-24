# Deployment Feature Testing Checklist

This document provides a comprehensive testing checklist for the AWS deployment feature.

## Prerequisites

Before testing, ensure you have:
- [ ] Running backend and frontend (via Docker or locally)
- [ ] Valid AWS account with credentials
- [ ] IAM user with CloudFormation permissions
- [ ] Test architecture saved in the application

## Manual Testing Checklist

### 1. UI/UX Testing

#### Deployment Modal
- [ ] Click "🚀 Deploy to AWS" button opens modal
- [ ] Modal has two tabs: "Deploy New" and "Deployment History"
- [ ] "Deploy New" tab is active by default
- [ ] Security warning is visible
- [ ] All form fields render correctly
- [ ] Region dropdown contains 10 AWS regions
- [ ] Close button (✕) closes modal
- [ ] Click outside modal closes it
- [ ] Modal is responsive on different screen sizes

#### Form Validation
- [ ] Empty AWS Access Key shows error
- [ ] Empty AWS Secret Key shows error
- [ ] Empty architecture shows error
- [ ] Valid form enables "Deploy Now" button
- [ ] Invalid form disables "Deploy Now" button

### 2. Functional Testing

#### Auto-Save Feature
- [ ] Unsaved architecture prompts for name
- [ ] Canceling name prompt aborts deployment
- [ ] Entering name saves and continues deployment
- [ ] Already saved architecture skips prompt

#### Template Download
- [ ] Click "📥 Download Template" downloads JSON file
- [ ] Filename format: `cloudformation-<arch-name>-<timestamp>.json`
- [ ] Downloaded file contains valid CloudFormation JSON
- [ ] Template includes all services from canvas
- [ ] Template has proper structure (Parameters, Resources, Outputs)

#### Deployment Creation
- [ ] Valid credentials initiate deployment
- [ ] Invalid credentials show error message
- [ ] Deployment success shows success message
- [ ] Success includes CloudFormation Stack ID
- [ ] Credentials are cleared after successful deployment
- [ ] Tab switches to "Deployment History" after success

#### Status Polling
- [ ] Status updates automatically every 10 seconds
- [ ] Creating status shows ⏳ Creating badge
- [ ] Complete status shows ✅ Complete badge
- [ ] Failed status shows ❌ Failed badge
- [ ] Polling stops when status is terminal (complete/failed)

#### Deployment History
- [ ] Switch to "Deployment History" tab shows list
- [ ] Empty state shows appropriate message
- [ ] Deployments are ordered by date (newest first)
- [ ] Each deployment shows:
  - [ ] Status badge
  - [ ] AWS region
  - [ ] Stack ID
  - [ ] Creation timestamp
  - [ ] Error message (if failed)
- [ ] Refresh button reloads history
- [ ] Delete button removes deployment record

### 3. API Testing

#### Create Deployment Endpoint
```bash
# Test: POST /api/deployments
curl -X POST http://localhost:5000/api/deployments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "architectureId": 1,
    "awsAccessKeyId": "AKIA...",
    "awsSecretAccessKey": "...",
    "awsRegion": "us-east-1"
  }'
```
- [ ] Returns 201 status code
- [ ] Returns deployment object with ID
- [ ] Returns CloudFormation Stack ID
- [ ] Status is "creating"

#### Get Deployment Endpoint
```bash
# Test: GET /api/deployments/:id
curl http://localhost:5000/api/deployments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 200 status code
- [ ] Returns deployment details
- [ ] Returns 404 for non-existent deployment
- [ ] Returns 403 for other user's deployment

#### Check Status Endpoint
```bash
# Test: GET /api/deployments/:id/status
curl http://localhost:5000/api/deployments/1/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns current status
- [ ] With credentials, fetches real-time status from AWS
- [ ] Without credentials, returns stored status

#### Preview Template Endpoint
```bash
# Test: GET /api/deployments/preview/:architectureId
curl http://localhost:5000/api/deployments/preview/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns CloudFormation template
- [ ] Template is valid JSON
- [ ] Includes all architecture services

#### Get Deployment History
```bash
# Test: GET /api/deployments/architecture/:architectureId
curl http://localhost:5000/api/deployments/architecture/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns array of deployments
- [ ] Ordered by creation date
- [ ] Only returns user's deployments

#### Delete Deployment
```bash
# Test: DELETE /api/deployments/:id
curl -X DELETE http://localhost:5000/api/deployments/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 200 status code
- [ ] Removes deployment from database
- [ ] Returns 404 for non-existent deployment
- [ ] Returns 403 for other user's deployment

### 4. CloudFormation Template Testing

#### Template Structure
- [ ] Contains "AWSTemplateFormatVersion"
- [ ] Contains "Description"
- [ ] Contains "Parameters" section (if needed)
- [ ] Contains "Resources" section
- [ ] Contains "Outputs" section

#### Template Content
- [ ] All canvas services are included
- [ ] Service names match canvas labels
- [ ] Logical IDs are sanitized (no special characters)
- [ ] Resources have proper tags
- [ ] Sensitive data uses parameters

#### Service-Specific Tests
For each service type, verify:
- [ ] **EC2**: Instance type, AMI, tags
- [ ] **RDS**: Engine, instance class, storage, password parameter
- [ ] **Lambda**: Runtime, handler, IAM role reference
- [ ] **S3**: Bucket name, encryption, versioning
- [ ] **DynamoDB**: Table name, billing mode, key schema
- [ ] **VPC**: CIDR block, DNS settings
- [ ] **ALB**: Name, scheme, type
- [ ] **SQS**: Queue name, visibility timeout
- [ ] **SNS**: Topic name
- [ ] **ECS**: Cluster name, capacity providers

### 5. Error Handling Testing

#### Client-Side Errors
- [ ] Missing credentials show error
- [ ] Empty architecture shows error
- [ ] Network errors are caught and displayed
- [ ] API errors are displayed to user

#### Server-Side Errors
- [ ] Invalid credentials return 400
- [ ] Missing architecture returns 404
- [ ] Database errors return 500
- [ ] CloudFormation errors are captured
- [ ] Error messages are logged

### 6. Security Testing

#### Authentication
- [ ] All endpoints require authentication
- [ ] Invalid token returns 401
- [ ] Expired token returns 401
- [ ] Missing token returns 401

#### Authorization
- [ ] Users can only access their deployments
- [ ] Users cannot access others' deployments
- [ ] Users cannot deploy others' architectures

#### Credentials
- [ ] AWS credentials are not stored in database
- [ ] Credentials are not logged
- [ ] Credentials are cleared from frontend
- [ ] Credentials are sent over HTTPS only

### 7. Integration Testing

#### Full Deployment Flow
1. [ ] Create architecture on canvas
2. [ ] Add EC2, RDS, S3 services
3. [ ] Configure services
4. [ ] Save architecture
5. [ ] Click "Deploy to AWS"
6. [ ] Enter valid AWS credentials
7. [ ] Click "Deploy Now"
8. [ ] Verify deployment created in database
9. [ ] Verify CloudFormation stack in AWS Console
10. [ ] Watch status change to "complete"
11. [ ] View in deployment history
12. [ ] Delete deployment record

### 8. Edge Cases

- [ ] Deploy empty architecture (should fail)
- [ ] Deploy with invalid AWS credentials
- [ ] Deploy with insufficient IAM permissions
- [ ] Deploy to unsupported region
- [ ] Deploy with very long architecture name
- [ ] Deploy with special characters in names
- [ ] Multiple simultaneous deployments
- [ ] Network failure during deployment
- [ ] Refresh page during deployment

### 9. Performance Testing

- [ ] Template generation < 1 second
- [ ] Deployment creation < 2 seconds
- [ ] Status check < 500ms
- [ ] History load < 1 second
- [ ] Large architecture (50+ services) performance

### 10. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

### 11. Database Testing

#### Migrations
- [ ] `deployments` table created
- [ ] Foreign keys work correctly
- [ ] Cascade delete works (architecture deletion)
- [ ] Timestamps auto-update

#### Data Integrity
- [ ] Deployment records persist correctly
- [ ] Audit logs created for deployments
- [ ] No orphaned records

### 12. Real AWS Testing

⚠️ **Warning**: This will create actual AWS resources and may incur costs.

#### Simple Architecture
- [ ] Deploy single EC2 instance
- [ ] Verify instance created in AWS Console
- [ ] Check instance tags
- [ ] Verify stack outputs
- [ ] Delete stack manually

#### Complex Architecture
- [ ] Deploy EC2 + RDS + S3 + ALB
- [ ] Verify all resources created
- [ ] Check resource relationships
- [ ] Verify security groups
- [ ] Check IAM roles (for Lambda)
- [ ] Delete stack manually

#### Failed Deployment
- [ ] Deploy with invalid AMI
- [ ] Verify status changes to "failed"
- [ ] Check error message
- [ ] Verify partial rollback in AWS

## Test Results Template

Use this template to document test results:

```markdown
## Test Run: [Date]

**Tester**: [Name]
**Environment**: [Local/Docker/Production]
**Branch**: [Git branch]

### Results
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W

### Failed Tests
1. [Test name] - [Reason]
2. [Test name] - [Reason]

### Notes
- [Any observations]
- [Performance issues]
- [Suggestions]

### Screenshots
[Attach screenshots of failures]
```

## Automated Testing (Future)

Recommended test automation:
- [ ] Unit tests for CloudFormation generator
- [ ] Integration tests for API endpoints
- [ ] E2E tests for deployment flow
- [ ] Mock AWS SDK for testing
- [ ] CI/CD pipeline integration

## Bug Report Template

```markdown
**Title**: [Brief description]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Environment**:
- Browser: [Chrome/Firefox/etc]
- OS: [Windows/Mac/Linux]
- Version: [App version]

**Screenshots**:
[Attach screenshots]

**Console Errors**:
[Paste console errors]

**Additional Context**:
[Any other relevant info]
```

## Success Criteria

The deployment feature is considered fully tested when:
- [ ] All manual tests pass
- [ ] All API tests pass
- [ ] At least one successful real AWS deployment
- [ ] Error handling verified
- [ ] Security tests pass
- [ ] Documentation is complete
- [ ] No critical bugs found

## Notes

- Always test in a development AWS account first
- Clean up AWS resources after testing
- Monitor AWS costs during testing
- Keep test credentials secure
- Document any issues found

---

**Happy Testing!** 🧪
