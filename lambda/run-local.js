process.env.ECS_CLUSTER = "test";
process.env.SAST_TASK_DEF = "test";
process.env.PENTEST_TASK_DEF = "test";
process.env.SUBNET_IDS = "subnet-a,subnet-b";
process.env.SECURITY_GROUP_ID = "sg-test";
process.env.SNS_ALERT_TOPIC = "arn:aws:sns:us-east-1:123456789012:test-topic";
process.env.DDB_TABLE = "scan-orchestrator-table";

const { handler } = require("./handler");

handler({ test: "run" })
  .then(res => console.log("SUCCESS:", res))
  .catch(err => console.error("ERROR:", err));
