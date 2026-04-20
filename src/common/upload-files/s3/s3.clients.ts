import { S3Client } from '@aws-sdk/client-s3';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

const region = requireEnv('AWS_REGION');
const accessKeyId = requireEnv('AWS_ACCESS_KEY_ID');
const secretAccessKey = requireEnv('AWS_SECRET_ACCESS_KEY');

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});