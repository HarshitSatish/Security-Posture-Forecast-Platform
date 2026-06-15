/**
 * Lambda Orchestrator — triggers ECS scan tasks
 * Owner: Harshit Satishkumar
 */

const { ECSClient, RunTaskCommand, DescribeTasksCommand } = require('@aws-sdk/client-ecs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const ecs = new ECSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }));

const RETRY_LIMIT = 2;
const TABLE_NAME = process.env.SCAN_RESULTS_TABLE || 'security-forecast-scan-results';

async function runEcsTask(taskDefinition, taskName, attempt = 1) {
  try {
    const response = await ecs.send(new RunTaskCommand({
      cluster: process.env.ECS_CLUSTER,
      taskDefinition,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: process.env.SUBNET_IDS.split(','),
          securityGroups: [process.env.SECURITY_GROUP_ID],
          assignPublicIp: 'DISABLED',
        },
      },
    }));
    const taskArn = response.tasks[0]?.taskArn;
    console.log(`[${taskName}] started — attempt ${attempt} — ARN: ${taskArn}`);
    return taskArn;
  } catch (err) {
    console.error(`[${taskName}] attempt ${attempt} failed: ${err.message}`);
    if (attempt < RETRY_LIMIT) {
      await new Promise(r => setTimeout(r, 2000 * attempt));
      return runEcsTask(taskDefinition, taskName, attempt + 1);
    }
    throw err;
  }
}

async function waitForTasks(clusterArn, taskArns) {
  console.log('Waiting 120 seconds for scanners to complete...');
  await new Promise(r => setTimeout(r, 120000));
}

async function checkHighRiskAndAlert() {
  try {
    const response = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'riskLevel = :high',
      ExpressionAttributeValues: { ':high': 'High' },
    }));

    const highRiskItems = response.Items || [];
    console.log(`High risk items found: ${highRiskItems.length}`);

    if (highRiskItems.length > 0) {
      const details = highRiskItems.map(item =>
        `• App: ${item.appId || item.scan_id}\n  Type: ${item.scan_type}\n  Score: ${item.score}\n  Risk: ${item.riskLevel}`
      ).join('\n\n');

      await sns.send(new PublishCommand({
        TopicArn: process.env.SNS_ALERT_TOPIC,
        Subject: '🚨 Security Alert — HIGH RISK Scan Results Detected',
        Message: `Security Posture Forecast Platform has detected HIGH RISK results.\n\nImmediate attention required!\n\n${details}\n\nPlease review the dashboard:\nhttp://security-forecast-alb-421408361.us-east-1.elb.amazonaws.com`,
      }));

      console.log(`SNS alert sent for ${highRiskItems.length} high risk items`);
    }
  } catch (err) {
    console.error('Error checking DynamoDB for high risk results:', err.message);
  }
}

async function sendFailureAlert(message) {
  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_ALERT_TOPIC,
    Subject: 'Security Platform — Scan Execution Failed',
    Message: message,
  }));
}

exports.handler = async (event) => {
  console.log('Orchestrator triggered:', JSON.stringify(event));
  const results = { sast: null, pentest: null, errors: [] };

  try {
    results.sast = await runEcsTask(process.env.SAST_TASK_DEF, 'SAST');
  } catch (err) {
    results.errors.push(`SAST: ${err.message}`);
    await sendFailureAlert(`SAST scan failed after ${RETRY_LIMIT} retries.\n\n${err.message}`);
  }

  try {
    results.pentest = await runEcsTask(process.env.PENTEST_TASK_DEF, 'Pentest');
  } catch (err) {
    results.errors.push(`Pentest: ${err.message}`);
    await sendFailureAlert(`Pentest scan failed after ${RETRY_LIMIT} retries.\n\n${err.message}`);
  }

  // Wait for scanners to complete then check for high risk results
  await waitForTasks();
  await checkHighRiskAndAlert();

  console.log('Orchestration complete:', JSON.stringify(results));
  return results;
};
