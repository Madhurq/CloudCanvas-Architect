import { CloudFormationClient, CreateStackCommand, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import pool from '../config/database.js';
import logger from '../config/logger.js';
import { formatResponse } from '../utils/helpers.js';
import { generateCloudFormationTemplate } from '../services/cloudFormationGenerator.js';

/**
 * Safely parse JSON - handles both string and object inputs
 * @param {string|object} data - JSON string or already parsed object
 * @returns {object} Parsed object
 */
const safeJsonParse = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.error('JSON parse error:', error);
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  } else if (typeof data === 'object' && data !== null) {
    // Already an object, return as-is
    return data;
  } else {
    throw new Error(`Cannot parse data: expected string or object, got ${typeof data}`);
  }
};

/**
 * Create a new deployment by submitting a CloudFormation stack to AWS
 * Request body: { architectureId, awsAccessKeyId, awsSecretAccessKey, awsRegion }
 */
export const createDeployment = async (req, res) => {
  const { architectureId, awsAccessKeyId, awsSecretAccessKey, awsRegion } = req.body;
  const userId = req.user.userId;

  if (!architectureId || !awsAccessKeyId || !awsSecretAccessKey || !awsRegion) {
    return res.status(400).json(
      formatResponse(false, null, 'Missing required fields: architectureId, awsAccessKeyId, awsSecretAccessKey, awsRegion')
    );
  }

  try {
    // Fetch architecture
    const archResult = await pool.query(
      'SELECT * FROM architectures WHERE id = $1 AND user_id = $2',
      [architectureId, userId]
    );

    if (archResult.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Architecture not found'));
    }

    const architecture = archResult.rows[0];
    
    // Safely parse nodes and edges (handle both string and object)
    let nodes, edges;
    try {
      nodes = safeJsonParse(architecture.nodes);
      edges = safeJsonParse(architecture.edges);
    } catch (parseError) {
      logger.error('Failed to parse architecture data:', parseError);
      return res.status(400).json(
        formatResponse(false, null, `Invalid architecture data: ${parseError.message}`)
      );
    }
    
    // Validate nodes and edges are arrays
    if (!Array.isArray(nodes)) {
      return res.status(400).json(
        formatResponse(false, null, 'Invalid architecture: nodes must be an array')
      );
    }
    if (!Array.isArray(edges)) {
      return res.status(400).json(
        formatResponse(false, null, 'Invalid architecture: edges must be an array')
      );
    }

    // Generate CloudFormation template
    let cfnTemplate;
    let templateJson;
    try {
      // Pass region to template generator for region-specific defaults (like AMI IDs)
      cfnTemplate = generateCloudFormationTemplate(nodes, edges, architecture.name, awsRegion);
      
      // Validate template is an object
      if (!cfnTemplate || typeof cfnTemplate !== 'object') {
        throw new Error('Generated template is not a valid object');
      }
      
      // Stringify template
      templateJson = JSON.stringify(cfnTemplate);
      
      // Validate JSON string
      if (!templateJson || typeof templateJson !== 'string') {
        throw new Error('Failed to stringify CloudFormation template');
      }
      
      // Verify it can be parsed back (sanity check)
      JSON.parse(templateJson);
    } catch (templateError) {
      logger.error('CloudFormation template generation error:', {
        error: templateError.message,
        stack: templateError.stack,
        nodesCount: nodes.length,
        edgesCount: edges.length,
      });
      return res.status(500).json(
        formatResponse(false, null, `Failed to generate CloudFormation template: ${templateError.message}`)
      );
    }

    // Create CloudFormation client with provided credentials
    const cfnClient = new CloudFormationClient({
      region: awsRegion,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    // Submit stack to CloudFormation
    const stackName = `arch-${architectureId}-${Date.now()}`;
    const createStackCmd = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateJson,
      Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_IAM'],
    });

    let stackResponse;
    let stackId;
    try {
      stackResponse = await cfnClient.send(createStackCmd);
      stackId = stackResponse.StackId;
    } catch (awsError) {
      // Handle AWS-specific errors with helpful messages
      const errorCode = awsError.name || awsError.$metadata?.httpStatusCode;
      const errorMessage = awsError.message || String(awsError);
      
      // Check for common permission errors
      if (errorMessage.includes('not authorized') || 
          errorMessage.includes('AccessDenied') ||
          errorMessage.includes('is not authorized to perform') ||
          errorCode === 403) {
        logger.error('AWS Permission Error:', {
          code: errorCode,
          message: errorMessage,
          region: awsRegion,
          stackName,
        });
        
        // Extract the specific permission that's missing
        const permissionMatch = errorMessage.match(/is not authorized to perform: ([^\s]+)/);
        const missingPermission = permissionMatch ? permissionMatch[1] : 'cloudformation:CreateStack';
        
        return res.status(403).json(
          formatResponse(false, null, 
            `🔒 AWS Permission Error: Your IAM user does not have the required permission: ${missingPermission}\n\n` +
            `Quick Fix:\n` +
            `1. Go to AWS IAM Console → Users → Select your user\n` +
            `2. Click "Add permissions" → "Attach policies directly"\n` +
            `3. Search and attach "PowerUserAccess" (for testing) or create a custom policy\n\n` +
            `See IAM_PERMISSIONS_FIX.md for detailed instructions.\n\n` +
            `Full error: ${errorMessage}`
          )
        );
      }
      
      // Re-throw other AWS errors
      throw awsError;
    }

    logger.info(`CloudFormation stack created: ${stackId}`);

    // Calculate estimated monthly cost from nodes
    let estimatedCost = 0;
    if (Array.isArray(nodes) && nodes.length > 0) {
      const { calculateTotalCost } = await import('../utils/costCalculator.js').catch(() => ({ calculateTotalCost: null }));
      if (calculateTotalCost) {
        try {
          const costResult = calculateTotalCost(nodes, awsRegion, 'on-demand');
          estimatedCost = costResult?.totalMonthly || 0;
        } catch (err) {
          logger.warn('Could not calculate estimated cost:', err.message);
        }
      }
    }

    // Store deployment record in database
    const deploymentResult = await pool.query(
      `INSERT INTO deployments (architecture_id, user_id, aws_region, cloudformation_stack_id, cloudformation_template, status, estimated_cost, deployed_resources)
       VALUES ($1, $2, $3, $4, $5, 'creating', $6, $7)
       RETURNING id, architecture_id, user_id, aws_region, status, cloudformation_stack_id, created_at, estimated_cost`,
      [architectureId, userId, awsRegion, stackId, templateJson, estimatedCost, JSON.stringify({ nodesCount: nodes.length, edgesCount: edges.length })]
    );

    const deployment = deploymentResult.rows[0];

    // Log audit
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'DEPLOYMENT_CREATED', 'deployments', deployment.id]
    );

    logger.info('Deployment created and stored:', {
      deploymentId: deployment.id,
      architectureId,
      stackId,
      estimatedCost,
      nodesCount: nodes.length,
    });

    res.status(201).json(
      formatResponse(true, {
        deployment,
        message: `Deployment initiated. Stack ID: ${stackId}`,
      })
    );
  } catch (error) {
    logger.error('Deployment creation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      architectureId,
      userId,
    });
    
    // Extract meaningful error message
    let errorMessage = 'Failed to create deployment';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }
    
    res.status(500).json(
      formatResponse(false, null, `Failed to create deployment: ${errorMessage}`)
    );
  }
};

