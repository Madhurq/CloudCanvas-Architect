# IAM Setup Guide Feature

## Overview
A comprehensive, step-by-step interactive guide that walks users through creating an AWS IAM user and generating credentials needed for CloudCanvas deployments.

## Features

### 🎯 Four-Step Wizard
1. **Create IAM User** - Clear instructions on how to create a new IAM user in AWS Console
2. **Set Permissions** - Guide users through granting CloudFormation and required service permissions
3. **Generate Access Keys** - Step-by-step instructions to create and obtain AWS credentials
4. **Paste Credentials** - Interactive form to enter and verify access keys

### 🎨 User Experience
- **Auto-Open on First Deploy** - Automatically shows guide when user clicks Deploy for the first time
- **Manual Access** - "📖 Need Help?" link in the Access Key field to reopen guide anytime
- **Progress Indicators** - Visual progress bar showing which step user is on
- **Step Navigation** - Click on any step to jump to it, navigate with Back/Next buttons
- **Copy Buttons** - Easy copying of credential fields

### 🔒 Security Features
- Password-masked input fields for credentials
- Show/Hide toggle for secret access key
- Security best practices section with 5 key recommendations
- Clear warning about credential safety
- Credentials cleared from form after successful deployment

### 📚 Comprehensive Instructions
- Direct links to AWS Console
- Policy recommendations with searchable names
- Policy tags showing: CloudFormationFullAccess, EC2FullAccess, RDSFullAccess, S3FullAccess, ElastiCacheCost
- Hints and tips throughout the guide
- Link to IAM_PERMISSIONS_FIX.md for custom policies

## User Flow

```
User clicks "Deploy" button
↓
First time? → IAM Setup Guide opens
↓
User follows 4 steps with interactive instructions
↓
Step 4: User pastes their AWS credentials
↓
"Complete & Deploy" button transfers credentials to deployment form
↓
Guide closes, user sees deployment form with credentials pre-filled
↓
Deploy as normal
```

## Component Structure

### Files Created
1. `Frontend/src/components/IAMSetupGuide.jsx` - Main guide component
2. `Frontend/src/styles/IAMSetupGuide.css` - Comprehensive styling

### Files Modified
1. `Frontend/src/components/DeploymentPanel.jsx` - Integrated guide, added state management
2. `Frontend/src/styles/DeploymentPanel.css` - Added help-link button styling

## Key Features

### Smart Auto-Open
- Only shows on first deployment attempt
- Dismisses with localStorage flag (`iam-guide-dismissed-once`)
- Users can reopen anytime via "Need Help?" link

### Interactive Form (Step 4)
```jsx
- Access Key ID input with copy button
- Secret Access Key input with show/hide toggle and copy button
- Form validation (both fields required before completion)
- Security best practices checklist
```

### Step Progress
- Visual progress indicator with 4 steps
- Current step highlighted
- Completed steps marked with checkmark
- Click any step to jump to it

### Responsive Design
- Works on mobile (progress labels hidden on small screens)
- Scrollable content area
- Touch-friendly buttons
- Modal overlay design

## Integration Points

1. **Deploy Modal Opens** → Auto-shows guide if first-time
2. **User Completes Guide** → Credentials transferred to deployment form
3. **Help Link** → Allows manual reopening of guide
4. **Cancel Button** → Sets dismiss flag, closes modal

## Styling Highlights

- Dark theme compatible
- Smooth animations (fadeIn, slideUp)
- Color-coded steps and policies
- Professional card-based design
- Consistent with CloudCanvas design system

## Accessibility
- Proper label associations
- ARIA-friendly button labels
- Keyboard navigation support
- High contrast colors
- Clear visual feedback

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS Safari, Android Chrome)
- Fallback styling for older browsers

## Future Enhancements
- Video walkthrough for visual learners
- Custom IAM policy generator
- AWS credential validation check
- Integration with AWS Cognito for automatic auth
- Credential encryption in browser storage
