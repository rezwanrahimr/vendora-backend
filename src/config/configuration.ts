export default () => ({
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      '90b993b816f5a33db98331dffee22e4e2027e2de61376f1a87ac6d8ad94e8073',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@example.com',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
  aws: {
    s3Bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  nestpay: {
    gatewayUrl: process.env.NESTPAY_GATEWAY_URL,
    clientId: process.env.NESTPAY_CLIENT_ID,
    storeKey: process.env.NESTPAY_STORE_KEY,
    okUrl: process.env.NESTPAY_OK_URL,
    failUrl: process.env.NESTPAY_FAIL_URL,
    currency: process.env.NESTPAY_CURRENCY || '941',
    trantype: process.env.NESTPAY_TRANTYPE || 'PreAuth',
    storetype: process.env.NESTPAY_STORETYPE || '3d_pay_hosting',
    lang: process.env.NESTPAY_LANG || 'sr',
    encoding: process.env.NESTPAY_ENCODING || 'utf-8',
  },
});
