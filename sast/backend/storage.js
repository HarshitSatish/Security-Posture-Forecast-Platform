const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const region = process.env.AWS_REGION || "us-east-1";
const reportBucket = process.env.REPORT_BUCKET;
const scanResultsTable = process.env.SCAN_RESULTS_TABLE;

const s3 = new S3Client({ region });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

function calculateScore(high = 0, medium = 0, low = 0) {
  const score = Math.max(0, 100 - high * 30 - medium * 10 - low * 3);

  let riskLevel = "Low";
  if (score < 60) {
    riskLevel = "High";
  } else if (score < 80) {
    riskLevel = "Medium";
  }

  return { score, riskLevel };
}

async function persistScanResult(scanResult) {
  const { score, riskLevel } = calculateScore(
    scanResult.high,
    scanResult.medium,
    scanResult.low
  );

  const enrichedScanResult = {
    ...scanResult,
    score,
    riskLevel
  };

  if (!reportBucket || !scanResultsTable) {
    return {
      skipped: true,
      reason: "REPORT_BUCKET or SCAN_RESULTS_TABLE not configured",
      score,
      riskLevel
    };
  }

  const timestamp = enrichedScanResult.timestamp || new Date().toISOString();
  const scanId =
    enrichedScanResult.scan_id || `${enrichedScanResult.scan_type}-${Date.now()}`;
  const reportKey = `reports/${enrichedScanResult.scan_type.toLowerCase()}/${scanId}.json`;

  await s3.send(
    new PutObjectCommand({
      Bucket: reportBucket,
      Key: reportKey,
      Body: JSON.stringify(enrichedScanResult, null, 2),
      ContentType: "application/json"
    })
  );

  await ddb.send(
    new PutCommand({
      TableName: scanResultsTable,
      Item: {
        scan_id: scanId,
        timestamp,
        scan_type: enrichedScanResult.scan_type,
        service: enrichedScanResult.service,
        status: enrichedScanResult.status,
        high: enrichedScanResult.high,
        medium: enrichedScanResult.medium,
        low: enrichedScanResult.low,
        score,
        riskLevel,
        report_s3_key: reportKey
      }
    })
  );

  return {
    skipped: false,
    report_s3_key: reportKey,
    score,
    riskLevel
  };
}

module.exports = { persistScanResult, calculateScore };