const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const region = process.env.AWS_REGION || "us-east-1";
const reportBucket = process.env.REPORT_BUCKET;
const scanResultsTable = process.env.SCAN_RESULTS_TABLE;

const s3 = new S3Client({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

async function persistScanResult(scanResult) {
  if (!reportBucket || !scanResultsTable) {
    return {
      skipped: true,
      reason: "REPORT_BUCKET or SCAN_RESULTS_TABLE not configured"
    };
  }

  const timestamp = scanResult.timestamp || new Date().toISOString();
  const scanId = scanResult.scan_id || `${scanResult.scan_type}-${Date.now()}`;
  const reportKey = `reports/${scanResult.scan_type.toLowerCase()}/${scanId}.json`;

  await s3.send(
    new PutObjectCommand({
      Bucket: reportBucket,
      Key: reportKey,
      Body: JSON.stringify(scanResult, null, 2),
      ContentType: "application/json"
    })
  );

  await ddb.send(
    new PutCommand({
      TableName: scanResultsTable,
      Item: {
        scan_id: scanId,
        timestamp,
        scan_type: scanResult.scan_type,
        service: scanResult.service,
        status: scanResult.status,
        high: scanResult.high,
        medium: scanResult.medium,
        low: scanResult.low,
        report_s3_key: reportKey
      }
    })
  );

  return {
    skipped: false,
    report_s3_key: reportKey
  };
}

module.exports = { persistScanResult };