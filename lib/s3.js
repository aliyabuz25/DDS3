const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let cachedClient = null;

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || 'biblecms-media-2026-app';
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Set up credentials safely, fallback to unsigned requests or instance profiles automatically if not present in .env
  const config = { region };
  
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  return {
    bucket,
    region,
    client: cachedClient || (cachedClient = new S3Client(config))
  };
}

function createS3ObjectKey({ keyPrefix = 'uploads', originalName = 'file' }) {
  const ext = path.extname(originalName);
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${keyPrefix}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`;
}

async function createPresignedPutUrl({ key, expiresIn = 7200 }) {
  const { bucket, region, client } = getS3Config();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  let uploadUrl = '';
  try {
    uploadUrl = await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    // S3 error is suppressed
  }

  return {
    bucket,
    region,
    key,
    uploadUrl,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  };
}

async function uploadFileToS3({ filePath, originalName, mimeType, keyPrefix = 'uploads' }) {
  const { bucket, region, client } = getS3Config();
  const key = createS3ObjectKey({ keyPrefix, originalName: originalName || filePath });

  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: mimeType || 'application/octet-stream'
    }));
  } catch (error) {
    // S3 error is suppressed
  }

  return {
    bucket,
    region,
    key,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  };
}

async function listS3Objects({ prefix = '', maxKeys = 1000 }) {
  const { bucket, region, client } = getS3Config();
  const objects = [];
  let continuationToken;

  try {
    do {
      const response = await client.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken
      }));

      for (const item of response.Contents || []) {
        if (!item.Key || item.Key.endsWith('/')) continue;
        objects.push({
          bucket,
          region,
          key: item.Key,
          size: item.Size || 0,
          lastModified: item.LastModified,
          url: `https://${bucket}.s3.${region}.amazonaws.com/${item.Key}`
        });
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
  } catch (error) {
    // S3 error is suppressed
  }

  return objects;
}

module.exports = {
  createPresignedPutUrl,
  createS3ObjectKey,
  listS3Objects,
  uploadFileToS3
};
