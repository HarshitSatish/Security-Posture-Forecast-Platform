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
  let forecastMessage = "Security posture is stable.";
  let recommendation = "Continue routine monitoring.";

  if (score < 60) {
    riskLevel = "High";
    forecastMessage = "Security posture is risky and may worsen if unresolved.";
    recommendation = "Prioritize fixing high severity findings immediately.";
  } else if (score < 80) {
    riskLevel = "Medium";
    forecastMessage = "Security posture shows warning signs.";
    recommendation = "Review medium and high severity findings soon.";
  }

  return { score, riskLevel, forecastMessage, recommendation };
}

async function persistScanResult(scanResult) {
  const high = scanResult.high || 0;
  const medium = scanResult.medium || 0;
  const low = scanResult.low || 0;
  const totalFindings = high + medium + low;

  const { score, riskLevel, forecastMessage, recommendation } = calculateScore(
    high,
    medium,
    low
  );

  const enrichedScanResult = {
    ...scanResult,
    high,
    medium,
    low,
    totalFindings,
    score,
    riskLevel,
    forecastMessage,
    recommendation
  };

  if (!reportBucket || !scanResultsTable) {
    return {
      skipped: true,
      reason: "REPORT_BUCKET or SCAN_RESULTS_TABLE not configured",
      score,
      riskLevel,
      forecastMessage,
      recommendation
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
        high,
        medium,
        low,
        totalFindings,
        score,
        riskLevel,
        forecastMessage,
        recommendation,
        report_s3_key: reportKey
      }
    })
  );

  return {
    skipped: false,
    report_s3_key: reportKey,
    score,
    riskLevel,
    forecastMessage,
    recommendation
  };
}

module.exports = { persistScanResult, calculateScore };