/**
 * Get deployment details and status
 */
export const getDeployment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM deployments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Deployment not found'));
    }

    const deployment = result.rows[0];
    res.json(formatResponse(true, { deployment }));
  } catch (error) {
    logger.error('Get deployment error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch deployment'));
  }
};

/**
 * Get all deployments for an architecture
 */
export const getDeploymentsByArchitecture = async (req, res) => {
  const { architectureId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT d.* FROM deployments d
       JOIN architectures a ON d.architecture_id = a.id
       WHERE a.id = $1 AND a.user_id = $2
       ORDER BY d.created_at DESC`,
      [architectureId, userId]
    );

    const deployments = result.rows;
    res.json(formatResponse(true, { deployments }));
  } catch (error) {
    logger.error('Get deployments error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to fetch deployments'));
  }
};

/**
 * Poll deployment status from CloudFormation
 * Fetches real-time status from AWS and updates database
 */
export const checkDeploymentStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const { awsAccessKeyId, awsSecretAccessKey } = req.query; // Optional: for real-time polling

  try {
    const result = await pool.query(
      'SELECT * FROM deployments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Deployment not found'));
    }

    const deployment = result.rows[0];

    // If credentials provided, fetch real-time status from CloudFormation
    if (awsAccessKeyId && awsSecretAccessKey && deployment.cloudformation_stack_id) {
      try {
        const cfnClient = new CloudFormationClient({
          region: deployment.aws_region,
          credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
          },
        });

        const describeCmd = new DescribeStacksCommand({
          StackName: deployment.cloudformation_stack_id,
        });

        const stackResponse = await cfnClient.send(describeCmd);
        
        if (stackResponse.Stacks && stackResponse.Stacks.length > 0) {
          const stack = stackResponse.Stacks[0];
          const cfnStatus = stack.StackStatus;
          
          // Map CloudFormation status to our status
          let newStatus = deployment.status;
          let completedAt = deployment.completed_at;
          
          if (cfnStatus.includes('COMPLETE')) {
            newStatus = 'complete';
            completedAt = completedAt || new Date();
          } else if (cfnStatus.includes('FAILED') || cfnStatus.includes('ROLLBACK')) {
            newStatus = 'failed';
            completedAt = completedAt || new Date();
          } else if (cfnStatus.includes('IN_PROGRESS')) {
            newStatus = 'creating';
          }

          // Update database with latest status and stack information
          const stackOutputs = stack.Outputs ? JSON.stringify(stack.Outputs) : null;
          const deployedResourcesInfo = stack.StackStatusReason || null;
          
          const updateResult = await pool.query(
            `UPDATE deployments 
             SET status = $1, 
                 updated_at = CURRENT_TIMESTAMP,
                 completed_at = $2,
                 error_message = $3,
                 deployed_resources = $4
             WHERE id = $5
             RETURNING *`,
            [newStatus, completedAt, stack.StackStatusReason || null, deployedResourcesInfo, id]
          );

          const updatedDeployment = updateResult.rows[0];
          updatedDeployment.cloudformation_status = cfnStatus;
          updatedDeployment.stack_outputs = stack.Outputs;

          return res.json(formatResponse(true, { deployment: updatedDeployment }));
        }
      } catch (cfnError) {
        logger.warn('Could not fetch CloudFormation status:', cfnError.message);
        // Fall through to return stored status
      }
    }

    // Return stored status if real-time fetch not available
    res.json(formatResponse(true, { deployment }));
  } catch (error) {
    logger.error('Check deployment status error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to check deployment status'));
  }
};

/**
 * Preview CloudFormation template for an architecture
 * This allows users to see/download the template before deploying
 */
export const previewTemplate = async (req, res) => {
  const { architectureId } = req.params;
  const userId = req.user.userId;

  try {
    // Fetch architecture
    const archResult = await pool.query(
      'SELECT * FROM architectures WHERE id = $1 AND user_id = $2',
      [architectureId, userId]
    );

    if (archResult.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Architecture not found'));
    }

    const architecture = archResult.rows[0];
    
    // Safely parse nodes and edges (handle both string and object)
    let nodes, edges;
    try {
      nodes = safeJsonParse(architecture.nodes);
      edges = safeJsonParse(architecture.edges);
    } catch (parseError) {
      logger.error('Failed to parse architecture data:', parseError);
      return res.status(400).json(
        formatResponse(false, null, `Invalid architecture data: ${parseError.message}`)
      );
    }
    
    // Validate nodes and edges are arrays
    if (!Array.isArray(nodes)) {
      return res.status(400).json(
        formatResponse(false, null, 'Invalid architecture: nodes must be an array')
      );
    }
    if (!Array.isArray(edges)) {
      return res.status(400).json(
        formatResponse(false, null, 'Invalid architecture: edges must be an array')
      );
    }

    // Generate CloudFormation template (pass region for region-specific defaults)
    const cfnTemplate = generateCloudFormationTemplate(nodes, edges, architecture.name, 'us-east-1');

    res.json(
      formatResponse(true, {
        template: cfnTemplate,
        templateJson: JSON.stringify(cfnTemplate, null, 2),
        architectureName: architecture.name,
      })
    );
  } catch (error) {
    logger.error('Template preview error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to generate template'));
  }
};

/**
 * Delete a deployment (may cascade in database)
 */
export const deleteDeployment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const ownerCheck = await pool.query(
      'SELECT user_id FROM deployments WHERE id = $1',
      [id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(formatResponse(false, null, 'Deployment not found'));
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json(formatResponse(false, null, 'Unauthorized'));
    }

    await pool.query('DELETE FROM deployments WHERE id = $1', [id]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'DEPLOYMENT_DELETED', 'deployments', id]
    );

    res.json(formatResponse(true, { message: 'Deployment deleted' }));
  } catch (error) {
    logger.error('Delete deployment error:', error);
    res.status(500).json(formatResponse(false, null, 'Failed to delete deployment'));
  }
};
