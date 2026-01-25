import { useState } from 'react';
import '../styles/IAMSetupGuide.css';

export default function IAMSetupGuide({ onComplete, onCancel }) {
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
      title: 'Set IAM Permissions',
      description: 'Grant the user permissions to deploy CloudFormation stacks:',
      details: (
        <div>
          <ol className="steps-list">
            <li>
              <strong>On Permissions Page:</strong> Select "Attach policies directly"
            </li>
            <li>
              <strong>Search for Policies:</strong> In the search box, type <code>CloudFormationFullAccess</code>
            </li>
            <li>
              <strong>Select Policy:</strong> Check the box next to <code>CloudFormationFullAccess</code>
            </li>
            <li>
              <strong>Add More Policies (Recommended):</strong> Also search and add:
              <div className="policy-list">
                <span className="policy-tag">CloudFormationReadOnlyAccess</span>
                <span className="policy-tag">EC2FullAccess</span>
                <span className="policy-tag">RDSFullAccess</span>
                <span className="policy-tag">S3FullAccess</span>
                <span className="policy-tag">ElastiCacheFullAccess</span>
              </div>
              <p className="hint">💡 <strong>Tip:</strong> For production, create a custom policy with minimal permissions. See IAM_PERMISSIONS_FIX.md for details.</p>
            </li>
            <li>
              <strong>Click Next:</strong> Review and create user
            </li>
            <li>
              <strong>Click Create User:</strong> Your user is now created!
            </li>
          </ol>
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
