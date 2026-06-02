/**
 * Lambda Orchestrator — triggers ECS scan tasks
 * Owner: Spandan Surdas
 */

const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const { SNSClient, PublishCommand }  = require('@aws-sdk/client-sns');

const ecs = new ECSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const RETRY_LIMIT = 2;

async function runEcsTask(taskDefinition, taskName, attempt = 1) {
  try {
    const response = await ecs.send(new RunTaskCommand({
      cluster:        process.env.ECS_CLUSTER,
      taskDefinition,
      launchType:     'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets:        process.env.SUBNET_IDS.split(','),
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

async function sendFailureAlert(message) {
  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_ALERT_TOPIC,
    Subject:  'Security Platform — Scan Execution Failed',
    Message:  message,
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

  console.log('Orchestration complete:', JSON.stringify(results));
  return results;
};
